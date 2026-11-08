import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { AppLoadingScreen } from "@shared/components/ui";

export function ProtectedRoute() {
  const { token, loading } = useAuth();
  const location = useLocation();
  if (loading) return <AppLoadingScreen />;
  if (!token)
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  return <Outlet />;
}
