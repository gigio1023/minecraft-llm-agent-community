import { runtimePrimitiveIds } from "../gameplay/primitives/registry.js";

export const allowedTools = runtimePrimitiveIds;

export type AllowedTool = (typeof allowedTools)[number];

export type ToolProposal = {
  tool: string;
  args?: Record<string, unknown>;
};

export type ValidatedProposal = {
  tool: AllowedTool;
  args: Record<string, unknown>;
};

export function validateProposal(proposal: ToolProposal): ValidatedProposal {
  if (!allowedTools.includes(proposal.tool as AllowedTool)) {
    throw new Error(`Unsupported tool: ${proposal.tool}`);
  }

  return {
    tool: proposal.tool as AllowedTool,
    args: proposal.args ?? {}
  };
}
