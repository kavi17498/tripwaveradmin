"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const dashboardLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/my-trips", label: "My Trips" },
  { href: "/dashboard/create-trip", label: "Create Trip" },
  { href: "/dashboard/organizers", label: "Organizers" },
  { href: "/dashboard/earnings", label: "Earnings" },
  { href: "/dashboard/reviews", label: "Reviews" },
  { href: "/dashboard/verification", label: "Verification" },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-r border-border bg-muted/20 md:w-64">
      <div className="border-b border-border p-4">
        <p className="text-sm font-semibold">User Dashboard</p>
      </div>
      <nav className="space-y-1 p-2">
        {dashboardLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block border border-transparent px-3 py-2 text-sm text-muted-foreground hover:border-border hover:bg-background hover:text-foreground",
                isActive && "border-border bg-background font-medium text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
