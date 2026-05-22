import type {
  ActorReviewReasoner,
  ActorReviewReasonerResult
} from "./reviewerQueue.js";
import { RELATIONSHIP_EVENT_KINDS } from "../npc/relationships/relationshipLedger.js";
import type { ActorReviewFinding } from "./reviewerStore.js";

const RESPONSES_API_URL = "https://api.openai.com/v1/responses";

type ResponsesApiPayload = {
  output_text?: unknown;
};

type CreateOpenAICodexReviewerArgs = {
  accessToken: string;
  model: string;
  reasoning: "low" | "medium" | "high";
  fetchImpl?: typeof fetch;
};

function createPrompt(input: Parameters<ActorReviewReasoner["review"]>[0]) {
  return [
    "Review this Minecraft actor job from immutable artifacts only.",
    "Return exactly one JSON object with keys findings and optional proposal.",
    "findings must be an array of {severity,title,body}; severity is p0,p1,p2,or p3.",
    "proposal, if present, may include task_intent, preconditions, required_primitives, known_failure_modes, and notes.",
    "relationship_event_proposals, if present, must be an array of {kind,target_actor_id,summary,evidence_refs}; kind must use the documented relationship event enum.",
    "Do not claim runtime success. Do not mutate active action skills.",
    JSON.stringify(input)
  ].join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseFindings(value: unknown): ActorReviewFinding[] {
  if (!Array.isArray(value)) {
    throw new Error("Reviewer response findings must be an array");
  }

  return value.map((entry) => {
    if (!isRecord(entry)) {
      throw new Error("Reviewer finding must be an object");
    }

    const severity = entry.severity;
    if (!["p0", "p1", "p2", "p3"].includes(String(severity))) {
      throw new Error(`Unsupported reviewer finding severity: ${String(severity)}`);
    }

    if (typeof entry.title !== "string" || typeof entry.body !== "string") {
      throw new Error("Reviewer finding requires title and body strings");
    }

    return {
      severity: severity as ActorReviewFinding["severity"],
      title: entry.title,
      body: entry.body
    };
  });
}

function parseStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : undefined;
}

function parseRelationshipEventProposals(value: unknown): ActorReviewReasonerResult["relationship_event_proposals"] {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("Reviewer relationship_event_proposals must be an array");
  }

  return value.map((entry) => {
    if (!isRecord(entry)) {
      throw new Error("Reviewer relationship event proposal must be an object");
    }

    if (!RELATIONSHIP_EVENT_KINDS.includes(entry.kind as (typeof RELATIONSHIP_EVENT_KINDS)[number])) {
      throw new Error(`Unsupported relationship event kind: ${String(entry.kind)}`);
    }

    if (typeof entry.target_actor_id !== "string" || typeof entry.summary !== "string") {
      throw new Error("Reviewer relationship event proposal requires target_actor_id and summary");
    }

    return {
      kind: entry.kind as (typeof RELATIONSHIP_EVENT_KINDS)[number],
      target_actor_id: entry.target_actor_id,
      summary: entry.summary,
      evidence_refs: parseStringArray(entry.evidence_refs)
    };
  });
}

function parseReviewerResult(value: unknown): ActorReviewReasonerResult {
  if (!isRecord(value)) {
    throw new Error("Reviewer response must be an object");
  }

  const proposal = isRecord(value.proposal)
    ? {
        task_intent:
          typeof value.proposal.task_intent === "string"
            ? value.proposal.task_intent
            : "repair reviewed action skill failure",
        preconditions: parseStringArray(value.proposal.preconditions),
        required_primitives: parseStringArray(value.proposal.required_primitives),
        known_failure_modes: parseStringArray(value.proposal.known_failure_modes),
        notes: typeof value.proposal.notes === "string" ? value.proposal.notes : undefined
      }
    : undefined;

  return {
    findings: parseFindings(value.findings),
    ...(value.relationship_event_proposals !== undefined
      ? {
          relationship_event_proposals: parseRelationshipEventProposals(
            value.relationship_event_proposals
          )
        }
      : {}),
    ...(proposal ? { proposal } : {})
  };
}

async function requestResponse(
  fetchImpl: typeof fetch,
  accessToken: string,
  input: Parameters<ActorReviewReasoner["review"]>[0],
  model: string,
  reasoning: "low" | "medium" | "high"
): Promise<ResponsesApiPayload> {
  const response = await fetchImpl(RESPONSES_API_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      reasoning: {
        effort: reasoning
      },
      text: {
        format: {
          type: "json_object"
        }
      },
      input: createPrompt(input)
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI Codex reviewer request failed with status ${response.status}`);
  }

  return (await response.json()) as ResponsesApiPayload;
}

function parseOutputText(payload: ResponsesApiPayload) {
  if (typeof payload.output_text !== "string") {
    throw new Error("OpenAI Codex reviewer response must include string output_text");
  }

  return JSON.parse(payload.output_text);
}

export function createOpenAICodexReviewer({
  accessToken,
  model,
  reasoning,
  fetchImpl = fetch
}: CreateOpenAICodexReviewerArgs): ActorReviewReasoner {
  if (accessToken.trim().length === 0) {
    throw new Error("OpenAI Codex reviewer accessToken must be a non-empty string");
  }

  return {
    async review(input) {
      const payload = await requestResponse(fetchImpl, accessToken, input, model, reasoning);
      return parseReviewerResult(parseOutputText(payload));
    }
  };
}
