/**
 * @fileoverview Database seed script for PLPG.
 * Populates the database with initial data for development and testing.
 *
 * @module @plpg/shared/prisma/seed
 * @description Seeds the database with skills, resources, and test users.
 *
 * @example
 * npm run db:seed
 */

import { PrismaClient, Phase, ResourceType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Hash a password using bcrypt.
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Seed skills for the Backend Dev → ML Engineer learning path.
 */
async function seedSkills() {
  console.log('🌱 Seeding skills...');

  // Foundation Phase Skills
  const foundationSkills = [
    {
      name: 'Python for ML',
      slug: 'python-for-ml',
      description: 'Python programming fundamentals with focus on data structures, OOP, and ML-specific libraries like NumPy and Pandas.',
      phase: Phase.foundation,
      estimatedHours: 20,
      isOptional: false,
      sequenceOrder: 1,
    },
    {
      name: 'Linear Algebra',
      slug: 'linear-algebra',
      description: 'Mathematical foundations including vectors, matrices, eigenvalues, and their applications in ML.',
      phase: Phase.foundation,
      estimatedHours: 15,
      isOptional: false,
      sequenceOrder: 2,
    },
    {
      name: 'Statistics & Probability',
      slug: 'statistics-probability',
      description: 'Probability theory, statistical distributions, hypothesis testing, and Bayesian thinking.',
      phase: Phase.foundation,
      estimatedHours: 15,
      isOptional: false,
      sequenceOrder: 3,
    },
    {
      name: 'Calculus for ML',
      slug: 'calculus-for-ml',
      description: 'Differential calculus, gradients, and optimization concepts essential for understanding ML algorithms.',
      phase: Phase.foundation,
      estimatedHours: 10,
      isOptional: true,
      sequenceOrder: 4,
    },
    {
      name: 'Data Manipulation with Pandas',
      slug: 'pandas-data-manipulation',
      description: 'Data cleaning, transformation, and analysis using Pandas DataFrames.',
      phase: Phase.foundation,
      estimatedHours: 12,
      isOptional: false,
      sequenceOrder: 5,
    },
    {
      name: 'Data Visualization',
      slug: 'data-visualization',
      description: 'Creating insightful visualizations with Matplotlib, Seaborn, and Plotly.',
      phase: Phase.foundation,
      estimatedHours: 8,
      isOptional: false,
      sequenceOrder: 6,
    },
  ];

  // Core ML Phase Skills
  const coreMLSkills = [
    {
      name: 'Supervised Learning',
      slug: 'supervised-learning',
      description: 'Regression and classification algorithms including Linear Regression, Logistic Regression, SVM, and ensemble methods.',
      phase: Phase.core_ml,
      estimatedHours: 25,
      isOptional: false,
      sequenceOrder: 1,
    },
    {
      name: 'Unsupervised Learning',
      slug: 'unsupervised-learning',
      description: 'Clustering (K-Means, DBSCAN), dimensionality reduction (PCA, t-SNE), and anomaly detection.',
      phase: Phase.core_ml,
      estimatedHours: 15,
      isOptional: false,
      sequenceOrder: 2,
    },
    {
      name: 'Model Evaluation & Selection',
      slug: 'model-evaluation',
      description: 'Cross-validation, metrics (accuracy, precision, recall, F1), hyperparameter tuning, and model selection.',
      phase: Phase.core_ml,
      estimatedHours: 12,
      isOptional: false,
      sequenceOrder: 3,
    },
    {
      name: 'Feature Engineering',
      slug: 'feature-engineering',
      description: 'Feature selection, extraction, and transformation techniques to improve model performance.',
      phase: Phase.core_ml,
      estimatedHours: 10,
      isOptional: false,
      sequenceOrder: 4,
    },
    {
      name: 'Scikit-learn Mastery',
      slug: 'scikit-learn',
      description: 'In-depth usage of scikit-learn for building and deploying ML pipelines.',
      phase: Phase.core_ml,
      estimatedHours: 15,
      isOptional: false,
      sequenceOrder: 5,
    },
  ];

  // Deep Learning Phase Skills
  const deepLearningSkills = [
    {
      name: 'Neural Network Fundamentals',
      slug: 'neural-network-fundamentals',
      description: 'Perceptrons, activation functions, backpropagation, and gradient descent optimization.',
      phase: Phase.deep_learning,
      estimatedHours: 20,
      isOptional: false,
      sequenceOrder: 1,
    },
    {
      name: 'PyTorch Fundamentals',
      slug: 'pytorch-fundamentals',
      description: 'Building and training neural networks with PyTorch including tensors, autograd, and nn.Module.',
      phase: Phase.deep_learning,
      estimatedHours: 20,
      isOptional: false,
      sequenceOrder: 2,
    },
    {
      name: 'Convolutional Neural Networks',
      slug: 'cnn',
      description: 'CNN architectures for image classification, object detection, and computer vision tasks.',
      phase: Phase.deep_learning,
      estimatedHours: 20,
      isOptional: false,
      sequenceOrder: 3,
    },
    {
      name: 'Recurrent Neural Networks',
      slug: 'rnn-lstm',
      description: 'RNNs, LSTMs, and GRUs for sequence modeling and natural language processing.',
      phase: Phase.deep_learning,
      estimatedHours: 15,
      isOptional: false,
      sequenceOrder: 4,
    },
    {
      name: 'Transformers & Attention',
      slug: 'transformers',
      description: 'Attention mechanisms, transformer architecture, and applications in NLP and beyond.',
      phase: Phase.deep_learning,
      estimatedHours: 20,
      isOptional: false,
      sequenceOrder: 5,
    },
    {
      name: 'MLOps Basics',
      slug: 'mlops-basics',
      description: 'Model deployment, monitoring, CI/CD for ML, and production best practices.',
      phase: Phase.deep_learning,
      estimatedHours: 15,
      isOptional: true,
      sequenceOrder: 6,
    },
  ];

  const allSkills = [...foundationSkills, ...coreMLSkills, ...deepLearningSkills];

  // Create all skills
  const createdSkills: Record<string, string> = {};
  for (const skill of allSkills) {
    const created = await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: skill,
      create: skill,
    });
    createdSkills[skill.slug] = created.id;
    console.log(`  ✓ Created skill: ${skill.name}`);
  }

  return createdSkills;
}

/**
 * Seed skill prerequisites (DAG structure).
 */
async function seedPrerequisites(skillIds: Record<string, string>) {
  console.log('🔗 Seeding skill prerequisites...');

  const prerequisites = [
    // Foundation dependencies
    { skill: 'pandas-data-manipulation', prerequisite: 'python-for-ml' },
    { skill: 'data-visualization', prerequisite: 'pandas-data-manipulation' },
    { skill: 'calculus-for-ml', prerequisite: 'linear-algebra' },

    // Core ML dependencies
    { skill: 'supervised-learning', prerequisite: 'python-for-ml' },
    { skill: 'supervised-learning', prerequisite: 'linear-algebra' },
    { skill: 'supervised-learning', prerequisite: 'statistics-probability' },
    { skill: 'unsupervised-learning', prerequisite: 'supervised-learning' },
    { skill: 'model-evaluation', prerequisite: 'supervised-learning' },
    { skill: 'feature-engineering', prerequisite: 'pandas-data-manipulation' },
    { skill: 'feature-engineering', prerequisite: 'supervised-learning' },
    { skill: 'scikit-learn', prerequisite: 'supervised-learning' },
    { skill: 'scikit-learn', prerequisite: 'model-evaluation' },

    // Deep Learning dependencies
    { skill: 'neural-network-fundamentals', prerequisite: 'supervised-learning' },
    { skill: 'neural-network-fundamentals', prerequisite: 'calculus-for-ml' },
    { skill: 'pytorch-fundamentals', prerequisite: 'neural-network-fundamentals' },
    { skill: 'cnn', prerequisite: 'pytorch-fundamentals' },
    { skill: 'rnn-lstm', prerequisite: 'pytorch-fundamentals' },
    { skill: 'transformers', prerequisite: 'rnn-lstm' },
    { skill: 'mlops-basics', prerequisite: 'scikit-learn' },
    { skill: 'mlops-basics', prerequisite: 'pytorch-fundamentals' },
  ];

  for (const prereq of prerequisites) {
    const skillId = skillIds[prereq.skill];
    const prerequisiteId = skillIds[prereq.prerequisite];

    if (skillId && prerequisiteId) {
      await prisma.skillPrerequisite.upsert({
        where: {
          skillId_prerequisiteId: { skillId, prerequisiteId },
        },
        update: {},
        create: { skillId, prerequisiteId },
      });
      console.log(`  ✓ ${prereq.skill} requires ${prereq.prerequisite}`);
    }
  }
}

/**
 * Seed sample resources for skills.
 */
async function seedResources(skillIds: Record<string, string>) {
  console.log('📚 Seeding resources...');

  const resources = [
    // Python for ML
    {
      skillSlug: 'python-for-ml',
      title: 'Python for Data Science Handbook',
      url: 'https://jakevdp.github.io/PythonDataScienceHandbook/',
      type: ResourceType.documentation,
      source: 'official_docs',
      estimatedMinutes: 480,
      description: 'Comprehensive guide to Python for data science and ML',
      isRecommended: true,
      isFree: true,
    },
    {
      skillSlug: 'python-for-ml',
      title: 'Corey Schafer Python Tutorial',
      url: 'https://www.youtube.com/playlist?list=PL-osiE80TeTt2d9bfVyTiXJA-UTHn6WwU',
      type: ResourceType.video,
      source: 'youtube',
      estimatedMinutes: 600,
      description: 'Beginner-friendly Python video tutorials',
      isRecommended: false,
      isFree: true,
    },
    // Linear Algebra
    {
      skillSlug: 'linear-algebra',
      title: '3Blue1Brown Linear Algebra Series',
      url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab',
      type: ResourceType.video,
      source: 'youtube',
      estimatedMinutes: 300,
      description: 'Visual and intuitive explanation of linear algebra concepts',
      isRecommended: true,
      isFree: true,
    },
    // Statistics
    {
      skillSlug: 'statistics-probability',
      title: 'StatQuest Statistics Fundamentals',
      url: 'https://www.youtube.com/playlist?list=PLblh5JKOoLUK0FLuzwntyYI10UQFUhsY9',
      type: ResourceType.video,
      source: 'youtube',
      estimatedMinutes: 400,
      description: 'Clear explanations of statistics concepts for ML',
      isRecommended: true,
      isFree: true,
    },
    // Supervised Learning
    {
      skillSlug: 'supervised-learning',
      title: 'Andrew Ng Machine Learning Course',
      url: 'https://www.coursera.org/learn/machine-learning',
      type: ResourceType.tutorial,
      source: 'coursera',
      estimatedMinutes: 900,
      description: 'Classic ML course covering supervised learning algorithms',
      isRecommended: true,
      isFree: false,
    },
    // PyTorch
    {
      skillSlug: 'pytorch-fundamentals',
      title: 'PyTorch Official Tutorials',
      url: 'https://pytorch.org/tutorials/',
      type: ResourceType.documentation,
      source: 'official_docs',
      estimatedMinutes: 600,
      description: 'Official PyTorch tutorials and documentation',
      isRecommended: true,
      isFree: true,
    },
    // Transformers
    {
      skillSlug: 'transformers',
      title: 'Attention Is All You Need Paper',
      url: 'https://arxiv.org/abs/1706.03762',
      type: ResourceType.documentation,
      source: 'other',
      estimatedMinutes: 120,
      description: 'Original transformer paper',
      isRecommended: false,
      isFree: true,
    },
    {
      skillSlug: 'transformers',
      title: 'Hugging Face Transformers Course',
      url: 'https://huggingface.co/learn/nlp-course',
      type: ResourceType.tutorial,
      source: 'other',
      estimatedMinutes: 480,
      description: 'Comprehensive course on using transformers for NLP',
      isRecommended: true,
      isFree: true,
    },
  ];

  for (const resource of resources) {
    const skillId = skillIds[resource.skillSlug];
    if (skillId) {
      await prisma.resource.create({
        data: {
          skillId,
          title: resource.title,
          url: resource.url,
          type: resource.type,
          source: resource.source,
          estimatedMinutes: resource.estimatedMinutes,
          description: resource.description,
          isRecommended: resource.isRecommended,
          isFree: resource.isFree,
        },
      });
      console.log(`  ✓ Created resource: ${resource.title}`);
    }
  }
}

/**
 * Seed test users for development.
 */
async function seedUsers() {
  console.log('👤 Seeding test users...');

  const testUsers = [
    {
      email: 'admin@plpg.local',
      password: 'Admin123!',
      name: 'Admin User',
      role: UserRole.admin,
      emailVerified: true,
    },
    {
      email: 'pro@plpg.local',
      password: 'Pro123!',
      name: 'Pro User',
      role: UserRole.pro,
      emailVerified: true,
    },
    {
      email: 'free@plpg.local',
      password: 'Free123!',
      name: 'Free User',
      role: UserRole.free,
      emailVerified: true,
    },
    {
      email: 'test@plpg.local',
      password: 'Test123!',
      name: 'Test User',
      role: UserRole.free,
      emailVerified: false,
    },
  ];

  for (const user of testUsers) {
    const passwordHash = await hashPassword(user.password);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      create: {
        email: user.email,
        passwordHash,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
    console.log(`  ✓ Created user: ${user.email} (${user.role})`);
  }
}

/**
 * Main seed function.
 */
async function main() {
  console.log('🚀 Starting database seed...\n');

  try {
    // Seed skills
    const skillIds = await seedSkills();

    // Seed prerequisites (DAG structure)
    await seedPrerequisites(skillIds);

    // Seed resources
    await seedResources(skillIds);

    // Seed test users
    await seedUsers();

    console.log('\n✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
