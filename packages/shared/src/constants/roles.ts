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
 * Aligned with Jira Story AIRE-234 requirements.
 *
 * @constant CURRENT_ROLE_NAMES
 */
export const CURRENT_ROLE_NAMES: Record<CurrentRole, string> = {
  backend_developer: 'Backend Developer',
  devops_engineer: 'DevOps Engineer',
  data_analyst: 'Data Analyst',
  qa_engineer: 'QA Engineer',
  it_professional: 'IT Professional',
  other: 'Other',
} as const;

/**
 * Current role descriptions.
 * Provides context for each role option in the onboarding UI.
 *
 * @constant CURRENT_ROLE_DESCRIPTIONS
 */
export const CURRENT_ROLE_DESCRIPTIONS: Record<CurrentRole, string> = {
  backend_developer: 'Building server-side applications and APIs',
  devops_engineer: 'Managing infrastructure and deployment pipelines',
  data_analyst: 'Analyzing data and creating insights',
  qa_engineer: 'Ensuring software quality through testing',
  it_professional: 'Managing IT systems and infrastructure',
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
 * Ordered as per Jira Story AIRE-234 requirements.
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
    value: 'devops_engineer',
    label: CURRENT_ROLE_NAMES.devops_engineer,
    description: CURRENT_ROLE_DESCRIPTIONS.devops_engineer,
  },
  {
    value: 'data_analyst',
    label: CURRENT_ROLE_NAMES.data_analyst,
    description: CURRENT_ROLE_DESCRIPTIONS.data_analyst,
  },
  {
    value: 'qa_engineer',
    label: CURRENT_ROLE_NAMES.qa_engineer,
    description: CURRENT_ROLE_DESCRIPTIONS.qa_engineer,
  },
  {
    value: 'it_professional',
    label: CURRENT_ROLE_NAMES.it_professional,
    description: CURRENT_ROLE_DESCRIPTIONS.it_professional,
  },
  {
    value: 'other',
    label: CURRENT_ROLE_NAMES.other,
    description: CURRENT_ROLE_DESCRIPTIONS.other,
  },
] as const;

/**
 * Target role metadata interface.
 * Defines the structure for role-specific information displayed in onboarding.
 *
 * @interface TargetRoleMetadata
 * @property {number} estimatedHours - Total estimated learning hours for the path
 * @property {string[]} typicalOutcomes - List of typical career outcomes after completion
 * @property {boolean} isAvailable - Whether the path is currently available (MVP: only ML Engineer)
 */
export interface TargetRoleMetadata {
  estimatedHours: number;
  typicalOutcomes: ReadonlyArray<string>;
  isAvailable: boolean;
}

/**
 * Target role metadata with estimated learning hours and typical outcomes.
 * Used in Step 2 of onboarding to display role-specific information.
 *
 * @constant TARGET_ROLE_METADATA
 * @description MVP: Only ml_engineer is available, others show "Coming Soon"
 */
export const TARGET_ROLE_METADATA: Readonly<Record<TargetRole, TargetRoleMetadata>> = {
  ml_engineer: {
    estimatedHours: 300,
    typicalOutcomes: [
      'Design and deploy production ML systems',
      'Build end-to-end ML pipelines',
      'Optimize model performance at scale',
      'Collaborate with cross-functional teams',
    ],
    isAvailable: true,
  },
  data_scientist: {
    estimatedHours: 250,
    typicalOutcomes: [
      'Analyze complex datasets for insights',
      'Build predictive and statistical models',
      'Communicate findings to stakeholders',
      'Drive data-informed decisions',
    ],
    isAvailable: false,
  },
  mlops_engineer: {
    estimatedHours: 280,
    typicalOutcomes: [
      'Automate ML model deployment',
      'Build CI/CD pipelines for ML',
      'Monitor model performance in production',
      'Manage ML infrastructure at scale',
    ],
    isAvailable: false,
  },
  ai_engineer: {
    estimatedHours: 320,
    typicalOutcomes: [
      'Build AI-powered applications',
      'Integrate LLMs and foundation models',
      'Design conversational AI systems',
      'Implement responsible AI practices',
    ],
    isAvailable: false,
  },
} as const;

/**
 * Target role options for onboarding UI.
 * Combines display information with metadata for rendering role cards.
 *
 * @constant TARGET_ROLE_OPTIONS
 */
export const TARGET_ROLE_OPTIONS: ReadonlyArray<{
  value: TargetRole;
  label: string;
  description: string;
  metadata: TargetRoleMetadata;
}> = [
  {
    value: 'ml_engineer',
    label: TARGET_ROLE_NAMES.ml_engineer,
    description: TARGET_ROLE_DESCRIPTIONS.ml_engineer,
    metadata: TARGET_ROLE_METADATA.ml_engineer,
  },
  {
    value: 'data_scientist',
    label: TARGET_ROLE_NAMES.data_scientist,
    description: TARGET_ROLE_DESCRIPTIONS.data_scientist,
    metadata: TARGET_ROLE_METADATA.data_scientist,
  },
  {
    value: 'mlops_engineer',
    label: TARGET_ROLE_NAMES.mlops_engineer,
    description: TARGET_ROLE_DESCRIPTIONS.mlops_engineer,
    metadata: TARGET_ROLE_METADATA.mlops_engineer,
  },
  {
    value: 'ai_engineer',
    label: TARGET_ROLE_NAMES.ai_engineer,
    description: TARGET_ROLE_DESCRIPTIONS.ai_engineer,
    metadata: TARGET_ROLE_METADATA.ai_engineer,
  },
] as const;
