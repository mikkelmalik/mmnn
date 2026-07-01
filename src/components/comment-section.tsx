import { addComment, deleteComment } from "@/lib/actions";
import { displayName, timeAgo } from "@/lib/format";
import type { ItemDetail } from "@/lib/queries";

export function CommentSection({
  item,
  currentUserId,
}: {
  item: ItemDetail;
  currentUserId: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold">
        Comments{" "}
        <span className="text-stone-400">({item.comments.length})</span>
      </h2>

      {item.comments.map((c) => (
        <div
          key={c.commentId}
          className="rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{displayName(c)}</span>
            <span className="text-xs text-stone-400">
              {timeAgo(c.createdAt)}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-stone-700 dark:text-stone-300">
            {c.body}
          </p>
          {c.id === currentUserId && (
            <form action={deleteComment} className="mt-1">
              <input type="hidden" name="id" value={c.commentId} />
              <input type="hidden" name="mediaItemId" value={item.id} />
              <button
                type="submit"
                className="text-xs text-stone-400 hover:text-red-600"
              >
                Delete
              </button>
            </form>
          )}
        </div>
      ))}

      <form action={addComment} className="flex flex-col gap-2">
        <input type="hidden" name="mediaItemId" value={item.id} />
        <textarea
          name="body"
          required
          rows={2}
          maxLength={4000}
          placeholder="Add a comment…"
          className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-stone-700 dark:bg-stone-900"
        />
        <button
          type="submit"
          className="self-end rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Comment
        </button>
      </form>
    </section>
  );
}
