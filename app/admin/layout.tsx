import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/wrappers/protected-route";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowRoles={["admin", "superadmin"]}>
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </ProtectedRoute>
  );
}
