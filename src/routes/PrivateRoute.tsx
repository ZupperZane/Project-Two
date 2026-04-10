import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import useAuth from "../hooks/useAuth";
import { useUserProfile } from "../hooks/useUserProfile";
import type { Role } from "../utils/constants";
import { ROUTES } from "../utils/constants";

interface PrivateRouteProps {
  children: ReactNode;
  requiredRole?: Role; // omit to allow any authenticated user
}

function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const location = useLocation();

  // Wait for auth (and profile if role-check is needed) to resolve
  if (authLoading || (requiredRole && profileLoading)) {
    return null;
  }

  // Guest: not logged in — send to login, preserve intended destination
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  }

  // Role check: if a specific role is required and user doesn't have it,
  // redirect to dashboard silently. This is a failsafe — UI should never
  // render the link in the first place for the wrong role.
  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}

export default PrivateRoute;
