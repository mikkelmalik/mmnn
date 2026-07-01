import Link from "next/link";

import { db } from "@/db";
import { groups } from "@/db/schema";
import { getValidInviteByToken } from "@/lib/queries";
import { SignupForm } from "@/components/signup-form";
import { eq } from "drizzle-orm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const invite = token ? await getValidInviteByToken(token) : null;
  const valid = !!invite;

  const group = invite
    ? await db.query.groups.findFirst({ where: eq(groups.id, invite.groupId) })
    : undefined;

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">📚</div>
        <h1 className="text-3xl font-bold">Join Book Club</h1>
        {valid ? (
          <p className="mt-2 text-stone-500 dark:text-stone-400">
            You&apos;ve been invited to{" "}
            <strong>{group?.name ?? "the group"}</strong>. Create your account
            below.
          </p>
        ) : (
          <p className="mt-2 text-stone-500 dark:text-stone-400">
            This invite link is invalid or has expired.
          </p>
        )}
      </div>

      {valid ? (
        <SignupForm token={token!} lockedEmail={invite.email} />
      ) : (
        <Link
          href="/login"
          className="rounded-xl border border-stone-300 px-4 py-3 text-center font-medium hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
        >
          Go to sign in
        </Link>
      )}
    </div>
  );
}
