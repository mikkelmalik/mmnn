import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/db";
import { memberships } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Member = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  groupId: string;
  role: "owner" | "member";
};

/** Require a signed-in user. Redirects to /login otherwise. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

/**
 * Require a signed-in user who belongs to a group. Returns their membership
 * (single-group in v1). Redirects to /login if signed out, or /welcome if
 * signed in but not yet part of a group.
 */
export async function requireMember(): Promise<Member> {
  const user = await requireUser();
  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, user.id!),
  });
  if (!membership) redirect("/welcome");
  return {
    userId: user.id!,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
    groupId: membership.groupId,
    role: membership.role,
  };
}
