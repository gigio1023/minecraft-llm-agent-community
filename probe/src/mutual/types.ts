export type MutualJsonValue =
  | string
  | number
  | boolean
  | null
  | MutualJsonValue[]
  | { [key: string]: MutualJsonValue };

export type Proposal = {
  tool: string;
  args?: Record<string, unknown>;
  why?: string;
};

export type MutualStepRecord = {
  actor: string;
  observation: MutualJsonValue;
  actorAction: {
    tool: string;
  };
  result: MutualJsonValue;
  actorArgs?: Record<string, MutualJsonValue>;
  memoryNote?: {
    note: string;
  };
  providerMeta?: {
    why: string;
  };
  failure?: {
    message: string;
    [key: string]: MutualJsonValue;
  };
};
