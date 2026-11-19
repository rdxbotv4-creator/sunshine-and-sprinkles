import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDown, Menu, UserRound, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { openLogin, useReaderName } from "@/lib/reader";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/novels", label: "Novels" },
  { to: "/authors", label: "Authors" },
  { to: "/playlists", label: "Playlists" },
  { to: "/pdfs", label: "PDF Library" },
  { to: "/contact", label: "Support" },
] as const;

export function SiteHeader() {
  const name = useReaderName();
  const [open, setOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-40 border-b border-border">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-primary data-[status=active]:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="relative">
            {!name && (
              <span
                aria-hidden
                className="animate-point absolute -top-7 left-1/2 -translate-x-1/2 text-primary"
              >
                <ArrowDown className="h-5 w-5" />
              </span>
            )}
            <Button variant={name ? "glass" : "gold"} size="sm" onClick={openLogin}>
              <UserRound />
              <span className="max-w-28 truncate">{name ?? "Login"}</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      <nav
        className={cn("border-t border-border px-4 pb-4 lg:hidden", open ? "block" : "hidden")}
        aria-label="Mobile"
      >
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            activeOptions={{ exact: item.to === "/" }}
            className="block rounded-md px-3 py-3 text-base text-muted-foreground data-[status=active]:text-primary"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
