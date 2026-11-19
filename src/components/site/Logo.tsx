import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export function Logo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <Link to="/" className={cn("group flex items-center gap-3", className)} aria-label="Novels Forever home">
      <img
        src={logo}
        alt=""
        width={size === "lg" ? 64 : 44}
        height={size === "lg" ? 64 : 44}
        className={cn(
          "drop-shadow-[0_0_14px_oklch(0.8_0.13_82/0.45)] transition-transform duration-500 group-hover:rotate-[-6deg] group-hover:scale-105",
          size === "lg" ? "h-16 w-16" : "h-11 w-11",
        )}
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display font-semibold tracking-wide text-gold animate-shine",
            size === "lg" ? "text-3xl" : "text-2xl",
          )}
        >
          Novels Forever
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          Urdu audio novel library
        </span>
      </span>
    </Link>
  );
}
