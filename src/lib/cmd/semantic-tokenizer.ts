export type SemanticTokenKind =
  | "literal"
  | "platform"
  | "financial"
  | "person_label"
  | "body"
  | "control"
  | "symbolic";

export interface SemanticToken {
  raw: string;
  normalized: string;
  kind: SemanticTokenKind;
  confidence: number;
  externalFact: false;
}

const PLATFORM = new Set(["tiktok", "tiktoker", "huggingface", "hugging", "face"]);
const FINANCIAL = new Set(["money", "cash", "coin"]);
const BODY = new Set(["psychosomatisch", "tromboe", "sister"]);
const CONTROL = new Set(["control", "controller", "tokenizer", "rc", "pusher"]);

export function classifyToken(raw: string): SemanticToken {
  const normalized = raw.trim().toLowerCase();
  let kind: SemanticTokenKind = "symbolic";

  if (PLATFORM.has(normalized)) kind = "platform";
  else if (FINANCIAL.has(normalized)) kind = "financial";
  else if (BODY.has(normalized)) kind = "body";
  else if (CONTROL.has(normalized)) kind = "control";
  else if (/^(mr|herr|doktor|dr)$/i.test(raw)) kind = "person_label";
  else if (/^[a-z0-9_-]+$/i.test(raw)) kind = "literal";

  return {
    raw,
    normalized,
    kind,
    confidence: kind === "symbolic" ? 0.4 : 0.8,
    externalFact: false,
  };
}

export function tokenizeSemanticInput(input: string): SemanticToken[] {
  return input
    .split(/\s+/)
    .map((token) => token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}_-]+$/gu, ""))
    .filter(Boolean)
    .map(classifyToken);
}

export interface SemanticFrame {
  tokens: SemanticToken[];
  unresolved: string[];
  mode: "rc-semantic";
  claimsExternalState: false;
}

export function buildSemanticFrame(input: string): SemanticFrame {
  const tokens = tokenizeSemanticInput(input);
  return {
    tokens,
    unresolved: tokens.filter((token) => token.kind === "symbolic").map((token) => token.raw),
    mode: "rc-semantic",
    claimsExternalState: false,
  };
}
