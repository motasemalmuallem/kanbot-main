import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, Check, Loader2, Mail, Moon, Sun, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { ApiError, getErrorMessage } from "@shared/api/client";
import type { LoginRequest, RegisterRequest } from "@shared/types/api";
import { AuthAlert } from "../components/AuthAlert";
import { PasswordField } from "../components/PasswordField";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "@shared/i18n/LanguageProvider";
import { useTheme } from "@shared/theme/ThemeProvider";
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "../lib/schemas";
import { safeRedirect } from "../lib/safeRedirect";

const authInputClasses =
  "min-h-[43px] w-full rounded-lg border border-kanbot-shell-control-border bg-kanbot-shell-control px-3 py-2 text-sm text-kanbot-ink shadow-none outline-none transition-colors hover:border-kanbot-accent/70 focus-visible:border-kanbot-accent focus-visible:ring-[3px] focus-visible:ring-kanbot-accent/20 aria-invalid:border-kanbot-danger-border-700 aria-invalid:focus-visible:ring-red-500/20";
const authFieldClasses = "grid gap-[7px] text-xs font-medium text-kanbot-muted";
const authErrorClasses = "mt-0.5 text-[11px] leading-[1.4] text-kanbot-danger-300";
const REMEMBERED_EMAIL_KEY = "kanbot-remembered-email";
const submitClasses =
  "mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-kanbot-auth-button bg-kanbot-auth-button px-4 py-2 text-sm font-semibold text-kanbot-auth-button-contrast shadow-[0_6px_18px_rgb(99_91_215_/_0.22)] transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-kanbot-auth-button-hover hover:shadow-[0_8px_22px_rgb(99_91_215_/_0.3)] active:translate-y-0 active:scale-[.99] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-kanbot-accent disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_6px_18px_rgb(99_91_215_/_0.22)]";
const linkClasses =
  "font-medium text-kanbot-auth-link underline-offset-4 hover:text-kanbot-auth-link-hover hover:underline";

function getRememberedEmail(): string {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function setRememberedEmail(email: string): void {
  try {
    if (email) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch {
    // Keep login usable if browser storage is unavailable.
  }
}

function AuthFrame({
  title,
  greeting,
  children,
}: {
  title: string;
  greeting: string;
  children: React.ReactNode;
}) {
  const { language, isArabic, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="relative isolate grid min-h-screen place-items-center bg-kanbot-canvas bg-[image:var(--kanbot-auth-ambient-gradient)] bg-fixed bg-cover bg-no-repeat px-4 py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat saturate-[.42]"
        style={{ backgroundImage: "url('/images/kanbot-auth-background.png')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-kanbot-canvas/55"
      />
      <div className="absolute right-5 top-5 z-20 flex items-center gap-2">
        <button
          className="grid size-9 place-items-center rounded-lg border border-kanbot-line bg-kanbot-raised p-0 text-kanbot-ink transition hover:border-kanbot-accent/50 hover:bg-kanbot-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kanbot-accent"
          type="button"
          onClick={toggleTheme}
          aria-label={t(theme === "dark" ? "Switch to light mode" : "Switch to dark mode")}
          title={t(theme === "dark" ? "Switch to light mode" : "Switch to dark mode")}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="rounded-lg border border-kanbot-line bg-kanbot-raised px-3 py-2 text-xs text-kanbot-ink transition hover:border-kanbot-accent/50 hover:bg-kanbot-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kanbot-accent" type="button" onClick={() => setLanguage(language === "en" ? "ar" : "en")}>{language === "en" ? "العربية" : "English"}</button>
      </div>
      <section className="relative z-10 w-full max-w-[460px] rounded-xl border border-kanbot-line bg-kanbot-shell-sidebar px-[22px] py-7 shadow-[0_22px_70px_rgb(0_0_0_/_0.32)] motion-safe:animate-kanbot-modal-enter motion-reduce:animate-none sm:px-9 sm:py-[34px]">
        <div className="mb-6 flex justify-center">
          <img
            className="h-auto w-[220px] max-w-full rounded-lg"
            src={theme === "light" ? "/logos/kanbot-logo-light.svg" : "/logos/kanbot-logo-dark.webp"}
            alt="Kanbot"
          />
        </div>
        <div className="mb-[23px] text-center">
          <p className="mb-2 text-xs font-medium tracking-wide text-kanbot-auth-mutedaccent">
            {t(greeting)}
          </p>
          <h1 className="text-[21px] font-semibold tracking-[-0.025em] text-kanbot-ink">
            {t(title)}
          </h1>
            <p className="mx-auto mt-2 max-w-[310px] text-[13px] leading-5 text-kanbot-muted">
            {greeting === "Welcome back"
              ? t("Pick up where you left off and keep your projects moving.")
              : t("A little planning goes a long way. Create your account and make room for great work.")}
          </p>
        </div>
        {children}
      </section>
    </main>
  );
}

export function LoginPage() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const [serverError, setServerError] = useState("");
  const [rememberMe, setRememberMe] = useState(() => Boolean(getRememberedEmail()));
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    defaultValues: { email: getRememberedEmail() },
  });
  const expired = sessionStorage.getItem("kanbot-session-expired") === "1";
  const submit = handleSubmit(async ({ email, password }) => {
    setServerError("");
    setRememberedEmail(rememberMe ? email : "");
    try {
      await login({ email, password } satisfies LoginRequest, rememberMe);
      sessionStorage.removeItem("kanbot-session-expired");
      navigate(safeRedirect(params.get("redirect")), { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <AuthFrame greeting="Welcome back" title="Sign in to Kanbot">
      {expired && (
        <AuthAlert variant="warning">
          {t("Session expired. Please sign in again.")}
        </AuthAlert>
      )}
      {serverError && <AuthAlert>{serverError}</AuthAlert>}
      <form className="grid gap-[15px]" onSubmit={submit} noValidate autoComplete="on">
        <label className={authFieldClasses} htmlFor="login-email">
          <span>{t("Email")}</span>
          <span className="relative block">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-kanbot-zinc-500"
              size={16}
              aria-hidden="true"
            />
            <input
              {...register("email", {
                onChange: (event) => {
                  setServerError("");
                  if (rememberMe) setRememberedEmail(event.target.value);
                },
              })}
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              autoFocus
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className={`${authInputClasses} pl-10`}
            />
          </span>
          {errors.email && (
            <small className={authErrorClasses} id="login-email-error">
              {errors.email.message}
            </small>
          )}
        </label>
        <PasswordField
          id="login-password"
          label={t("Password")}
          autoComplete="current-password"
          placeholder={t("Enter your password")}
          registration={register("password", {
            onChange: () => setServerError(""),
          })}
          error={errors.password?.message}
        />
        <label className="group inline-flex min-h-6 w-fit cursor-pointer select-none items-center gap-2 text-xs font-medium text-kanbot-muted transition-colors hover:text-kanbot-ink">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => {
              const shouldRemember = event.target.checked;
              setRememberMe(shouldRemember);
              setRememberedEmail(shouldRemember ? getValues("email") : "");
            }}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={`grid size-4 shrink-0 place-items-center rounded-[4px] border transition-[background-color,border-color,box-shadow] duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-kanbot-accent/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-kanbot-shell-sidebar ${rememberMe ? "border-kanbot-accent bg-kanbot-accent text-white" : "border-kanbot-line bg-kanbot-raised text-transparent group-hover:border-kanbot-accent/60"}`}
          >
            <Check size={11} strokeWidth={3} />
          </span>
          <span>{t("Remember me")}</span>
        </label>
        <button
          className={submitClasses}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {t("Signing in…")}
            </>
          ) : (
            <>
              {t("Sign in")} <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-kanbot-muted">
        {t("Don't have an account?")}{" "}
        <Link className={linkClasses} to={`/register${location.search}`}>
          {t("Create one")}
        </Link>
      </p>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const { t } = useLanguage();
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
  });
  const submit = handleSubmit(async ({ name, email, password }) => {
    setServerError("");
    try {
      await createAccount({ name, email, password } satisfies RegisterRequest);
      navigate(safeRedirect(params.get("redirect")), { replace: true });
    } catch (error) {
      let hasFieldError = false;
      if (error instanceof ApiError) {
        if (
          error.status === 409 &&
          !error.details?.some((issue) => issue.path === "email")
        ) {
          setError("email", {
            message: "An account with this email already exists",
          });
          hasFieldError = true;
        }
        for (const issue of error.details ?? []) {
          if (
            issue.path === "name" ||
            issue.path === "email" ||
            issue.path === "password"
          ) {
            setError(issue.path, { message: issue.message });
            hasFieldError = true;
          }
        }
      }
      if (!hasFieldError) setServerError(getErrorMessage(error));
    }
  });
  const loginHref = params.get("redirect")
    ? `/login?redirect=${encodeURIComponent(params.get("redirect")!)}`
    : "/login";

  return (
    <AuthFrame
      greeting="Your workspace starts here"
      title="Create your account"
    >
      {serverError && <AuthAlert>{serverError}</AuthAlert>}
      <form className="grid gap-[15px]" onSubmit={submit} noValidate>
        <label className={authFieldClasses} htmlFor="register-name">
          <span>{t("Name")}</span>
          <span className="relative block">
            <UserRound
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-kanbot-zinc-500"
              size={16}
              aria-hidden="true"
            />
            <input
              {...register("name")}
              id="register-name"
              autoComplete="name"
              placeholder={t("e.g. Sara Ahmed")}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "register-name-error" : undefined}
              className={`${authInputClasses} pl-10`}
            />
          </span>
          {errors.name && (
            <small className={authErrorClasses} id="register-name-error">
              {errors.name.message}
            </small>
          )}
        </label>
        <label className={authFieldClasses} htmlFor="register-email">
          <span>{t("Email")}</span>
          <span className="relative block">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-kanbot-zinc-500"
              size={16}
              aria-hidden="true"
            />
            <input
              {...register("email")}
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "register-email-error" : undefined
              }
              className={`${authInputClasses} pl-10`}
            />
          </span>
          {errors.email && (
            <small className={authErrorClasses} id="register-email-error">
              {errors.email.message}
            </small>
          )}
        </label>
        <PasswordField
          id="register-password"
          label={t("Password")}
          autoComplete="new-password"
          placeholder={t("Create a password")}
          registration={register("password")}
          error={errors.password?.message}
        />
        <PasswordField
          id="register-confirm-password"
          label={t("Confirm password")}
          autoComplete="new-password"
          placeholder={t("Re-enter your password")}
          registration={register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />
        <button
          className={submitClasses}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {t("Creating account…")}
            </>
          ) : (
            <>
              {t("Create account")} <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-kanbot-muted">
        {t("Already have an account?")}{" "}
        <Link className={linkClasses} to={loginHref}>
          {t("Sign in")}
        </Link>
      </p>
    </AuthFrame>
  );
}

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-kanbot-canvas bg-[image:var(--kanbot-ambient-gradient)] bg-fixed bg-cover bg-no-repeat px-4 py-8">
      <section className="w-full max-w-[460px] rounded-xl border border-kanbot-line bg-kanbot-shell-sidebar px-[22px] py-7 text-center shadow-[0_22px_70px_rgb(0_0_0_/_0.32)] sm:px-9 sm:py-[34px]">
        <h1 className="mb-5 text-xl font-semibold text-kanbot-ink">
          Page not found
        </h1>
        <Link className={linkClasses} to="/">
          Back to projects
        </Link>
      </section>
    </main>
  );
}
