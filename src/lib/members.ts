export const TEAM_MEMBERS = [
  {
    slug: "athithya",
    name: "Athithya",
    role: "Development",
    accent: "#0f766e",
  },
  {
    slug: "sarvesh",
    name: "Sarvesh",
    role: "Sales",
    accent: "#c2410c",
  },
] as const;

export function getTeamMemberBySlug(slug?: string | null) {
  return TEAM_MEMBERS.find((member) => member.slug === slug);
}
