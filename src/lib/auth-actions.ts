"use server";

import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { invites, memberships, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { credentialsSchema, signupSchema } from "@/lib/validation";

export type SignInState = { error?: string; sent?: boolean; email?: string };

/** Magic-link (email) sign-in. Sends a link the user clicks to sign in. */
export async function signInWithEmail(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email address." };
  }
  try {
    // redirect: false so we can render a friendly "check your email" state.
    await signIn("resend", { email, redirect: false });
    return { sent: true, email };
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Couldn't send the sign-in link. Try again." };
    }
    throw err;
  }
}

/** Email + password sign-in (used by the admin and invited members). */
export async function signInWithPassword(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw err;
  }
  redirect("/feed");
}

export type SignUpState = { error?: string };

/** Create an account from an invite link, then sign in. */
export async function signUpWithInvite(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "This invite link is invalid." };

  const invite = await db.query.invites.findFirst({
    where: eq(invites.token, token),
  });
  if (!invite || invite.expiresAt.getTime() <= Date.now()) {
    return { error: "This invite link is invalid or has expired." };
  }
  // Email-addressed invites are single-use.
  if (invite.email && invite.acceptedAt) {
    return { error: "This invite link has already been used." };
  }

  const parsed = signupSchema.safeParse({
    email: invite.email ?? formData.get("email"),
    name: formData.get("name") ?? "",
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { email, name, password } = parsed.data;

  // If the invite is addressed to someone, they must use that address.
  if (invite.email && invite.email !== email) {
    return { error: "This invite is for a different email address." };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    return {
      error: "An account with that email already exists — sign in instead.",
    };
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({
      email,
      name: name || email.split("@")[0],
      emailVerified: new Date(),
      passwordHash,
    })
    .returning();

  await db
    .insert(memberships)
    .values({ groupId: invite.groupId, userId: user.id, role: "member" })
    .onConflictDoNothing();

  if (invite.email) {
    await db
      .update(invites)
      .set({ acceptedAt: new Date() })
      .where(eq(invites.id, invite.id));
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      // Account was created; let them sign in manually.
      redirect("/login");
    }
    throw err;
  }
  redirect("/feed");
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
