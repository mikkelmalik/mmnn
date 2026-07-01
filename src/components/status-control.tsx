import { setStatus } from "@/lib/actions";
import type { ItemDetail } from "@/lib/queries";

export function StatusControl({ item }: { item: ItemDetail }) {
  const my = item.myStatus;
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <p className="mb-3 text-sm font-medium">Your status</p>
      <div className="flex flex-wrap items-center gap-2">
        <form action={setStatus}>
          <input type="hidden" name="mediaItemId" value={item.id} />
          <input type="hidden" name="status" value="want_to_try" />
          <button
            type="submit"
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              my?.status === "want_to_try"
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-100"
                : "border-stone-300 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
            }`}
          >
            🔖 Want to try
          </button>
        </form>

        <form action={setStatus} className="flex items-center gap-2">
          <input type="hidden" name="mediaItemId" value={item.id} />
          <input type="hidden" name="status" value="consumed" />
          <button
            type="submit"
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              my?.status === "consumed"
                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-200"
                : "border-stone-300 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
            }`}
          >
            ✓ Consumed
          </button>
          <select
            name="rating"
            defaultValue={my?.rating ?? ""}
            aria-label="Your rating"
            className="rounded-full border border-stone-300 bg-white px-2 py-1.5 text-sm dark:border-stone-700 dark:bg-stone-900"
          >
            <option value="">Rate…</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)}
              </option>
            ))}
          </select>
        </form>

        {my && (
          <form action={setStatus}>
            <input type="hidden" name="mediaItemId" value={item.id} />
            <input type="hidden" name="status" value="none" />
            <button
              type="submit"
              className="rounded-full px-2 py-1.5 text-sm text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              Clear
            </button>
          </form>
        )}
      </div>
      <p className="mt-2 text-xs text-stone-400">
        Tip: pick a rating then press “Consumed” to save it.
      </p>
    </div>
  );
}
