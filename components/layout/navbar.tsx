"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { getFirestore, collection, query as firestoreQuery, where, onSnapshot } from "firebase/firestore";
import { app } from "@/lib/config/firebase";
import { chatService } from "@/lib/services/chatService";
import { waitForFirebaseUser } from "@/lib/services/firebaseAuthUtils";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/services/authService";
import { notificationService } from "@/lib/services/notificationService";
import { userSessionService } from "@/lib/services/userSessionService";
import { Notification, User } from "@/lib/types";
import { cn } from "@/lib/utils";

type AppMode = "explorer" | "creator";

const explorerLinks = [
  { href: "/", label: "Home" },
  { href: "/trips", label: "Trips" },
  { href: "/bookings", label: "Bookings" },
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
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mode, setMode] = useState<AppMode>(getInitialMode);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let mounted = true;

    const refreshNotifications = async () => {
      if (!currentUser) {
        if (mounted) setUnreadCount(0);
        return;
      }

      const token = userSessionService.getToken();
      if (!token) {
        if (mounted) setUnreadCount(0);
        return;
      }

      try {
        const result = await notificationService.getUnreadCount(currentUser.id);
        if (mounted) setUnreadCount(result.data ?? 0);
      } catch {
        if (mounted) setUnreadCount(0);
      }
    };

    void refreshNotifications();
    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("tripwaver:notifications-changed", refreshNotifications);

    // Listen for chat summary changes to update unread chat count
    const handleChatSnapshots = async () => {
      const token = userSessionService.getToken();
      if (!token || !currentUser) {
        setChatUnreadCount(0);
        return;
      }

      try {
        // If the Firebase client is signed-in, subscribe to Firestore summaries for realtime updates.
        const firebaseUser = await waitForFirebaseUser();

        if (firebaseUser) {
          const db = getFirestore(app);
          const q = firestoreQuery(collection(db, 'chatgroups'), where('members', 'array-contains', currentUser.id));
          let unsub: (() => void) | null = null;
          unsub = onSnapshot(q, (snap) => {
            let total = 0;
            snap.forEach((doc) => {
              const d: any = doc.data();
              const unreadCounts: Record<string, number> = d?.unreadCounts ?? {};
              total += unreadCounts[currentUser.id] ?? 0;
            });
            setChatUnreadCount(total);
          }, async (err) => {
            // on permission error, unsubscribe and fallback to REST computation
            const msg = err?.message ?? '';
            const code = (err && (err.code || err?.name)) ?? null;
            if (code === 'permission-denied' || (typeof msg === 'string' && msg.toLowerCase().includes('permission-denied'))) {
              try { if (typeof unsub === 'function') unsub(); } catch {}
              try {
                const res = await chatService.getChatGroups(token ?? undefined);
                const groups = res.data ?? [];
                let total = 0;
                for (const g of groups) {
                  const unreadCounts: Record<string, number> = (g as any)?.unreadCounts ?? {};
                  total += unreadCounts[currentUser.id] ?? 0;
                }
                setChatUnreadCount(total);
              } catch {
                setChatUnreadCount(0);
              }
            }
          });

          (window as any).__tripwaver_chat_unsub_nav = unsub;
        } else {
          // Fallback to REST-based computation when the client isn't signed into Firebase.
          const res = await chatService.getChatGroups(token ?? undefined);
          const groups = res.data ?? [];
          let total = 0;
          for (const g of groups) {
            const unreadCounts: Record<string, number> = (g as any)?.unreadCounts ?? {};
            total += unreadCounts[currentUser.id] ?? 0;
          }
          setChatUnreadCount(total);
        }
      } catch {
        setChatUnreadCount(0);
      }
    };

    void handleChatSnapshots();

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("tripwaver:notifications-changed", refreshNotifications);
      const navUnsub = (window as any).__tripwaver_chat_unsub_nav;
      if (typeof navUnsub === 'function') navUnsub();
    };
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (notificationPanelRef.current && !notificationPanelRef.current.contains(target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      if (!showNotifications || !currentUser) return;

      const token = userSessionService.getToken();
      if (!token) return;

      setLoadingNotifications(true);
      try {
        const result = await notificationService.getNotifications(currentUser.id);
        if (mounted) setNotifications(result.data.slice(0, 5));
      } catch {
        if (mounted) setNotifications([]);
      } finally {
        if (mounted) setLoadingNotifications(false);
      }
    };

    void loadNotifications();
    window.addEventListener("tripwaver:notifications-changed", loadNotifications);
    return () => {
      mounted = false;
      window.removeEventListener("tripwaver:notifications-changed", loadNotifications);
    };
  }, [currentUser, showNotifications]);
      const token = userSessionService.getToken();

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
            <div className="relative" ref={notificationPanelRef}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notifications"
                onClick={() => setShowNotifications((current) => !current)}
              >
                <Bell className="size-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Button>

              {showNotifications ? (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-md border border-border bg-background shadow-lg">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">Notifications</p>
                      <p className="text-xs text-muted-foreground">Latest trip updates</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)}>
                      Close
                    </Button>
                  </div>

                  <div className="max-h-80 overflow-auto p-3 space-y-2">
                    {loadingNotifications ? (
                      <p className="px-1 py-3 text-sm text-muted-foreground">Loading notifications...</p>
                    ) : notifications.length > 0 ? (
                      notifications.map((item) => (
                        <Link
                          key={item.id}
                          href={item.tripId ? `/trips/${item.tripId}` : "/notifications"}
                          onClick={() => setShowNotifications(false)}
                          className={cn(
                            "block rounded-md border border-border px-3 py-2 transition-colors hover:bg-accent/20",
                            !item.read && "bg-sky-50/60",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium">{item.title}</p>
                            {!item.read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-destructive" aria-label="Unread notification" /> : null}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                        </Link>
                      ))
                    ) : (
                      <p className="px-1 py-3 text-sm text-muted-foreground">No notifications yet.</p>
                    )}
                  </div>

                  <div className="border-t border-border px-4 py-3">
                    <Link
                      href="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View full screen
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
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
