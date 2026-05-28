import { randomBytes } from 'node:crypto'

export function generateExperimentId(): string {
  return `exp_${randomBytes(9).toString('base64url')}`
}
