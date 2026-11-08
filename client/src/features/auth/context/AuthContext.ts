import { createContext } from "react";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@shared/types/api";

export type AuthContextValue = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (body: LoginRequest, rememberMe?: boolean) => Promise<AuthResponse>;
  register: (body: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
