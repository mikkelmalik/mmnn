import { AppShell } from "@/components/app-shell";
import { MediaCard } from "@/components/media-card";
import { requireMember } from "@/lib/auth-guard";
import { getMyLists, type FeedItem } from "@/lib/queries";

export default async function MePage() {
  const member = await requireMember();
  const lists = await getMyLists(member.groupId, member.userId);

  const section = (title: string, emoji: string, items: FeedItem[]) => (
    <section className="mb-6">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
        <span aria-hidden>{emoji}</span> {title}
        <span className="text-stone-400">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-stone-400">Nothing here yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((i) => (
            <MediaCard key={i.id} item={i} currentUserId={member.userId} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <AppShell title="Mine">
      <h1 className="mb-4 text-2xl font-bold">Mine</h1>
      {section("Recommended for you", "🎁", lists.taggedForMe)}
      {section("Want to try", "🔖", lists.wantToTry)}
      {section("Consumed", "✓", lists.consumed)}
    </AppShell>
  );
}
