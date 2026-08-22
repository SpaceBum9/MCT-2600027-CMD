export type LimiterStatus = "in_range" | "limited" | "invalid";

export type ScaleFitInput = {
  value: number;
  inputMin: number;
  inputMax: number;
  outputMin?: number;
  outputMax?: number;
};

export type ScaleFitResult = {
  input: number;
  normalized: number;
  fitted: number;
  status: LimiterStatus;
  limited: boolean;
};

export type SaiSignal = {
  value: number;
  confidence: number;
  expectedMin?: number;
  expectedMax?: number;
};

export type SaiFitResult = {
  value: ScaleFitResult;
  confidence: ScaleFitResult;
  drift: number;
  clipped: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function fitScale({
  value,
  inputMin,
  inputMax,
  outputMin = 0,
  outputMax = 1,
}: ScaleFitInput): ScaleFitResult {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(inputMin) ||
    !Number.isFinite(inputMax) ||
    !Number.isFinite(outputMin) ||
    !Number.isFinite(outputMax) ||
    inputMax <= inputMin ||
    outputMax < outputMin
  ) {
    return {
      input: value,
      normalized: 0,
      fitted: outputMin,
      status: "invalid",
      limited: false,
    };
  }

  const normalizedRaw = (value - inputMin) / (inputMax - inputMin);
  const normalized = clamp(normalizedRaw, 0, 1);
  const fitted = outputMin + normalized * (outputMax - outputMin);
  const limited = normalizedRaw !== normalized;

  return {
    input: value,
    normalized,
    fitted,
    status: limited ? "limited" : "in_range",
    limited,
  };
}

export function fitSaiSignal(signal: SaiSignal): SaiFitResult {
  const expectedMin = signal.expectedMin ?? -1;
  const expectedMax = signal.expectedMax ?? 1;
  const value = fitScale({
    value: signal.value,
    inputMin: expectedMin,
    inputMax: expectedMax,
    outputMin: -1,
    outputMax: 1,
  });
  const confidence = fitScale({
    value: signal.confidence,
    inputMin: 0,
    inputMax: 1,
    outputMin: 0,
    outputMax: 1,
  });

  const center = (expectedMin + expectedMax) / 2;
  const halfRange = (expectedMax - expectedMin) / 2;
  const drift = halfRange > 0 ? Math.abs(signal.value - center) / halfRange : 0;

  return {
    value,
    confidence,
    drift,
    clipped: value.limited || confidence.limited,
  };
}

/**
 * Deterministic limiter/scale fitter for MCT SAI/AI signals.
 * It normalizes numeric state and confidence but does not infer truth,
 * medical meaning, network reachability, or external system state.
 */
