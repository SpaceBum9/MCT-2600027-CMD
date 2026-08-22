export type VerificationDomain =
  | "brainstem"
  | "hypothalamus"
  | "insula"
  | "cingulate"
  | "somatosensory"
  | "limbic"
  | "prefrontal";

export type BodySignal = {
  id: string;
  organ: string;
  metric: string;
  observed: number;
  expected: number;
  tolerance: number;
};

export type VerificationNode = {
  id: VerificationDomain;
  label: string;
  responsibilities: readonly string[];
};

export type VerificationResult = {
  signalId: string;
  organ: string;
  metric: string;
  delta: number;
  normalizedError: number;
  inRange: boolean;
  checkedBy: VerificationDomain[];
};

export const VERIFICATION_NODES: readonly VerificationNode[] = [
  {
    id: "brainstem",
    label: "Brainstem",
    responsibilities: ["breathing", "heart-rate", "blood-pressure", "protective-reflexes"],
  },
  {
    id: "hypothalamus",
    label: "Hypothalamus",
    responsibilities: ["temperature", "thirst", "hunger", "energy-balance", "endocrine-control"],
  },
  {
    id: "insula",
    label: "Insula",
    responsibilities: ["interoception", "visceral-state", "breath-awareness", "nausea", "internal-tension"],
  },
  {
    id: "cingulate",
    label: "Anterior cingulate",
    responsibilities: ["salience", "pain", "conflict", "action-priority"],
  },
  {
    id: "somatosensory",
    label: "Somatosensory cortex",
    responsibilities: ["touch", "pressure", "pain", "proprioception"],
  },
  {
    id: "limbic",
    label: "Limbic systems",
    responsibilities: ["threat-value", "emotion", "learned-significance"],
  },
  {
    id: "prefrontal",
    label: "Prefrontal cortex",
    responsibilities: ["context", "inhibition", "reappraisal", "decision-control"],
  },
] as const;

const ROUTING_RULES: Readonly<Record<string, readonly VerificationDomain[]>> = {
  breathing: ["brainstem", "insula", "cingulate", "prefrontal"],
  "heart-rate": ["brainstem", "insula", "cingulate", "limbic"],
  "blood-pressure": ["brainstem", "hypothalamus", "insula"],
  temperature: ["hypothalamus", "insula"],
  thirst: ["hypothalamus", "insula", "prefrontal"],
  hunger: ["hypothalamus", "insula", "limbic", "prefrontal"],
  pain: ["somatosensory", "insula", "cingulate", "limbic", "prefrontal"],
  proprioception: ["somatosensory", "prefrontal"],
};

export function verificationRoute(metric: string): VerificationDomain[] {
  return [...(ROUTING_RULES[metric] ?? ["insula", "prefrontal"])];
}

export function verifyBodySignal(signal: BodySignal): VerificationResult {
  const tolerance = Math.max(Math.abs(signal.tolerance), Number.EPSILON);
  const delta = signal.observed - signal.expected;
  const normalizedError = Math.abs(delta) / tolerance;

  return {
    signalId: signal.id,
    organ: signal.organ,
    metric: signal.metric,
    delta,
    normalizedError,
    inRange: normalizedError <= 1,
    checkedBy: verificationRoute(signal.metric),
  };
}

export function verifyInternalState(signals: readonly BodySignal[]) {
  const results = signals.map(verifyBodySignal);
  const outOfRange = results.filter((result) => !result.inRange);

  return {
    signalCount: results.length,
    inRangeCount: results.length - outOfRange.length,
    outOfRangeCount: outOfRange.length,
    results,
  };
}

// Conceptual systems model only. It is not a diagnostic or clinical decision engine.
