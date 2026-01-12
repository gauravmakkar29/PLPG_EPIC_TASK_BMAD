/**
 * @fileoverview Prerequisite skills constants for PLPG onboarding.
 * Defines the common foundational skills users can indicate proficiency in.
 *
 * @module @plpg/shared/constants/skills
 * @description Prerequisite skill definitions for Step 4 of onboarding.
 *
 * @requirements
 * - AIRE-237: Story 2.5 - Existing Skills Selection
 * - Checkbox list of common prerequisite skills
 * - Brief description of what each skill covers
 *
 * @designPrinciples
 * - SRP: Module only defines skill constant data
 * - OCP: New skills can be added without modifying existing code
 * - DIP: Consumers depend on the interface, not implementation details
 */

/**
 * Prerequisite skill interface for onboarding.
 * Defines the structure for skills displayed in Step 4.
 *
 * @interface PrerequisiteSkill
 * @property {string} id - Unique identifier (UUID format)
 * @property {string} name - Human-readable skill name
 * @property {string} slug - URL-safe identifier
 * @property {string} description - Brief description of what the skill covers
 * @property {string} category - Skill category for grouping (programming, math, tools)
 */
export interface PrerequisiteSkill {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: 'programming' | 'math' | 'tools';
}

/**
 * Prerequisite skill categories enumeration.
 * Groups skills for organized display.
 *
 * @constant SKILL_CATEGORIES
 */
export const SKILL_CATEGORIES = {
  programming: {
    label: 'Programming',
    description: 'Core programming and data skills',
  },
  math: {
    label: 'Mathematics',
    description: 'Mathematical foundations for ML',
  },
  tools: {
    label: 'Tools & Workflows',
    description: 'Development tools and practices',
  },
} as const;

/**
 * Prerequisite skills for ML engineering learning path.
 * Skills that can be skipped if user already has proficiency.
 *
 * @constant PREREQUISITE_SKILLS
 * @description Array of foundational skills for onboarding assessment.
 *
 * @remarks
 * UUIDs are deterministic for database seeding consistency.
 * IDs match the seed data in Prisma for proper skill lookup.
 */
export const PREREQUISITE_SKILLS: ReadonlyArray<PrerequisiteSkill> = [
  {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    name: 'Python Basics',
    slug: 'python-basics',
    description:
      'Variables, data types, control flow, functions, classes, and object-oriented programming fundamentals.',
    category: 'programming',
  },
  {
    id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    name: 'Linear Algebra',
    slug: 'linear-algebra',
    description:
      'Vectors, matrices, matrix operations, eigenvalues/eigenvectors, and linear transformations.',
    category: 'math',
  },
  {
    id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    name: 'Statistics & Probability',
    slug: 'statistics-probability',
    description:
      'Probability distributions, hypothesis testing, confidence intervals, and statistical inference.',
    category: 'math',
  },
  {
    id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    name: 'SQL/Databases',
    slug: 'sql-databases',
    description:
      'SQL queries, joins, aggregations, database design, and working with relational databases.',
    category: 'programming',
  },
  {
    id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    name: 'Git Version Control',
    slug: 'git-version-control',
    description:
      'Basic git commands, branching, merging, pull requests, and collaborative development workflows.',
    category: 'tools',
  },
  {
    id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    name: 'Data Manipulation (Pandas/NumPy)',
    slug: 'data-manipulation',
    description:
      'DataFrames, data cleaning, transformations, array operations, and data analysis with Python libraries.',
    category: 'programming',
  },
  {
    id: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    name: 'Basic Calculus',
    slug: 'basic-calculus',
    description:
      'Derivatives, gradients, partial derivatives, chain rule, and optimization basics for understanding backpropagation.',
    category: 'math',
  },
] as const;

/**
 * Get prerequisite skill by ID.
 * Utility function for skill lookup.
 *
 * @param {string} id - Skill UUID
 * @returns {PrerequisiteSkill | undefined} The skill or undefined if not found
 *
 * @example
 * ```ts
 * const skill = getPrerequisiteSkillById('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d');
 * // { id: '...', name: 'Python Basics', ... }
 * ```
 */
export function getPrerequisiteSkillById(
  id: string
): PrerequisiteSkill | undefined {
  return PREREQUISITE_SKILLS.find((skill) => skill.id === id);
}

/**
 * Get prerequisite skill by slug.
 * Utility function for URL-based skill lookup.
 *
 * @param {string} slug - Skill slug
 * @returns {PrerequisiteSkill | undefined} The skill or undefined if not found
 *
 * @example
 * ```ts
 * const skill = getPrerequisiteSkillBySlug('python-basics');
 * // { id: '...', name: 'Python Basics', ... }
 * ```
 */
export function getPrerequisiteSkillBySlug(
  slug: string
): PrerequisiteSkill | undefined {
  return PREREQUISITE_SKILLS.find((skill) => skill.slug === slug);
}

/**
 * Get skills filtered by category.
 * Returns skills belonging to a specific category.
 *
 * @param {PrerequisiteSkill['category']} category - Category to filter by
 * @returns {PrerequisiteSkill[]} Array of skills in the category
 *
 * @example
 * ```ts
 * const mathSkills = getSkillsByCategory('math');
 * // [{ name: 'Linear Algebra', ... }, { name: 'Statistics & Probability', ... }, ...]
 * ```
 */
export function getSkillsByCategory(
  category: PrerequisiteSkill['category']
): PrerequisiteSkill[] {
  return PREREQUISITE_SKILLS.filter((skill) => skill.category === category);
}

/**
 * Get all prerequisite skill IDs.
 * Useful for validation and "Select All" functionality.
 *
 * @returns {string[]} Array of all skill UUIDs
 *
 * @example
 * ```ts
 * const allIds = getAllPrerequisiteSkillIds();
 * // ['a1b2c3d4-...', 'b2c3d4e5-...', ...]
 * ```
 */
export function getAllPrerequisiteSkillIds(): string[] {
  return PREREQUISITE_SKILLS.map((skill) => skill.id);
}

/**
 * Check if a skill ID is a valid prerequisite skill.
 * Useful for validation.
 *
 * @param {string} id - Skill ID to validate
 * @returns {boolean} True if valid prerequisite skill ID
 *
 * @example
 * ```ts
 * const isValid = isValidPrerequisiteSkillId('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d');
 * // true
 * ```
 */
export function isValidPrerequisiteSkillId(id: string): boolean {
  return PREREQUISITE_SKILLS.some((skill) => skill.id === id);
}
