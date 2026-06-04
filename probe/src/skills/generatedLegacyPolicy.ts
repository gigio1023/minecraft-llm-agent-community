/**
 * Policy switch for legacy generated action skill execution.
 *
 * @remarks Legacy generated output is exploratory history. Active actor-owned
 * action skill authority should come from the gated author-and-trial lifecycle.
 */
export function shouldExecuteLegacyGeneratedActionSkills(
  env: Record<string, string | undefined> = process.env
) {
  const value = env.ALLOW_LEGACY_GENERATED_ACTION_SKILLS?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}
