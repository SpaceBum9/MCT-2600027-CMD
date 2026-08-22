export type DeviceShortcutSource = "manual" | "shortcut";
export type DeviceShortcutStatus = "blocked" | "prepared" | "ready";

export interface DeviceShortcutInput {
  deviceId: string;
  source: DeviceShortcutSource;
  userApproved: boolean;
  serverEndpoint?: string;
  createdAt: string;
  payload: Record<string, unknown>;
}

export interface DeviceShortcutEnvelope {
  deviceId: string;
  source: DeviceShortcutSource;
  createdAt: string;
  payload: Record<string, unknown>;
  endpointConfigured: boolean;
  status: DeviceShortcutStatus;
  blockedReason?: string;
}

export function prepareDeviceShortcut(
  input: DeviceShortcutInput,
): DeviceShortcutEnvelope {
  const endpointConfigured = Boolean(input.serverEndpoint?.trim());

  if (!input.userApproved) {
    return {
      deviceId: input.deviceId,
      source: input.source,
      createdAt: input.createdAt,
      payload: {},
      endpointConfigured,
      status: "blocked",
      blockedReason: "explicit-user-approval-required",
    };
  }

  return {
    deviceId: input.deviceId,
    source: input.source,
    createdAt: input.createdAt,
    payload: input.payload,
    endpointConfigured,
    status: endpointConfigured ? "ready" : "prepared",
  };
}
