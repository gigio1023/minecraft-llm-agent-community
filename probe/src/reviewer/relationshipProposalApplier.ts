import fs from "node:fs/promises";
import path from "node:path";

import {
  applyRelationshipEvent,
  createRelationshipEventRef,
  RELATIONSHIP_EVENT_KINDS
} from "../npc/relationships/relationshipLedger.js";
import {
  readRelationshipEdge,
  writeRelationshipEdge
} from "../npc/relationships/relationshipStore.js";
import {
  getActorWorkspacePaths,
  sanitizeWorkspaceFileId
} from "../runtime/actorWorkspacePaths.js";
import { writeJson } from "../runtime/actorWorkspaceStore.js";
import type { ActorReviewOutput } from "./reviewerStore.js";

export type RelationshipProposalApplication = {
  event_id: string;
  from_actor_id: string;
  to_actor_id: string;
  kind: string;
  status: "applied" | "already_applied";
  relationship_path?: string;
};

type RelationshipEventProposal = NonNullable<
  ActorReviewOutput["relationship_event_proposals"]
>[number];

function isInside(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return relative.length === 0 || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveArtifactRef(rootDir: string, ref: string) {
  if (ref.includes("\0") || ref.trim().length === 0) {
    throw new Error("Relationship proposal evidence ref cannot be empty");
  }

  return path.isAbsolute(ref) ? path.resolve(ref) : path.resolve(rootDir, ref);
}

function assertActorEvidenceRef(rootDir: string, actorId: string, ref: string) {
  const paths = getActorWorkspacePaths(rootDir, actorId);
  const resolved = resolveArtifactRef(rootDir, ref);
  const allowedDirs = [
    paths.evidenceDir,
    paths.providerInputsDir,
    paths.reviewsDir
  ];

  if (!allowedDirs.some((allowedDir) => isInside(allowedDir, resolved))) {
    throw new Error(
      `Relationship proposal evidence ref must stay under ${actorId} evidence, provider input, or review artifacts`
    );
  }

  return resolved;
}

async function assertEvidenceRefsExist(filePaths: readonly string[]) {
  await Promise.all(filePaths.map((filePath) => fs.access(filePath)));
}

async function assertKnownActorWorkspace(rootDir: string, actorId: string) {
  if (actorId !== sanitizeWorkspaceFileId(actorId)) {
    throw new Error(`Relationship proposal actor id is not workspace-safe: ${actorId}`);
  }

  await fs.access(getActorWorkspacePaths(rootDir, actorId).actorFile);
}

function appliedMarkerPath(rootDir: string, review: ActorReviewOutput, eventId: string) {
  return path.join(
    getActorWorkspacePaths(rootDir, review.actor_id).reviewsDir,
    "applied-relationship-proposals",
    `${eventId}.json`
  );
}

async function markerExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function assertProposalShape(review: ActorReviewOutput, proposal: RelationshipEventProposal) {
  if (!RELATIONSHIP_EVENT_KINDS.includes(proposal.kind)) {
    throw new Error(`Unsupported relationship event kind: ${String(proposal.kind)}`);
  }

  if (proposal.target_actor_id.trim().length === 0) {
    throw new Error("Relationship proposal requires target_actor_id");
  }

  if (proposal.target_actor_id === review.actor_id) {
    throw new Error("Relationship proposal cannot target the reviewed actor itself");
  }

  if (proposal.evidence_refs.length === 0) {
    throw new Error("Relationship proposal requires at least one evidence ref");
  }
}

function relationshipEventId(
  review: ActorReviewOutput,
  proposal: RelationshipEventProposal,
  index: number
) {
  return sanitizeWorkspaceFileId(
    `${review.review_id}-${index}-${proposal.kind}-${proposal.target_actor_id}-to-${review.actor_id}`
  );
}

/**
 * Applies reviewer relationship proposals through a runtime-owned guard.
 *
 * Direction is intentionally observer-to-actor: a review for `npc_b` proposing
 * target `npc_a` updates `npc_a -> npc_b`, because `npc_a` is the actor whose
 * relationship stance toward `npc_b` changed.
 */
export async function applyReviewerRelationshipEventProposals(
  rootDir: string,
  review: ActorReviewOutput
): Promise<RelationshipProposalApplication[]> {
  if (review.schema !== "actor-review/v1") {
    throw new Error("Relationship proposal applier requires actor-review/v1");
  }

  const proposals = review.relationship_event_proposals ?? [];
  const applications: RelationshipProposalApplication[] = [];
  await assertKnownActorWorkspace(rootDir, review.actor_id);

  for (const [index, proposal] of proposals.entries()) {
    assertProposalShape(review, proposal);
    await assertKnownActorWorkspace(rootDir, proposal.target_actor_id);
    const resolvedEvidenceRefs = proposal.evidence_refs.map((ref) =>
      assertActorEvidenceRef(rootDir, review.actor_id, ref)
    );
    await assertEvidenceRefsExist(resolvedEvidenceRefs);

    const fromActorId = proposal.target_actor_id;
    const toActorId = review.actor_id;
    const eventId = relationshipEventId(review, proposal, index);
    const markerPath = appliedMarkerPath(rootDir, review, eventId);
    const currentEdge = await readRelationshipEdge(rootDir, fromActorId, toActorId);

    if (
      await markerExists(markerPath) ||
      currentEdge.recent_events.some((event) => event.id === eventId)
    ) {
      await writeJson(markerPath, {
        schema: "relationship-proposal-application/v1",
        event_id: eventId,
        review_id: review.review_id,
        from_actor_id: fromActorId,
        to_actor_id: toActorId,
        kind: proposal.kind,
        status: "already_applied"
      });
      applications.push({
        event_id: eventId,
        from_actor_id: fromActorId,
        to_actor_id: toActorId,
        kind: proposal.kind,
        status: "already_applied"
      });
      continue;
    }

    const nextEdge = applyRelationshipEvent(
      currentEdge,
      createRelationshipEventRef({
        id: eventId,
        kind: proposal.kind,
        summary: proposal.summary,
        evidence_refs: resolvedEvidenceRefs
      })
    );
    const relationshipPath = await writeRelationshipEdge(rootDir, nextEdge);
    await writeJson(markerPath, {
      schema: "relationship-proposal-application/v1",
      event_id: eventId,
      review_id: review.review_id,
      from_actor_id: fromActorId,
      to_actor_id: toActorId,
      kind: proposal.kind,
      status: "applied",
      evidence_refs: resolvedEvidenceRefs,
      relationship_path: relationshipPath
    });

    applications.push({
      event_id: eventId,
      from_actor_id: fromActorId,
      to_actor_id: toActorId,
      kind: proposal.kind,
      status: "applied",
      relationship_path: relationshipPath
    });
  }

  return applications;
}
