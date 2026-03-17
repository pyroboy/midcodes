
import { ReactNode } from "react";
import { useAuth } from "@/context/useAuth"; // Fixed import
import { Navigate } from "react-router-dom";
import type { UserRole } from "@/context/authTypes"; // Importing UserRole type from authTypes

interface RoleBasedWrapperProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode | string;
  redirect?: string;
}

const RoleBasedWrapper = ({
  children,
  allowedRoles,
  fallback = null,
  redirect,
}: RoleBasedWrapperProps) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role as UserRole)) {
    if (redirect) {
      return <Navigate to={redirect} replace />;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleBasedWrapper;
