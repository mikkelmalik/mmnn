"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";

export type SignInState = { error?: string; sent?: boolean; email?: string };

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

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
