/**
 * @fileoverview Check-in entity type definitions for PLPG.
 * Defines daily/weekly check-in models for engagement tracking.
 *
 * @module @plpg/shared/types/checkin
 * @description Check-in domain types for user engagement.
 */

/**
 * Check-in type enumeration.
 * Defines the type of check-in event.
 *
 * @constant CheckInType
 * @description Types of check-in events.
 *
 * - daily: Daily login/activity check-in
 * - weekly: Weekly progress review
 * - milestone: Achievement milestone
 */
export type CheckInType = 'daily' | 'weekly' | 'milestone';

/**
 * Check-in entity.
 *
 * @interface CheckIn
 * @description Tracks user check-in events for streak calculation.
 *
 * @property {string} id - Unique identifier (UUID)
 * @property {string} userId - Reference to user
 * @property {CheckInType} type - Type of check-in
 * @property {Date} checkedInAt - When the check-in occurred
 * @property {object | null} metadata - Additional check-in data
 * @property {Date} createdAt - Record creation timestamp
 */
export interface CheckIn {
  id: string;
  userId: string;
  type: CheckInType;
  checkedInAt: Date;
  metadata: CheckInMetadata | null;
  createdAt: Date;
}

/**
 * Check-in metadata.
 *
 * @interface CheckInMetadata
 * @description Additional data associated with a check-in.
 */
export interface CheckInMetadata {
  moduleId?: string;
  milestoneType?: string;
  notes?: string;
}

/**
 * Check-in streak information.
 *
 * @interface StreakInfo
 * @description User's current and historical streak data.
 */
export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: Date | null;
  totalCheckIns: number;
  streakStartDate: Date | null;
}

/**
 * Weekly check-in summary.
 *
 * @interface WeeklyCheckInSummary
 * @description Summary of check-ins for a specific week.
 */
export interface WeeklyCheckInSummary {
  weekStart: Date;
  weekEnd: Date;
  daysCheckedIn: number;
  checkIns: CheckIn[];
  streakMaintained: boolean;
}

/**
 * Create check-in input.
 *
 * @interface CreateCheckInInput
 * @description Data required to create a check-in.
 */
export interface CreateCheckInInput {
  type?: CheckInType;
  metadata?: CheckInMetadata;
}

/**
 * Check-in response.
 *
 * @interface CheckInResponse
 * @description Response from check-in endpoint.
 */
export interface CheckInResponse {
  checkIn: CheckIn;
  streakInfo: StreakInfo;
  message: string;
}
