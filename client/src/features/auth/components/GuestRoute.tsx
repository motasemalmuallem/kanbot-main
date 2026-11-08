import { Navigate, Outlet, useSearchParams } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { safeRedirect } from "../lib/safeRedirect";
import { AppLoadingScreen } from "@shared/components/ui";

export function GuestRoute() {
  const { token, loading } = useAuth();
  const [params] = useSearchParams();
  if (loading) return <AppLoadingScreen />;
  return token ? <Navigate to={safeRedirect(params.get("redirect"))} replace /> : <Outlet />;
}
