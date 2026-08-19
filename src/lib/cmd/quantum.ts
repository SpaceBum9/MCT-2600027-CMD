/** MCT-170021 port: Euclidean sequencer, Zero-Tier ATM, state vector. */
export function iterateRegler(a: number) {
  const b = -Math.tanh(a);
  return { a, b, divergence: Math.abs(a - b) };
}
