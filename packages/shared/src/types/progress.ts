/**
 * @fileoverview Progress entity type definitions for PLPG.
 * Defines progress tracking models for learning modules.
 *
 * @module @plpg/shared/types/progress
 * @description Progress domain types for tracking user advancement.
 */

/**
 * Progress entity tracking module completion.
 *
 * @interface Progress
 * @description Tracks user progress on a specific roadmap module.
 *
 * @property {string} id - Unique identifier (UUID)
 * @property {string} moduleId - Reference to roadmap module
 * @property {Date | null} startedAt - When user started the module
 * @property {Date | null} completedAt - When user completed the module
 * @property {number} timeSpentMinutes - Total time spent on module
 * @property {Date} createdAt - Record creation timestamp
 * @property {Date} updatedAt - Last modification timestamp
 */
export interface Progress {
  id: string;
  moduleId: string;
  startedAt: Date | null;
  completedAt: Date | null;
  timeSpentMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Progress summary for dashboard display.
 *
 * @interface ProgressSummary
 * @description Aggregated progress statistics.
 */
export interface ProgressSummary {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  skippedModules: number;
  totalHours: number;
  completedHours: number;
  percentComplete: number;
  currentStreak: number;
  longestStreak: number;
}

/**
 * Phase progress breakdown.
 *
 * @interface PhaseProgress
 * @description Progress statistics per learning phase.
 */
export interface PhaseProgress {
  phase: string;
  phaseName: string;
  totalModules: number;
  completedModules: number;
  percentComplete: number;
  estimatedHoursRemaining: number;
}

/**
 * Weekly progress data point.
 *
 * @interface WeeklyProgress
 * @description Progress data for a specific week.
 */
export interface WeeklyProgress {
  weekStart: Date;
  weekEnd: Date;
  hoursCompleted: number;
  modulesCompleted: number;
  targetHours: number;
}

/**
 * Progress history for analytics.
 *
 * @interface ProgressHistory
 * @description Historical progress data for visualization.
 */
export interface ProgressHistory {
  daily: DailyProgress[];
  weekly: WeeklyProgress[];
  milestones: Milestone[];
}

/**
 * Daily progress data point.
 *
 * @interface DailyProgress
 * @description Progress data for a specific day.
 */
export interface DailyProgress {
  date: Date;
  minutesSpent: number;
  modulesCompleted: number;
}

/**
 * Learning milestone achievement.
 *
 * @interface Milestone
 * @description Represents a notable achievement in the learning journey.
 */
export interface Milestone {
  id: string;
  type: MilestoneType;
  title: string;
  description: string;
  achievedAt: Date;
}

/**
 * Milestone type enumeration.
 *
 * @constant MilestoneType
 * @description Types of achievable milestones.
 */
export type MilestoneType =
  | 'phase_complete'
  | 'streak_7_days'
  | 'streak_30_days'
  | 'first_module'
  | 'halfway'
  | 'roadmap_complete';

/**
 * Start module input.
 *
 * @interface StartModuleInput
 * @description Data for starting a module.
 */
export interface StartModuleInput {
  moduleId: string;
}

/**
 * Complete module input.
 *
 * @interface CompleteModuleInput
 * @description Data for completing a module.
 */
export interface CompleteModuleInput {
  moduleId: string;
  timeSpentMinutes?: number;
}

/**
 * Update progress input.
 *
 * @interface UpdateProgressInput
 * @description Data for updating module progress.
 */
export interface UpdateProgressInput {
  timeSpentMinutes?: number;
}
