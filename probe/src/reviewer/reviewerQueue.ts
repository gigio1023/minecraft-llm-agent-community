import fs from "node:fs/promises";
import path from "node:path";

import {
  getActorWorkspacePaths,
  sanitizeWorkspaceFileId
} from "../runtime/actorWorkspacePaths.js";
import { writeJson, type ActorActionSkillRecord } from "../runtime/actorWorkspaceStore.js";
import {
  writeReviewerOutput,
  type ActorReviewFinding,
  type ActorReviewOutput
} from "./reviewerStore.js";
import { writeActionSkillProposal } from "../skills/proposals/proposalStore.js";
import type { ActionSkillProposalRecord } from "../skills/proposals/types.js";
import type { JsonValue } from "../provider/inputSnapshot.js";
import type { RelationshipEventKind } from "../npc/relationships/relationshipLedger.js";
import {
  applyReviewerRelationshipEventProposals,
  type RelationshipProposalApplication
} from "./relationshipProposalApplier.js";

export type ActorReviewInputRefKind =
  | "evidence"
  | "provider_input"
  | "transcript"
  | "langfuse_trace"
  | "action_skill_candidate"
  | "action_skill_retired"
  | "memory_summary";

export type ActorReviewInputRef = {
  kind: ActorReviewInputRefKind;
  ref: string;
};

export type ActorReviewActionSkillSnapshot = {
  skill_id: string;
  status: "active";
  required_primitives: string[];
};

export type ActorReviewJobReason =
  | "verification_failure"
  | "fake_progress_rejection"
  | "runtime_block"
  | "manual_review";

export type ActorReviewJob = {
  schema: "actor-review-job/v1";
  job_id: string;
  actor_id: string;
  reason: ActorReviewJobReason;
  created_at: string;
  input_refs: ActorReviewInputRef[];
  active_action_skill_snapshot: ActorReviewActionSkillSnapshot[];
};

export type ActorReviewerRunnerOptions = {
  now?: () => string;
  reviewer?: ActorReviewReasoner;
  actorContext?: JsonValue;
  applyRelationshipEventProposals?: boolean;
};

export type ActorReviewerRunResult = {
  jobPath: string;
  reviewPath: string;
  relationshipApplications?: RelationshipProposalApplication[];
};

export type ActorReviewReasonerResult = {
  findings: ActorReviewFinding[];
  relationship_event_proposals?: Array<{
    kind: RelationshipEventKind;
    target_actor_id: string;
    summary: string;
    evidence_refs?: string[];
  }>;
  proposal?: {
    task_intent: string;
    preconditions?: string[];
    required_primitives?: string[];
    known_failure_modes?: string[];
    notes?: string;
  };
};

export type ActorReviewReasoner = {
  review(input: {
    job: ActorReviewJob;
    actor_context?: JsonValue;
  }): Promise<ActorReviewReasonerResult> | ActorReviewReasonerResult;
};

function getReviewQueueDir(rootDir: string, actorId: string) {
  return path.join(getActorWorkspacePaths(rootDir, actorId).reviewsDir, "queue");
}

function isInside(parent: string, child: string) {
  const relative = path.relative(parent, child);
  return relative.length === 0 || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function expectedArtifactDir(rootDir: string, actorId: string, kind: ActorReviewInputRefKind) {
  const paths = getActorWorkspacePaths(rootDir, actorId);

  switch (kind) {
    case "evidence":
      return paths.evidenceDir;
    case "provider_input":
      return paths.providerInputsDir;
    case "action_skill_candidate":
      return paths.actionSkills.candidatesDir;
    case "action_skill_retired":
      return paths.actionSkills.retiredDir;
    case "memory_summary":
      return paths.memoryDir;
    case "transcript":
      return paths.actorDir;
    case "langfuse_trace":
      return undefined;
  }
}

function assertReviewInputRef(rootDir: string, actorId: string, inputRef: ActorReviewInputRef) {
  if (inputRef.ref.trim().length === 0) {
    throw new Error("Reviewer input ref cannot be empty");
  }

  if (inputRef.kind === "langfuse_trace") {
    return;
  }

  if (inputRef.ref.includes("\0")) {
    throw new Error("Reviewer input ref cannot contain null bytes");
  }

  const expectedDir = expectedArtifactDir(rootDir, actorId, inputRef.kind);

  if (!expectedDir) {
    return;
  }

  const resolvedRef = path.isAbsolute(inputRef.ref)
    ? inputRef.ref
    : path.resolve(rootDir, inputRef.ref);

  if (!isInside(expectedDir, resolvedRef)) {
    throw new Error(
      `Reviewer ${inputRef.kind} ref must stay under ${actorId} ${inputRef.kind} artifacts`
    );
  }
}

function assertReviewJob(rootDir: string, job: ActorReviewJob) {
  if (job.schema !== "actor-review-job/v1") {
    throw new Error("Reviewer job must use actor-review-job/v1 schema");
  }

  if (job.actor_id.trim().length === 0 || job.job_id.trim().length === 0) {
    throw new Error("Reviewer job requires actor_id and job_id");
  }

  for (const inputRef of job.input_refs) {
    assertReviewInputRef(rootDir, job.actor_id, inputRef);
  }
}

export function snapshotActiveActionSkills(
  activeActionSkills: readonly ActorActionSkillRecord[]
): ActorReviewActionSkillSnapshot[] {
  return activeActionSkills
    .filter((record) => record.status === "active")
    .map((record) => ({
      skill_id: record.skill_id,
      status: "active" as const,
      required_primitives: [...record.required_primitives]
    }))
    .sort((left, right) => left.skill_id.localeCompare(right.skill_id));
}

export async function enqueueActorReviewJob(rootDir: string, job: ActorReviewJob) {
  assertReviewJob(rootDir, job);

  const jobPath = path.join(
    getReviewQueueDir(rootDir, job.actor_id),
    `${sanitizeWorkspaceFileId(job.job_id)}.json`
  );
  await writeJson(jobPath, job);
  return jobPath;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

function deterministicFindings(job: ActorReviewJob): ActorReviewFinding[] {
  const refList = job.input_refs.map((inputRef) => inputRef.ref).join(", ");

  if (job.reason === "fake_progress_rejection") {
    return [
      {
        severity: "p1",
        title: "Fake progress evidence needs action-skill repair",
        body: `The actor produced fake progress evidence. Review refs: ${refList}`
      }
    ];
  }

  if (job.reason === "verification_failure") {
    return [
      {
        severity: "p1",
        title: "Verification failed against runtime evidence",
        body: `The actor failed runtime verification. Review refs: ${refList}`
      }
    ];
  }

  if (job.reason === "runtime_block") {
    return [
      {
        severity: "p2",
        title: "Runtime blocked the proposed primitive",
        body: `The actor proposed an action outside the runtime contract. Review refs: ${refList}`
      }
    ];
  }

  return [
    {
      severity: "p3",
      title: "Manual review requested",
      body: `Manual actor review was queued. Review refs: ${refList}`
    }
  ];
}

export function buildDeterministicReviewerOutput(
  job: ActorReviewJob,
  options: ActorReviewerRunnerOptions & { candidateProposalPaths?: string[] } = {}
): ActorReviewOutput {
  return {
    schema: "actor-review/v1",
    review_id: `review-for-${job.job_id}`,
    actor_id: job.actor_id,
    created_at: options.now?.() ?? new Date().toISOString(),
    input_refs: job.input_refs.map((inputRef) => inputRef.ref),
    findings: deterministicFindings(job),
    candidate_proposals: options.candidateProposalPaths ?? [],
    relationship_event_proposals: [],
    active_mutation: "forbidden"
  };
}

function evidenceRefs(job: ActorReviewJob) {
  return job.input_refs
    .filter((inputRef) => inputRef.kind === "evidence")
    .map((inputRef) => inputRef.ref);
}

function shouldProposeActionSkillRepair(job: ActorReviewJob) {
  return job.reason === "fake_progress_rejection" || job.reason === "verification_failure";
}

function buildActionSkillProposal(
  job: ActorReviewJob,
  now: string,
  reasonerProposal?: ActorReviewReasonerResult["proposal"]
): ActionSkillProposalRecord | null {
  if (!shouldProposeActionSkillRepair(job)) {
    return null;
  }

  const primarySkill = job.active_action_skill_snapshot[0];
  const primitiveIds = primarySkill?.required_primitives.length
    ? primarySkill.required_primitives
    : ["observe", "wait", "remember"];

  return {
    schema: "action-skill-proposal/v1",
    proposal_id: `proposal-${job.job_id}`,
    skill_id: `reviewRepair-${job.job_id}`,
    owner_actor_id: job.actor_id,
    source_kind: "derived",
    status: "draft",
    task_intent: reasonerProposal?.task_intent ?? `repair ${job.reason}`,
    evidence_refs: evidenceRefs(job),
    preconditions: reasonerProposal?.preconditions ?? ["reviewer observed immutable runtime evidence"],
    required_primitives: reasonerProposal?.required_primitives?.length
      ? [...reasonerProposal.required_primitives]
      : [...primitiveIds],
    proposed_recipe_id: `reviewer-repair:${job.job_id}`,
    success_verifier: "runtime verification must pass on a future trial",
    known_failure_modes: reasonerProposal?.known_failure_modes?.length
      ? [...reasonerProposal.known_failure_modes]
      : [job.reason],
    created_at: now,
    updated_at: now,
    notes:
      reasonerProposal?.notes ??
      "Deterministic reviewer proposal. It is a draft candidate only and cannot become active without validation and promotion."
  };
}

export async function listQueuedActorReviewJobs(rootDir: string, actorId: string) {
  const queueDir = getReviewQueueDir(rootDir, actorId);

  let entries: string[];
  try {
    entries = await fs.readdir(queueDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }

  return Promise.all(
    entries
      .filter((entry) => entry.endsWith(".json"))
      .sort()
      .map(async (entry) => {
        const jobPath = path.join(queueDir, entry);
        return {
          jobPath,
          job: await readJson<ActorReviewJob>(jobPath)
        };
      })
  );
}

export async function runQueuedActorReviewJobs(
  rootDir: string,
  actorId: string,
  options: ActorReviewerRunnerOptions = {}
): Promise<ActorReviewerRunResult[]> {
  const queuedJobs = await listQueuedActorReviewJobs(rootDir, actorId);
  const results: ActorReviewerRunResult[] = [];

  for (const queued of queuedJobs) {
    if (queued.job.actor_id !== actorId) {
      throw new Error(`Queued reviewer job ${queued.job.job_id} belongs to ${queued.job.actor_id}`);
    }

    const createdAt = options.now?.() ?? new Date().toISOString();
    const reasonerResult = options.reviewer
      ? await options.reviewer.review({ job: queued.job, actor_context: options.actorContext })
      : undefined;
    const candidateProposal = buildActionSkillProposal(
      queued.job,
      createdAt,
      reasonerResult?.proposal
    );
    const candidateProposalPaths = candidateProposal
      ? [await writeActionSkillProposal(rootDir, candidateProposal)]
      : [];
    const review = reasonerResult
      ? {
          schema: "actor-review/v1" as const,
          review_id: `review-for-${queued.job.job_id}`,
          actor_id: queued.job.actor_id,
          created_at: createdAt,
          input_refs: queued.job.input_refs.map((inputRef) => inputRef.ref),
          findings: reasonerResult.findings,
          candidate_proposals: candidateProposalPaths,
          relationship_event_proposals:
            reasonerResult.relationship_event_proposals?.map((proposal) => ({
              kind: proposal.kind,
              target_actor_id: proposal.target_actor_id,
              summary: proposal.summary,
              evidence_refs: proposal.evidence_refs ?? evidenceRefs(queued.job)
            })) ?? [],
          active_mutation: "forbidden" as const
        }
      : buildDeterministicReviewerOutput(queued.job, {
          ...options,
          now: () => createdAt,
          candidateProposalPaths
        });
    const reviewPath = await writeReviewerOutput(rootDir, review);
    const relationshipApplications = options.applyRelationshipEventProposals
      ? await applyReviewerRelationshipEventProposals(rootDir, review)
      : undefined;
    results.push({
      jobPath: queued.jobPath,
      reviewPath,
      ...(relationshipApplications ? { relationshipApplications } : {})
    });
  }

  return results;
}
