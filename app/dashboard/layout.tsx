import { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ProtectedRoute } from "@/components/wrappers/protected-route";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <Navbar />
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
