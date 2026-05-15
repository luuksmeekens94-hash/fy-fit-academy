import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type AudienceProfile, type Role } from "@prisma/client";
import { config } from "dotenv";

import { hashPassword } from "../../../src/lib/password";

config({ path: ".env.local" });
config();

export type E2EAccount = {
  email: string;
  password: string;
};

const DEMO_PASSWORD = "fyfit-demo";

const demoRoleAccounts: Partial<Record<Role, E2EAccount>> = {
  BEHEERDER: { email: "e2e-beheerder@fysiotherapienijmegen.nl", password: DEMO_PASSWORD },
  REVIEWER: { email: "e2e-reviewer@fysiotherapienijmegen.nl", password: DEMO_PASSWORD },
  MEDEWERKER: { email: "e2e-medewerker@fysiotherapienijmegen.nl", password: DEMO_PASSWORD },
};

const demoAudienceAccounts: Partial<Record<AudienceProfile, E2EAccount>> = {
  FYSIOTHERAPEUT: { email: "e2e-fysio@fysiotherapienijmegen.nl", password: DEMO_PASSWORD },
  PRAKTIJKONDERSTEUNER: { email: "e2e-po@fysiotherapienijmegen.nl", password: DEMO_PASSWORD },
  FITCOACH: { email: "e2e-fitcoach@fysiotherapienijmegen.nl", password: DEMO_PASSWORD },
};

let prismaClient: PrismaClient | null = null;

export function prisma() {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
      }),
    });
  }

  return prismaClient;
}

export async function disconnectPrisma() {
  await prismaClient?.$disconnect();
  prismaClient = null;
}

export function getRoleAccount(role: Role): E2EAccount {
  const email = process.env[`E2E_${role}_EMAIL`];
  const password = process.env[`E2E_${role}_PASSWORD`];

  if (email && password) {
    return { email, password };
  }

  const demo = process.env.E2E_USE_DEMO_ACCOUNTS === "1" ? demoRoleAccounts[role] : null;
  if (demo) {
    return demo;
  }

  throw new Error(`Missing E2E account for role ${role}. Set E2E_${role}_EMAIL/PASSWORD.`);
}

export function getAudienceAccount(audienceProfile: AudienceProfile): E2EAccount {
  const demo = process.env.E2E_USE_DEMO_ACCOUNTS === "1" ? demoAudienceAccounts[audienceProfile] : null;
  if (demo) {
    return demo;
  }

  const email = process.env[`E2E_${audienceProfile}_EMAIL`];
  const password = process.env[`E2E_${audienceProfile}_PASSWORD`];

  if (email && password) {
    return { email, password };
  }

  throw new Error(
    `Missing E2E account for audience ${audienceProfile}. Set E2E_${audienceProfile}_EMAIL/PASSWORD or E2E_USE_DEMO_ACCOUNTS=1.`,
  );
}

export async function ensureRoleE2EAccount(role: Role) {
  const account = getRoleAccount(role);
  const passwordHash = await hashPassword(account.password);
  const defaults: Record<string, { name: string; title: string; location: string; bio: string; avatarColor: string }> = {
    REVIEWER: {
      name: "Accreditatiecommissie Reviewer",
      title: "Reviewer Kwaliteitshuis",
      location: "Extern",
      bio: "Reviewer-account voor accreditatie-preview zonder datavervuiling.",
      avatarColor: "bg-violet-500",
    },
    BEHEERDER: {
      name: "E2E Beheerder",
      title: "Academy beheerder",
      location: "E2E",
      bio: "E2E beheeraccount voor LMS-accreditatieflows.",
      avatarColor: "bg-emerald-500",
    },
    MEDEWERKER: {
      name: "E2E Medewerker",
      title: "Fysiotherapeut",
      location: "E2E",
      bio: "E2E medewerkeraccount voor LMS-afrondingsflows.",
      avatarColor: "bg-amber-500",
    },
  };
  const profile = defaults[role] ?? defaults.MEDEWERKER;

  await prisma().user.upsert({
    where: { email: account.email },
    update: {
      passwordHash,
      role,
      audienceProfile: role === "REVIEWER" || role === "BEHEERDER" ? "FYSIOTHERAPEUT" : "FYSIOTHERAPEUT",
      isActive: true,
    },
    create: {
      email: account.email,
      passwordHash,
      name: profile.name,
      role,
      audienceProfile: "FYSIOTHERAPEUT",
      team: "E2E",
      title: profile.title,
      location: profile.location,
      bio: profile.bio,
      avatarColor: profile.avatarColor,
      isActive: true,
    },
  });
}

export async function ensureAudienceE2EAccounts() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const specs: Array<{ profile: AudienceProfile; name: string; title: string; location: string }> = [
    { profile: "FYSIOTHERAPEUT", name: "E2E Fysiotherapeut", title: "Fysiotherapeut", location: "E2E" },
    { profile: "PRAKTIJKONDERSTEUNER", name: "E2E Praktijkondersteuner", title: "Praktijkondersteuner", location: "E2E" },
    { profile: "FITCOACH", name: "E2E Fitcoach", title: "Fitcoach", location: "E2E" },
  ];

  await Promise.all(specs.map((spec) => {
    const account = getAudienceAccount(spec.profile);

    return prisma().user.upsert({
      where: { email: account.email },
      update: {
        passwordHash,
        name: spec.name,
        role: "MEDEWERKER",
        audienceProfile: spec.profile,
        title: spec.title,
        location: spec.location,
        bio: `E2E ${spec.profile} testaccount voor doelgroepzichtbaarheid.`,
        avatarColor: "bg-slate-500",
        isActive: true,
      },
      create: {
        email: account.email,
        passwordHash,
        name: spec.name,
        role: "MEDEWERKER",
        audienceProfile: spec.profile,
        team: "E2E",
        title: spec.title,
        location: spec.location,
        bio: `E2E ${spec.profile} testaccount voor doelgroepzichtbaarheid.`,
        avatarColor: "bg-slate-500",
        isActive: true,
      },
    });
  }));
}

export async function getSeedCourseFixture() {
  const course = await prisma().course.findUnique({
    where: { slug: process.env.E2E_LMS_COURSE_SLUG ?? "fy-fit-consultvoering-basis" },
    include: {
      versions: {
        where: { isActive: true },
        include: {
          lessons: { orderBy: { order: "asc" } },
          assessments: {
            include: {
              questions: {
                orderBy: { order: "asc" },
                include: { options: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  if (!course || !course.versions[0]) {
    throw new Error("LMS E2E seed course with active version is missing.");
  }

  const activeVersion = course.versions[0];
  const assessment = activeVersion.assessments[0];
  if (!assessment) {
    throw new Error("LMS E2E seed course has no assessment.");
  }

  return { course, activeVersion, assessment };
}

export async function resetLearnerCourseEvidence(email: string, courseId: string) {
  const user = await prisma().user.findUnique({ where: { email } });
  const course = await prisma().course.findUnique({
    where: { id: courseId },
    include: { versions: { where: { isActive: true }, include: { lessons: true, assessments: true } } },
  });

  if (!user || !course?.versions[0]) {
    throw new Error("Cannot reset LMS E2E evidence: user or course missing.");
  }

  const activeVersion = course.versions[0];
  const lessonIds = activeVersion.lessons.map((lesson) => lesson.id);
  const assessmentIds = activeVersion.assessments.map((assessment) => assessment.id);
  const attempts = await prisma().assessmentAttempt.findMany({
    where: { userId: user.id, assessmentId: { in: assessmentIds } },
    select: { id: true },
  });
  const attemptIds = attempts.map((attempt) => attempt.id);
  const evaluationForms = await prisma().evaluationForm.findMany({
    where: { courseVersionId: activeVersion.id },
    select: { id: true },
  });
  const evaluationFormIds = evaluationForms.map((form) => form.id);
  const evaluationSubmissions = await prisma().evaluationSubmission.findMany({
    where: { userId: user.id, evaluationFormId: { in: evaluationFormIds } },
    select: { id: true },
  });
  const evaluationSubmissionIds = evaluationSubmissions.map((submission) => submission.id);

  await prisma().$transaction([
    prisma().assessmentAnswer.deleteMany({ where: { attemptId: { in: attemptIds } } }),
    prisma().assessmentAttempt.deleteMany({ where: { id: { in: attemptIds } } }),
    prisma().evaluationAnswer.deleteMany({ where: { evaluationSubmissionId: { in: evaluationSubmissionIds } } }),
    prisma().evaluationSubmission.deleteMany({ where: { id: { in: evaluationSubmissionIds } } }),
    prisma().lessonProgress.deleteMany({ where: { userId: user.id, lessonId: { in: lessonIds } } }),
    prisma().certificate.deleteMany({ where: { userId: user.id, courseId } }),
    prisma().enrollment.deleteMany({ where: { userId: user.id, courseId } }),
  ]);

  return { userId: user.id, lessonIds, assessmentIds };
}

export async function countCourseEvidenceForUser(email: string, courseId: string) {
  const user = await prisma().user.findUnique({ where: { email } });
  const course = await prisma().course.findUnique({
    where: { id: courseId },
    include: { versions: { where: { isActive: true }, include: { lessons: true, assessments: true, evaluationForms: true } } },
  });

  if (!user || !course?.versions[0]) {
    throw new Error("Cannot count LMS evidence: user or course missing.");
  }

  const activeVersion = course.versions[0];
  const lessonIds = activeVersion.lessons.map((lesson) => lesson.id);
  const assessmentIds = activeVersion.assessments.map((assessment) => assessment.id);
  const evaluationFormIds = activeVersion.evaluationForms.map((form) => form.id);

  const [enrollments, lessonProgress, attempts, certificates, evaluationSubmissions] = await Promise.all([
    prisma().enrollment.count({ where: { userId: user.id, courseId } }),
    prisma().lessonProgress.count({ where: { userId: user.id, lessonId: { in: lessonIds } } }),
    prisma().assessmentAttempt.count({ where: { userId: user.id, assessmentId: { in: assessmentIds } } }),
    prisma().certificate.count({ where: { userId: user.id, courseId } }),
    prisma().evaluationSubmission.count({ where: { userId: user.id, evaluationFormId: { in: evaluationFormIds } } }),
  ]);

  return { enrollments, lessonProgress, attempts, certificates, evaluationSubmissions };
}

export async function createBrokenPublishGateCourse(adminEmail: string) {
  const admin = await prisma().user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    throw new Error("Admin account missing for publish gate E2E fixture.");
  }

  const slug = `e2e-publish-gate-${Date.now()}`;
  const course = await prisma().course.create({
    data: {
      title: "E2E publish gate blokkade",
      slug,
      description: "Bewust incomplete accreditatiecursus voor Playwright publish gate test.",
      audience: null,
      visibleToAll: false,
      visibleToRoles: ["BEHEERDER", "REVIEWER"],
      visibleToAudienceProfiles: [],
      learningObjectives: null,
      accreditationRegister: null,
      studyLoadMinutes: 0,
      status: "CONCEPT",
      isMandatory: false,
      authorId: admin.id,
      versions: {
        create: {
          versionNumber: "0.1-e2e",
          isActive: true,
          changeSummary: "E2E incomplete fixture.",
          createdById: admin.id,
        },
      },
    },
  });

  return course;
}

export async function createAudienceVisibilityCourses(adminEmail: string) {
  const admin = await prisma().user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    throw new Error("Admin account missing for audience visibility E2E fixture.");
  }

  const stamp = Date.now();
  const specs: { audienceProfile: AudienceProfile; title: string; slug: string }[] = [
    { audienceProfile: "FYSIOTHERAPEUT", title: `E2E FYSIO zichtbaarheid ${stamp}`, slug: `e2e-fysio-${stamp}` },
    { audienceProfile: "PRAKTIJKONDERSTEUNER", title: `E2E PO zichtbaarheid ${stamp}`, slug: `e2e-po-${stamp}` },
    { audienceProfile: "FITCOACH", title: `E2E FITCOACH zichtbaarheid ${stamp}`, slug: `e2e-fitcoach-${stamp}` },
  ];

  const courses = [];
  for (const spec of specs) {
    const course = await prisma().course.create({
      data: {
        title: spec.title,
        slug: spec.slug,
        description: `Doelgroep-specifieke E2E cursus voor ${spec.audienceProfile}.`,
        audience: spec.audienceProfile,
        visibleToAll: false,
        visibleToRoles: [],
        visibleToAudienceProfiles: [spec.audienceProfile],
        learningObjectives: "De juiste doelgroep ziet deze e-learning in de Academy.",
        accreditationRegister: "E2E",
        studyLoadMinutes: 10,
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorId: admin.id,
        versions: {
          create: {
            versionNumber: "1.0-e2e",
            isActive: true,
            changeSummary: "E2E doelgroep fixture.",
            createdById: admin.id,
            lessons: {
              create: {
                title: `Intro ${spec.audienceProfile}`,
                slug: `intro-${spec.slug}`,
                description: "E2E zichtbaarheid les.",
                type: "TEXT",
                content: "E2E doelgroep zichtbaarheid.",
                order: 1,
                isRequired: true,
                estimatedMinutes: 10,
              },
            },
          },
        },
      },
    });
    courses.push({ ...spec, id: course.id });
  }

  return courses;
}

export async function cleanupE2ECourses(courseIds: string[]) {
  if (!courseIds.length) {
    return;
  }

  const versions = await prisma().courseVersion.findMany({ where: { courseId: { in: courseIds } }, select: { id: true } });
  const versionIds = versions.map((version) => version.id);
  const lessons = await prisma().lesson.findMany({ where: { courseVersionId: { in: versionIds } }, select: { id: true } });
  const lessonIds = lessons.map((lesson) => lesson.id);
  const assessments = await prisma().assessment.findMany({ where: { courseVersionId: { in: versionIds } }, select: { id: true } });
  const assessmentIds = assessments.map((assessment) => assessment.id);
  const attempts = await prisma().assessmentAttempt.findMany({ where: { assessmentId: { in: assessmentIds } }, select: { id: true } });
  const attemptIds = attempts.map((attempt) => attempt.id);

  await prisma().$transaction([
    prisma().assessmentAnswer.deleteMany({ where: { attemptId: { in: attemptIds } } }),
    prisma().assessmentAttempt.deleteMany({ where: { id: { in: attemptIds } } }),
    prisma().questionLearningObjective.deleteMany({ where: { question: { assessmentId: { in: assessmentIds } } } }),
    prisma().questionOption.deleteMany({ where: { question: { assessmentId: { in: assessmentIds } } } }),
    prisma().question.deleteMany({ where: { assessmentId: { in: assessmentIds } } }),
    prisma().assessment.deleteMany({ where: { id: { in: assessmentIds } } }),
    prisma().lessonProgress.deleteMany({ where: { lessonId: { in: lessonIds } } }),
    prisma().lesson.deleteMany({ where: { id: { in: lessonIds } } }),
    prisma().enrollment.deleteMany({ where: { courseId: { in: courseIds } } }),
    prisma().certificate.deleteMany({ where: { courseId: { in: courseIds } } }),
    prisma().evaluationAnswer.deleteMany({ where: { submission: { evaluationForm: { courseVersionId: { in: versionIds } } } } }),
    prisma().evaluationSubmission.deleteMany({ where: { evaluationForm: { courseVersionId: { in: versionIds } } } }),
    prisma().evaluationQuestion.deleteMany({ where: { evaluationForm: { courseVersionId: { in: versionIds } } } }),
    prisma().evaluationForm.deleteMany({ where: { courseVersionId: { in: versionIds } } }),
    prisma().learningObjective.deleteMany({ where: { courseVersionId: { in: versionIds } } }),
    prisma().literatureReference.deleteMany({ where: { courseVersionId: { in: versionIds } } }),
    prisma().competencyReference.deleteMany({ where: { courseVersionId: { in: versionIds } } }),
    prisma().courseModule.deleteMany({ where: { courseVersionId: { in: versionIds } } }),
    prisma().courseChangeLog.deleteMany({ where: { courseId: { in: courseIds } } }),
    prisma().courseVersion.deleteMany({ where: { id: { in: versionIds } } }),
    prisma().course.deleteMany({ where: { id: { in: courseIds } } }),
  ]);
}
