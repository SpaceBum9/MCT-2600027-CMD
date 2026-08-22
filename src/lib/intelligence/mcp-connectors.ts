export type ConnectorStatus = "unconfigured" | "ready" | "error";
export type PhaseShift = "cold" | "linking" | "coupled" | "degraded";

export type ConnectorSnapshot = {
  provider: "github" | "huggingface";
  target: string | null;
  status: ConnectorStatus;
  configured: boolean;
  reachable: boolean;
  detail: string;
};

export type McpConnectorSnapshot = {
  phaseShift: PhaseShift;
  github: ConnectorSnapshot;
  huggingFace: ConnectorSnapshot;
};

export type McpConnectorConfig = {
  githubRepo?: string;
  githubToken?: string;
  huggingFaceRepo?: string;
  huggingFaceToken?: string;
};

function unconfigured(provider: ConnectorSnapshot["provider"], detail: string): ConnectorSnapshot {
  return {
    provider,
    target: null,
    status: "unconfigured",
    configured: false,
    reachable: false,
    detail,
  };
}

export function connectorConfigFromEnv(env: NodeJS.ProcessEnv = process.env): McpConnectorConfig {
  return {
    githubRepo: env.MCT_GITHUB_REPO ?? "SpaceBum9/MCT-2600027-CMD",
    githubToken: env.GITHUB_TOKEN,
    huggingFaceRepo: env.HF_REPO_ID,
    huggingFaceToken: env.HF_TOKEN,
  };
}

export async function probeGitHubConnector(
  config: McpConnectorConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<ConnectorSnapshot> {
  const repo = config.githubRepo?.trim();
  if (!repo) return unconfigured("github", "MCT_GITHUB_REPO is not configured.");

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (config.githubToken?.trim()) headers.Authorization = `Bearer ${config.githubToken.trim()}`;

  try {
    const response = await fetchImpl(`https://api.github.com/repos/${repo}`, {
      headers,
      signal: AbortSignal.timeout(5_000),
    });
    return {
      provider: "github",
      target: repo,
      status: response.ok ? "ready" : "error",
      configured: true,
      reachable: response.ok,
      detail: response.ok ? "GitHub repository is reachable." : `GitHub probe failed with HTTP ${response.status}.`,
    };
  } catch (error) {
    return {
      provider: "github",
      target: repo,
      status: "error",
      configured: true,
      reachable: false,
      detail: `GitHub probe failed: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
}

export async function probeHuggingFaceConnector(
  config: McpConnectorConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<ConnectorSnapshot> {
  const repo = config.huggingFaceRepo?.trim();
  if (!repo) return unconfigured("huggingface", "HF_REPO_ID is not configured.");

  const headers: Record<string, string> = { Accept: "application/json" };
  if (config.huggingFaceToken?.trim()) headers.Authorization = `Bearer ${config.huggingFaceToken.trim()}`;

  try {
    const response = await fetchImpl(`https://huggingface.co/api/models/${repo}`, {
      headers,
      signal: AbortSignal.timeout(5_000),
    });
    return {
      provider: "huggingface",
      target: repo,
      status: response.ok ? "ready" : "error",
      configured: true,
      reachable: response.ok,
      detail: response.ok ? "Hugging Face repository is reachable." : `Hugging Face probe failed with HTTP ${response.status}.`,
    };
  } catch (error) {
    return {
      provider: "huggingface",
      target: repo,
      status: "error",
      configured: true,
      reachable: false,
      detail: `Hugging Face probe failed: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
}

export function derivePhaseShift(github: ConnectorSnapshot, huggingFace: ConnectorSnapshot): PhaseShift {
  if (!github.configured && !huggingFace.configured) return "cold";
  if (github.status === "error" || huggingFace.status === "error") return "degraded";
  if (github.reachable && huggingFace.reachable) return "coupled";
  return "linking";
}

export async function probeMcpConnectors(
  config: McpConnectorConfig = connectorConfigFromEnv(),
  fetchImpl: typeof fetch = fetch,
): Promise<McpConnectorSnapshot> {
  const [github, huggingFace] = await Promise.all([
    probeGitHubConnector(config, fetchImpl),
    probeHuggingFaceConnector(config, fetchImpl),
  ]);

  return {
    phaseShift: derivePhaseShift(github, huggingFace),
    github,
    huggingFace,
  };
}
