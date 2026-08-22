import { createServerFn } from "@tanstack/react-start";
import {
  connectorConfigFromEnv,
  probeMcpConnectors,
  type McpConnectorSnapshot,
} from "./mcp-connectors";

export const loadMcpConnectorStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<McpConnectorSnapshot> => {
    return probeMcpConnectors(connectorConfigFromEnv());
  },
);
