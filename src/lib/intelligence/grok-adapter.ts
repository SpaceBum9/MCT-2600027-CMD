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
};

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
