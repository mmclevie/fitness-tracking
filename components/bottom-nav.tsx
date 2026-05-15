"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Dumbbell, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Calendar", icon: Calendar, match: (p: string) => p === "/" || p.startsWith("/day") },
  { href: "/strength", label: "Strength", icon: Dumbbell, match: (p: string) => p.startsWith("/strength") },
  { href: "/body", label: "Body", icon: Activity, match: (p: string) => p.startsWith("/body") },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-3">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-h-16 text-xs",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
