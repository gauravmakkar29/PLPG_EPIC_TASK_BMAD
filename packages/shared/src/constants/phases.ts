/**
 * @fileoverview Learning phase constants for PLPG.
 * Defines phase-related constants and metadata.
 *
 * @module @plpg/shared/constants/phases
 * @description Phase constants for the learning journey.
 */

import type { Phase } from '../types/skill';

/**
 * Phase display names.
 * Human-readable names for each learning phase.
 *
 * @constant PHASE_NAMES
 */
export const PHASE_NAMES: Record<Phase, string> = {
  foundation: 'Foundation',
  core_ml: 'Core ML',
  deep_learning: 'Deep Learning',
} as const;

/**
 * Phase descriptions.
 * Detailed descriptions for each learning phase.
 *
 * @constant PHASE_DESCRIPTIONS
 */
export const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  foundation: 'Build essential programming and math foundations for ML',
  core_ml: 'Master classical machine learning algorithms and techniques',
  deep_learning: 'Explore neural networks and advanced deep learning topics',
} as const;

/**
 * Phase order.
 * Sequence order for displaying phases.
 *
 * @constant PHASE_ORDER
 */
export const PHASE_ORDER: readonly Phase[] = [
  'foundation',
  'core_ml',
  'deep_learning',
] as const;

/**
 * Phase colors for UI.
 * Tailwind CSS color classes for each phase.
 *
 * @constant PHASE_COLORS
 */
export const PHASE_COLORS: Record<Phase, { bg: string; text: string; border: string }> = {
  foundation: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
  },
  core_ml: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
  },
  deep_learning: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
  },
} as const;

/**
 * Phase icons.
 * Icon names (Lucide icons) for each phase.
 *
 * @constant PHASE_ICONS
 */
export const PHASE_ICONS: Record<Phase, string> = {
  foundation: 'Blocks',
  core_ml: 'Brain',
  deep_learning: 'Cpu',
} as const;

/**
 * Phase metadata.
 * Complete metadata for each learning phase.
 *
 * @interface PhaseMetadata
 */
export interface PhaseMetadata {
  id: Phase;
  name: string;
  description: string;
  order: number;
  colors: { bg: string; text: string; border: string };
  icon: string;
}

/**
 * Get metadata for all phases.
 *
 * @function getPhaseMetadata
 * @returns {PhaseMetadata[]} Array of phase metadata objects
 */
export function getPhaseMetadata(): PhaseMetadata[] {
  return PHASE_ORDER.map((phase, index) => ({
    id: phase,
    name: PHASE_NAMES[phase],
    description: PHASE_DESCRIPTIONS[phase],
    order: index,
    colors: PHASE_COLORS[phase],
    icon: PHASE_ICONS[phase],
  }));
}

/**
 * Get metadata for a specific phase.
 *
 * @function getPhaseById
 * @param {Phase} phase - The phase identifier
 * @returns {PhaseMetadata} Phase metadata object
 */
export function getPhaseById(phase: Phase): PhaseMetadata {
  const index = PHASE_ORDER.indexOf(phase);
  return {
    id: phase,
    name: PHASE_NAMES[phase],
    description: PHASE_DESCRIPTIONS[phase],
    order: index,
    colors: PHASE_COLORS[phase],
    icon: PHASE_ICONS[phase],
  };
}
