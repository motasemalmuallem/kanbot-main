export type ActionError = {
  message: string;
  retry: () => void;
} | null;
