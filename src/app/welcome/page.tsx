import { signOutAction } from "@/lib/auth-actions";
import { requireUser } from "@/lib/auth-guard";

export default async function WelcomePage() {
  const user = await requireUser();
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 text-center">
      <div className="mb-3 text-5xl">👋</div>
      <h1 className="text-2xl font-bold">You&apos;re signed in</h1>
      <p className="mt-2 text-stone-500 dark:text-stone-400">
        {user.email} isn&apos;t part of a group yet. Ask a member to invite this
        email, then sign in again.
      </p>
      <form action={signOutAction} className="mt-6">
        <button
          type="submit"
          className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
