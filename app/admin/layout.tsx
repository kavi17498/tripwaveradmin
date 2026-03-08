import { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { RoleLayoutWrapper } from "@/components/wrappers/role-layout-wrapper";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayoutWrapper role="admin">
      <Navbar />
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </RoleLayoutWrapper>
  );
}
