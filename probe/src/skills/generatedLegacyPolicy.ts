export function shouldExecuteLegacyGeneratedActionSkills(
  env: Record<string, string | undefined> = process.env
) {
  const value = env.ALLOW_LEGACY_GENERATED_ACTION_SKILLS?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}
