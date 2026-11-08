import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@shared/types/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  clearStoredSession,
  getStoredUser,
  getStoredToken,
  saveStoredSession,
  updateStoredSession,
} from "@shared/api/client";
import * as authApi from "../api/auth";
import { AuthContext, type AuthContextValue } from "../context/AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const meQuery = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
  });
  const unauthorized =
    meQuery.error instanceof ApiError && meQuery.error.status === 401;
  const activeToken = unauthorized ? null : token;
  const activeUser = unauthorized ? null : (meQuery.data?.user ?? user);
  const loading = Boolean(activeToken && meQuery.isPending);

  const saveSession = useCallback((
    newToken: string,
    newUser: User,
    rememberMe = false,
  ) => {
    saveStoredSession(newToken, newUser, rememberMe);
    setToken(newToken);
    setUser(newUser);
    queryClient.setQueryData(["auth", "me", newToken], { user: newUser });
    window.dispatchEvent(new Event("kanbot-auth-change"));
  }, [queryClient]);
  const logout = useCallback(() => {
    clearStoredSession();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const sync = () => {
      const nextToken = getStoredToken();
      setToken(nextToken);
      if (!nextToken) {
        setUser(null);
        queryClient.removeQueries({ queryKey: ["auth", "me"] });
      } else {
        setUser(getStoredUser());
      }
    };
    window.addEventListener("kanbot-auth-change", sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("kanbot-auth-change", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!meQuery.data || !token) return;
    updateStoredSession(token, meQuery.data.user);
  }, [meQuery.data, token]);

  useEffect(() => {
    if (!unauthorized) return;
    clearStoredSession();
  }, [unauthorized]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token: activeToken,
      user: activeUser,
      loading,
      login: async (body, rememberMe = false) => {
        const result = await authApi.login(body);
        saveSession(result.token, result.user, rememberMe);
        return result;
      },
      register: async (body) => {
        const result = await authApi.register(body);
        saveSession(result.token, result.user, true);
        return result;
      },
      logout,
    }),
    [activeToken, activeUser, loading, logout, saveSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
