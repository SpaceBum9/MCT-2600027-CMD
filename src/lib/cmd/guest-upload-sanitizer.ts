export type MediaTransformTag = "grayscale" | "vhs" | "fast_forward" | "sync";

export type GuestUploadInput = {
  source: string;
  payload: Record<string, unknown>;
  transformTags?: readonly MediaTransformTag[];
};

export type GuestUploadResult = {
  status: "ready" | "redacted" | "blocked";
  source: string;
  sanitizedPayload: Record<string, unknown>;
  transformTags: readonly MediaTransformTag[];
  redactedKeys: readonly string[];
  storesCredentials: false;
};

const SENSITIVE_KEY = /(pass(word)?|credential|secret|token|api[_-]?key|auth(orization)?|cookie|ssid[_-]?key|wifi[_-]?key)/i;

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") return sanitizeRecord(value as Record<string, unknown>).sanitized;
  return value;
}

function sanitizeRecord(input: Record<string, unknown>): {
  sanitized: Record<string, unknown>;
  redacted: string[];
} {
  const sanitized: Record<string, unknown> = {};
  const redacted: string[] = [];

  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY.test(key)) {
      sanitized[key] = "[REDACTED]";
      redacted.push(key);
      continue;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = sanitizeRecord(value as Record<string, unknown>);
      sanitized[key] = nested.sanitized;
      redacted.push(...nested.redacted.map((child) => `${key}.${child}`));
      continue;
    }

    sanitized[key] = sanitizeValue(value);
  }

  return { sanitized, redacted };
}

export function sanitizeGuestUpload(input: GuestUploadInput): GuestUploadResult {
  if (!input.source.trim()) {
    return {
      status: "blocked",
      source: input.source,
      sanitizedPayload: {},
      transformTags: input.transformTags ?? [],
      redactedKeys: [],
      storesCredentials: false,
    };
  }

  const { sanitized, redacted } = sanitizeRecord(input.payload);

  return {
    status: redacted.length > 0 ? "redacted" : "ready",
    source: input.source,
    sanitizedPayload: sanitized,
    transformTags: input.transformTags ?? [],
    redactedKeys: redacted,
    storesCredentials: false,
  };
}
