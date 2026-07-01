import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { CategoryBadge } from "@/components/category-badge";
import { CommentSection } from "@/components/comment-section";
import { ReactionBar } from "@/components/reaction-bar";
import { StatusControl } from "@/components/status-control";
import { deleteRecommendation } from "@/lib/actions";
import { requireMember } from "@/lib/auth-guard";
import { displayName, timeAgo } from "@/lib/format";
import { getItemDetail } from "@/lib/queries";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const member = await requireMember();
  const { id } = await params;
  const item = await getItemDetail(member.groupId, id, member.userId);
  if (!item) notFound();

  const isAuthor = item.author.id === member.userId;

  return (
    <AppShell title="Recommendation">
      <Link
        href="/feed"
        className="mb-3 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400"
      >
        <ArrowLeft size={16} /> Back to feed
      </Link>

      <article className="flex flex-col gap-4">
        <header>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CategoryBadge category={item.category} />
            {item.taggedFor && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                for{" "}
                {item.taggedFor.id === member.userId
                  ? "you"
                  : displayName(item.taggedFor)}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{item.title}</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Recommended by {displayName(item.author)} · {timeAgo(item.createdAt)}
          </p>
        </header>

        {item.notes && (
          <p className="whitespace-pre-wrap text-stone-700 dark:text-stone-300">
            {item.notes}
          </p>
        )}

        <ReactionBar itemId={item.id} reactions={item.reactions} />

        <StatusControl item={item} />

        {item.statuses.length > 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm dark:border-stone-800 dark:bg-stone-900">
            <p className="mb-2 font-medium">What the group thinks</p>
            <ul className="flex flex-col gap-1">
              {item.statuses.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between text-stone-600 dark:text-stone-300"
                >
                  <span>{displayName(s)}</span>
                  <span>
                    {s.status === "consumed"
                      ? s.rating
                        ? "★".repeat(s.rating)
                        : "✓ done"
                      : "🔖 want to try"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <CommentSection item={item} currentUserId={member.userId} />

        {isAuthor && (
          <form action={deleteRecommendation} className="pt-2">
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="text-sm text-stone-400 hover:text-red-600"
            >
              Delete this recommendation
            </button>
          </form>
        )}
      </article>
    </AppShell>
  );
}
