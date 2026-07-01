import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { and, eq } from "drizzle-orm";

import { hashPassword } from "../lib/password";
import { db } from "./index";
import { groups, mediaItems, memberships, users } from "./schema";

async function ensureMembership(
  groupId: string,
  userId: string,
  role: "owner" | "member",
) {
  const existing = await db.query.memberships.findFirst({
    where: and(eq(memberships.groupId, groupId), eq(memberships.userId, userId)),
  });
  if (!existing) {
    await db.insert(memberships).values({ groupId, userId, role });
    return;
  }
  // Make sure the seeded admin keeps owner rights even if they existed before.
  if (role === "owner" && existing.role !== "owner") {
    await db
      .update(memberships)
      .set({ role: "owner" })
      .where(eq(memberships.id, existing.id));
  }
}

async function main() {
  const groupName = process.env.SEED_GROUP_NAME ?? "The Book Club";
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  const adminName = process.env.ADMIN_NAME?.trim() || undefined;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD to create the initial admin user.",
    );
  }

  // 1. Group
  let group = await db.query.groups.findFirst({
    where: eq(groups.name, groupName),
  });
  if (!group) {
    [group] = await db.insert(groups).values({ name: groupName }).returning();
    console.log(`Created group "${group.name}"`);
  }

  // 2. Admin user (owner). Idempotent: creates once, and always syncs the
  //    password/name so changing them in the env + re-seeding takes effect.
  const passwordHash = await hashPassword(adminPassword);
  let admin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });
  if (!admin) {
    [admin] = await db
      .insert(users)
      .values({
        email: adminEmail,
        name: adminName ?? adminEmail.split("@")[0],
        emailVerified: new Date(),
        passwordHash,
      })
      .returning();
    console.log(`Created admin user ${adminEmail}`);
  } else {
    await db
      .update(users)
      .set({
        passwordHash,
        ...(adminName ? { name: adminName } : {}),
        emailVerified: admin.emailVerified ?? new Date(),
      })
      .where(eq(users.id, admin.id));
    console.log(`Updated admin user ${adminEmail} (password synced)`);
  }
  await ensureMembership(group.id, admin.id, "owner");

  // 3. Optional extra members (magic-link only; no password set).
  const extraEmails = (process.env.SEED_MEMBER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e && e !== adminEmail);
  for (const email of extraEmails) {
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!user) {
      [user] = await db
        .insert(users)
        .values({ email, name: email.split("@")[0] })
        .returning();
    }
    await ensureMembership(group.id, user.id, "member");
    console.log(`Ensured member ${email}`);
  }

  // 4. A couple of sample recommendations on first run so the feed isn't empty.
  const existingItems = await db.query.mediaItems.findFirst({
    where: eq(mediaItems.groupId, group.id),
  });
  if (!existingItems) {
    await db.insert(mediaItems).values([
      {
        groupId: group.id,
        authorId: admin.id,
        title: "Everything Everywhere All at Once",
        category: "movie",
        notes: "A wild, big-hearted multiverse ride. Trust me on this one.",
      },
      {
        groupId: group.id,
        authorId: admin.id,
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
