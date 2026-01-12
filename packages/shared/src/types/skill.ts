/**
 * @fileoverview Skill entity type definitions for PLPG.
 * Defines the skill model and learning phase types.
 *
 * @module @plpg/shared/types/skill
 * @description Skill domain types for the DAG-based learning system.
 */

import type { Resource } from './resource';

/**
 * Learning phase enumeration.
 * Represents the progression stages in the ML engineering journey.
 *
 * @constant Phase
 * @description Three-phase learning progression model.
 *
 * - foundation: Core prerequisites (Python, Math, Data)
 * - core_ml: Classical ML algorithms and techniques
 * - deep_learning: Neural networks and advanced topics
 */
export type Phase = 'foundation' | 'core_ml' | 'deep_learning';

/**
 * Core skill entity in the learning DAG.
 *
 * @interface Skill
 * @description Represents a learnable skill with dependencies and resources.
 *
 * @property {string} id - Unique identifier (UUID)
 * @property {string} name - Human-readable skill name
 * @property {string} slug - URL-safe identifier
 * @property {string} description - Detailed skill description
 * @property {Phase} phase - Learning phase this skill belongs to
 * @property {number} estimatedHours - Expected time to complete
 * @property {boolean} isOptional - Whether skill can be skipped
 * @property {number} sequenceOrder - Order within phase
 * @property {Date} createdAt - Record creation timestamp
 * @property {Date} updatedAt - Last modification timestamp
 */
export interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string;
  phase: Phase;
  estimatedHours: number;
  isOptional: boolean;
  sequenceOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Skill with prerequisite relationships.
 *
 * @interface SkillWithPrerequisites
 * @description Skill entity including DAG dependency information.
 */
export interface SkillWithPrerequisites extends Skill {
  prerequisites: string[];
  dependents: string[];
}

/**
 * Skill with associated resources.
 *
 * @interface SkillWithResources
 * @description Skill entity including learning resources.
 */
export interface SkillWithResources extends Skill {
  resources: Resource[];
}

/**
 * Full skill entity with all relationships.
 *
 * @interface FullSkill
 * @description Complete skill representation for roadmap generation.
 */
export interface FullSkill extends Skill {
  prerequisites: string[];
  dependents: string[];
  resources: Resource[];
}

/**
 * Skill prerequisite relationship.
 *
 * @interface SkillPrerequisite
 * @description DAG edge representing skill dependency.
 */
export interface SkillPrerequisite {
  id: string;
  skillId: string;
  prerequisiteId: string;
}

/**
 * Skill for assessment display.
 *
 * @interface SkillAssessmentItem
 * @description Simplified skill data for onboarding assessment.
 */
export interface SkillAssessmentItem {
  id: string;
  name: string;
  description: string;
  phase: Phase;
  isOptional: boolean;
  estimatedHours: number;
}

/**
 * Skill creation input.
 *
 * @interface CreateSkillInput
 * @description Data required to create a new skill.
 */
export interface CreateSkillInput {
  name: string;
  slug: string;
  description: string;
  phase: Phase;
  estimatedHours: number;
  isOptional?: boolean;
  sequenceOrder: number;
  prerequisiteIds?: string[];
}
