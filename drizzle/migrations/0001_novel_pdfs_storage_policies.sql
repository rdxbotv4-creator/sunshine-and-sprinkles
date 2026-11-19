create policy "Anyone can read novel pdfs" on storage.objects for select to anon, authenticated
  using (bucket_id = 'novel-pdfs');
create policy "Admins upload novel pdfs" on storage.objects for insert to authenticated
  with check (bucket_id = 'novel-pdfs' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update novel pdfs" on storage.objects for update to authenticated
  using (bucket_id = 'novel-pdfs' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete novel pdfs" on storage.objects for delete to authenticated
  using (bucket_id = 'novel-pdfs' and public.has_role(auth.uid(), 'admin'));