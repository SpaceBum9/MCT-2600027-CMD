export type GrokAdapterStatus = "unconfigured" | "ready" | "error";

export type GrokAdapterSnapshot = {
  provider: "xai";
  model: string | null;
  status: GrokAdapterStatus;
  configured: boolean;
  reachable: boolean;
  detail: string;
};

export type GrokAdapterConfig = {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
};

const DEFAULT_XAI_BASE_URL = "https://api.x.ai/v1";

export function inspectGrokAdapter(config: GrokAdapterConfig = {}): GrokAdapterSnapshot {
  const configured = Boolean(config.apiKey?.trim());

  if (!configured) {
    return {
      provider: "xai",
      model: config.model ?? null,
      status: "unconfigured",
      configured: false,
      reachable: false,
      detail: "xAI credential is not configured outside the repository.",
    };
  }

  return {
    provider: "xai",
    model: config.model ?? null,
    status: "ready",
    configured: true,
    reachable: false,
    detail: "Adapter contract is configured; live reachability has not been probed.",
  };
}

export async function probeGrokAdapter(
  config: GrokAdapterConfig = {},
  fetchImpl: typeof fetch = fetch,
): Promise<GrokAdapterSnapshot> {
  const inspected = inspectGrokAdapter(config);
  if (!inspected.configured) return inspected;

  const baseUrl = (config.baseUrl ?? DEFAULT_XAI_BASE_URL).replace(/\/$/, "");

  try {
    const response = await fetchImpl(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiKey!.trim()}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return {
        ...inspected,
        status: "error",
        reachable: false,
        detail: `xAI probe failed with HTTP ${response.status}.`,
      };
    }

    return {
      ...inspected,
      status: "ready",
      reachable: true,
      detail: "xAI API is reachable via the configured runtime credential.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown probe error";
    return {
      ...inspected,
      status: "error",
      reachable: false,
      detail: `xAI probe failed: ${message}`,
    };
  }
}

export function grokConfigFromEnv(env: NodeJS.ProcessEnv = process.env): GrokAdapterConfig {
  return {
    apiKey: env.XAI_API_KEY,
    model: env.XAI_MODEL,
    baseUrl: env.XAI_BASE_URL,
  };
}
