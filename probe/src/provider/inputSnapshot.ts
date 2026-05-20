export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ProviderInputSnapshot = {
  schema: "provider-input-snapshot/v1";
  snapshot_id: string;
  actor_id: string;
  turn_id: string;
  provider_id: string;
  model: string;
  created_at: string;
  input: JsonValue;
  allowed_tools?: string[];
  active_action_skills?: string[];
  observation?: JsonValue;
  memory?: JsonValue;
  recent_context?: JsonValue;
  trace_ref?: string;
};
