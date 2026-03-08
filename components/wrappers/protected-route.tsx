"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services/authService";
import { UserRole } from "@/lib/types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, allowRoles, redirectTo = "/login" }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const result = await authService.getCurrentUser();
      const user = result.data;

      if (!user) {
        router.replace(redirectTo);
        return;
      }
      if (allowRoles && !allowRoles.includes(user.role)) {
        router.replace("/dashboard");
        return;
      }

      setIsAllowed(true);
      setLoading(false);
    };

    run();
  }, [allowRoles, redirectTo, router]);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Checking access...</div>;
  }

  return isAllowed ? <>{children}</> : null;
}
