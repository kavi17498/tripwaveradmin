"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FileText,
  LogOut,
  Route,
  ShieldCheck,
  UserCircle2,
  UserCog,
  Users,
  XCircle,
  Clock3,
  type LucideIcon,
} from "lucide-react";

import { authService } from "@/lib/services/authService";
import { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

type AdminSidebarItem =
  | {
      kind: "link";
      label: string;
      href: string;
      activePath: string;
      status?: "pending" | "in review" | "approved" | "rejected" | "draft";
      icon: LucideIcon;
    }
  | {
      kind: "placeholder";
      label: string;
      icon: LucideIcon;
    };

type AdminSidebarSection = {
  title: string;
  icon: LucideIcon;
  defaultOpen: boolean;
  items: AdminSidebarItem[];
};

const adminSections: AdminSidebarSection[] = [
  {
    title: "User Management",
    icon: UserCog,
    defaultOpen: true,
    items: [
      {
        kind: "link",
        label: "See all users",
        href: "/admin/users",
        activePath: "/admin/users",
        icon: Users,
      },
      {
        kind: "link",
        label: "Verifaction request",
        href: "/admin/verifications",
        activePath: "/admin/verifications",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "Trip Management",
    icon: Route,
    defaultOpen: true,
    items: [
      {
        kind: "link",
        label: "Pending Trips",
        href: "/admin/trips?status=pending",
        activePath: "/admin/trips",
        status: "pending",
        icon: Clock3,
      },
      {
        kind: "link",
        label: "To Review Trips",
        href: "/admin/trips?status=in%20review",
        activePath: "/admin/trips",
        status: "in review",
        icon: Clock3,
      },
      {
        kind: "link",
        label: "Approved trips",
        href: "/admin/trips?status=approved",
        activePath: "/admin/trips",
        status: "approved",
        icon: CheckCircle2,
      },
      {
        kind: "link",
        label: "Rejected Trips",
        href: "/admin/trips?status=rejected",
        activePath: "/admin/trips",
        status: "rejected",
        icon: XCircle,
      },
      {
        kind: "link",
        label: "Draft Trips",
        href: "/admin/trips?status=draft",
        activePath: "/admin/trips",
        status: "draft",
        icon: FileText,
      },
    ],
  },
  {
    title: "Payment Management",
    icon: CreditCard,
    defaultOpen: true,
    items: [
      {
        kind: "placeholder",
        label: "Coming soon",
        icon: CreditCard,
      },
    ],
  },
];

export function AdminSidebarShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-svh w-full bg-background">
        <AdminSidebar />
        <SidebarInset>
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 md:px-6">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const sectionCount = useMemo(() => adminSections.length, []);

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border px-3 py-4">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-4" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold">TripWaver Admin</p>
              <p className="truncate text-xs text-muted-foreground">Control center</p>
            </div>
          </Link>
          <SidebarTrigger className="shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-2 py-2">
        {adminSections.map((section) => (
          <AdminSection key={section.title} pathname={pathname} searchParams={searchParams} section={section} collapsed={isCollapsed} />
        ))}
        <p className="px-4 pt-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {sectionCount} sections
        </p>
      </SidebarContent>

      <SidebarFooter className="border-t border-border px-3 py-4">
        {currentUser ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <UserCircle2 className="size-10 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-medium">{currentUser.name}</p>
                <p className="truncate text-xs text-muted-foreground">Admin account</p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className={cn(
                "w-full justify-start gap-2",
                isCollapsed && "mx-auto size-9 w-9 justify-center px-0"
              )}
            >
              <LogOut className="size-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground group-data-[collapsible=icon]:px-0">
            <span className="group-data-[collapsible=icon]:hidden">Loading admin profile...</span>
            <UserCircle2 className="hidden size-5 group-data-[collapsible=icon]:block" />
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function AdminSection({
  section,
  pathname,
  searchParams,
  collapsed,
}: {
  section: AdminSidebarSection;
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams>;
  collapsed: boolean;
}) {
  const [open, setOpen] = useState(section.defaultOpen);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{section.title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={section.title}
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              className="justify-between"
            >
              <span className="flex min-w-0 items-center gap-2">
                <section.icon className="size-4 shrink-0" />
                {!collapsed ? <span className="truncate">{section.title}</span> : null}
              </span>
              {!collapsed ? <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} /> : null}
            </SidebarMenuButton>

            {!collapsed && open ? (
              <SidebarMenuSub>
                {section.items.map((item) => (
                  <SidebarMenuSubItem key={item.label}>
                    {item.kind === "link" ? (
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname.startsWith(item.activePath) && (item.status ? searchParams.get("status") === item.status : true)}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    ) : (
                      <SidebarMenuSubButton asChild className="pointer-events-none opacity-60">
                        <span>
                          <item.icon />
                          <span>{item.label}</span>
                        </span>
                      </SidebarMenuSubButton>
                    )}
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            ) : null}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}