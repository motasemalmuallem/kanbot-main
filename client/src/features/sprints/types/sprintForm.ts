import * as z from "zod";

export const sprintFormSchema = z.object({
  name: z.string().trim().min(1, "Sprint name is required.").max(80, "Sprint name must be at most 80 characters."),
  goal: z.string().max(300, "Sprint goal must be at most 300 characters."),
  startDate: z.string(),
  endDate: z.string(),
}).superRefine((value, context) => {
  if (value.startDate && value.endDate && value.endDate < value.startDate) {
    context.addIssue({ code: "custom", path: ["endDate"], message: "End date must be on or after the start date." });
  }
});

export type SprintFormValues = z.infer<typeof sprintFormSchema>;
