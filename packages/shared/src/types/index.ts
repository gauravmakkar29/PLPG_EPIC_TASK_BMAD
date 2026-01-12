/**
 * @fileoverview Types barrel file for PLPG shared package.
 * Re-exports all type definitions for external consumption.
 *
 * @module @plpg/shared/types
 * @description Central export point for all domain types.
 */

// User types
export type {
  User,
  UserProfile,
  UserSession,
  CreateUserInput,
  UpdateUserInput,
} from './user';

// Authentication types
export type {
  UserRole,
  AuthTokenPayload,
  RefreshTokenPayload,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AuthUser,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ChangePasswordRequest,
  SessionInfo,
} from './auth';

// Onboarding types
export type {
  OnboardingResponse,
  CurrentRole,
  TargetRole,
  WeeklyHoursOption,
  OnboardingStep1Data,
  OnboardingStep2Data,
  OnboardingStep3Data,
  OnboardingStep4Data,
  CompleteOnboardingInput,
  OnboardingStatus,
} from './onboarding';

// Skill types
export type {
  Phase,
  Skill,
  SkillWithPrerequisites,
  SkillWithResources,
  FullSkill,
  SkillPrerequisite,
  SkillAssessmentItem,
  CreateSkillInput,
} from './skill';

// Resource types
export type {
  ResourceType,
  ResourceSource,
  Resource,
  ResourceSummary,
  CreateResourceInput,
  ResourceClickEvent,
} from './resource';

// Roadmap types
export type {
  ModuleStatus,
  Roadmap,
  RoadmapWithModules,
  RoadmapModule,
  RoadmapModuleWithRelations,
  PhaseSummary,
  RoadmapResponse,
  CreateRoadmapInput,
  RecalculateRoadmapInput,
} from './roadmap';

// Progress types
export type {
  Progress,
  ProgressSummary,
  PhaseProgress,
  WeeklyProgress,
  ProgressHistory,
  DailyProgress,
  Milestone,
  MilestoneType,
  StartModuleInput,
  CompleteModuleInput,
  UpdateProgressInput,
} from './progress';

// Subscription types
export type {
  SubscriptionPlan,
  SubscriptionStatus,
  Subscription,
  SubscriptionWithUser,
  PlanFeatures,
  PlanLimitations,
  SubscriptionResponse,
  UpgradeSubscriptionInput,
  CancelSubscriptionInput,
} from './subscription';

// Check-in types
export type {
  CheckInType,
  CheckIn,
  CheckInMetadata,
  StreakInfo,
  WeeklyCheckInSummary,
  CreateCheckInInput,
  CheckInResponse,
} from './checkin';

// Feedback types
export type {
  Feedback,
  FeedbackWithModule,
  FeedbackSummary,
  RatingDistribution,
  CreateFeedbackInput,
  FeedbackResponse,
} from './feedback';

// Error types
export type { ErrorCode, ApiErrorResponse } from './errors';
export {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from './errors';
