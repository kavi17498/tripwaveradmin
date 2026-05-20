"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/authService";
import { User } from "@/lib/types";
import { cn } from "@/lib/utils";

type AppMode = "explorer" | "creator";

const explorerLinks = [
  { href: "/", label: "Home" },
  { href: "/trips", label: "Trips" },
  { href: "/chat", label: "Chat" },
];

const creatorLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "Chat" },
  { href: "/organizer", label: "Organizer" },
];

const APP_MODE_STORAGE_KEY = "tripwaver:app-mode";

const getInitialMode = (): AppMode => {
  if (typeof window === "undefined") return "explorer";
  const storedMode = localStorage.getItem(APP_MODE_STORAGE_KEY);
  return storedMode === "creator" ? "creator" : "explorer";
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mode, setMode] = useState<AppMode>(getInitialMode);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const links = useMemo(() => {
    return mode === "explorer" ? explorerLinks : creatorLinks;
  }, [mode]);

  const handleModeToggle = (nextMode: AppMode) => {
    setMode(nextMode);
    if (typeof window !== "undefined") {
      localStorage.setItem(APP_MODE_STORAGE_KEY, nextMode);
    }

    router.push(nextMode === "explorer" ? "/" : "/dashboard");
  };

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
        <div className="hidden items-center rounded-md border border-border p-1 md:flex">
          <button
            type="button"
            onClick={() => handleModeToggle("explorer")}
            className={cn(
              "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
              mode === "explorer" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Explorer
          </button>
          <button
            type="button"
            onClick={() => handleModeToggle("creator")}
            className={cn(
              "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
              mode === "creator" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Creator
          </button>
        </div>
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
                <Link href="/profile" className="flex items-center gap-2">
                  {/* display avatar or placeholder */}
                  <div>
                    {currentUser.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentUser.avatarUrl} alt="avatar" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-border">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="absolute -right-1 -bottom-1">
                          <div className="h-4 w-4 rounded-full bg-white flex items-center justify-center border border-border text-primary">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  Profile
                </Link>
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
