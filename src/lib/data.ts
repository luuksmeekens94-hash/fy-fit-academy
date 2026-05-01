import "server-only";

import { cache } from "react";

import { ModulePublicationStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { buildCertificateEvidenceAudit } from "@/lib/lms/certificate-backfill";
import type {
  AcademyModule,
  Category,
  DevelopmentDocument,
  LearningGoal,
  LibraryDocument,
  ModuleProgress,
  OnboardingPath,
  OnboardingProgress,
  User,
} from "@/lib/types";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  team: true,
  professionalRegistrationNumber: true,
  title: true,
  location: true,
  bio: true,
  avatarColor: true,
  isActive: true,
  isOnboarding: true,
  buddyId: true,
  teamleaderId: true,
} satisfies Prisma.UserSelect;

const moduleInclude = {
  sections: {
    orderBy: {
      order: "asc",
    },
  },
} satisfies Prisma.ModuleInclude;

const onboardingPathInclude = {
  steps: {
    orderBy: {
      order: "asc",
    },
  },
} satisfies Prisma.OnboardingPathInclude;

function toIsoDate(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : undefined;
}

function mapUser(user: Prisma.UserGetPayload<{ select: typeof userSelect }>): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    team: user.team,
    professionalRegistrationNumber: user.professionalRegistrationNumber,
    title: user.title,
    location: user.location,
    bio: user.bio,
    avatarColor: user.avatarColor,
    isActive: user.isActive,
    isOnboarding: user.isOnboarding,
    buddyId: user.buddyId ?? undefined,
    teamleaderId: user.teamleaderId ?? undefined,
  };
}

function mapCategory(category: { id: string; name: string; icon: string | null; order: number }): Category {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon ?? "",
    order: category.order,
  };
}

function mapModule(
  module: Prisma.ModuleGetPayload<{ include: typeof moduleInclude }>,
): AcademyModule {
  return {
    id: module.id,
    title: module.title,
    description: module.description,
    categoryId: module.categoryId,
    thumbnailLabel: module.thumbnailLabel,
    status: module.status,
    isRequired: module.isRequired,
    estimatedMinutes: module.estimatedMinutes,
    authorId: module.authorId,
    sections: module.sections.map((section) => ({
      id: section.id,
      moduleId: section.moduleId,
      order: section.order,
      title: section.title,
      type: section.type,
      content: section.content,
      quizData: Array.isArray(section.quizData)
        ? (section.quizData as Array<{
            id?: string;
            question: string;
            options: string[];
            correctIndex: number;
            explanation?: string;
          }>).map((question, index) => ({
            id: question.id ?? `${section.id}-${index + 1}`,
            question: question.question,
            options: question.options,
            correctIndex: question.correctIndex,
            explanation: question.explanation ?? "",
          }))
        : undefined,
    })),
  };
}

function mapModuleProgress(progress: {
  id: string;
  userId: string;
  moduleId: string;
  status: import("@prisma/client").ModuleStatus;
  score: number | null;
  startedAt: Date;
  completedAt: Date | null;
}): ModuleProgress {
  return {
    id: progress.id,
    userId: progress.userId,
    moduleId: progress.moduleId,
    status: progress.status,
    score: progress.score ?? undefined,
    startedAt: toIsoDate(progress.startedAt) ?? "",
    completedAt: toIsoDate(progress.completedAt),
  };
}

function mapOnboardingPath(
  path: Prisma.OnboardingPathGetPayload<{ include: typeof onboardingPathInclude }>,
): OnboardingPath {
  return {
    id: path.id,
    name: path.name,
    description: path.description,
    isActive: path.isActive,
    steps: path.steps.map((step) => ({
      id: step.id,
      pathId: step.pathId,
      order: step.order,
      title: step.title,
      description: step.description,
      contentType: step.contentType,
      content: step.content,
      isRequired: step.isRequired,
    })),
  };
}

function mapOnboardingProgress(progress: {
  id: string;
  userId: string;
  stepId: string;
  completed: boolean;
  completedAt: Date | null;
  completedById: string | null;
  notes: string | null;
}): OnboardingProgress {
  return {
    id: progress.id,
    userId: progress.userId,
    stepId: progress.stepId,
    completed: progress.completed,
    completedAt: toIsoDate(progress.completedAt),
    completedById: progress.completedById ?? undefined,
    notes: progress.notes ?? undefined,
  };
}

function mapLearningGoal(goal: {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: import("@prisma/client").LearningGoalStatus;
  targetDate: Date | null;
  updatedAt: Date;
}): LearningGoal {
  return {
    id: goal.id,
    userId: goal.userId,
    title: goal.title,
    description: goal.description,
    status: goal.status,
    targetDate: toIsoDate(goal.targetDate),
    updatedAt: toIsoDate(goal.updatedAt) ?? "",
  };
}

function mapDevelopmentDocument(document: {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  visibility: import("@prisma/client").Visibility;
  updatedAt: Date;
}): DevelopmentDocument {
  return {
    id: document.id,
    userId: document.userId,
    title: document.title,
    description: document.description,
    category: document.category,
    visibility: document.visibility,
    updatedAt: toIsoDate(document.updatedAt) ?? "",
  };
}

function mapDocument(document: {
  id: string;
  title: string;
  type: import("@prisma/client").DocumentType;
  categoryId: string;
  version: string;
  ownerId: string;
  isPublished: boolean;
  updatedAt: Date;
  summary: string;
  content: string;
  tags: string[];
}): LibraryDocument {
  return {
    id: document.id,
    title: document.title,
    type: document.type,
    categoryId: document.categoryId,
    version: document.version,
    ownerId: document.ownerId,
    isPublished: document.isPublished,
    updatedAt: toIsoDate(document.updatedAt) ?? "",
    summary: document.summary,
    content: document.content,
    tags: document.tags,
  };
}

export const getSessionUserById = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user || !user.isActive) {
    return null;
  }

  return mapUser(user);
});

export async function getAuthUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      ...userSelect,
      passwordHash: true,
    },
  });
}

export const getUserById = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  return user ? mapUser(user) : null;
});

export const listUsers = cache(async () => {
  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: userSelect,
  });

  return users.map(mapUser);
});

export const listActiveUsers = cache(async () => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: userSelect,
  });

  return users.map(mapUser);
});

export const listCategories = cache(async () => {
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return categories.map(mapCategory);
});

export const listModules = cache(async (options?: { publishedOnly?: boolean }) => {
  const modules = await prisma.module.findMany({
    where: options?.publishedOnly ? { status: ModulePublicationStatus.GEPUBLICEERD } : undefined,
    include: moduleInclude,
    orderBy: { title: "asc" },
  });

  return modules.map(mapModule);
});

export const getModuleById = cache(async (moduleId: string) => {
  const academyModule = await prisma.module.findUnique({
    where: { id: moduleId },
    include: moduleInclude,
  });

  return academyModule ? mapModule(academyModule) : null;
});

export const getModuleProgressForUser = cache(async (userId: string) => {
  const progress = await prisma.moduleProgress.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
  });

  return progress.map(mapModuleProgress);
});

export const listDocuments = cache(async (options?: { publishedOnly?: boolean }) => {
  const documents = await prisma.document.findMany({
    where: options?.publishedOnly ? { isPublished: true } : undefined,
    orderBy: [{ isPublished: "desc" }, { updatedAt: "desc" }],
  });

  return documents.map(mapDocument);
});

export const getDocumentById = cache(async (documentId: string) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  return document ? mapDocument(document) : null;
});

export const getActiveOnboardingPath = cache(async () => {
  const path = await prisma.onboardingPath.findFirst({
    where: { isActive: true },
    include: onboardingPathInclude,
    orderBy: { name: "asc" },
  });

  return path ? mapOnboardingPath(path) : null;
});

export const listOnboardingPaths = cache(async () => {
  const paths = await prisma.onboardingPath.findMany({
    include: onboardingPathInclude,
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return paths.map(mapOnboardingPath);
});

export const getOnboardingPathById = cache(async (pathId: string) => {
  const path = await prisma.onboardingPath.findUnique({
    where: { id: pathId },
    include: onboardingPathInclude,
  });

  return path ? mapOnboardingPath(path) : null;
});

export const getOnboardingProgressForUser = cache(async (userId: string) => {
  const progress = await prisma.onboardingProgress.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
  });

  return progress.map(mapOnboardingProgress);
});

export const getVisibleDevelopmentDocuments = cache(async (viewerId: string, targetUserId: string) => {
  const [viewer, target, documents] = await Promise.all([
    getUserById(viewerId),
    getUserById(targetUserId),
    prisma.developmentDocument.findMany({
      where: { userId: targetUserId },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  if (!viewer || !target) {
    return [];
  }

  return documents
    .filter((document) => {
      if (viewer.role === "BEHEERDER" || viewer.id === targetUserId) {
        return true;
      }

      return document.visibility === "TEAM" && target.teamleaderId === viewer.id;
    })
    .map(mapDevelopmentDocument);
});

export const getVisibleGoals = cache(async (viewerId: string, targetUserId: string) => {
  const [viewer, target] = await Promise.all([getUserById(viewerId), getUserById(targetUserId)]);

  if (!viewer || !target) {
    return [];
  }

  if (
    viewer.role !== "BEHEERDER" &&
    viewer.id !== targetUserId &&
    target.teamleaderId !== viewer.id
  ) {
    return [];
  }

  const goals = await prisma.learningGoal.findMany({
    where: { userId: targetUserId },
    orderBy: { updatedAt: "desc" },
  });

  return goals.map(mapLearningGoal);
});

export const getTeamMembers = cache(async (teamleaderId: string) => {
  const members = await prisma.user.findMany({
    where: {
      teamleaderId,
      isActive: true,
    },
    orderBy: { name: "asc" },
    select: userSelect,
  });

  return members.map(mapUser);
});

export const getCertificateEvidenceAdminAudit = cache(async () => {
  const certificates = await prisma.certificate.findMany({
    select: {
      id: true,
      participantName: true,
      registrationNumber: true,
      courseTitle: true,
      completedAt: true,
      attemptCount: true,
      evaluationCompleted: true,
      courseVersionNumber: true,
      accreditationRegisterSnapshot: true,
      accreditationKindSnapshot: true,
      issuedAt: true,
      certificateCode: true,
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
    orderBy: { issuedAt: "desc" },
  });

  const audit = buildCertificateEvidenceAudit(certificates);

  return {
    ...audit,
    items: audit.items.map((item) => {
      const certificate = certificates.find((entry) => entry.id === item.certificateId);

      return {
        ...item,
        certificateCode: certificate?.certificateCode ?? item.certificateId,
        participantName: certificate?.participantName ?? certificate?.user.name ?? "Onbekende deelnemer",
        courseTitle: certificate?.courseTitle ?? certificate?.course.title ?? "Onbekende e-learning",
        issuedAt: certificate?.issuedAt ?? null,
      };
    }),
  };
});

export async function getAdminOverview() {
  const [users, categories, modules, documents, goalsCount, developmentDocsCount, paths] =
    await Promise.all([
      listUsers(),
      listCategories(),
      listModules(),
      listDocuments(),
      prisma.learningGoal.count(),
      prisma.developmentDocument.count(),
      listOnboardingPaths(),
    ]);

  return {
    users,
    categories,
    modules,
    documents,
    onboardingPaths: paths,
    metrics: {
      users: users.length,
      modules: modules.length,
      documents: documents.length,
      developmentItems: goalsCount + developmentDocsCount,
    },
  };
}
