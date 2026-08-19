export const PROJECT_ID = "MCT-2600027-CMD";
export const GH_OWNER = "SpaceBum9";
export const GH_REPO = "MCT-2600027-CMD";
export const GH_URL = `https://github.com/${GH_OWNER}/${GH_REPO}`;

export const DEPARTMENTS = [
  { id: "hal", title: "HAL", path: "/", summary: "Kommando.", group: "kern" },
  { id: "agents", title: "Agents", path: "/agents", summary: "Orchestrator.", group: "kern" },
  { id: "tracer", title: "TracerHubs", path: "/tracer", summary: "Zero-Tier Quantum.", group: "netz" },
  { id: "tunnel", title: "Tunnel", path: "/tunnel", summary: "Cloudflare.", group: "netz" },
  { id: "updater", title: "Updater", path: "/update", summary: "Systemzyklus.", group: "ops" },
  { id: "skills", title: "Skills", path: "/skills", summary: "LLM-Fusion.", group: "ops" },
  { id: "flow", title: "Flow", path: "/flow", summary: "BILO 2026.", group: "kern" },
  { id: "codex", title: "Codex", path: "/codex", summary: "GitHub Agent.", group: "ops" },
  { id: "lumen", title: "Lumen", path: "/write", summary: "iOS.", group: "produkt" },
] as const;

export type DepartmentId = (typeof DEPARTMENTS)[number]["id"];

export const SAI_ROUTE = ["Quelle", "Crystal Mike", "HAL", "Zielknoten", "Reinforcement"] as const;
