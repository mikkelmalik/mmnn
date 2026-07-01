import { z } from "zod";

import { ITEM_STATUSES, MEDIA_CATEGORIES } from "@/db/schema";

export const recommendationSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  category: z.enum(MEDIA_CATEGORIES),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  taggedForUserId: z.string().trim().min(1).optional().or(z.literal("")),
});
export type RecommendationInput = z.infer<typeof recommendationSchema>;

export const commentSchema = z.object({
  mediaItemId: z.string().min(1),
  body: z.string().trim().min(1, "Comment can't be empty").max(4000),
});

export const statusSchema = z.object({
  mediaItemId: z.string().min(1),
  status: z.enum([...ITEM_STATUSES, "none"]),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export const reactionSchema = z.object({
  mediaItemId: z.string().min(1),
  emoji: z.string().min(1).max(16),
});

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
  name: z.string().trim().max(80).optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(200),
});
