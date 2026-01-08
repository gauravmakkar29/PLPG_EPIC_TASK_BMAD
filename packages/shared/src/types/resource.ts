/**
 * @fileoverview Resource entity type definitions for PLPG.
 * Defines learning resource types and structures.
 *
 * @module @plpg/shared/types/resource
 * @description Resource domain types for learning materials.
 */

/**
 * Resource type enumeration.
 * Categorizes different types of learning materials.
 *
 * @constant ResourceType
 * @description Types of learning resources available.
 *
 * - video: Video tutorials and courses
 * - documentation: Official docs and references
 * - tutorial: Written tutorials and guides
 * - mini_project: Hands-on coding exercises
 */
export type ResourceType = 'video' | 'documentation' | 'tutorial' | 'mini_project';

/**
 * Resource source enumeration.
 * Identifies the platform/provider of the resource.
 *
 * @constant ResourceSource
 * @description Known resource providers.
 */
export type ResourceSource =
  | 'youtube'
  | 'coursera'
  | 'udemy'
  | 'official_docs'
  | 'medium'
  | 'github'
  | 'kaggle'
  | 'other';

/**
 * Learning resource entity.
 *
 * @interface Resource
 * @description Represents a learning material associated with a skill.
 *
 * @property {string} id - Unique identifier (UUID)
 * @property {string} skillId - Reference to parent skill
 * @property {string} title - Resource title
 * @property {string} url - External URL to the resource
 * @property {ResourceType} type - Type of resource
 * @property {string} source - Source platform
 * @property {number} estimatedMinutes - Expected completion time
 * @property {string | null} description - Optional description
 * @property {number | null} qualityScore - Community rating (1-5)
 * @property {boolean} isRecommended - Whether this is the primary resource
 * @property {boolean} isFree - Whether resource is freely accessible
 * @property {Date | null} verifiedAt - Last verification date
 * @property {Date} createdAt - Record creation timestamp
 * @property {Date} updatedAt - Last modification timestamp
 */
export interface Resource {
  id: string;
  skillId: string;
  title: string;
  url: string;
  type: ResourceType;
  source: string;
  estimatedMinutes: number;
  description: string | null;
  qualityScore: number | null;
  isRecommended: boolean;
  isFree: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resource summary for listing.
 *
 * @interface ResourceSummary
 * @description Condensed resource info for UI display.
 */
export interface ResourceSummary {
  id: string;
  title: string;
  type: ResourceType;
  source: string;
  estimatedMinutes: number;
  isRecommended: boolean;
  isFree: boolean;
}

/**
 * Resource creation input.
 *
 * @interface CreateResourceInput
 * @description Data required to create a new resource.
 */
export interface CreateResourceInput {
  skillId: string;
  title: string;
  url: string;
  type: ResourceType;
  source: string;
  estimatedMinutes: number;
  description?: string;
  isRecommended?: boolean;
  isFree?: boolean;
}

/**
 * Resource click tracking event.
 *
 * @interface ResourceClickEvent
 * @description Analytics event for resource engagement.
 */
export interface ResourceClickEvent {
  resourceId: string;
  userId: string;
  moduleId: string;
  timestamp: Date;
}
