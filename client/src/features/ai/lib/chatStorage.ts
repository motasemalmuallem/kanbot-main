import type { ChatThread } from "../types/chat";

const STORAGE_PREFIX = "kanbot-ai-chats";

export function getChatStorageKey(userId: string, projectId: string) {
  return `${STORAGE_PREFIX}:${userId}:${projectId}`;
}

export function readChatThreads(storageKey: string): ChatThread[] {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(saved)) return [];
    return saved
      .filter(
        (thread): thread is ChatThread =>
          typeof thread?.id === "string" &&
          typeof thread?.title === "string" &&
          typeof thread?.updatedAt === "string" &&
          Array.isArray(thread?.messages),
      )
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  } catch {
    return [];
  }
}

export function writeChatThreads(storageKey: string, threads: ChatThread[]) {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify(threads.filter((thread) => thread.messages.length > 0)),
    );
  } catch {
    // Chat history remains usable for this session if browser storage is unavailable.
  }
}
