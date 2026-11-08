import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  FolderKanban,
  FolderPlus,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { ApiError, getErrorMessage } from "@shared/api/client";
import { Button, EmptyState, Spinner, Tooltip } from "@shared/components/ui";
import type { ProjectWithStats } from "@shared/types/api";
import { DeleteProjectDialog } from "../components/DeleteProjectDialog";
import { ProjectFormDialog } from "../components/ProjectFormDialog";
import { emptyProjectForm, type ProjectFormValues } from "../types/project";
import { useLanguage } from "@shared/i18n/LanguageProvider";
import { useDeleteProject, useProjects, useSaveProject } from "../hooks/useProjects";

const EMPTY_PROJECTS: ProjectWithStats[] = [];

export function ProjectsPage() {
  const projectsQuery = useProjects();
  const saveProject = useSaveProject();
  const removeProject = useDeleteProject();
  const projects = projectsQuery.data?.projects ?? EMPTY_PROJECTS;
  const [search, setSearch] = useState("");
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<ProjectFormValues>(emptyProjectForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProjectFormValues, string>>>({});
  const [formError, setFormError] = useState("");
  const [deletingProject, setDeletingProject] = useState<ProjectWithStats | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { t, isArabic, formatNumber } = useLanguage();

  const loading = projectsQuery.isPending;
  const loadError = projectsQuery.error ? getErrorMessage(projectsQuery.error) : "";
  const saving = saveProject.isPending;
  const deleting = removeProject.isPending;

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      `${project.name} ${project.key} ${project.description}`.toLowerCase().includes(query),
    );
  }, [projects, search]);

  const openCreateDialog = () => {
    setEditingProject(null);
    setFormValues(emptyProjectForm);
    setFieldErrors({});
    setFormError("");
    setFormOpen(true);
  };

  const openEditDialog = (project: ProjectWithStats) => {
    setEditingProject(project);
    setFormValues({
      name: project.name,
      key: project.key,
      description: project.description,
    });
    setFieldErrors({});
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingProject(null);
  };

  const submitProject = async (values: ProjectFormValues) => {
    setFieldErrors({});
    setFormError("");
    try {
      const body = {
        name: values.name,
        description: values.description,
        ...((values.key || editingProject) ? { key: values.key } : {}),
      };
      await saveProject.mutateAsync({ projectId: editingProject?.id, body });
      window.dispatchEvent(new Event("kanbot-projects-changed"));
      setFormOpen(false);
      setEditingProject(null);
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped: Partial<Record<keyof ProjectFormValues, string>> = {};
        for (const detail of error.details ?? []) {
          if (detail.path === "name" || detail.path === "key" || detail.path === "description") {
            mapped[detail.path] = detail.message;
          }
        }
        if (error.status === 409 && !mapped.key) {
          mapped.key = "This project key is already in use. Choose another key.";
        }
        setFieldErrors(mapped);
        if (error.status !== 409 && Object.keys(mapped).length === 0) {
          setFormError(getErrorMessage(error));
        }
      } else {
        setFormError(getErrorMessage(error));
      }
    }
  };

  const confirmDelete = async () => {
    if (!deletingProject) return;
    setDeleteError("");
    try {
      await removeProject.mutateAsync(deletingProject.id);
      window.dispatchEvent(new Event("kanbot-projects-changed"));
      if (projectId === deletingProject.id) navigate("/projects", { replace: true });
      setDeletingProject(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    }
  };

  return (
    <>
      <header dir={isArabic ? "rtl" : "ltr"} className="flex min-h-[76px] items-center justify-between gap-3 border-b border-kanbot-line bg-transparent px-page py-4 max-md:min-h-[66px] max-md:px-4">
        <h1 className="m-0 text-xl font-semibold tracking-tight text-kanbot-ink max-md:text-lg">
          {t("Projects")} <small className="ms-3 text-xs font-normal text-kanbot-muted"><bdi>{formatNumber(projects.length)}</bdi> {t(projects.length === 1 ? "project" : "projects")}</small>
        </h1>
        <Button onClick={openCreateDialog} icon={<FolderPlus size={16} />}>
          {t("New project")}
        </Button>
      </header>

      <div dir={isArabic ? "rtl" : "ltr"} className="min-h-[calc(100vh-168px)] bg-transparent px-page pb-8 pt-4 motion-safe:animate-kanbot-page-enter motion-reduce:animate-none max-md:px-4">
        {projects.length > 0 && (
          <label className="relative mb-4 block w-full max-w-[420px] text-kanbot-muted">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" size={16} aria-hidden="true" />
            <input
              className="min-h-[42px] w-full rounded-lg border border-kanbot-line-strong bg-kanbot-panel pl-9 pr-3 text-sm text-kanbot-ink outline-none placeholder:text-kanbot-subtle focus:border-kanbot-accent focus:ring-2 focus:ring-kanbot-accent/20 rtl:pl-3 rtl:pr-9"
              type="search"
              data-kanbot-search
              aria-label={t("Search projects")}
              placeholder={t("Search projects…")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        )}

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-2.5 text-sm text-kanbot-muted"><Spinner label={t("Loading projects")} /> {t("Loading projects…")}</div>
        ) : loadError ? (
          <EmptyState
            className="!mt-3 !rounded-panel !border-kanbot-line-strong !bg-kanbot-panel !text-kanbot-ink"
            icon={<FolderKanban size={23} />}
            title={t("Couldn't load projects")}
            description={loadError}
            action={<Button variant="secondary" onClick={() => void projectsQuery.refetch()}>{t("Try again")}</Button>}
          />
        ) : projects.length === 0 ? (
          <EmptyState
            className="!mt-3 !rounded-panel !border-kanbot-line-strong !bg-kanbot-panel !text-kanbot-ink"
            icon={<FolderKanban size={23} />}
            title={t("No projects yet")}
            description={t("Create your first project to start planning backlogs and sprints.")}
            action={<Button onClick={openCreateDialog} icon={<FolderPlus size={16} />}>{t("Create your first project")}</Button>}
          />
        ) : visibleProjects.length === 0 ? (
          <EmptyState
            className="!mt-3 !rounded-panel !border-kanbot-line-strong !bg-kanbot-panel !text-kanbot-ink"
            icon={<Search size={23} />}
            title={t("No matching projects")}
            description={`${t("No projects match")} “${search.trim()}”. ${t("Try another name or key.")}`}
            action={<Button variant="secondary" onClick={() => setSearch("")}>{t("Clear search")}</Button>}
          />
        ) : (
          <div className="mt-3 grid grid-cols-1 items-stretch gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map((project, index) => (
              <article className="group relative grid min-h-[200px] rounded-panel border border-kanbot-line bg-kanbot-panel shadow-sm transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-kanbot-line-strong hover:shadow-lg motion-safe:animate-kanbot-card-enter motion-reduce:animate-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100" key={project.id} style={{ animationDelay: `${Math.min(index * 75, 375)}ms` }}>
                <div className="absolute right-3 top-3 z-10 flex gap-1.5 rtl:left-3 rtl:right-auto">
                  <Tooltip content={`${t("Edit project")}: ${project.name}`} placement="bottom" align="end"><button type="button" className="grid size-8 place-items-center rounded-lg border border-kanbot-line bg-kanbot-raised text-kanbot-muted transition hover:border-kanbot-line-strong hover:bg-kanbot-hover hover:text-kanbot-ink" aria-label={`${t("Edit project")}: ${project.name}`} onClick={() => openEditDialog(project)}>
                    <Pencil size={15} />
                  </button></Tooltip>
                  <Tooltip content={`${t("Delete project")}: ${project.name}`} placement="bottom" align="end"><button type="button" className="grid size-8 place-items-center rounded-lg border border-kanbot-line bg-kanbot-raised text-kanbot-muted transition hover:border-kanbot-danger-border-900 hover:bg-kanbot-danger-soft-40 hover:text-kanbot-danger-300" aria-label={`${t("Delete project")}: ${project.name}`} onClick={() => { setDeleteError(""); setDeletingProject(project); }}>
                    <Trash2 size={15} />
                  </button></Tooltip>
                </div>
                <button type="button" className="grid min-h-[198px] w-full content-start gap-3.5 bg-transparent p-4 text-start text-kanbot-ink hover:bg-transparent" onClick={() => navigate(`/projects/${project.id}/backlog`)}>
                  <span className="flex min-h-[42px] items-center gap-3 pe-[78px]">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-kanbot-line-strong bg-kanbot-hover text-kanbot-violet-200"><FolderKanban size={20} /></span>
                    <span className="grid min-w-0 justify-items-start gap-1">
                      <strong dir="auto" className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-kanbot-ink">{t(project.name)}</strong>
                      <span className="rounded-md border border-kanbot-line bg-kanbot-hover px-1.5 py-0.5 text-[10px] leading-tight text-kanbot-zinc-300">{project.key}</span>
                    </span>
                  </span>
                  <span dir="auto" className="line-clamp-2 min-h-[38px] text-xs leading-relaxed text-kanbot-muted">{project.description || t("No description")}</span>
                  <span className="w-full border-t border-kanbot-line" />
                  <span dir="auto" className="break-words text-[11px] leading-relaxed text-kanbot-muted">
                    <bdi>{formatNumber(project.stats.backlogCount)}</bdi> {t("backlog tasks")} · {project.stats.activeSprint?.name ? <>{t("Active sprint")}: <bdi dir="auto">{project.stats.activeSprint.name}</bdi></> : t("No active sprint")}
                  </span>
                </button>
              </article>
            ))}
            <button type="button" className="flex min-h-[200px] items-center justify-center gap-2 rounded-panel border border-dashed border-kanbot-line-strong bg-kanbot-white-soft-1 text-sm text-kanbot-muted transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-kanbot-accent hover:bg-kanbot-violet-soft-strong hover:text-kanbot-ink motion-safe:animate-kanbot-card-enter motion-reduce:animate-none motion-reduce:transition-none" style={{ animationDelay: `${Math.min(visibleProjects.length * 75, 375)}ms` }} onClick={openCreateDialog}>
              <FolderPlus size={20} /> {t("New project")}
            </button>
          </div>
        )}
      </div>

      {formOpen && (
        <ProjectFormDialog
          project={editingProject}
          values={formValues}
          fieldErrors={fieldErrors}
          formError={formError}
          saving={saving}
          onClose={closeForm}
          onSubmit={(values) => void submitProject(values)}
        />
      )}

      {deletingProject && (
        <DeleteProjectDialog
          project={deletingProject}
          deleting={deleting}
          error={deleteError}
          onClose={() => { if (!deleting) setDeletingProject(null); }}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </>
  );
}
