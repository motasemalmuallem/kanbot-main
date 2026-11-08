import * as z from "zod";
import { TODO_PRIORITIES, TODO_STATUSES, TODO_TYPES } from "@shared/types/api";

export const todoFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Title must be at most 200 characters."),
  description: z.string().max(5000, "Description must be at most 5000 characters."),
  assigneeName: z.string().max(80, "Assignee name must be at most 80 characters."),
  type: z.enum(TODO_TYPES),
  priority: z.enum(TODO_PRIORITIES),
  status: z.enum(TODO_STATUSES),
  storyPoints: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5), z.literal(8), z.literal(13), z.null()]),
  sprintId: z.string(),
});

export type TodoFormValues = z.infer<typeof todoFormSchema>;
