import { useCallback } from "react";
import { useNavigate } from "react-router";
import { clearQueryCache } from "@shared/api/client";
import { useAuth } from "./useAuth";

export function useSignOut() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return useCallback(() => {
    logout();
    clearQueryCache();
    navigate("/login", { replace: true });
  }, [logout, navigate]);
}
