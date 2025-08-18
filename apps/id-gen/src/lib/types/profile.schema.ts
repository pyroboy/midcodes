import { z } from 'zod';

// Input schemas
export const updateProfileInputSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
});

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const deleteAccountInputSchema = z.object({
  confirmation: z.literal("DELETE"),
  password: z.string().min(8),
});

// Output schemas
export const profileOutputSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  role: z.string(),
  credits_balance: z.number(),
  card_generation_count: z.number(),
  template_count: z.number(),
  unlimited_templates: z.boolean(),
  remove_watermarks: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const updateProfileResultSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  profile: profileOutputSchema.optional(),
});

export const passwordChangeResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// TypeScript types
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountInputSchema>;
export type ProfileOutput = z.infer<typeof profileOutputSchema>;
export type UpdateProfileResult = z.infer<typeof updateProfileResultSchema>;
export type PasswordChangeResult = z.infer<typeof passwordChangeResultSchema>;
