import {
  History,
  LoaderCircle,
  MessageSquarePlus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { MarkdownContent } from "@shared/components";
import { useEffect, useRef } from "react";
import { Modal, Tooltip } from "@shared/components/ui";
import { useLanguage } from "@shared/i18n/LanguageProvider";
import type { AiStatusResponse, ChatMessage } from "@shared/types/api";
import type { ChatThread } from "../types/chat";
import type { ActionError } from "../types/actionError";
import { ActionErrorNotice } from "./ActionErrorNotice";

type AssistantDrawerProps = {
  open: boolean;
  onClose: () => void;
  aiStatus: AiStatusResponse | null;
  chatHistoryOpen: boolean;
  onToggleChatHistory: () => void;
  onOpenGenerateTodos: () => void;
  onOpenPlanSprint: () => void;
  threads: ChatThread[];
  activeThreadId: string | null;
  onStartNewChat: () => void;
  onSelectThread: (threadId: string) => void;
  onRequestDeleteThread: (thread: ChatThread) => void;
  onConfirmDeleteThread: () => void;
  onCancelDeleteThread: () => void;
  threadToDelete: ChatThread | null;
  chatLoading: boolean;
  quickSummaryLoading: boolean;
  onSummarizeActiveSprint: () => void;
  messages: ChatMessage[];
  chatError: ActionError;
  onAsk: (message: string) => void;
  question: string;
  onQuestionChange: (question: string) => void;
};

export function AssistantDrawer({
  open,
  onClose,
  aiStatus,
  chatHistoryOpen,
  onToggleChatHistory,
  onOpenGenerateTodos,
  onOpenPlanSprint,
  threads,
  activeThreadId,
  onStartNewChat,
  onSelectThread,
  onRequestDeleteThread,
  onConfirmDeleteThread,
  onCancelDeleteThread,
  threadToDelete,
  chatLoading,
  quickSummaryLoading,
  onSummarizeActiveSprint,
  messages,
  chatError,
  onAsk,
  question,
  onQuestionChange,
}: AssistantDrawerProps) {
  const { t, isArabic } = useLanguage();
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const savedThreadCount = threads.filter(
    (thread) => thread.messages.length > 0,
  ).length;

  useEffect(() => {
    if (open && chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [open, messages, chatLoading]);

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-kanbot-overlay-50 backdrop-blur-sm transition-opacity ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      >
        <aside
          dir={isArabic ? "rtl" : "ltr"}
          className={`absolute inset-y-0 right-0 flex w-[min(500px,100vw)] min-w-0 flex-col overflow-hidden border-l border-kanbot-line bg-kanbot-sidebar text-kanbot-ink shadow-2xl transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-kanbot-line bg-kanbot-page px-4 py-2.5">
            <strong className="min-w-0 truncate text-sm">
              ✦ {t("Kanbot Assistant")}
            </strong>
            <div className="flex shrink-0 items-center gap-2">
              {aiStatus?.mode === "mock" && (
                <span className="rounded-full border border-kanbot-violet-border-400/30 bg-kanbot-violet-soft-10 px-2 py-1 text-[10px] font-medium text-kanbot-violet-200">
                  {t("Mock AI")}
                </span>
              )}
              <Tooltip content={t("View saved chats")} placement="bottom" align="start">
                <button
                  className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-2.5 text-xs font-semibold transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kanbot-accent/50 motion-reduce:transition-none ${chatHistoryOpen ? "border-kanbot-accent/70 bg-kanbot-violet-soft-15 text-kanbot-violet-100 shadow-sm" : "border-kanbot-line-strong bg-kanbot-raised text-kanbot-ink hover:-translate-y-px hover:border-kanbot-accent/50 hover:bg-kanbot-hover"}`}
                  type="button"
                  aria-expanded={chatHistoryOpen}
                  aria-controls="ai-chat-history"
                  onClick={onToggleChatHistory}
                >
                  <History size={14} aria-hidden="true" />
                  <span>{t("Chats")}</span>
                  <span className="grid size-5 place-items-center rounded-full bg-kanbot-white-soft-10 text-[10px] tabular-nums">
                    {savedThreadCount}
                  </span>
                </button>
              </Tooltip>
              <Tooltip content={t("Start a new conversation")} placement="bottom" align="center">
                <button
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-kanbot-accent/35 bg-kanbot-accent/[0.10] px-2.5 text-xs font-semibold text-kanbot-ink shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-px hover:border-kanbot-accent/60 hover:bg-kanbot-accent/[0.16] hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kanbot-accent/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
                  type="button"
                  onClick={onStartNewChat}
                >
                  <MessageSquarePlus
                    size={14}
                    className="text-kanbot-accent"
                    aria-hidden="true"
                  />
                  <span>{t("New chat")}</span>
                </button>
              </Tooltip>
              <button
                className="grid size-9 place-items-center rounded-lg border border-transparent text-kanbot-muted transition-[background-color,border-color,color,transform] duration-300 ease-out hover:border-kanbot-line hover:bg-kanbot-hover hover:text-kanbot-ink active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kanbot-accent/50 motion-reduce:transition-none motion-reduce:active:scale-100"
                type="button"
                aria-label={t("Close assistant")}
                onClick={onClose}
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="flex shrink-0 flex-wrap gap-2 border-b border-kanbot-line bg-kanbot-page/40 px-4 py-3 [&>button]:min-h-9 [&>button]:rounded-full [&>button]:border [&>button]:border-kanbot-line-strong/70 [&>button]:bg-kanbot-raised [&>button]:px-3 [&>button]:text-xs [&>button]:font-medium [&>button]:text-kanbot-ink [&>button]:transition-[background-color,border-color,box-shadow,transform] [&>button]:duration-300 [&>button]:ease-out [&>button]:hover:-translate-y-px [&>button]:hover:border-kanbot-accent/50 [&>button]:hover:bg-kanbot-violet-soft-10 [&>button]:hover:shadow-sm [&>button]:focus-visible:outline-none [&>button]:focus-visible:ring-2 [&>button]:focus-visible:ring-kanbot-accent/50 [&>button]:disabled:cursor-wait [&>button]:disabled:opacity-60 motion-reduce:[&>button]:transition-none motion-reduce:[&>button]:hover:translate-y-0">
            <button type="button" onClick={onOpenGenerateTodos}>
              {t("Create todos")}
            </button>
            <button type="button" onClick={onOpenPlanSprint}>
              {t("Plan sprint")}
            </button>
            <button
              type="button"
              disabled={quickSummaryLoading}
              onClick={onSummarizeActiveSprint}
            >
              {quickSummaryLoading ? t("Summarizing…") : t("Summarize sprint")}
            </button>
          </div>

          {chatHistoryOpen && (
            <section
              className="max-h-52 min-w-0 shrink-0 overflow-hidden border-b border-kanbot-line bg-kanbot-raised px-4 py-3"
              id="ai-chat-history"
              aria-label={t("Saved conversations")}
            >
              <header className="flex items-center justify-between text-xs text-kanbot-muted">
                <strong>{t("Saved chats")}</strong>
                <span>{savedThreadCount}</span>
              </header>
              <div className="mt-2 grid max-h-36 min-w-0 gap-1.5 overflow-x-hidden overflow-y-auto overscroll-y-contain pe-1">
                {threads.map((thread) => (
                  <div
                    className={`flex min-w-0 items-center rounded-xl border transition-colors ${thread.id === activeThreadId ? "border-kanbot-violet-border-400/40 bg-kanbot-violet-soft-10 shadow-sm" : "border-kanbot-line/70 bg-kanbot-panel hover:border-kanbot-line-strong hover:bg-kanbot-hover"}`}
                    key={thread.id}
                  >
                    <button
                      className="min-w-0 flex-1 overflow-hidden px-3 py-2.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kanbot-accent [&>strong]:block [&>strong]:truncate [&>small]:mt-1 [&>small]:block [&>small]:truncate [&>small]:text-[10px] [&>small]:text-kanbot-muted"
                      type="button"
                      aria-current={thread.id === activeThreadId ? "true" : undefined}
                      onClick={() => onSelectThread(thread.id)}
                    >
                      <strong>{thread.title}</strong>
                      <small>{new Date(thread.updatedAt).toLocaleString()}</small>
                    </button>
                    <Tooltip content={t("Delete conversation")}>
                      <button
                        className="me-2 grid size-8 shrink-0 place-items-center rounded-lg text-kanbot-muted transition hover:bg-kanbot-danger-soft-50 hover:text-kanbot-danger-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kanbot-danger-300"
                        type="button"
                        aria-label={`${t("Delete chat")}: ${thread.title}`}
                        disabled={chatLoading || quickSummaryLoading}
                        onClick={() => onRequestDeleteThread(thread)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </Tooltip>
                  </div>
                ))}
                {threads.length === 0 && (
                  <p className="py-3 text-center text-xs text-kanbot-muted">
                    {t("Your conversations will appear here.")}
                  </p>
                )}
              </div>
            </section>
          )}

          <div
            className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-gradient-to-b from-kanbot-page/25 to-transparent px-4 py-5 scroll-smooth"
            aria-live="polite"
            ref={chatMessagesRef}
          >
            {messages.length === 0 && (
              <p className="m-auto max-w-xs text-center text-sm text-kanbot-muted">
                {t("Ask about your backlog, tasks, or active sprint.")}
              </p>
            )}
            {messages.map((message, index) => (
              <div
                dir="auto"
                className={`min-w-0 max-w-[min(88%,36rem)] break-words rounded-2xl border px-4 py-3 text-start text-sm leading-relaxed shadow-sm [overflow-wrap:anywhere] ${message.role === "user" ? "self-end rounded-br-md border-kanbot-violet-border-400/25 bg-kanbot-violet-soft-10 text-kanbot-violet-50" : "self-start rounded-bl-md border-kanbot-line bg-kanbot-raised text-kanbot-zinc-200 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:ps-5 [&_pre]:my-2 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-kanbot-code-surface [&_pre]:p-3 [&_code]:break-all [&_a]:text-kanbot-violet-300 [&_a]:underline [&_strong]:font-semibold [&_h1]:mb-2 [&_h2]:mb-2 [&_h3]:mb-2"}`}
                key={`${index}-${message.role}`}
              >
                {message.role === "assistant" ? (
                  <MarkdownContent content={message.content} />
                ) : (
                  message.content
                )}
              </div>
            ))}
            {chatLoading && (
              <p className="flex items-center gap-2 self-start rounded-full border border-kanbot-line bg-kanbot-raised px-3 py-2 text-xs text-kanbot-muted">
                <span className="size-2 animate-pulse rounded-full bg-kanbot-accent" />
                {t("Thinking…")}
              </p>
            )}
            <ActionErrorNotice error={chatError} />
          </div>

          <form
            className="flex shrink-0 items-end gap-2 border-t border-kanbot-line bg-kanbot-page px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              onAsk(question);
            }}
          >
            <textarea
              className="min-h-12 max-h-36 min-w-0 flex-1 resize-y rounded-xl border border-kanbot-line-strong bg-kanbot-raised px-3.5 py-3 text-sm text-kanbot-ink outline-none transition focus:border-kanbot-accent focus:ring-2 focus:ring-kanbot-accent/20 placeholder:text-kanbot-subtle"
              aria-label={t("Message Kanbot")}
              placeholder={t("Ask Kanbot… (Enter to send)")}
              value={question}
              rows={2}
              onChange={(event) => onQuestionChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onAsk(question);
                }
              }}
            />
            <button
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-kanbot-accent/70 bg-kanbot-accent px-4 text-sm font-semibold text-kanbot-accent-contrast shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:bg-kanbot-accent/90 hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kanbot-accent/50 disabled:cursor-not-allowed disabled:border-kanbot-line disabled:bg-kanbot-raised disabled:text-kanbot-muted disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:bg-kanbot-raised motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
              type="submit"
              disabled={chatLoading || !question.trim()}
              aria-busy={chatLoading}
            >
              {chatLoading ? (
                <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={15} aria-hidden="true" />
              )}
              <span>{chatLoading ? t("Sending…") : t("Send")}</span>
            </button>
          </form>
          <small className="shrink-0 px-4 pb-3 text-center text-[10px] text-kanbot-subtle">
            {t("AI can make mistakes. Review suggestions before saving.")}
          </small>
        </aside>
      </div>

      <Modal
        open={!!threadToDelete}
        title={t("Delete conversation?")}
        onClose={onCancelDeleteThread}
      >
        <div className="grid gap-4 p-5 text-sm text-kanbot-zinc-300">
          <p>
            {t("Delete conversation")} <strong>{threadToDelete?.title}</strong>?{" "}
            {t("This conversation will be removed from this browser and can't be restored.")}
          </p>
          <footer className="flex justify-end gap-2">
            <button
              className="min-h-9 rounded-lg border border-kanbot-line bg-kanbot-raised px-3 text-xs text-kanbot-ink hover:bg-kanbot-hover"
              type="button"
              onClick={onCancelDeleteThread}
            >
              {t("Cancel")}
            </button>
            <button
              className="min-h-9 rounded-lg border border-kanbot-danger-border-900 bg-kanbot-danger-solid-800 px-3 text-xs text-white hover:bg-kanbot-danger-solid-700"
              type="button"
              onClick={onConfirmDeleteThread}
            >
              {t("Delete chat")}
            </button>
          </footer>
        </div>
      </Modal>
    </>
  );
}
