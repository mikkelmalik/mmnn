"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import {
  comments,
  itemStatuses,
  mediaItems,
  reactions,
} from "@/db/schema";
import { requireMember } from "@/lib/auth-guard";
import {
  commentSchema,
  reactionSchema,
  recommendationSchema,
  statusSchema,
} from "@/lib/validation";

/** Confirm an item exists and belongs to the caller's group; returns it. */
async function itemInGroup(itemId: string, groupId: string) {
  const item = await db.query.mediaItems.findFirst({
    where: and(eq(mediaItems.id, itemId), eq(mediaItems.groupId, groupId)),
  });
  if (!item) throw new Error("Item not found");
  return item;
}

export type ActionState = { error?: string };

export async function createRecommendation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const member = await requireMember();
  const parsed = recommendationSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    notes: formData.get("notes") ?? "",
    taggedForUserId: formData.get("taggedForUserId") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { title, category, notes, taggedForUserId } = parsed.data;

  await db.insert(mediaItems).values({
    groupId: member.groupId,
    authorId: member.userId,
    title,
    category,
    notes: notes ? notes : null,
    taggedForUserId: taggedForUserId ? taggedForUserId : null,
  });

  revalidatePath("/feed");
  redirect("/feed");
}

export async function deleteRecommendation(formData: FormData): Promise<void> {
  const member = await requireMember();
  const id = String(formData.get("id"));
  const item = await itemInGroup(id, member.groupId);
  if (item.authorId !== member.userId) throw new Error("Not allowed");
  await db.delete(mediaItems).where(eq(mediaItems.id, id));
  revalidatePath("/feed");
  redirect("/feed");
}

export async function toggleReaction(formData: FormData): Promise<void> {
  const member = await requireMember();
  const parsed = reactionSchema.parse({
    mediaItemId: formData.get("mediaItemId"),
    emoji: formData.get("emoji"),
  });
  await itemInGroup(parsed.mediaItemId, member.groupId);

  const existing = await db.query.reactions.findFirst({
    where: and(
      eq(reactions.mediaItemId, parsed.mediaItemId),
      eq(reactions.userId, member.userId),
      eq(reactions.emoji, parsed.emoji),
    ),
  });

  if (existing) {
    await db.delete(reactions).where(eq(reactions.id, existing.id));
  } else {
    await db
      .insert(reactions)
      .values({
        mediaItemId: parsed.mediaItemId,
        userId: member.userId,
        emoji: parsed.emoji,
      })
      .onConflictDoNothing();
  }

  revalidatePath("/feed");
  revalidatePath(`/item/${parsed.mediaItemId}`);
}

export async function addComment(formData: FormData): Promise<void> {
  const member = await requireMember();
  const parsed = commentSchema.parse({
    mediaItemId: formData.get("mediaItemId"),
    body: formData.get("body"),
  });
  await itemInGroup(parsed.mediaItemId, member.groupId);

  await db.insert(comments).values({
    mediaItemId: parsed.mediaItemId,
    userId: member.userId,
    body: parsed.body,
  });
  revalidatePath(`/item/${parsed.mediaItemId}`);
  revalidatePath("/feed");
}

export async function deleteComment(formData: FormData): Promise<void> {
  const member = await requireMember();
  const id = String(formData.get("id"));
  const mediaItemId = String(formData.get("mediaItemId"));
  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, id),
  });
  if (!comment) return;
  if (comment.userId !== member.userId) throw new Error("Not allowed");
  await db.delete(comments).where(eq(comments.id, id));
  revalidatePath(`/item/${mediaItemId}`);
}

export async function setStatus(formData: FormData): Promise<void> {
  const member = await requireMember();
  const parsed = statusSchema.parse({
    mediaItemId: formData.get("mediaItemId"),
    status: formData.get("status"),
    rating: formData.get("rating") || undefined,
  });
  await itemInGroup(parsed.mediaItemId, member.groupId);

  if (parsed.status === "none") {
    await db
      .delete(itemStatuses)
      .where(
        and(
          eq(itemStatuses.mediaItemId, parsed.mediaItemId),
          eq(itemStatuses.userId, member.userId),
        ),
      );
  } else {
    const rating = parsed.status === "consumed" ? (parsed.rating ?? null) : null;
    await db
      .insert(itemStatuses)
      .values({
        mediaItemId: parsed.mediaItemId,
        userId: member.userId,
        status: parsed.status,
        rating,
      })
      .onConflictDoUpdate({
        target: [itemStatuses.mediaItemId, itemStatuses.userId],
        set: { status: parsed.status, rating, updatedAt: new Date() },
      });
  }

  revalidatePath(`/item/${parsed.mediaItemId}`);
  revalidatePath("/feed");
  revalidatePath("/me");
}
