import type {
  AuthResponse,
  LoginRequest,
  MeResponse,
  RegisterRequest,
} from "@shared/types/api";
import { apiRequest } from "@shared/api/client";

export const register = (body: RegisterRequest) =>
  apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const login = (body: LoginRequest) =>
  apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
export const me = () => apiRequest<MeResponse>("/auth/me");
