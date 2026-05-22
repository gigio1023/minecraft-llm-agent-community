import type { PressureKind, PressureRecord } from "../../runtime/pressureIntent.js";
import type { BulletinEntry } from "./teamBulletin.js";
import type { MailItem } from "../../runtime/mailbox/turnPhasedMailbox.js";

type ObligationRouterInput = {
  actorId: string;
  roleId: string;
  bulletinEntries: BulletinEntry[];
  pendingMail: MailItem[];
  sharedChestItems?: Array<{ name: string; count: number }>;
  turn: number;
};

const ESSENTIAL_THRESHOLD = 4;

let obligationPressureCounter = 0;

function nextObligationPressureId() {
  obligationPressureCounter += 1;
  return `obligation-pressure-${obligationPressureCounter}`;
}

/**
 * Converts public social artifacts into runtime pressure records.
 *
 * The router deliberately reads bulletin, mailbox, and shared-storage facts
 * instead of persona text, so coordination pressure stays tied to material
 * evidence that can be reviewed from transcripts.
 */
export function routeObligationPressures({
  actorId,
  roleId,
  bulletinEntries,
  pendingMail,
  sharedChestItems,
  turn
}: ObligationRouterInput): PressureRecord[] {
  const pressures: PressureRecord[] = [];

  for (const entry of bulletinEntries) {
    if (entry.currentBlocker && entry.actorId !== actorId) {
      const isRelevantToMe = isRoleRelevantToBlocker(roleId, entry.currentBlocker);

      if (isRelevantToMe) {
        pressures.push({
          id: nextObligationPressureId(),
          actorId,
          kind: "blocked_teammate",
          summary: `${entry.actorId} (${entry.roleId}) is blocked: ${entry.currentBlocker}`,
          source: "bulletin",
          relatedActorId: entry.actorId,
          relatedTaskId: entry.currentTask,
          urgency: 0.8,
          roleRelevance: isRelevantToMe ? 0.9 : 0.3,
          sharedImportance: 0.85,
          personalImportance: 0.4,
          accessibility: 0.7,
          novelty: 0.5,
          recoveryWeight: 0.0,
          interruptsCurrentIntent: false
        });
      }
    }

    if (entry.resourceNeeds && entry.resourceNeeds.length > 0 && entry.actorId !== actorId) {
      pressures.push({
        id: nextObligationPressureId(),
        actorId,
        kind: "public_obligation_due",
        summary: `${entry.actorId} needs: ${entry.resourceNeeds.join(", ")}`,
        source: "bulletin",
        relatedActorId: entry.actorId,
        relatedItemNames: [...entry.resourceNeeds],
        urgency: 0.65,
        roleRelevance: roleId === "gatherer" || roleId === "quartermaster" ? 0.85 : 0.4,
        sharedImportance: 0.7,
        personalImportance: 0.35,
        accessibility: 0.6,
        novelty: 0.4,
        recoveryWeight: 0.0,
        interruptsCurrentIntent: false
      });
    }
  }

  // Mail becomes conversation pressure only when it is addressed to this actor;
  // warning mail is handled as hostile pressure elsewhere.
  const unacknowledgedMail = pendingMail.filter(
    (mail) => mail.to === actorId && mail.kind !== "warning"
  );

  if (unacknowledgedMail.length > 0) {
    pressures.push({
      id: nextObligationPressureId(),
      actorId,
      kind: "conversation_backlog",
      summary: `${unacknowledgedMail.length} unread message(s) from teammates`,
      source: "mailbox",
      relatedActorId: unacknowledgedMail[0].from,
      urgency: 0.5 + Math.min(unacknowledgedMail.length * 0.1, 0.3),
      roleRelevance: 0.6,
      sharedImportance: 0.5,
      personalImportance: 0.6,
      accessibility: 0.9,
      novelty: 0.7,
      recoveryWeight: 0.0,
      interruptsCurrentIntent: false
    });
  }

  if (sharedChestItems) {
    const totalItems = sharedChestItems.reduce(
      (sum, item) => sum + item.count,
      0
    );

    if (totalItems < ESSENTIAL_THRESHOLD) {
      pressures.push({
        id: nextObligationPressureId(),
        actorId,
        kind: "shared_shortage",
        summary: `Shared storage has only ${totalItems} items (threshold: ${ESSENTIAL_THRESHOLD})`,
        source: "world",
        urgency: 0.75,
        roleRelevance: roleId === "gatherer" || roleId === "quartermaster" ? 0.9 : 0.5,
        sharedImportance: 0.9,
        personalImportance: 0.5,
        accessibility: 0.7,
        novelty: 0.3,
        recoveryWeight: 0.0,
        interruptsCurrentIntent: false
      });
    }
  }

  return pressures;
}

function isRoleRelevantToBlocker(roleId: string, blocker: string): boolean {
  const blockerLower = blocker.toLowerCase();

  if (roleId === "gatherer") {
    return blockerLower.includes("log") ||
      blockerLower.includes("wood") ||
      blockerLower.includes("cobblestone") ||
      blockerLower.includes("coal") ||
      blockerLower.includes("iron") ||
      blockerLower.includes("material") ||
      blockerLower.includes("resource");
  }

  if (roleId === "crafter") {
    return blockerLower.includes("craft") ||
      blockerLower.includes("tool") ||
      blockerLower.includes("planks") ||
      blockerLower.includes("pickaxe") ||
      blockerLower.includes("furnace");
  }

  if (roleId === "quartermaster") {
    return true;
  }

  return false;
}
