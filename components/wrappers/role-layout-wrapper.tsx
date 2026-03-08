import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/wrappers/protected-route";
import { UserRole } from "@/lib/types";

interface RoleLayoutWrapperProps {
  role: UserRole;
  children: ReactNode;
}

export function RoleLayoutWrapper({ role, children }: RoleLayoutWrapperProps) {
  return <ProtectedRoute allowRoles={[role]}>{children}</ProtectedRoute>;
}
