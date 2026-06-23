import { z } from "zod";

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Project name must be at least 3 characters")
    .max(100, "Project name must be under 100 characters"),

  description: z
    .string()
    .trim()
    .min(5, "Description must be at least 5 characters")
    .max(500, "Description must be under 500 characters"),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
