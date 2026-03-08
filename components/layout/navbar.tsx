"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/authService";
import { User } from "@/lib/types";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/trips", label: "Trips" },
];

const privateLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/organizer", label: "Organizer" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const links = useMemo(() => {
    if (!currentUser) return publicLinks;
    return [...publicLinks, ...privateLinks];
  }, [currentUser]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await authService.logout();
    setLoggingOut(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          TripWaver
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm text-muted-foreground hover:text-foreground",
                pathname === link.href && "font-medium text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {currentUser ? (
            <>
              <Button variant="outline" asChild>
                <Link href="/dashboard">{currentUser.name}</Link>
              </Button>
              <Button onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? "Logging out..." : "Logout"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
