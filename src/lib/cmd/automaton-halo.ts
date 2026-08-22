export type AutomatonStasis = "on" | "off";
export type AutomatonGate = "closed" | "opening" | "open";
export type DeliveryState = "prepared" | "delivered" | "failed";

export interface GreetingPayload {
  from: string;
  to: readonly string[];
  message: string;
  delivery: DeliveryState;
}

export interface HaloAutomatonState {
  automatonId: string;
  registered: boolean;
  effect: "halo";
  stasis: AutomatonStasis;
  gate: AutomatonGate;
  greeting: GreetingPayload;
}

export const HALO_AUTOMATON_ID = "mct-halo-automaton";

export function createHaloAutomaton(): HaloAutomatonState {
  return {
    automatonId: HALO_AUTOMATON_ID,
    registered: true,
    effect: "halo",
    stasis: "off",
    gate: "closed",
    greeting: {
      from: "Herr Schneider",
      to: ["Dr. Merklin", "Dr. Müller"],
      message: "Hallo von Herrn Schneider.",
      delivery: "prepared",
    },
  };
}

export function openHaloAutomaton(
  state: HaloAutomatonState,
): HaloAutomatonState {
  if (!state.registered || state.stasis !== "off") return state;

  return {
    ...state,
    gate: "open",
  };
}

export function setHaloStasis(
  state: HaloAutomatonState,
  stasis: AutomatonStasis,
): HaloAutomatonState {
  return {
    ...state,
    stasis,
    gate: stasis === "on" ? "closed" : state.gate,
  };
}

export function markGreetingDelivered(
  state: HaloAutomatonState,
): HaloAutomatonState {
  return {
    ...state,
    greeting: {
      ...state.greeting,
      delivery: "delivered",
    },
  };
}
