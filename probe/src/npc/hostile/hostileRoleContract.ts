export type HostileRoleContract = {
  roleId: "hostile";
  allowedTools: string[];
  homeRadius: number;
  maxEngagementTicks: number;
  retreatHealthThreshold: number;
};

export const hostileRoleContract: HostileRoleContract = {
  roleId: "hostile",
  allowedTools: ["move_to", "wait", "remember"],
  homeRadius: 12,
  maxEngagementTicks: 5,
  retreatHealthThreshold: 6
};
