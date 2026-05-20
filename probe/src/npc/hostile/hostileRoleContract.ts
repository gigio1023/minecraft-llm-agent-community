export type HostileRoleContract = {
  roleId: "hostile";
  allowedTools: string[];
  homeRadius: number;
  maxEngagementTicks: number;
  retreatHealthThreshold: number;
};

// Hostile behavior is intentionally smaller than cooperative behavior: it can
// create pressure, but cannot use open-ended combat or storage primitives.
export const hostileRoleContract: HostileRoleContract = {
  roleId: "hostile",
  allowedTools: ["move_to", "wait", "remember"],
  homeRadius: 12,
  maxEngagementTicks: 5,
  retreatHealthThreshold: 6
};
