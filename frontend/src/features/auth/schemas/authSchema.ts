import { z } from "zod";

export const signupSchema = z.object({
  full_name: z.string().min(3).max(50),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain number"),
});

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type SignupFormData = z.infer<typeof signupSchema>;
export type SigninFormData = z.infer<typeof signinSchema>;
