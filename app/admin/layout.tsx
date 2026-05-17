import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/wrappers/protected-route";
import { AdminSidebarShell } from "@/components/adminpanel/admin-sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowRoles={["admin", "superadmin"]}>
      <AdminSidebarShell>{children}</AdminSidebarShell>
    </ProtectedRoute>
  );
}
