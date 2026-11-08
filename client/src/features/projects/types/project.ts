import * as z from "zod";

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(80, "Project name must be at most 80 characters."),
  key: z.string().trim().toUpperCase().refine((key) => !key || /^[A-Z]{2,6}$/.test(key), "Use 2–6 letters for the project key."),
  description: z.string().trim().max(500, "Description must be at most 500 characters."),
});

export type ProjectFormValues = {
  name: string;
  key: string;
  description: string;
};

export const emptyProjectForm: ProjectFormValues = {
  name: "",
  key: "",
  description: "",
};
