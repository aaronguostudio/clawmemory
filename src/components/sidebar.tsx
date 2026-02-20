"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, GitBranch, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Memory", icon: FileText },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/graph", label: "Graph", icon: GitBranch },
  { href: "/search", label: "Search", icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-14 border-r border-border bg-card flex flex-col items-center py-4 gap-1 shrink-0">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}
          >
            <Icon className="h-4.5 w-4.5" />
          </Link>
        );
      })}
    </nav>
  );
}
