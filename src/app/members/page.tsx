import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import { InvitePanel, type InviteView } from "@/components/invite-panel";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { requireMember } from "@/lib/auth-guard";
import { displayName, timeAgo } from "@/lib/format";
import { getActiveInvites, getGroupMembers } from "@/lib/queries";
import { eq } from "drizzle-orm";

async function baseUrl(): Promise<string> {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function MembersPage() {
  const member = await requireMember();
  const [group, members] = await Promise.all([
    db.query.groups.findFirst({ where: eq(groups.id, member.groupId) }),
    getGroupMembers(member.groupId),
  ]);

  const isOwner = member.role === "owner";
  let inviteViews: InviteView[] = [];
  if (isOwner) {
    const [invites, origin] = await Promise.all([
      getActiveInvites(member.groupId),
      baseUrl(),
    ]);
    inviteViews = invites.map((inv) => ({
      id: inv.id,
      url: `${origin}/signup?token=${inv.token}`,
      email: inv.email,
      expiresLabel: timeAgo(inv.expiresAt),
    }));
  }

  return (
    <AppShell title="Group">
      <h1 className="mb-1 text-2xl font-bold">{group?.name ?? "Your group"}</h1>
      <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">
        {members.length} member{members.length === 1 ? "" : "s"}
      </p>

      <ul className="flex flex-col gap-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900"
          >
            <div>
              <p className="font-medium">
                {displayName(m)}
                {m.id === member.userId && (
                  <span className="text-stone-400"> (you)</span>
                )}
              </p>
              {m.email && (
                <p className="text-xs text-stone-400">{m.email}</p>
              )}
            </div>
            {m.role === "owner" && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-100">
                owner
              </span>
            )}
          </li>
        ))}
      </ul>

      {isOwner ? (
        <InvitePanel invites={inviteViews} />
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
          Want to invite a friend? Ask the group owner to share a sign-up link.
        </p>
      )}
    </AppShell>
  );
}
