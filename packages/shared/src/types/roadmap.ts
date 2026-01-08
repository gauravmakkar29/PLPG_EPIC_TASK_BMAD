/**
 * @fileoverview Roadmap entity type definitions for PLPG.
 * Defines the roadmap model and module status types.
 *
 * @module @plpg/shared/types/roadmap
 * @description Roadmap domain types for personalized learning paths.
 */

import type { Phase } from './skill';
import type { Skill } from './skill';
import type { Progress } from './progress';

/**
 * Module status enumeration.
 * Represents the current state of a learning module.
 *
 * @constant ModuleStatus
 * @description Lifecycle states for roadmap modules.
 *
 * - locked: Prerequisites not complete
 * - available: Ready to start
 * - in_progress: Currently being studied
 * - completed: Successfully finished
 * - skipped: User chose to skip
 */
export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped';

/**
 * Core roadmap entity representing a user's learning path.
 *
 * @interface Roadmap
 * @description Personalized learning roadmap generated from onboarding.
 *
 * @property {string} id - Unique identifier (UUID)
 * @property {string} userId - Reference to owning user
 * @property {number} weeklyHours - User's weekly time commitment
 * @property {number} totalHours - Total estimated hours for roadmap
 * @property {number} completedHours - Hours of completed content
 * @property {Date} projectedCompletion - Estimated completion date
 * @property {Date} createdAt - Record creation timestamp
 * @property {Date} updatedAt - Last modification timestamp
 */
export interface Roadmap {
  id: string;
  userId: string;
  weeklyHours: number;
  totalHours: number;
  completedHours: number;
  projectedCompletion: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Roadmap with modules relationship.
 *
 * @interface RoadmapWithModules
 * @description Roadmap entity including its modules.
 */
export interface RoadmapWithModules extends Roadmap {
  modules: RoadmapModule[];
}

/**
 * Roadmap module entity representing a single learning unit.
 *
 * @interface RoadmapModule
 * @description A module within a roadmap linked to a skill.
 *
 * @property {string} id - Unique identifier (UUID)
 * @property {string} roadmapId - Reference to parent roadmap
 * @property {string} skillId - Reference to associated skill
 * @property {string | null} resourceId - Optional primary resource
 * @property {Phase} phase - Learning phase this module belongs to
 * @property {number} sequenceOrder - Position in the roadmap
 * @property {ModuleStatus} status - Current module status
 * @property {Date} createdAt - Record creation timestamp
 * @property {Date} updatedAt - Last modification timestamp
 */
export interface RoadmapModule {
  id: string;
  roadmapId: string;
  skillId: string;
  resourceId: string | null;
  phase: Phase;
  sequenceOrder: number;
  status: ModuleStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Roadmap module with related entities.
 *
 * @interface RoadmapModuleWithRelations
 * @description Module including skill and progress data.
 */
export interface RoadmapModuleWithRelations extends RoadmapModule {
  skill: Skill;
  progress: Progress | null;
}

/**
 * Phase summary for roadmap display.
 *
 * @interface PhaseSummary
 * @description Aggregated phase data for UI display.
 */
export interface PhaseSummary {
  phase: Phase;
  name: string;
  totalModules: number;
  completedModules: number;
  status: 'not_started' | 'in_progress' | 'completed';
  modules: RoadmapModuleWithRelations[];
}

/**
 * Complete roadmap response for API.
 *
 * @interface RoadmapResponse
 * @description Full roadmap data structured by phases.
 */
export interface RoadmapResponse {
  id: string;
  weeklyHours: number;
  totalHours: number;
  completedHours: number;
  projectedCompletion: Date;
  phases: PhaseSummary[];
}

/**
 * Roadmap creation input.
 *
 * @interface CreateRoadmapInput
 * @description Data required to generate a new roadmap.
 */
export interface CreateRoadmapInput {
  userId: string;
  weeklyHours: number;
  skillsToSkip: string[];
}

/**
 * Roadmap recalculation input.
 *
 * @interface RecalculateRoadmapInput
 * @description Data for recalculating roadmap timeline.
 */
export interface RecalculateRoadmapInput {
  weeklyHours?: number;
  adjustForProgress?: boolean;
}
