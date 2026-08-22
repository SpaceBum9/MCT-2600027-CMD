export type ScrapeCopterStatus = "blocked" | "ready" | "invalid";

export interface ScrapeCopterRequest {
  url: string;
  allowHosts: readonly string[];
  minIntervalMs?: number;
}

export interface ScrapeCopterDecision {
  status: ScrapeCopterStatus;
  host: string | null;
  reason: string | null;
  provenance: {
    source: string;
    mode: "explicit-http-source";
  } | null;
}

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^\[?::1\]?$/,
];

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

export function authorizeScrapeCopter(
  request: ScrapeCopterRequest,
): ScrapeCopterDecision {
  let parsed: URL;
  try {
    parsed = new URL(request.url);
  } catch {
    return { status: "invalid", host: null, reason: "invalid-url", provenance: null };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return {
      status: "blocked",
      host: parsed.hostname || null,
      reason: "unsupported-protocol",
      provenance: null,
    };
  }

  if (parsed.username || parsed.password) {
    return {
      status: "blocked",
      host: parsed.hostname,
      reason: "embedded-credentials-not-allowed",
      provenance: null,
    };
  }

  if (isPrivateHost(parsed.hostname)) {
    return {
      status: "blocked",
      host: parsed.hostname,
      reason: "private-network-target-not-allowed",
      provenance: null,
    };
  }

  const allowed = request.allowHosts.some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
  );

  if (!allowed) {
    return {
      status: "blocked",
      host: parsed.hostname,
      reason: "host-not-allowlisted",
      provenance: null,
    };
  }

  const minIntervalMs = request.minIntervalMs ?? 2_000;
  if (!Number.isFinite(minIntervalMs) || minIntervalMs < 500) {
    return {
      status: "blocked",
      host: parsed.hostname,
      reason: "rate-limit-too-aggressive",
      provenance: null,
    };
  }

  return {
    status: "ready",
    host: parsed.hostname,
    reason: null,
    provenance: {
      source: parsed.toString(),
      mode: "explicit-http-source",
    },
  };
}
