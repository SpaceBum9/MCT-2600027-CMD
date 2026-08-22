import { createServerFn } from "@tanstack/react-start";
import {
  grokConfigFromEnv,
  probeGrokAdapter,
  type GrokAdapterSnapshot,
} from "./grok-adapter";

export const loadGrokStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<GrokAdapterSnapshot> => {
    return probeGrokAdapter(grokConfigFromEnv());
  },
);
