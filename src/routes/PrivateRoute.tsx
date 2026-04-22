import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";

interface PrivateRouteProps {
  children: ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // Wait for auth (and profile if role-check is needed) to resolve
  if (authLoading) {
    return null;
  }

  // Guest: not logged in — send to login, preserve intended destination
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export default PrivateRoute;
