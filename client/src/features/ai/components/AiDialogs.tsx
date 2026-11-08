import { Button, Modal, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui";
import { useLanguage } from "@shared/i18n/LanguageProvider";
import type { DraftTodo, PlanSprintResponse, Todo } from "@shared/types/api";
import type { ActionError } from "../types/actionError";
import { ActionErrorNotice } from "./ActionErrorNotice";

type GenerateTodosDialogProps = {
  open: boolean;
  saving: boolean;
  generating: boolean;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  count: number;
  onCountChange: (count: number) => void;
  onGenerate: () => void;
  generateError: ActionError;
  drafts: DraftTodo[];
  selected: boolean[];
  onToggleDraft: (index: number, checked: boolean) => void;
  onUpdateDraft: (index: number, patch: Partial<DraftTodo>) => void;
  saveError: ActionError;
  onSave: () => void;
  onClose: () => void;
};

export function GenerateTodosDialog({
  open,
  saving,
  generating,
  prompt,
  onPromptChange,
  count,
  onCountChange,
  onGenerate,
  generateError,
  drafts,
  selected,
  onToggleDraft,
  onUpdateDraft,
  saveError,
  onSave,
  onClose,
}: GenerateTodosDialogProps) {
  const { t } = useLanguage();
  const selectedCount = selected.filter(Boolean).length;

  return (
    <Modal
      open={open}
      title={`✦ ${t("Generate todos with AI")}`}
      onClose={() => {
        if (!saving) onClose();
      }}
    >
      <div className="grid gap-4 p-5 text-sm text-kanbot-zinc-300 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-xs [&_label]:font-medium">
        <label>
          {t("Describe the feature")}
          <textarea
            className="mt-1 min-h-20 w-full rounded-lg border border-kanbot-line-strong bg-kanbot-page px-3 py-2 text-sm text-kanbot-ink outline-none placeholder:text-kanbot-subtle focus:border-kanbot-accent focus:ring-2 focus:ring-kanbot-accent/20"
            rows={3}
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder={t("e.g. User profile page with avatar upload")}
          />
        </label>
        <label>
          {t("Number of suggestions")}
          <input
            className="mt-1 min-h-10 w-full rounded-lg border border-kanbot-line-strong bg-kanbot-page px-3 text-sm text-kanbot-ink outline-none focus:border-kanbot-accent focus:ring-2 focus:ring-kanbot-accent/20"
            type="number"
            min="1"
            max="10"
            value={count}
            onChange={(event) =>
              onCountChange(
                Math.max(1, Math.min(10, Number(event.target.value) || 1)),
              )
            }
          />
        </label>
        <Button
          className="justify-self-start"
          variant="secondary"
          size="md"
          disabled={generating || prompt.trim().length < 3}
          onClick={onGenerate}
        >
          {generating ? t("Generating…") : `✦ ${t("Generate drafts")}`}
        </Button>
      </div>
      <ActionErrorNotice error={generateError} />
      {generating && (
        <p className="px-5 py-3 text-xs text-kanbot-muted">
          {t("Generating editable drafts…")}
        </p>
      )}
      {drafts.length > 0 && (
        <>
          <h3>
            {t("Suggested todos")} ({drafts.length})
          </h3>
          <div className="grid max-h-[45vh] gap-3 overflow-y-auto px-5">
            {drafts.map((draft, index) => (
              <div
                className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 rounded-lg border border-kanbot-line bg-kanbot-raised p-3 max-md:grid-cols-1 [&_input:not([type=checkbox])]:min-h-10 [&_input:not([type=checkbox])]:min-w-0 [&_input:not([type=checkbox])]:rounded-md [&_input:not([type=checkbox])]:border [&_input:not([type=checkbox])]:border-kanbot-line-strong [&_input:not([type=checkbox])]:bg-kanbot-page [&_input:not([type=checkbox])]:px-2 [&_input:not([type=checkbox])]:text-xs [&_input:not([type=checkbox])]:text-kanbot-ink [&_textarea]:min-h-10 [&_textarea]:min-w-0 [&_textarea]:rounded-md [&_textarea]:border [&_textarea]:border-kanbot-line-strong [&_textarea]:bg-kanbot-page [&_textarea]:px-2 [&_textarea]:py-2 [&_textarea]:text-xs [&_textarea]:text-kanbot-ink [&_button]:w-full"
                key={index}
              >
                <input
                  aria-label={`Select suggestion ${index + 1}`}
                  type="checkbox"
                  checked={Boolean(selected[index])}
                  onChange={(event) => onToggleDraft(index, event.target.checked)}
                />
                <input
                  aria-label={t("Task title")}
                  value={draft.title}
                  maxLength={200}
                  onChange={(event) =>
                    onUpdateDraft(index, { title: event.target.value })
                  }
                />
                <textarea
                  aria-label={t("Task description")}
                  rows={2}
                  value={draft.description}
                  onChange={(event) =>
                    onUpdateDraft(index, { description: event.target.value })
                  }
                />
                <Select
                  value={draft.type}
                  onValueChange={(value) => {
                    if (typeof value === "string")
                      onUpdateDraft(index, {
                        type: value as DraftTodo["type"],
                      });
                  }}
                >
                  <SelectTrigger aria-label={t("Task type")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">{t("Task")}</SelectItem>
                    <SelectItem value="story">{t("Story")}</SelectItem>
                    <SelectItem value="bug">{t("Bug")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={draft.priority}
                  onValueChange={(value) => {
                    if (typeof value === "string")
                      onUpdateDraft(index, {
                        priority: value as DraftTodo["priority"],
                      });
                  }}
                >
                  <SelectTrigger aria-label={t("Task priority")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("Low")}</SelectItem>
                    <SelectItem value="medium">{t("Medium")}</SelectItem>
                    <SelectItem value="high">{t("High")}</SelectItem>
                    <SelectItem value="urgent">{t("Urgent")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={draft.storyPoints}
                  onValueChange={(value) =>
                    onUpdateDraft(index, {
                      storyPoints:
                        value == null
                          ? null
                          : (Number(value) as DraftTodo["storyPoints"]),
                    })
                  }
                >
                  <SelectTrigger aria-label={t("Story points")}>
                    <SelectValue placeholder={t("No points")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>{t("No points")}</SelectItem>
                    {[1, 2, 3, 5, 8, 13].map((points) => (
                      <SelectItem key={points} value={points}>
                        {points} {t("pts")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <ActionErrorNotice error={saveError} />
          <footer className="mt-4 flex flex-wrap justify-end gap-2 border-t border-kanbot-line px-5 py-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              {t("Cancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onSave}
              disabled={saving || !selectedCount}
            >
              {saving
                ? t("Saving…")
                : `${t("Add selected to backlog")} (${selectedCount})`}
            </Button>
          </footer>
        </>
      )}
    </Modal>
  );
}

type PlanSprintDialogProps = {
  open: boolean;
  loading: boolean;
  capacity: number;
  onCapacityChange: (capacity: number) => void;
  focus: string;
  onFocusChange: (focus: string) => void;
  onSuggest: () => void;
  error: ActionError;
  result: PlanSprintResponse | null;
  onGoalChange: (goal: string) => void;
  todos: Todo[];
  onToggleTodo: (todoId: string, checked: boolean) => void;
  onCreateSprint: () => void;
  onClose: () => void;
};

export function PlanSprintDialog({
  open,
  loading,
  capacity,
  onCapacityChange,
  focus,
  onFocusChange,
  onSuggest,
  error,
  result,
  onGoalChange,
  todos,
  onToggleTodo,
  onCreateSprint,
  onClose,
}: PlanSprintDialogProps) {
  const { t } = useLanguage();

  return (
    <Modal
      open={open}
      title={`✦ ${t("Plan sprint with AI")}`}
      onClose={() => {
        if (!loading) onClose();
      }}
    >
      <form
        className="grid gap-4 p-5 text-sm text-kanbot-zinc-300 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-xs [&_label]:font-medium [&_input]:mt-1 [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-kanbot-line-strong [&_input]:bg-kanbot-page [&_input]:px-3 [&_input]:text-sm [&_input]:text-kanbot-ink [&_input]:outline-none [&_input]:focus:border-kanbot-accent"
        onSubmit={(event) => {
          event.preventDefault();
          onSuggest();
        }}
      >
        <label>
          {t("Capacity (story points)")}
          <input
            required
            type="number"
            min="1"
            max="200"
            value={capacity}
            onChange={(event) => onCapacityChange(Number(event.target.value))}
          />
        </label>
        <label>
          {t("Focus / goal")}
          <input
            maxLength={300}
            value={focus}
            onChange={(event) => onFocusChange(event.target.value)}
            placeholder={t("Optional sprint goal")}
          />
        </label>
        <Button variant="secondary" size="md" className="justify-self-start" type="submit" disabled={loading}>
          {loading ? t("Planning…") : `✦ ${t("Suggest plan")}`}
        </Button>
      </form>
      <ActionErrorNotice error={error} />
      {loading && (
        <p className="px-5 py-3 text-xs text-kanbot-muted">
          {t("Reviewing backlog and capacity…")}
        </p>
      )}
      {result && (
        <div className="grid gap-3 px-5 pb-5 text-sm text-kanbot-zinc-300 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-xs [&_label]:font-medium [&_input]:mt-1 [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-kanbot-line-strong [&_input]:bg-kanbot-page [&_input]:px-3 [&_input]:text-kanbot-ink [&_input]:outline-none [&_input]:focus:border-kanbot-accent">
          <label>
            {t("Suggested sprint goal")}
            <input
              value={result.goal}
              maxLength={300}
              onChange={(event) => onGoalChange(event.target.value)}
            />
          </label>
          <h3>
            {t("Selected backlog tasks")} · {result.totalPoints} / {capacity}{" "}
            {t("pts")}
          </h3>
          <p>{result.reasoning}</p>
          <div className="grid max-h-56 gap-2 overflow-y-auto rounded-lg border border-kanbot-line bg-kanbot-raised p-3">
            {todos.map((todo) => (
              <label key={todo.id}>
                <input
                  type="checkbox"
                  checked={result.todoIds.includes(todo.id)}
                  disabled={
                    !result.todoIds.includes(todo.id) &&
                    result.totalPoints + (todo.storyPoints ?? 0) > capacity
                  }
                  onChange={(event) => onToggleTodo(todo.id, event.target.checked)}
                />
                <span>{todo.key}</span>
                <strong>{todo.title}</strong>
                <span>
                  {todo.storyPoints ?? "—"} {t("pts")}
                </span>
              </label>
            ))}
          </div>
          {!todos.length && (
            <p className="rounded-lg border border-dashed border-kanbot-line p-4 text-center text-sm text-kanbot-muted">
              {t("No estimated backlog tasks fit this capacity.")}
            </p>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={onCreateSprint}
            disabled={loading || !result.todoIds.length}
          >
            {loading
              ? t("Creating sprint…")
              : `${t("Create sprint with")} ${result.todoIds.length} ${t("tasks")}`}
          </Button>
        </div>
      )}
    </Modal>
  );
}
