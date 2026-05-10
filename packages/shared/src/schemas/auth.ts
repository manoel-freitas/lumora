import { z } from 'zod'

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email()

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(8),
})

export const signupSchema = z.object({
  email: emailField,
  name: z.string().min(1).max(255).optional(),
  password: z.string().min(8).max(128),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
