import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAiActions, useAiStatus } from "../hooks/useAi";
import { useChatThreads } from "../hooks/useChatThreads";
import { useAuth } from "@features/auth";
import { useTodoMutations, useTodos } from "@features/todos/hooks/useTodos";
import { useSprintMutations, useSprints } from "@features/sprints/hooks/useSprints";
import type {
  ChatMessage,
  DraftTodo,
  PlanSprintResponse,
  Todo,
} from "@shared/types/api";
import type { ChatThread } from "../types/chat";
import type { ActionError } from "../types/actionError";
import { AssistantDrawer } from "./AssistantDrawer";
import { GenerateTodosDialog, PlanSprintDialog } from "./AiDialogs";

export function AiOverlays() {
  const { projectId = "" } = useParams();
  const { user } = useAuth();
  const userId = user?.id ?? "unknown-user";
  return (
    <AiOverlaysContent
      key={`${userId}:${projectId}`}
      userId={userId}
      projectId={projectId}
    />
  );
}

function AiOverlaysContent({
  userId,
  projectId,
}: {
  userId: string;
  projectId: string;
}) {
  const navigate = useNavigate();
  const aiStatusQuery = useAiStatus();
  const aiActions = useAiActions(projectId);
  const todoMutations = useTodoMutations(projectId);
  const sprintMutations = useSprintMutations(projectId);
  const backlogQuery = useTodos(projectId, { sprintId: "backlog" });
  const sprintsQuery = useSprints(projectId);
  const backlogData = backlogQuery.data;
  const refetchBacklog = backlogQuery.refetch;
  const sprintsData = sprintsQuery.data;
  const refetchSprints = sprintsQuery.refetch;
  const [drawer, setDrawer] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<ChatThread | null>(null);
  const [generate, setGenerate] = useState(false);
  const [plan, setPlan] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(5);
  const [drafts, setDrafts] = useState<DraftTodo[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [question, setQuestion] = useState("");
  const [capacity, setCapacity] = useState(30);
  const [focus, setFocus] = useState("");
  const [planResult, setPlanResult] = useState<PlanSprintResponse | null>(null);
  const [planTodos, setPlanTodos] = useState<Todo[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [quickSummaryLoading, setQuickSummaryLoading] = useState(false);
  const [chatError, setChatError] = useState<ActionError>(null);
  const chatRequestRef = useRef(false);
  const [generateError, setGenerateError] = useState<ActionError>(null);
  const [planError, setPlanError] = useState<ActionError>(null);
  const [saveError, setSaveError] = useState<ActionError>(null);
  const {
    threads,
    activeThread,
    activeThreadId,
    setActiveThreadId,
    createThread,
    saveMessages,
    deleteThread,
  } = useChatThreads(userId, projectId);
  const messages = useMemo(
    () => activeThread?.messages ?? [],
    [activeThread?.messages],
  );

  const aiStatus = aiStatusQuery.data ?? null;

  useEffect(() => {
    const openDrawer = () => setDrawer(true);
    const openGenerate = () => setGenerate(true);
    const openPlan = () => setPlan(true);
    window.addEventListener("open-ai-drawer", openDrawer);
    window.addEventListener("open-generate-todos", openGenerate);
    window.addEventListener("open-plan-sprint", openPlan);
    return () => {
      window.removeEventListener("open-ai-drawer", openDrawer);
      window.removeEventListener("open-generate-todos", openGenerate);
      window.removeEventListener("open-plan-sprint", openPlan);
    };
  }, []);

  const ask = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || chatLoading || chatRequestRef.current || !projectId) return;
      if (messages.at(-1)?.role === "user" && messages.at(-1)?.content === content) return;
      chatRequestRef.current = true;
      const threadId = activeThreadId ?? createThread();
      const next = [...messages, { role: "user", content } as ChatMessage];
      saveMessages(threadId, next);
      setQuestion("");
      setChatError(null);
      setChatLoading(true);
      try {
        const result = await aiActions.chat.mutateAsync(next);
        saveMessages(threadId, [...next, result.message]);
      } catch (error) {
        const retry = async () => {
          if (chatRequestRef.current) return;
          chatRequestRef.current = true;
          setChatError(null);
          setChatLoading(true);
          try {
            const result = await aiActions.chat.mutateAsync(next);
            saveMessages(threadId, [...next, result.message]);
          } catch (retryError) {
            setChatError({
              message:
                retryError instanceof Error
                  ? retryError.message
                  : "Couldn't get an answer.",
              retry: () => void retry(),
            });
          } finally {
            chatRequestRef.current = false;
            setChatLoading(false);
          }
        };
        setChatError({
          message:
            error instanceof Error ? error.message : "Couldn't get an answer.",
          retry: () => void retry(),
        });
      } finally {
        chatRequestRef.current = false;
        setChatLoading(false);
      }
    },
    [
      activeThreadId,
      aiActions.chat,
      chatLoading,
      createThread,
      messages,
      projectId,
      saveMessages,
    ],
  );

  const makeDrafts = useCallback(async () => {
    if (!projectId || generateLoading) return;
    setGenerateError(null);
    setGenerateLoading(true);
    try {
      const result = await aiActions.generateTodos.mutateAsync({ prompt, count });
      setDrafts(result.todos);
      setSelected(result.todos.map(() => true));
    } catch (error) {
      setGenerateError({
        message:
          error instanceof Error
            ? error.message
            : "Couldn't generate task suggestions.",
        retry: () => void makeDrafts(),
      });
    } finally {
      setGenerateLoading(false);
    }
  }, [aiActions.generateTodos, count, generateLoading, projectId, prompt]);

  const suggestPlan = useCallback(async () => {
    if (!projectId || planLoading) return;
    setPlanError(null);
    setPlanLoading(true);
    try {
      const [result, backlogResult] = await Promise.all([
        aiActions.planSprint.mutateAsync({ capacity, focus }),
        backlogData ? Promise.resolve({ data: backlogData }) : refetchBacklog(),
      ]);
      setPlanResult(result);
      const backlogById = new Map((backlogResult.data?.todos ?? []).map((todo) => [todo.id, todo]));
      setPlanTodos(
        result.todoIds.flatMap((id) => {
          const todo = backlogById.get(id);
          return todo ? [todo] : [];
        }),
      );
    } catch (error) {
      setPlanError({
        message:
          error instanceof Error
            ? error.message
            : "Couldn't suggest a sprint plan.",
        retry: () => void suggestPlan(),
      });
    } finally {
      setPlanLoading(false);
    }
  }, [aiActions.planSprint, backlogData, capacity, focus, planLoading, projectId, refetchBacklog]);

  const saveDrafts = async () => {
    const todos = drafts
      .filter((_, index) => selected[index])
      .map((todo) => ({ ...todo, sprintId: null }));
    if (!todos.length || saveLoading) return;
    setSaveError(null);
    setSaveLoading(true);
    try {
      await todoMutations.createBulk.mutateAsync({ todos });
      window.dispatchEvent(new Event("backlog-todos-saved"));
      setGenerate(false);
      setDrafts([]);
    } catch (error) {
      setSaveError({
        message:
          error instanceof Error
            ? error.message
            : "Couldn't save the selected tasks.",
        retry: () => void saveDrafts(),
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const createPlannedSprint = async () => {
    if (!planResult || planLoading) return;
    setPlanError(null);
    setPlanLoading(true);
    try {
      await sprintMutations.create.mutateAsync({
        goal: planResult.goal,
        todoIds: planResult.todoIds,
      });
      setPlan(false);
      setPlanResult(null);
      navigate(`/projects/${projectId}/backlog`);
    } catch (error) {
      setPlanError({
        message:
          error instanceof Error
            ? error.message
            : "Couldn't create the planned sprint.",
        retry: () => void createPlannedSprint(),
      });
    } finally {
      setPlanLoading(false);
    }
  };

  const addActiveSprintSummaryToChat = useCallback(async () => {
    const sprints = sprintsData?.sprints ?? (await refetchSprints()).data?.sprints ?? [];
    const active = sprints.find((sprint) => sprint.status === "active");
    if (!active) throw new Error("Start a sprint before asking for its summary.");
    const result = await aiActions.summarizeSprint.mutateAsync(active.id);
    const threadId = activeThreadId ?? createThread();
    const currentMessages = activeThread?.messages ?? [];

    saveMessages(threadId, [
      ...currentMessages,
      { role: "user", content: "Summarize my active sprint" },
      { role: "assistant", content: result.summary.content },
    ]);
  }, [activeThread, activeThreadId, aiActions.summarizeSprint, createThread, refetchSprints, saveMessages, sprintsData]);

  async function summarizeActiveSprint() {
    if (!projectId || quickSummaryLoading) return;
    setChatError(null);
    setQuickSummaryLoading(true);
    try {
      await addActiveSprintSummaryToChat();
    } catch (error) {
      setChatError({
        message:
          error instanceof Error
            ? error.message
            : "Couldn't summarize the active sprint.",
        retry: () => void summarizeActiveSprint(),
      });
    } finally {
      setQuickSummaryLoading(false);
    }
  }

  const startNewChat = () => {
    setActiveThreadId(null);
    setQuestion("");
    setChatError(null);
  };
  const confirmDeleteThread = () => {
    if (!threadToDelete) return;
    deleteThread(threadToDelete.id);
    setThreadToDelete(null);
  };
  const updateDraft = (index: number, patch: Partial<DraftTodo>) =>
    setDrafts((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );

  return (
    <>
      <AssistantDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        aiStatus={aiStatus}
        chatHistoryOpen={chatHistoryOpen}
        onToggleChatHistory={() => setChatHistoryOpen((open) => !open)}
        onOpenGenerateTodos={() => {
          setDrawer(false);
          setGenerate(true);
        }}
        onOpenPlanSprint={() => {
          setDrawer(false);
          setPlan(true);
        }}
        threads={threads}
        activeThreadId={activeThreadId}
        onStartNewChat={startNewChat}
        onSelectThread={(threadId) => {
          setActiveThreadId(threadId);
          setChatError(null);
          setQuestion("");
          setChatHistoryOpen(false);
        }}
        onRequestDeleteThread={setThreadToDelete}
        onConfirmDeleteThread={confirmDeleteThread}
        onCancelDeleteThread={() => setThreadToDelete(null)}
        threadToDelete={threadToDelete}
        chatLoading={chatLoading}
        quickSummaryLoading={quickSummaryLoading}
        onSummarizeActiveSprint={() => void summarizeActiveSprint()}
        messages={messages}
        chatError={chatError}
        onAsk={(text) => void ask(text)}
        question={question}
        onQuestionChange={setQuestion}
      />

      <GenerateTodosDialog
        open={generate}
        saving={saveLoading}
        generating={generateLoading}
        prompt={prompt}
        onPromptChange={setPrompt}
        count={count}
        onCountChange={setCount}
        onGenerate={() => void makeDrafts()}
        generateError={generateError}
        drafts={drafts}
        selected={selected}
        onToggleDraft={(index, checked) =>
          setSelected((items) =>
            items.map((value, itemIndex) =>
              itemIndex === index ? checked : value,
            ),
          )
        }
        onUpdateDraft={updateDraft}
        saveError={saveError}
        onSave={() => void saveDrafts()}
        onClose={() => setGenerate(false)}
      />

      <PlanSprintDialog
        open={plan}
        loading={planLoading}
        capacity={capacity}
        onCapacityChange={setCapacity}
        focus={focus}
        onFocusChange={setFocus}
        onSuggest={() => void suggestPlan()}
        error={planError}
        result={planResult}
        onGoalChange={(goal) => {
          if (planResult) setPlanResult({ ...planResult, goal });
        }}
        todos={planTodos}
        onToggleTodo={(todoId, checked) => {
          if (!planResult) return;
          const todoIds = checked
            ? [...planResult.todoIds, todoId]
            : planResult.todoIds.filter((id) => id !== todoId);
          const totalPoints = planTodos
            .filter((todo) => todoIds.includes(todo.id))
            .reduce((sum, todo) => sum + (todo.storyPoints ?? 0), 0);
          setPlanResult({ ...planResult, todoIds, totalPoints });
        }}
        onCreateSprint={() => void createPlannedSprint()}
        onClose={() => setPlan(false)}
      />
    </>
  );
}
