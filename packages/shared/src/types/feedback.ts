/**
 * @fileoverview Feedback entity type definitions for PLPG.
 * Defines user feedback models for modules and resources.
 *
 * @module @plpg/shared/types/feedback
 * @description Feedback domain types for user ratings and comments.
 */

/**
 * Feedback entity.
 *
 * @interface Feedback
 * @description User feedback on a completed module.
 *
 * @property {string} id - Unique identifier (UUID)
 * @property {string} userId - Reference to user
 * @property {string} moduleId - Reference to roadmap module
 * @property {number} rating - Rating score (1-5)
 * @property {string | null} comment - Optional text feedback
 * @property {Date} createdAt - Record creation timestamp
 */
export interface Feedback {
  id: string;
  userId: string;
  moduleId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

/**
 * Feedback with module relationship.
 *
 * @interface FeedbackWithModule
 * @description Feedback including module details.
 */
export interface FeedbackWithModule extends Feedback {
  module: {
    id: string;
    skillId: string;
    skillName: string;
  };
}

/**
 * Feedback summary for a skill.
 *
 * @interface FeedbackSummary
 * @description Aggregated feedback statistics.
 */
export interface FeedbackSummary {
  skillId: string;
  totalRatings: number;
  averageRating: number;
  ratingDistribution: RatingDistribution;
}

/**
 * Rating distribution breakdown.
 *
 * @interface RatingDistribution
 * @description Count of each rating level.
 */
export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

/**
 * Create feedback input.
 *
 * @interface CreateFeedbackInput
 * @description Data required to submit feedback.
 */
export interface CreateFeedbackInput {
  moduleId: string;
  rating: number;
  comment?: string;
}

/**
 * Feedback response for API.
 *
 * @interface FeedbackResponse
 * @description Feedback data for client display.
 */
export interface FeedbackResponse {
  feedback: Feedback;
  message: string;
}
