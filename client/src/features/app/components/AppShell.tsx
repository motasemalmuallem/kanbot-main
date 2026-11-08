import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { queryKeys } from "@shared/api/queryKeys";
import { useProjects } from "@features/projects/hooks/useProjects";
import {
  Button,
  Dialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
} from "@shared/components/ui";
import { useAuth, useSignOut } from "../../auth";
import { useLanguage } from "@shared/i18n/LanguageProvider";
import {
  LayoutGrid,
  ListTodo,
  LogOut,
  Menu,
  PanelsTopLeft,
  Sparkles,
  Timer,
  UserRoundCog,
} from "lucide-react";
import { useTheme } from "@shared/theme/ThemeProvider";

export function AppShell() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const projectsQuery = useProjects();
  const projects = projectsQuery.data?.projects ?? [];
  const projectsLoading = projectsQuery.isPending;
  const projectsError = projectsQuery.error instanceof Error ? projectsQuery.error.message : "";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { user } = useAuth();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isArabic, t } = useLanguage();
  const { theme } = useTheme();
  useEffect(() => {
    const refreshProjects = () => void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    window.addEventListener("kanbot-projects-changed", refreshProjects);
    return () => window.removeEventListener("kanbot-projects-changed", refreshProjects);
  }, [queryClient]);
  const active = projects.find((p) => p.id === projectId);
  const selectedProject = active ?? projects[0];
  const initials = user?.name
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const pageLabel = pathname.includes("/settings")
    ? "Account settings"
    : pathname.includes("/board")
    ? "Board"
    : pathname.includes("/sprints")
      ? "Sprints"
      : pathname.includes("/backlog")
        ? "Backlog"
        : "Projects";

  useEffect(() => {
    const navigateToProjectPage = (
      page: "backlog" | "board" | "sprints",
      keyboardFocus?: "search" | "new-task",
    ) => {
      setMobileNavOpen(false);
      if (!selectedProject) {
        navigate("/projects");
        return;
      }
      navigate(`/projects/${selectedProject.id}/${page}`, {
        state: keyboardFocus ? { keyboardFocus } : null,
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;

      const target = event.target;
      const editingText = target instanceof HTMLElement && (
        target.isContentEditable ||
        target.matches("input, textarea, select")
      );
      const hasModifier = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
      if (!editingText && !hasModifier && event.code === "Slash") {
        event.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>("[data-kanbot-search]");
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          navigateToProjectPage("backlog", "search");
        }
        return;
      }

      if (editingText || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

      switch (event.code) {
        case "Digit1":
          event.preventDefault();
          navigateToProjectPage("backlog");
          break;
        case "Digit2":
          event.preventDefault();
          navigateToProjectPage("board");
          break;
        case "Digit3":
          event.preventDefault();
          navigateToProjectPage("sprints");
          break;
        case "Digit4":
          event.preventDefault();
          setMobileNavOpen(false);
          navigate("/projects");
          break;
        case "KeyN": {
          event.preventDefault();
          const newTaskInput = document.querySelector<HTMLInputElement>("[data-kanbot-new-task]");
          if (newTaskInput) {
            newTaskInput.focus();
          } else {
            navigateToProjectPage("backlog", "new-task");
          }
          break;
        }
        case "KeyU":
          event.preventDefault();
          setMobileNavOpen(false);
          navigate(selectedProject ? `/projects/${selectedProject.id}/settings` : "/settings");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, pathname, selectedProject]);
  return (
    <div
      className="relative isolate grid min-h-screen grid-cols-[252px_minmax(0,1fr)] items-start gap-3 bg-kanbot-canvas bg-[image:var(--kanbot-ambient-gradient)] bg-fixed bg-cover bg-no-repeat p-3 max-[769px]:block max-[769px]:p-0"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <button
        className={`fixed inset-0 z-40 block bg-kanbot-overlay-50 transition-opacity min-[769px]:hidden ${mobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        aria-label={t("Close navigation")}
        onClick={() => setMobileNavOpen(false)}
        tabIndex={mobileNavOpen ? 0 : -1}
      />
      <aside dir={isArabic ? "rtl" : "ltr"} className={`relative z-10 sticky top-3 flex h-[calc(100dvh-24px)] min-h-[540px] flex-col overflow-hidden rounded-xl border border-kanbot-line bg-kanbot-shell-sidebar p-3.5 shadow-xl max-[769px]:fixed max-[769px]:inset-y-0 ${isArabic ? "max-[769px]:right-0 max-[769px]:rounded-l-2xl" : "max-[769px]:left-0 max-[769px]:rounded-r-2xl"} max-[769px]:z-50 max-[769px]:h-dvh max-[769px]:min-h-0 max-[769px]:w-[280px] max-[769px]:rounded-none max-[769px]:transition-transform ${mobileNavOpen ? "max-[769px]:translate-x-0" : isArabic ? "max-[769px]:translate-x-full" : "max-[769px]:-translate-x-full"}`}>
        <div className="min-h-[52px] border-b border-kanbot-line px-1 pb-3">
          <Link
            className="flex items-center gap-2.5 px-0.5 py-1"
            to="/projects"
            onClick={() => setMobileNavOpen(false)}
          >
            <img
              className="block h-auto max-w-full rounded-md"
              style={{ width: 148 }}
              src={theme === "light" ? "/logos/kanbot-logo-light.svg" : "/logos/kanbot-logo-dark.webp"}
              alt="Kanbot"
            />
          </Link>
        </div>
        <label className="mb-2 mt-4 text-[11px] font-medium text-kanbot-muted" htmlFor="project-switcher">
          {t("Workspace")}
        </label>
        <Select
          id="project-switcher"
          items={projects.map((project) => ({ value: project.id, label: `${project.key} · ${t(project.name)}` }))}
          disabled={projectsLoading}
          value={active?.id ?? null}
          onValueChange={(value) => {
            if (typeof value !== "string" || !value) return;
            navigate(`/projects/${value}/backlog`);
            setMobileNavOpen(false);
          }}
        >
          <SelectTrigger className="!mb-5 !min-h-10 !w-full !rounded-lg !border-kanbot-shell-control-border !bg-kanbot-shell-control hover:!border-kanbot-accent focus-visible:!border-kanbot-accent !text-kanbot-ink" id="project-switcher" aria-label={t("Project")}>
            <SelectValue
              placeholder={
                projectsLoading
                    ? t("Loading projects…")
                    : projectsError
                    ? t("Projects unavailable")
                    : t("Select a project")
              }
            />
          </SelectTrigger>
          <SelectContent className="!border-kanbot-shell-control-border !bg-kanbot-shell-control">
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.key} · {t(p.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {projectsError && (
          <div className="m-2 grid gap-2 rounded-lg border border-kanbot-danger-border-900/70 bg-kanbot-danger-soft-30 p-2 text-[10px] text-kanbot-danger-200" role="alert">
            <span>{projectsError}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void projectsQuery.refetch()}
            >
              {t("Retry")}
            </Button>
          </div>
        )}
        <small className="mb-1.5 text-[10px] font-semibold tracking-[.1em] text-kanbot-muted">{t("PROJECT")}</small>
        {selectedProject && (
          <nav className="grid gap-1">
            <NavLink
              to={`/projects/${selectedProject.id}/backlog`}
              className={({ isActive }) => `relative flex min-h-[42px] items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${isActive ? "bg-kanbot-violet-soft-15 text-kanbot-ink before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-kanbot-indigo-400 rtl:before:left-auto rtl:before:right-0" : "text-kanbot-zinc-300 hover:bg-kanbot-raised hover:text-kanbot-ink"}`}
              onClick={() => setMobileNavOpen(false)}
            >
              <ListTodo size={18} className="text-kanbot-indigo-300" /> <span>{t("Backlog")}</span>
            </NavLink>
            <NavLink
              to={`/projects/${selectedProject.id}/board`}
              className={({ isActive }) => `relative flex min-h-[42px] items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${isActive ? "bg-kanbot-violet-soft-15 text-kanbot-ink before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-kanbot-violet-400 rtl:before:left-auto rtl:before:right-0" : "text-kanbot-zinc-300 hover:bg-kanbot-raised hover:text-kanbot-ink"}`}
              onClick={() => setMobileNavOpen(false)}
            >
              <LayoutGrid size={18} className="text-kanbot-violet-300" /> <span>{t("Board")}</span>
            </NavLink>
            <NavLink
              to={`/projects/${selectedProject.id}/sprints`}
              className={({ isActive }) => `relative flex min-h-[42px] items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${isActive ? "bg-kanbot-violet-soft-15 text-kanbot-ink before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-kanbot-emerald-400 rtl:before:left-auto rtl:before:right-0" : "text-kanbot-zinc-300 hover:bg-kanbot-raised hover:text-kanbot-ink"}`}
              onClick={() => setMobileNavOpen(false)}
            >
              <Timer size={18} className="text-kanbot-success-300" /> <span>{t("Sprints")}</span>
            </NavLink>
          </nav>
        )}
        <NavLink
          className={({ isActive }) => `mt-5 flex min-h-[48px] items-center gap-3 rounded-lg border px-3 py-2 text-[13px] font-medium transition ${isActive ? "border-kanbot-accent/40 bg-kanbot-violet-soft-15 text-kanbot-ink" : "border-kanbot-line text-kanbot-zinc-300 hover:bg-kanbot-raised hover:text-kanbot-ink"}`}
          to="/projects"
          end
          onClick={() => setMobileNavOpen(false)}
        >
          <PanelsTopLeft size={18} className="text-kanbot-indigo-300" /> <span>{t("Projects")}</span>
        </NavLink>
        <footer className="mt-auto flex min-w-0 items-center gap-2.5 border-t border-kanbot-line pt-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-kanbot-line-strong bg-kanbot-raised text-xs font-semibold text-kanbot-ink">{initials || "U"}</span>
          <Link
            to={selectedProject ? `/projects/${selectedProject.id}/settings` : "/settings"}
            className="group grid min-w-0 flex-1 rounded-md text-xs font-semibold text-kanbot-ink outline-none transition-colors hover:text-kanbot-accent focus-visible:ring-2 focus-visible:ring-kanbot-accent/50"
            title={t("Open account settings")}
            aria-label={t("Open account settings")}
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="truncate">{user?.name ?? "Your account"}</span>
            <small className="mt-0.5 truncate text-[10px] font-normal text-kanbot-muted group-hover:text-kanbot-accent">{user?.email}</small>
          </Link>
          <Tooltip content={t("Log out")}>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setLogoutDialogOpen(true)}
            aria-label={t("Log out")}
          >
            <LogOut size={16} />
          </Button>
          </Tooltip>
        </footer>
      </aside>
      <main className="  relative z-10 flex h-[calc(100dvh-24px)] min-h-[600px] min-w-0 flex-col overflow-y-auto overflow-x-hidden rounded-xl border border-kanbot-line bg-kanbot-shell-sidebar shadow-xl max-[769px]:h-dvh max-[769px]:min-h-dvh max-[769px]:rounded-none max-[769px]:border-0">
        <header className=" sticky top-0 z-20 flex min-h-[58px] shrink-0 items-center justify-between gap-3 border-b border-kanbot-line bg-transparent px-6 backdrop-blur-lg max-[769px]:min-h-[54px] max-[769px]:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Tooltip content={t("Open navigation")}>
            <Button
              variant="secondary"
              size="icon"
              className="min-[770px]:!hidden"
              aria-label={t("Open navigation")}
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={19} />
            </Button>
            </Tooltip>
            <div className="flex min-w-0 items-center gap-3 text-xs text-kanbot-muted max-[769px]:gap-2 max-[769px]:text-[11px]">
              <Link
                className="max-[769px]:hidden transition-colors hover:text-kanbot-accent hover:underline focus-visible:rounded-sm"
                to="/projects"
              >
                {t("Workspace")}
              </Link>
              <span className="text-kanbot-zinc-600 max-[769px]:hidden">/</span>
              <Link
                className="max-w-[min(40vw,320px)] truncate font-semibold text-kanbot-ink transition-colors hover:text-kanbot-accent hover:underline focus-visible:rounded-sm max-[420px]:max-w-[18vw]"
                to={selectedProject ? `/projects/${selectedProject.id}/backlog` : "/projects"}
              >
                {t(active?.name ?? "Projects")}
              </Link>
              <span className="text-kanbot-zinc-600">/</span>
              <Link
                className="transition-colors hover:text-kanbot-accent hover:underline focus-visible:rounded-sm"
                to={pathname}
                aria-current="page"
              >
                {t(pageLabel)}
              </Link>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Tooltip content={t("Account settings")} placement="bottom">
              <Button
                variant="secondary"
                size="icon"
                aria-label={t("Account settings")}
                onClick={() => {
                  setMobileNavOpen(false);
                  navigate(selectedProject ? `/projects/${selectedProject.id}/settings` : "/settings");
                }}
              >
                <UserRoundCog size={16} />
              </Button>
            </Tooltip>
            <Tooltip content={t("Open AI assistant")} placement="bottom">
              <Button
                variant="secondary"
                size="sm"
                className="max-[420px]:size-9 max-[420px]:justify-center max-[420px]:px-0"
                onClick={() => window.dispatchEvent(new Event("open-ai-drawer"))}
              >
                <Sparkles size={15} /> <span className="max-[420px]:sr-only">{t("Ask AI")}</span>
              </Button>
            </Tooltip>
          </div>
        </header>
        <Outlet />
      </main>
      <Dialog
        open={logoutDialogOpen}
        title={t("Log out?")}
        description={t("Are you sure you want to end this session?")}
        onClose={() => setLogoutDialogOpen(false)}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLogoutDialogOpen(false)}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              icon={<LogOut size={15} />}
              onClick={signOut}
            >
              {t("Log out")}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-lg border border-kanbot-line bg-kanbot-raised/60 p-4 text-sm text-kanbot-muted">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-kanbot-accent/25 bg-kanbot-accent/10 text-kanbot-accent">
            <Sparkles size={17} aria-hidden="true" />
          </span>
          <p className="leading-6">{t("Your work is saved, and you can come back whenever you're ready.")}</p>
        </div>
      </Dialog>
    </div>
  );
}
