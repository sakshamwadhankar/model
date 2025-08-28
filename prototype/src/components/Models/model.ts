// src/components/Models/model.ts

// Props accepted by each 3D model component
export interface ModelProps {
  /** Set color of the interior */
  interior: string
  /** Set color of the exterior */
  exterior: string
  /** Show / hide this model in the scene */
  visible?: boolean
  // NOTE: Do NOT add `key` here — React treats `key` as a special prop and it
  // is not available inside component props. See React docs.
}

// Single source of truth for available model names
export const models = ['ARCHON'] as const
export type Model = (typeof models)[number]
