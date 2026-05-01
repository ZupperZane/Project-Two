import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../utils/constants";

interface PrivateRouteProps {
  children: ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, role, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  }

  if (!role) {
    return <Navigate to={ROUTES.SELECT_ROLE} replace />;
  }

  return <>{children}</>;
}

export default PrivateRoute;
