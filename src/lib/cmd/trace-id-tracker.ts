export type TraceStatus = "valid" | "invalid" | "ambiguous";

export type TraceTokenKind =
  | "control"
  | "financial"
  | "location"
  | "platform"
  | "person_label"
  | "symbolic";

export interface TraceToken {
  raw: string;
  normalized: string;
  kind: TraceTokenKind;
  externalFact: false;
}

export interface BurdenSignalInput {
  value: number;
  expectedMin?: number;
  expectedMax?: number;
}

export interface BurdenValidation {
  input: number;
  normalized: number;
  status: "in_range" | "limited" | "invalid";
  operationalOnly: true;
  medicalInference: false;
}

export interface TraceEnvelope {
  traceId: string;
  status: TraceStatus;
  tokens: TraceToken[];
  burden?: BurdenValidation;
  unresolved: string[];
  claimsExternalState: false;
}

const FINANCIAL = new Set(["dkb", "money", "broker", "atm"]);
const LOCATION = new Set(["berlin", "bielefeld"]);
const PLATFORM = new Set(["grok"]);
const CONTROL = new Set(["trace", "tracker", "vector", "vectoris", "gru", "sos", "imperativ", "impergator"]);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function validateBurdenSignal(input: BurdenSignalInput): BurdenValidation {
  const min = input.expectedMin ?? 0;
  const max = input.expectedMax ?? 1;

  if (!Number.isFinite(input.value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return {
      input: input.value,
      normalized: 0,
      status: "invalid",
      operationalOnly: true,
      medicalInference: false,
    };
  }

  const raw = (input.value - min) / (max - min);
  const normalized = clamp(raw, 0, 1);

  return {
    input: input.value,
    normalized,
    status: raw === normalized ? "in_range" : "limited",
    operationalOnly: true,
    medicalInference: false,
  };
}

export function classifyTraceToken(raw: string): TraceToken {
  const normalized = raw.trim().toLowerCase();
  let kind: TraceTokenKind = "symbolic";

  if (FINANCIAL.has(normalized)) kind = "financial";
  else if (LOCATION.has(normalized)) kind = "location";
  else if (PLATFORM.has(normalized)) kind = "platform";
  else if (CONTROL.has(normalized)) kind = "control";
  else if (/^(herr|mr|dr|doktor)$/i.test(raw)) kind = "person_label";

  return { raw, normalized, kind, externalFact: false };
}

export function buildTraceEnvelope(input: {
  traceId: string;
  statement: string;
  burden?: BurdenSignalInput;
}): TraceEnvelope {
  const traceId = input.traceId.trim();
  const tokens = input.statement
    .split(/\s+/)
    .map((token) => token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}_-]+$/gu, ""))
    .filter(Boolean)
    .map(classifyTraceToken);

  const unresolved = tokens
    .filter((token) => token.kind === "symbolic")
    .map((token) => token.raw);

  const validTraceId = /^[A-Za-z0-9][A-Za-z0-9._:-]{5,127}$/.test(traceId);

  return {
    traceId,
    status: !validTraceId ? "invalid" : unresolved.length > 0 ? "ambiguous" : "valid",
    tokens,
    burden: input.burden ? validateBurdenSignal(input.burden) : undefined,
    unresolved,
    claimsExternalState: false,
  };
}

// Pure validation only: no account access, person tracking, bank lookup,
// medical inference, or external delivery/reachability claims.
