"use server";

import { randomBytes } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { invites } from "@/db/schema";
import { requireMember } from "@/lib/auth-guard";

const INVITE_TTL_DAYS = 30;

/** Owners create a shareable sign-up link for their group. */
export async function createInvite(formData: FormData): Promise<void> {
  const member = await requireMember();
  if (member.role !== "owner") {
    throw new Error("Only the group owner can create invites.");
  }

  // An optional email addresses the link to one person; otherwise it's an
  // open link anyone can use until it expires.
  const rawEmail = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const email = rawEmail && rawEmail.includes("@") ? rawEmail : null;

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(invites).values({
    groupId: member.groupId,
    email,
    token,
    invitedByUserId: member.userId,
    expiresAt,
  });

  revalidatePath("/members");
}

/** Owners revoke an invite link. */
export async function revokeInvite(formData: FormData): Promise<void> {
  const member = await requireMember();
  if (member.role !== "owner") {
    throw new Error("Only the group owner can revoke invites.");
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db
    .delete(invites)
    .where(and(eq(invites.id, id), eq(invites.groupId, member.groupId)));

  revalidatePath("/members");
}
