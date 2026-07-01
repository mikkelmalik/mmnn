import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  comments,
  itemStatuses,
  type ItemStatus,
  type MediaCategory,
  mediaItems,
  memberships,
  reactions,
  users,
} from "@/db/schema";

export type UserRef = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

export type FeedItem = {
  id: string;
  title: string;
  category: MediaCategory;
  notes: string | null;
  coverImageUrl: string | null;
  createdAt: Date;
  author: UserRef;
  taggedFor: UserRef | null;
  reactions: { emoji: string; count: number; mine: boolean }[];
  commentCount: number;
  statusSummary: { want_to_try: number; consumed: number };
  myStatus: { status: ItemStatus; rating: number | null } | null;
};

async function usersByIds(ids: string[]): Promise<Map<string, UserRef>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(inArray(users.id, unique));
  return new Map(rows.map((u) => [u.id, u]));
}

export async function getFeedItems(
  groupId: string,
  currentUserId: string,
  opts: { category?: MediaCategory; forMe?: boolean } = {},
): Promise<FeedItem[]> {
  const conditions = [eq(mediaItems.groupId, groupId)];
  if (opts.category) conditions.push(eq(mediaItems.category, opts.category));
  if (opts.forMe) conditions.push(eq(mediaItems.taggedForUserId, currentUserId));

  const items = await db
    .select()
    .from(mediaItems)
    .where(and(...conditions))
    .orderBy(desc(mediaItems.createdAt));

  if (items.length === 0) return [];
  const itemIds = items.map((i) => i.id);

  const [allReactions, allComments, allStatuses, userMap] = await Promise.all([
    db.select().from(reactions).where(inArray(reactions.mediaItemId, itemIds)),
    db
      .select({ mediaItemId: comments.mediaItemId })
      .from(comments)
      .where(inArray(comments.mediaItemId, itemIds)),
    db
      .select()
      .from(itemStatuses)
      .where(inArray(itemStatuses.mediaItemId, itemIds)),
    usersByIds(
      items.flatMap((i) => [i.authorId, i.taggedForUserId ?? ""]),
    ),
  ]);

  const commentCounts = new Map<string, number>();
  for (const c of allComments) {
    commentCounts.set(c.mediaItemId, (commentCounts.get(c.mediaItemId) ?? 0) + 1);
  }

  return items.map((item) => {
    const reactionAgg = new Map<string, { count: number; mine: boolean }>();
    for (const r of allReactions) {
      if (r.mediaItemId !== item.id) continue;
      const cur = reactionAgg.get(r.emoji) ?? { count: 0, mine: false };
      cur.count += 1;
      if (r.userId === currentUserId) cur.mine = true;
      reactionAgg.set(r.emoji, cur);
    }

    const statusSummary = { want_to_try: 0, consumed: 0 };
    let myStatus: FeedItem["myStatus"] = null;
    for (const s of allStatuses) {
      if (s.mediaItemId !== item.id) continue;
      statusSummary[s.status] += 1;
      if (s.userId === currentUserId) {
        myStatus = { status: s.status, rating: s.rating };
      }
    }

    const author = userMap.get(item.authorId) ?? {
      id: item.authorId,
      name: null,
      email: null,
      image: null,
    };

    return {
      id: item.id,
      title: item.title,
      category: item.category,
      notes: item.notes,
      coverImageUrl: item.coverImageUrl,
      createdAt: item.createdAt,
      author,
      taggedFor: item.taggedForUserId
        ? (userMap.get(item.taggedForUserId) ?? null)
        : null,
      reactions: [...reactionAgg.entries()]
        .map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine }))
        .sort((a, b) => b.count - a.count),
      commentCount: commentCounts.get(item.id) ?? 0,
      statusSummary,
      myStatus,
    };
  });
}

export type ItemDetail = FeedItem & {
  comments: (UserRef & { commentId: string; body: string; createdAt: Date })[];
  statuses: (UserRef & { status: ItemStatus; rating: number | null })[];
};

export async function getItemDetail(
  groupId: string,
  itemId: string,
  currentUserId: string,
): Promise<ItemDetail | null> {
  const base = (await getFeedItems(groupId, currentUserId)).find(
    (i) => i.id === itemId,
  );
  if (!base) return null;

  const [commentRows, statusRows] = await Promise.all([
    db
      .select()
      .from(comments)
      .where(eq(comments.mediaItemId, itemId))
      .orderBy(comments.createdAt),
    db.select().from(itemStatuses).where(eq(itemStatuses.mediaItemId, itemId)),
  ]);

  const userMap = await usersByIds([
    ...commentRows.map((c) => c.userId),
    ...statusRows.map((s) => s.userId),
  ]);

  const ref = (id: string): UserRef =>
    userMap.get(id) ?? { id, name: null, email: null, image: null };

  return {
    ...base,
    comments: commentRows.map((c) => ({
      ...ref(c.userId),
      commentId: c.id,
      body: c.body,
      createdAt: c.createdAt,
    })),
    statuses: statusRows.map((s) => ({
      ...ref(s.userId),
      status: s.status,
      rating: s.rating,
    })),
  };
}

export async function getGroupMembers(groupId: string): Promise<
  (UserRef & { role: "owner" | "member" })[]
> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.groupId, groupId));
  return rows;
}

export async function getMyLists(groupId: string, userId: string) {
  const feed = await getFeedItems(groupId, userId);
  return {
    taggedForMe: feed.filter((i) => i.taggedFor?.id === userId),
    wantToTry: feed.filter((i) => i.myStatus?.status === "want_to_try"),
    consumed: feed.filter((i) => i.myStatus?.status === "consumed"),
  };
}
