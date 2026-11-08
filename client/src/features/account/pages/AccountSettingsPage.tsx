import { Fragment } from "react";
import {
  Keyboard,
  Languages,
  Moon,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import { useParams } from "react-router";
import { useAuth } from "@features/auth/hooks/useAuth";
import { Button } from "@shared/components/ui";
import { useLanguage } from "@shared/i18n/LanguageProvider";
import { useTheme } from "@shared/theme/ThemeProvider";

const shortcuts = [
  {
    group: "Navigation",
    keys: ["Alt", "1"],
    title: "Backlog",
    description: "Open the current project's Backlog.",
  },
  {
    group: "Navigation",
    keys: ["Alt", "2"],
    title: "Board",
    description: "Open the current project's Board.",
  },
  {
    group: "Navigation",
    keys: ["Alt", "3"],
    title: "Sprints",
    description: "Open the current project's Sprints.",
  },
  {
    group: "Navigation",
    keys: ["Alt", "4"],
    title: "Projects",
    description: "Open the projects overview.",
  },
  {
    group: "Actions",
    keys: ["/"],
    title: "Focus search",
    description: "Search projects or tasks, depending on the page.",
    icon: Search,
  },
  {
    group: "Actions",
    keys: ["Alt", "N"],
    title: "Add a task",
    description: "Open Backlog and focus the quick-add field.",
  },
  {
    group: "Actions",
    keys: ["Alt", "U"],
    title: "Open account settings",
    description: "Open your profile and preferences.",
    icon: UserRound,
  },
  {
    group: "Actions",
    keys: ["Esc"],
    title: "Close dialog",
    description: "Dismiss the open dialog or confirmation window.",
  },
];

export function AccountSettingsPage() {
  const { user } = useAuth();
  const { projectId } = useParams();
  const { language, isArabic, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const initials = user?.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header
        dir={isArabic ? "rtl" : "ltr"}
        className="flex min-h-[76px] items-center justify-between gap-3 border-b border-kanbot-line bg-transparent px-page py-3 max-md:min-h-[68px] max-md:px-4"
      >
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight text-kanbot-ink max-md:text-lg">
            {t("Account settings")}
          </h1>
          <p className="mt-1 text-xs text-kanbot-muted">
            {t("Your profile, preferences, and shortcuts.")}
          </p>
        </div>
      </header>

      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="grid min-h-[calc(100dvh-178px)] content-start gap-3 bg-transparent px-page py-4 pb-6 motion-safe:animate-kanbot-page-enter motion-reduce:animate-none max-md:px-4"
      >
        <section className="rounded-panel border border-kanbot-line bg-kanbot-panel p-3.5 shadow-sm sm:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-kanbot-line-strong bg-kanbot-raised text-sm font-semibold text-kanbot-ink">
              {initials || "U"}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-kanbot-ink">
                {user?.name ?? t("Your account")}
              </h2>
              <p className="mt-0.5 truncate text-xs text-kanbot-muted">{user?.email}</p>
            </div>
            <span className="rounded-full border border-kanbot-success-border-800/70 bg-kanbot-success-soft-40 px-2 py-0.5 text-[10px] font-medium text-kanbot-success-300">
              {t("Signed in")}
            </span>
          </div>
        </section>

        <section className="grid gap-2.5 xl:grid-cols-2">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-panel border border-kanbot-line bg-kanbot-panel p-3 shadow-sm">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-kanbot-line bg-kanbot-raised text-kanbot-violet-200">
                {theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-kanbot-ink">{t("Appearance")}</p>
                <p className="mt-0.5 text-xs text-kanbot-muted">
                  {t(theme === "dark" ? "Dark mode" : "Light mode")}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0 max-[420px]:w-full max-[420px]:justify-center"
              icon={theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              onClick={toggleTheme}
            >
              {t(theme === "dark" ? "Switch to light mode" : "Switch to dark mode")}
            </Button>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-3 rounded-panel border border-kanbot-line bg-kanbot-panel p-3 shadow-sm">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-kanbot-line bg-kanbot-raised text-kanbot-indigo-300">
                <Languages size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-kanbot-ink">{t("Language")}</p>
                <p className="mt-0.5 text-xs text-kanbot-muted">
                  {language === "ar" ? "العربية" : "English"}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            >
              {language === "en" ? "العربية" : "English"}
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-panel border border-kanbot-line bg-kanbot-panel shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-kanbot-line bg-kanbot-raised px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2.5">
              <Keyboard size={18} className="text-kanbot-accent" aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold text-kanbot-ink">
                  {t("Keyboard shortcuts")}
                </h2>
                <p className="mt-1 text-xs text-kanbot-muted">
                  {t("Move between project pages and common actions with these keys.")}
                </p>
              </div>
            </div>
            {projectId && (
              <span className="rounded-md border border-kanbot-line bg-kanbot-panel px-2 py-1 text-[11px] text-kanbot-muted">
                {t("Current project")}
              </span>
            )}
          </header>

          <div className="grid gap-3 p-3.5 sm:grid-cols-2 sm:gap-4 sm:p-4">
            {["Navigation", "Actions"].map((group) => (
              <div className="grid content-start gap-1.5" key={group}>
                <h3 className="px-1 text-[10px] font-semibold uppercase tracking-wide text-kanbot-muted">
                  {t(group)}
                </h3>
                {shortcuts.filter((shortcut) => shortcut.group === group).map((shortcut) => {
                  const Icon = shortcut.icon;
                  return (
                    <article
                      className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-kanbot-line bg-kanbot-raised/70 px-3 py-2 transition-colors hover:border-kanbot-line-strong hover:bg-kanbot-raised"
                      key={shortcut.title}
                    >
                      <div className="flex min-w-0 items-start gap-2.5">
                        {Icon && (
                          <Icon size={15} className="mt-0.5 shrink-0 text-kanbot-accent" aria-hidden="true" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-kanbot-ink">
                            {t(shortcut.title)}
                          </p>
                          <p className="mt-0.5 text-[10px] leading-snug text-kanbot-muted">
                            {t(shortcut.description)}
                          </p>
                        </div>
                      </div>
                      <span className="flex shrink-0 items-center gap-1" dir="ltr">
                        {shortcut.keys.map((key, index) => (
                          <Fragment key={`${shortcut.title}-${key}`}>
                            {index > 0 && <span className="text-[10px] text-kanbot-subtle">+</span>}
                            <kbd className="min-w-7 rounded-md border border-kanbot-line-strong bg-kanbot-panel px-2 py-1 text-center font-mono text-[11px] font-medium text-kanbot-zinc-200 shadow-[inset_0_-1px_0_rgb(255_255_255_/_0.04)]">
                              {key}
                            </kbd>
                          </Fragment>
                        ))}
                      </span>
                    </article>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
