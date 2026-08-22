export type FlowStateKind = "confirmed" | "speculative" | "rejected";

export interface FlowStateInput {
  id: string;
  label: string;
  kind: FlowStateKind;
  confidence?: number;
  source?: string;
}

export interface FlowStateSnapshot extends FlowStateInput {
  confidence: number;
  accepted: boolean;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function memorizeFlowState(input: FlowStateInput): FlowStateSnapshot {
  const confidence = clamp01(input.confidence ?? (input.kind === "confirmed" ? 1 : 0.5));
  const accepted = input.kind === "confirmed" && confidence >= 0.75;

  return {
    ...input,
    confidence,
    accepted,
  };
}

export function buildFlowMemory(inputs: readonly FlowStateInput[]): {
  accepted: FlowStateSnapshot[];
  speculative: FlowStateSnapshot[];
  rejected: FlowStateSnapshot[];
} {
  const states = inputs.map(memorizeFlowState);

  return {
    accepted: states.filter((state) => state.accepted),
    speculative: states.filter((state) => state.kind === "speculative"),
    rejected: states.filter((state) => state.kind === "rejected" || (state.kind === "confirmed" && !state.accepted)),
  };
}

// Deterministic in-process state shaping only. This module does not persist
// personal memory, infer external facts, or claim runtime delivery/reachability.
