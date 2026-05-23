import fs from "node:fs/promises";
import path from "node:path";

import { getActorProfile } from "../../npc/profiles.js";
import { getActorWorkspacePaths } from "../actorWorkspacePaths.js";
import { writeJson } from "../actorWorkspaceStore.js";
import type { ActorSoul } from "./types.js";
import { readJsonIfExists } from "./goalJsonStore.js";

/** Compiles durable ActorSoul from soul.md or canonical profile bootstrap. */
export function compileActorSoulFromProfile(actorId: string, societyId = "settlement_alpha"): ActorSoul {
  const profile = getActorProfile(actorId);
  return {
    schema: "actor-soul/v1",
    actor_id: actorId,
    display_name: profile.display_name,
    society_id: societyId,
    role: profile.gameplay_role,
    life_goal: `Live as ${profile.social_archetype}: ${profile.private_goal}. Sustain ${profile.public_responsibility}.`,
    public_responsibilities: [profile.public_responsibility],
    private_drives: [profile.private_goal, profile.learning_bias],
    values: ["evidence_before_claims", "shared_settlement_contribution"],
    needs: {
      survival: ["stay alive", "avoid reckless resource waste"],
      social: ["maintain trust through delivery", "acknowledge settlement pressure"],
      learning: [profile.learning_bias]
    },
    boundaries: {
      forbidden_actions: ["claim success without runtime evidence"],
      requires_evidence_before_claiming: [
        "inventory changes",
        "shared chest changes",
        "task completion"
      ],
      shared_resource_rules: ["deposit only allowed shared materials"]
    },
    action_skill_policy: {
      prefer_owned_action_skills: true,
      allow_primitive_fallback: true,
      allow_generated_action_skill_trials: false
    },
    memory_policy: {
      retrieve_layers: ["episodic", "social", "procedural", "belief", "guardrail"],
      must_consider_recent_cycle_judgment: true
    },
    speech_style: profile.speech_style
  };
}

export async function readActorSoul(rootDir: string, actorId: string): Promise<ActorSoul | null> {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  return readJsonIfExists<ActorSoul>(paths.soulJsonFile);
}

export async function ensureActorSoul(rootDir: string, actorId: string): Promise<ActorSoul> {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  await fs.mkdir(paths.goalsDir, { recursive: true });

  const existing = await readActorSoul(rootDir, actorId);
  if (existing) {
    return existing;
  }

  const soul = compileActorSoulFromProfile(actorId);
  const soulMd = `# ${soul.display_name} (${soul.actor_id})

Role: ${soul.role}
Life direction: ${soul.life_goal}

Public responsibilities:
${soul.public_responsibilities.map((line) => `- ${line}`).join("\n")}

Private drives:
${soul.private_drives.map((line) => `- ${line}`).join("\n")}
`;

  await fs.mkdir(path.dirname(paths.soulMdFile), { recursive: true });
  await fs.writeFile(paths.soulMdFile, soulMd, "utf8");
  await writeJson(paths.soulJsonFile, soul);
  return soul;
}

export function soulRef(actorId: string) {
  return `soul.json`;
}
