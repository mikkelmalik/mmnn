import { AppShell } from "@/components/app-shell";
import { RecommendationForm } from "@/components/recommendation-form";
import { requireMember } from "@/lib/auth-guard";
import { getGroupMembers } from "@/lib/queries";

export default async function NewRecommendationPage() {
  const member = await requireMember();
  const members = await getGroupMembers(member.groupId);

  return (
    <AppShell title="New recommendation">
      <h1 className="mb-4 text-2xl font-bold">Recommend something</h1>
      <RecommendationForm members={members} currentUserId={member.userId} />
    </AppShell>
  );
}
