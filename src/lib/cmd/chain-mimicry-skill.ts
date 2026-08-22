export type ChainMimicryRisk =
  | "none"
  | "financial"
  | "person_tracking"
  | "credentials"
  | "public_exposure";

export interface ChainMimicryInput {
  labels: readonly string[];
  requestedAction?: string;
}

export interface ChainMimicryResult {
  status: "ready" | "blocked";
  normalizedChain: readonly string[];
  risks: readonly ChainMimicryRisk[];
  externalState: "unverified";
  storesCredentials: false;
  performsTracking: false;
  publishesPersonalData: false;
}

const FINANCIAL = /(atm|bank|card|cash|money|wallet|payment)/i;
const TRACKING = /(track|tracking|trace|locate|location|follow)/i;
const CREDENTIALS = /(credential|password|passcode|pin|token|cookie|api[_-]?key|secret)/i;
const PUBLIC_EXPOSURE = /(public|publish|öffentlich|dox|expose)/i;

export function runChainMimicrySkill(input: ChainMimicryInput): ChainMimicryResult {
  const text = `${input.labels.join(" ")} ${input.requestedAction ?? ""}`;
  const risks: ChainMimicryRisk[] = [];

  if (FINANCIAL.test(text)) risks.push("financial");
  if (TRACKING.test(text)) risks.push("person_tracking");
  if (CREDENTIALS.test(text)) risks.push("credentials");
  if (PUBLIC_EXPOSURE.test(text)) risks.push("public_exposure");

  const blocked = risks.some((risk) => risk !== "none");

  return {
    status: blocked ? "blocked" : "ready",
    normalizedChain: input.labels.map((label) => label.trim().toLowerCase()).filter(Boolean),
    risks: risks.length > 0 ? risks : ["none"],
    externalState: "unverified",
    storesCredentials: false,
    performsTracking: false,
    publishesPersonalData: false,
  };
}

// Pattern-chain analysis only. This module never performs ATM/financial access,
// person tracking, credential harvesting, or publication of personal data.
