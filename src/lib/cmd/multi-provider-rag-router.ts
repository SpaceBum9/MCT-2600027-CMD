export type ProviderLabel = "gemini" | "grok" | "suno" | "gpt" | "meta" | "telegram";

export type ProviderState = "label_only" | "prepared" | "verified" | "failed";

export interface TraceNode {
  traceId: string;
  parentTraceId?: string;
  provider?: ProviderLabel;
  threadId: string;
  ownerLabel?: string;
  source: "input" | "rag" | "teleprompter" | "command_bot";
  state: ProviderState;
}

export interface RagChunk {
  id: string;
  text: string;
  provenance: string;
  confidence: number;
}

export interface TeleprompterCommand {
  traceId: string;
  threadId: string;
  target: ProviderLabel;
  prompt: string;
  delivery: "prepared" | "delivered" | "failed";
}

export interface MultiProviderSnapshot {
  trace: TraceNode[];
  rag: RagChunk[];
  commands: TeleprompterCommand[];
  providers: Record<ProviderLabel, ProviderState>;
  externalDeliveryVerified: boolean;
  personTracking: false;
}

const PROVIDERS: readonly ProviderLabel[] = [
  "gemini",
  "grok",
  "suno",
  "gpt",
  "meta",
  "telegram",
];

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function buildProviderState(
  overrides: Partial<Record<ProviderLabel, ProviderState>> = {},
): Record<ProviderLabel, ProviderState> {
  return Object.fromEntries(
    PROVIDERS.map((provider) => [provider, overrides[provider] ?? "label_only"]),
  ) as Record<ProviderLabel, ProviderState>;
}

export function normalizeRagChunk(chunk: RagChunk): RagChunk {
  return {
    ...chunk,
    text: chunk.text.trim(),
    provenance: chunk.provenance.trim(),
    confidence: clamp01(chunk.confidence),
  };
}

export function traceBack(
  trace: readonly TraceNode[],
  traceId: string,
): TraceNode[] {
  const byId = new Map(trace.map((node) => [node.traceId, node]));
  const path: TraceNode[] = [];
  const seen = new Set<string>();
  let current = byId.get(traceId);

  while (current && !seen.has(current.traceId)) {
    path.push(current);
    seen.add(current.traceId);
    current = current.parentTraceId ? byId.get(current.parentTraceId) : undefined;
  }

  return path;
}

export function prepareTeleprompterCommand(input: {
  traceId: string;
  threadId: string;
  target: ProviderLabel;
  prompt: string;
}): TeleprompterCommand {
  return {
    ...input,
    prompt: input.prompt.trim(),
    delivery: "prepared",
  };
}

export function buildMultiProviderSnapshot(input: {
  trace?: readonly TraceNode[];
  rag?: readonly RagChunk[];
  commands?: readonly TeleprompterCommand[];
  providerStates?: Partial<Record<ProviderLabel, ProviderState>>;
}): MultiProviderSnapshot {
  const commands = [...(input.commands ?? [])];
  const externalDeliveryVerified = commands.some((command) => command.delivery === "delivered");

  return {
    trace: [...(input.trace ?? [])],
    rag: (input.rag ?? []).map(normalizeRagChunk),
    commands,
    providers: buildProviderState(input.providerStates),
    externalDeliveryVerified,
    personTracking: false,
  };
}

// This module models provider labels, RAG provenance, deterministic threading,
// and internal trace ancestry only. It does not track people/devices, ingest
// private account data, or claim Gemini/Grok/Suno/Meta/Telegram delivery unless
// an external connector independently verifies it.
