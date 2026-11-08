import type { ChatMessage } from "@shared/types/api";

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}
