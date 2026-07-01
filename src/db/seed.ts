import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { and, eq } from "drizzle-orm";

import { db } from "./index";
import { groups, mediaItems, memberships, users } from "./schema";

async function findOrCreateUser(email: string) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) return existing;
  const [created] = await db
    .insert(users)
    .values({ email, name: email.split("@")[0] })
    .returning();
  return created;
}

async function main() {
  const groupName = process.env.SEED_GROUP_NAME ?? "The Book Club";
  const emails = (process.env.SEED_MEMBER_EMAILS ?? "you@example.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (emails.length === 0) {
    throw new Error("Set SEED_MEMBER_EMAILS to at least one email.");
  }

  let group = await db.query.groups.findFirst({
    where: eq(groups.name, groupName),
  });
  if (!group) {
    [group] = await db.insert(groups).values({ name: groupName }).returning();
    console.log(`Created group "${group.name}"`);
  }

  for (const [i, email] of emails.entries()) {
    const user = await findOrCreateUser(email);
    const existingMembership = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.groupId, group.id),
        eq(memberships.userId, user.id),
      ),
    });
    if (!existingMembership) {
      await db.insert(memberships).values({
        groupId: group.id,
        userId: user.id,
        role: i === 0 ? "owner" : "member",
      });
      console.log(`Added ${email} as ${i === 0 ? "owner" : "member"}`);
    } else {
      console.log(`${email} already a member`);
    }
  }

  // Add a couple of sample recommendations on first run so the feed isn't empty.
  const existingItems = await db.query.mediaItems.findFirst({
    where: eq(mediaItems.groupId, group.id),
  });
  if (!existingItems) {
    const owner = await findOrCreateUser(emails[0]);
    await db.insert(mediaItems).values([
      {
        groupId: group.id,
        authorId: owner.id,
        title: "Everything Everywhere All at Once",
        category: "movie",
        notes: "A wild, big-hearted multiverse ride. Trust me on this one.",
      },
      {
        groupId: group.id,
        authorId: owner.id,
        title: "Project Hail Mary",
        category: "book",
        notes: "If you liked The Martian, you'll devour this. Great audiobook too.",
      },
    ]);
    console.log("Added 2 sample recommendations");
  }

  console.log("✅ Seed complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
