import { createHaloAutomaton, openHaloAutomaton } from "./automaton-halo";
import { buildFlowMemory, type FlowStateKind } from "./flow-state-memorizer";
import { sanitizeGuestUpload, type MediaTransformTag } from "./guest-upload-sanitizer";
import { fitSaiSignal } from "./scale-fitter";
import { buildSemanticFrame } from "./semantic-tokenizer";

export type FlowControllerInput = {
  id: string;
  text: string;
  source: string;
  payload?: Record<string, unknown>;
  transformTags?: readonly MediaTransformTag[];
  signal?: {
    value: number;
    confidence: number;
    expectedMin?: number;
    expectedMax?: number;
  };
  stateKind?: FlowStateKind;
  openHalo?: boolean;
};

export type FlowControllerSnapshot = {
  id: string;
  source: string;
  semantic: ReturnType<typeof buildSemanticFrame>;
  upload: ReturnType<typeof sanitizeGuestUpload>;
  signal: ReturnType<typeof fitSaiSignal> | null;
  memory: ReturnType<typeof buildFlowMemory>;
  halo: ReturnType<typeof createHaloAutomaton>;
  externalState: "unverified";
  persistsSecrets: false;
};

export function runFlowController(input: FlowControllerInput): FlowControllerSnapshot {
  const semantic = buildSemanticFrame(input.text);
  const upload = sanitizeGuestUpload({
    source: input.source,
    payload: input.payload ?? {},
    transformTags: input.transformTags,
  });

  const signal = input.signal ? fitSaiSignal(input.signal) : null;
  const confidence = signal?.confidence.fitted ?? (
    semantic.tokens.length > 0
      ? semantic.tokens.reduce((sum, token) => sum + token.confidence, 0) / semantic.tokens.length
      : 0
  );

  const memory = buildFlowMemory([
    {
      id: input.id,
      label: input.text,
      kind: input.stateKind ?? "speculative",
      confidence,
      source: input.source,
    },
  ]);

  const baseHalo = createHaloAutomaton();
  const halo = input.openHalo && memory.accepted.length > 0
    ? openHaloAutomaton(baseHalo)
    : baseHalo;

  return {
    id: input.id,
    source: input.source,
    semantic,
    upload,
    signal,
    memory,
    halo,
    externalState: "unverified",
    persistsSecrets: false,
  };
}

/**
 * Central deterministic MCT flow orchestration.
 * No network I/O, external delivery, secret persistence, or runtime reachability
 * is performed or inferred here.
 */
