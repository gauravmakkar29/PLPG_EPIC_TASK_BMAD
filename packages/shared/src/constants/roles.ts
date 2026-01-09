/**
 * @fileoverview Role constants for PLPG.
 * Defines current and target role configurations.
 *
 * @module @plpg/shared/constants/roles
 * @description Role constants for onboarding flow.
 */

import type { CurrentRole, TargetRole } from '../types/onboarding';

/**
 * Current role display names.
 *
 * @constant CURRENT_ROLE_NAMES
 */
export const CURRENT_ROLE_NAMES: Record<CurrentRole, string> = {
  backend_developer: 'Backend Developer',
  frontend_developer: 'Frontend Developer',
  fullstack_developer: 'Full Stack Developer',
  data_analyst: 'Data Analyst',
  devops_engineer: 'DevOps Engineer',
  other: 'Other',
} as const;

/**
 * Current role descriptions.
 *
 * @constant CURRENT_ROLE_DESCRIPTIONS
 */
export const CURRENT_ROLE_DESCRIPTIONS: Record<CurrentRole, string> = {
  backend_developer: 'Building server-side applications and APIs',
  frontend_developer: 'Creating user interfaces and client-side applications',
  fullstack_developer: 'Working across the entire application stack',
  data_analyst: 'Analyzing data and creating insights',
  devops_engineer: 'Managing infrastructure and deployment pipelines',
  other: 'A different technical role',
} as const;

/**
 * Target role display names.
 *
 * @constant TARGET_ROLE_NAMES
 */
export const TARGET_ROLE_NAMES: Record<TargetRole, string> = {
  ml_engineer: 'ML Engineer',
  data_scientist: 'Data Scientist',
  mlops_engineer: 'MLOps Engineer',
  ai_engineer: 'AI Engineer',
} as const;

/**
 * Target role descriptions.
 *
 * @constant TARGET_ROLE_DESCRIPTIONS
 */
export const TARGET_ROLE_DESCRIPTIONS: Record<TargetRole, string> = {
  ml_engineer: 'Design and deploy machine learning systems at scale',
  data_scientist: 'Analyze data and build predictive models',
  mlops_engineer: 'Operationalize ML models and manage ML infrastructure',
  ai_engineer: 'Build AI-powered applications and integrate LLMs',
} as const;

/**
 * Current role options for onboarding UI.
 *
 * @constant CURRENT_ROLE_OPTIONS
 */
export const CURRENT_ROLE_OPTIONS: ReadonlyArray<{
  value: CurrentRole;
  label: string;
  description: string;
}> = [
  {
    value: 'backend_developer',
    label: CURRENT_ROLE_NAMES.backend_developer,
    description: CURRENT_ROLE_DESCRIPTIONS.backend_developer,
  },
  {
    value: 'frontend_developer',
    label: CURRENT_ROLE_NAMES.frontend_developer,
    description: CURRENT_ROLE_DESCRIPTIONS.frontend_developer,
  },
  {
    value: 'fullstack_developer',
    label: CURRENT_ROLE_NAMES.fullstack_developer,
    description: CURRENT_ROLE_DESCRIPTIONS.fullstack_developer,
  },
  {
    value: 'data_analyst',
    label: CURRENT_ROLE_NAMES.data_analyst,
    description: CURRENT_ROLE_DESCRIPTIONS.data_analyst,
  },
  {
    value: 'devops_engineer',
    label: CURRENT_ROLE_NAMES.devops_engineer,
    description: CURRENT_ROLE_DESCRIPTIONS.devops_engineer,
  },
  {
    value: 'other',
    label: CURRENT_ROLE_NAMES.other,
    description: CURRENT_ROLE_DESCRIPTIONS.other,
  },
] as const;

/**
 * Target role options for onboarding UI.
 *
 * @constant TARGET_ROLE_OPTIONS
 */
export const TARGET_ROLE_OPTIONS: ReadonlyArray<{
  value: TargetRole;
  label: string;
  description: string;
}> = [
  {
    value: 'ml_engineer',
    label: TARGET_ROLE_NAMES.ml_engineer,
    description: TARGET_ROLE_DESCRIPTIONS.ml_engineer,
  },
  {
    value: 'data_scientist',
    label: TARGET_ROLE_NAMES.data_scientist,
    description: TARGET_ROLE_DESCRIPTIONS.data_scientist,
  },
  {
    value: 'mlops_engineer',
    label: TARGET_ROLE_NAMES.mlops_engineer,
    description: TARGET_ROLE_DESCRIPTIONS.mlops_engineer,
  },
  {
    value: 'ai_engineer',
    label: TARGET_ROLE_NAMES.ai_engineer,
    description: TARGET_ROLE_DESCRIPTIONS.ai_engineer,
  },
] as const;
