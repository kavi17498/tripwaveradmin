import { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { ProtectedRoute } from "@/components/wrappers/protected-route";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowRoles={["admin", "superadmin"]}>
      <Navbar />
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </ProtectedRoute>
  );
}
