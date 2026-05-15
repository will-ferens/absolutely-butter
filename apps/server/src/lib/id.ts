export function generateExperimentId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9))
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `exp_${b64}`
}
