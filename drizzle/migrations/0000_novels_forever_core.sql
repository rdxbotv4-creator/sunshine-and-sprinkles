create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- emails that become admin on signup
create table public.admin_emails (
  email text primary key
);
grant all on public.admin_emails to service_role;
alter table public.admin_emails enable row level security;

create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.admin_emails where lower(email) = lower(new.email)) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created_role after insert on auth.users
  for each row execute function public.handle_new_user_role();

-- stats
create table public.novel_stats (
  novel_slug text primary key,
  views bigint not null default 0,
  pdf_reads bigint not null default 0,
  pdf_downloads bigint not null default 0,
  updated_at timestamptz not null default now()
);
grant select on public.novel_stats to anon, authenticated;
grant all on public.novel_stats to service_role;
alter table public.novel_stats enable row level security;
create policy "Stats are public" on public.novel_stats for select to anon, authenticated using (true);

create or replace function public.bump_stat(_slug text, _kind text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if _slug is null or length(_slug) > 200 or _slug !~ '^[a-z0-9-]+$' then
    raise exception 'invalid slug';
  end if;
  insert into public.novel_stats (novel_slug) values (_slug) on conflict do nothing;
  if _kind = 'view' then
    update public.novel_stats set views = views + 1, updated_at = now() where novel_slug = _slug;
  elsif _kind = 'pdf_read' then
    update public.novel_stats set pdf_reads = pdf_reads + 1, updated_at = now() where novel_slug = _slug;
  elsif _kind = 'pdf_download' then
    update public.novel_stats set pdf_downloads = pdf_downloads + 1, updated_at = now() where novel_slug = _slug;
  else
    raise exception 'invalid kind';
  end if;
end;
$$;
revoke all on function public.bump_stat(text, text) from public;
grant execute on function public.bump_stat(text, text) to anon, authenticated;

-- reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  novel_slug text not null,
  name text not null check (char_length(name) between 1 and 60),
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);
create index reviews_novel_idx on public.reviews (novel_slug, created_at desc);
grant select, insert on public.reviews to anon, authenticated;
grant delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Reviews are public" on public.reviews for select to anon, authenticated using (true);
create policy "Anyone can review" on public.reviews for insert to anon, authenticated
  with check (novel_slug ~ '^[a-z0-9-]+$' and char_length(novel_slug) <= 200);
create policy "Admins delete reviews" on public.reviews for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create view public.novel_ratings with (security_invoker = true) as
  select novel_slug, round(avg(rating)::numeric, 2) as avg_rating, count(*)::int as rating_count
  from public.reviews group by novel_slug;
grant select on public.novel_ratings to anon, authenticated;

-- feedback
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  contact text not null default '' check (char_length(contact) <= 120),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);
grant insert on public.feedback to anon, authenticated;
grant select, delete on public.feedback to authenticated;
grant all on public.feedback to service_role;
alter table public.feedback enable row level security;
create policy "Anyone can send feedback" on public.feedback for insert to anon, authenticated with check (true);
create policy "Admins read feedback" on public.feedback for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete feedback" on public.feedback for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- pdfs
create table public.novel_pdfs (
  novel_slug text primary key,
  file_path text not null,
  file_size bigint,
  uploaded_at timestamptz not null default now()
);
grant select on public.novel_pdfs to anon, authenticated;
grant insert, update, delete on public.novel_pdfs to authenticated;
grant all on public.novel_pdfs to service_role;
alter table public.novel_pdfs enable row level security;
create policy "PDF list is public" on public.novel_pdfs for select to anon, authenticated using (true);
create policy "Admins add pdfs" on public.novel_pdfs for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update pdfs" on public.novel_pdfs for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete pdfs" on public.novel_pdfs for delete to authenticated using (public.has_role(auth.uid(), 'admin'));