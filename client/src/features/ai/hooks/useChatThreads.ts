import { useCallback, useEffect, useState } from "react";
import type { ChatMessage } from "@shared/types/api";
import type { ChatThread } from "../types/chat";
import {
  getChatStorageKey,
  readChatThreads,
  writeChatThreads,
} from "../lib/chatStorage";

function makeThreadId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function titleFromMessages(messages: ChatMessage[]) {
  const firstQuestion = messages
    .find((message) => message.role === "user")
    ?.content.trim();
  if (!firstQuestion) return "New chat";
  return firstQuestion.length > 42
    ? `${firstQuestion.slice(0, 39)}…`
    : firstQuestion;
}

export function useChatThreads(userId: string, projectId: string) {
  const storageKey = getChatStorageKey(userId, projectId);
  const [threads, setThreads] = useState<ChatThread[]>(() =>
    readChatThreads(storageKey),
  );
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    () => readChatThreads(storageKey)[0]?.id ?? null,
  );

  useEffect(() => {
    writeChatThreads(storageKey, threads);
  }, [storageKey, threads]);

  const createThread = useCallback(() => {
    const thread: ChatThread = {
      id: makeThreadId(),
      title: "New chat",
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    setThreads((current) => [thread, ...current]);
    setActiveThreadId(thread.id);
    return thread.id;
  }, []);

  const saveMessages = useCallback(
    (threadId: string, messages: ChatMessage[]) => {
      setThreads((current) => {
        const existing = current.find((thread) => thread.id === threadId);
        const thread: ChatThread = {
          id: threadId,
          title:
            existing?.title === "New chat" || !existing
              ? titleFromMessages(messages)
              : existing.title,
          messages,
          updatedAt: new Date().toISOString(),
        };
        return [thread, ...current.filter((item) => item.id !== threadId)];
      });
    },
    [],
  );

  const deleteThread = useCallback(
    (threadId: string) => {
      const remaining = threads.filter((thread) => thread.id !== threadId);
      setThreads(remaining);
      if (activeThreadId === threadId)
        setActiveThreadId(remaining[0]?.id ?? null);
    },
    [activeThreadId, threads],
  );

  const activeThread =
    threads.find((thread) => thread.id === activeThreadId) ?? null;

  return {
    threads,
    activeThread,
    activeThreadId,
    setActiveThreadId,
    createThread,
    saveMessages,
    deleteThread,
  };
}
