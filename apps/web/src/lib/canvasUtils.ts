/** Yield to the main thread to prevent blocking the UI during heavy computation. */
export function yieldToMain(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}
