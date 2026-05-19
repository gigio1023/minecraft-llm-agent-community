import type { ActorId } from "./types.js";

export const actors: ActorId[] = ["npc_a", "npc_b", "npc_c"];

export const names: Record<ActorId, string> = {
  npc_a: "서윤",
  npc_b: "민재",
  npc_c: "하린"
};

export const personas: Record<ActorId, string> = {
  npc_a: "협력형 생존자. 정보를 공유하고 역할을 나누려 하지만, 위험하거나 자원이 부족하면 결정을 미룬다.",
  npc_b: "기회주의 생존자. 먼저 움직여 자원을 선점하려 하고, 협력은 자기 이득이 있을 때 받아들인다.",
  npc_c: "회의적인 전략가. 남의 말을 쉽게 믿지 않고, 관찰 증거와 자원 위치를 근거로 행동하려 한다."
};
