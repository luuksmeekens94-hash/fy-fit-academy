"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { listActiveUsers } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { buildAssessmentAnswerRecords } from "@/lib/lms/action-helpers";
import {
  parseAuthorExpertsInput,
  parseCompetencyReferencesInput,
  buildLessonSlug,
  getNextModuleOrder,
  parseLearningObjectivesInput,
  parseLessonBuilderInput,
  parseLiteratureReferencesInput,
  parseModulesInput,
  parseQuestionBuilderInput,
  parseWorkFormsInput,
  reorderModulesAfterMove,
} from "@/lib/lms/accreditation-admin";
import { buildAccreditationChecklist } from "@/lib/lms/accreditation-checklist";
import { assertAccreditationPublishable } from "@/lib/lms/accreditation-evidence";
import { canStartAssessmentResitAfterFailedAttempt } from "@/lib/lms/assessment-redo-policy";
import {
  buildStandardEvaluationQuestionTemplate,
  STANDARD_EVALUATION_FORM_TITLE,
} from "@/lib/lms/accreditation-template";
import { issueCertificate } from "@/lib/lms/certificates";
import { buildEvaluationAnswerRecords } from "@/lib/lms/evaluation";
import { getCourseDetail } from "@/lib/lms/queries";
import { getRequiredLiteratureProgressLesson, REQUIRED_LITERATURE_STEP_KEY } from "@/lib/lms/required-literature";
import { canMutateLearnerProgress } from "@/lib/lms/reviewer-preview";
import { isCourseCompleted } from "@/lib/lms/rules";
import { AUDIENCE_PROFILES } from "@/lib/audience";
import {
  applyContentVisibilityPreset,
  isContentVisibilityPreset,
  isContentVisibleForUser,
} from "@/lib/content-visibility";
import { buildCourseNotificationPayloads } from "@/lib/notifications";
import type { Role } from "@/lib/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const COURSE_VISIBILITY_ROLES = [
  "MEDEWERKER",
  "TEAMLEIDER",
  "PRAKTIJKMANAGER",
  "PRAKTIJKHOUDER",
  "BEHEERDER",
  "REVIEWER",
] as const satisfies Role[];

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length ? value : null;
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  assert(Number.isFinite(parsed), `${key} moet een getal zijn.`);
  return parsed;
}

function getOptionalDate(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  assert(!Number.isNaN(date.getTime()), `${key} moet een geldige datum zijn.`);
  return date;
}

function getAllowedArray<T extends string>(formData: FormData, key: string, allowed: readonly T[]) {
  return formData
    .getAll(key)
    .map((value) => String(value))
    .filter((value): value is T => allowed.includes(value as T));
}

function getCommaSeparatedStrings(formData: FormData, key: string) {
  return getString(formData, key)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

async function requireAccreditationManager() {
  const user = await requireUser();
  assert(user.role === "BEHEERDER", "Alleen beheerders mogen accreditatiegegevens beheren.");
  return user;
}

async function getActiveVersionForManagement(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      versions: {
        where: { isActive: true },
        include: {
          modules: true,
          lessons: true,
          objectives: true,
          literature: true,
          competencies: true,
        },
      },
    },
  });

  assert(course, "Cursus niet gevonden.");
  const activeVersion = course.versions[0] ?? null;
  assert(activeVersion, "Geen actieve cursusversie gevonden.");
  return { course, activeVersion };
}

function parseAssessmentResponses(formData: FormData) {
  const raw = getString(formData, "answers");
  assert(raw, "Antwoorden ontbreken.");

  const parsed = JSON.parse(raw) as Record<
    string,
    string[] | { textAnswer: string } | undefined
  >;

  return parsed;
}

async function revalidateLearningPaths(params: {
  courseId: string;
  lessonId?: string;
}) {
  revalidatePath("/");
  revalidatePath("/lms");
  revalidatePath(`/lms/courses/${params.courseId}`);
  revalidatePath("/lms/certificates");
  revalidatePath("/lms/team");
  revalidatePath("/lms/admin");
  revalidatePath("/lms/admin/courses");
  revalidatePath("/lms/admin/reports");
  revalidatePath("/academy");

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      versions: {
        where: { isActive: true },
        include: {
          lessons: true,
        },
      },
    },
  });

  if (!course) {
    return;
  }

  revalidatePath(`/academy/${course.slug}`);

  const activeVersion = course.versions[0] ?? null;
  const lesson = params.lessonId
    ? activeVersion?.lessons.find((entry) => entry.id === params.lessonId) ?? null
    : null;

  if (lesson) {
    revalidatePath(`/academy/${course.slug}/lessons/${lesson.slug}`);
  }
}

async function createCourseNotifications(courseId: string, eventType: "published" | "updated") {
  const [course, users] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        visibleToAll: true,
        visibleToRoles: true,
        visibleToAudienceProfiles: true,
        visibleToUserIds: true,
      },
    }),
    listActiveUsers(),
  ]);

  if (!course) {
    return;
  }

  const payloads = buildCourseNotificationPayloads({ eventType, course, users });
  if (!payloads.length) {
    return;
  }

  await prisma.notification.createMany({
    data: payloads.map((payload) => ({
      userId: payload.userId,
      type: payload.type,
      severity: payload.severity,
      title: payload.title,
      body: payload.body,
      href: payload.href,
      sourceId: payload.sourceId,
      sourceType: payload.sourceType,
    })),
  });
}

async function getEnrollmentForUser(userId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    include: {
      course: {
        include: {
          versions: {
            where: { isActive: true },
            include: {
              lessons: true,
              assessments: true,
            },
          },
        },
      },
    },
  });

  assert(enrollment, "Geen LMS-inschrijving gevonden voor deze cursus.");
  return enrollment;
}

async function ensureEnrollmentForUser(userId: string, courseId: string) {
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (existingEnrollment) {
    return existingEnrollment;
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, isMandatory: true },
  });

  assert(course, "Cursus niet gevonden.");

  return prisma.enrollment.create({
    data: {
      userId,
      courseId,
      assignmentType: course.isMandatory ? "REQUIRED" : "OPTIONAL",
      status: "NOT_STARTED",
    },
  });
}

async function assertCourseAccessibleForUser(params: {
  userId: string;
  role: Role;
  courseId: string;
}) {
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: {
      id: true,
      status: true,
      visibleToAll: true,
      visibleToRoles: true,
      visibleToAudienceProfiles: true,
      visibleToUserIds: true,
    },
  });

  assert(course, "Cursus niet gevonden.");

  if (params.role === "BEHEERDER" || params.role === "REVIEWER") {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, role: true, audienceProfile: true },
  });

  assert(user, "Gebruiker niet gevonden.");
  assert(
    course.status === "PUBLISHED" && isContentVisibleForUser(course, user),
    "Cursus is niet beschikbaar."
  );
}

async function assertReviewerCourseLessonAccess(params: {
  userId: string;
  role: Role;
  courseId: string;
  lessonId: string;
}) {
  assert(params.role === "REVIEWER" || params.role === "BEHEERDER", "Alleen reviewers en beheerders kunnen deze stapvoortgang bijwerken.");

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: {
      id: true,
      reviewerId: true,
      versions: {
        where: { isActive: true },
        select: {
          id: true,
          lessons: {
            where: { id: params.lessonId },
            select: { id: true },
          },
        },
      },
    },
  });

  assert(course, "Cursus niet gevonden.");
  if (params.role === "REVIEWER") {
    assert(course.reviewerId === params.userId, "Reviewer is niet gekoppeld aan deze cursus.");
  }

  const activeVersion = course.versions[0] ?? null;
  assert(activeVersion, "Geen actieve cursusversie gevonden.");
  assert(activeVersion.lessons.length === 1, "Les hoort niet bij deze cursus.");
}

function assertSafeReviewerNextHref(nextHref: string, courseId: string) {
  assert(!nextHref || nextHref.startsWith(`/lms/courses/${courseId}`) || nextHref === "/lms", "Ongeldige vervolgstap.");
}

async function upsertLessonStepProgress(params: {
  userId: string;
  lessonId: string;
  stepKey: string;
}) {
  assert(/^[a-z0-9-]{2,80}$/i.test(params.stepKey), "Ongeldige stapcode.");

  return prisma.lessonStepProgress.upsert({
    where: {
      userId_lessonId_stepKey: {
        userId: params.userId,
        lessonId: params.lessonId,
        stepKey: params.stepKey,
      },
    },
    update: {
      completedAt: new Date(),
      lastViewedAt: new Date(),
    },
    create: {
      userId: params.userId,
      lessonId: params.lessonId,
      stepKey: params.stepKey,
      completedAt: new Date(),
      lastViewedAt: new Date(),
    },
  });
}

async function getActiveCourseVersionId(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      versions: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  const activeVersions = course?.versions ?? [];
  assert(activeVersions.length === 1, "Er moet precies één actieve cursusversie zijn.");

  return activeVersions[0].id;
}

async function syncEnrollmentCompletionState(params: {
  userId: string;
  courseId: string;
}) {
  const enrollment = await getEnrollmentForUser(params.userId, params.courseId);
  const activeVersion = enrollment.course.versions[0] ?? null;
  assert(activeVersion, "Geen actieve cursusversie gevonden.");

  const requiredLessonIds = activeVersion.lessons
    .filter((lesson) => lesson.isRequired)
    .map((lesson) => lesson.id);
  const requiredAssessmentIds = activeVersion.assessments
    .filter((assessment) => assessment.isRequiredForCompletion)
    .map((assessment) => assessment.id);

  const [lessonProgress, attempts] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: {
        userId: params.userId,
        lessonId: { in: activeVersion.lessons.map((lesson) => lesson.id) },
      },
    }),
    prisma.assessmentAttempt.findMany({
      where: {
        userId: params.userId,
        assessmentId: { in: requiredAssessmentIds },
        passed: true,
      },
      orderBy: { attemptNumber: "desc" },
    }),
  ]);

  const completedLessonIds = lessonProgress
    .filter((progress) => progress.status === "COMPLETED")
    .map((progress) => progress.lessonId);
  const passedAssessmentIds = Array.from(
    new Set(attempts.map((attempt) => attempt.assessmentId))
  );

  const courseCompleted = isCourseCompleted({
    requiredLessonIds,
    completedLessonIds,
    requiredAssessmentIds,
    passedAssessmentIds,
  });

  if (courseCompleted) {
    const latestPassedAttempt = attempts[0] ?? null;
    const certificate = await issueCertificate({
      userId: params.userId,
      courseId: params.courseId,
      courseVersionId: activeVersion.id,
      scorePercentage: latestPassedAttempt?.scorePercentage ?? null,
      studyLoadMinutes: enrollment.course.studyLoadMinutes,
    });

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "COMPLETED",
        completedAt: enrollment.completedAt ?? new Date(),
        startedAt: enrollment.startedAt ?? new Date(),
        certificateId: certificate.id,
      },
    });

    return { courseCompleted: true, certificateId: certificate.id };
  }

  if (enrollment.status === "NOT_STARTED") {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "IN_PROGRESS",
        startedAt: enrollment.startedAt ?? new Date(),
      },
    });
  }

  return { courseCompleted: false, certificateId: null };
}

export async function startEnrollmentAction(formData: FormData) {
  const user = await requireUser();
  const courseId = getString(formData, "courseId");

  assert(courseId, "Cursus ontbreekt.");
  assert(
    canMutateLearnerProgress(user.role, true),
    "Reviewer-/beheerpreview mag geen inschrijvingen of voortgang aanmaken."
  );

  await assertCourseAccessibleForUser({
    userId: user.id,
    role: user.role,
    courseId,
  });

  const enrollment = await ensureEnrollmentForUser(user.id, courseId);

  if (enrollment.status === "NOT_STARTED") {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "IN_PROGRESS",
        startedAt: enrollment.startedAt ?? new Date(),
      },
    });
  }

  await revalidateLearningPaths({ courseId });
}

export async function completeLessonAction(formData: FormData) {
  const user = await requireUser();
  const courseId = getString(formData, "courseId");
  const lessonId = getString(formData, "lessonId");

  assert(courseId, "Cursus ontbreekt.");
  assert(lessonId, "Les ontbreekt.");
  assert(
    canMutateLearnerProgress(user.role, true),
    "Reviewer-/beheerpreview mag geen lesvoortgang aanmaken."
  );

  await assertCourseAccessibleForUser({
    userId: user.id,
    role: user.role,
    courseId,
  });

  await ensureEnrollmentForUser(user.id, courseId);
  const activeCourseVersionId = await getActiveCourseVersionId(courseId);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      courseVersion: true,
    },
  });

  assert(lesson, "Les niet gevonden.");
  assert(lesson.courseVersion.courseId === courseId, "Les hoort niet bij deze cursus.");
  assert(lesson.courseVersionId === activeCourseVersionId, "Les hoort niet bij de actieve cursusversie.");
  assert(lesson.type !== "ASSESSMENT", "Een assessment-les wordt afgerond via toetsinlevering.");

  const existingLessonProgress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId,
      },
    },
  });

  await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId,
      },
    },
    update: {
      status: "COMPLETED",
      completedAt: new Date(),
      lastViewedAt: new Date(),
      startedAt: existingLessonProgress?.startedAt ?? new Date(),
    },
    create: {
      userId: user.id,
      lessonId,
      status: "COMPLETED",
      startedAt: new Date(),
      completedAt: new Date(),
      lastViewedAt: new Date(),
    },
  });

  await syncEnrollmentCompletionState({
    userId: user.id,
    courseId,
  });

  await revalidateLearningPaths({ courseId, lessonId });
}

export async function completeReviewerLessonStepAction(formData: FormData) {
  const user = await requireUser();
  const courseId = getString(formData, "courseId");
  const lessonId = getString(formData, "lessonId");
  const stepKey = getString(formData, "stepKey");
  const nextHref = getString(formData, "nextHref");

  assert(courseId, "Cursus ontbreekt.");
  assert(lessonId, "Les ontbreekt.");
  assert(stepKey, "Stap ontbreekt.");
  assertSafeReviewerNextHref(nextHref, courseId);

  await assertReviewerCourseLessonAccess({
    userId: user.id,
    role: user.role,
    courseId,
    lessonId,
  });

  await upsertLessonStepProgress({
    userId: user.id,
    lessonId,
    stepKey,
  });

  await revalidateLearningPaths({ courseId, lessonId });

  if (nextHref) {
    redirect(nextHref);
  }
}

export async function markReviewerLessonStepAction(formData: FormData) {
  const user = await requireUser();
  const courseId = getString(formData, "courseId");
  const lessonId = getString(formData, "lessonId");
  const stepKey = getString(formData, "stepKey");

  assert(courseId, "Cursus ontbreekt.");
  assert(lessonId, "Les ontbreekt.");
  assert(stepKey, "Stap ontbreekt.");

  await assertReviewerCourseLessonAccess({
    userId: user.id,
    role: user.role,
    courseId,
    lessonId,
  });

  const saved = await upsertLessonStepProgress({
    userId: user.id,
    lessonId,
    stepKey,
  });

  await revalidateLearningPaths({ courseId, lessonId });

  return {
    completedAt: saved.completedAt.toISOString(),
  };
}

export async function submitCommunityAssignmentAction(formData: FormData) {
  const user = await requireUser();
  const courseId = getString(formData, "courseId");
  const lessonId = getString(formData, "lessonId");
  const title = getString(formData, "title");
  const prompt = getString(formData, "prompt");
  const answer = getString(formData, "answer");
  const stepKey = getOptionalString(formData, "stepKey");

  assert(courseId, "Cursus ontbreekt.");
  assert(lessonId, "Les ontbreekt.");
  assert(title.length >= 3, "Opdrachttitel ontbreekt.");
  assert(prompt.length >= 10, "Opdrachtprompt ontbreekt.");
  assert(answer.length >= 20, "Werk je antwoord iets verder uit voordat je inlevert.");

  await assertCourseAccessibleForUser({
    userId: user.id,
    role: user.role,
    courseId,
  });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      reviewerId: true,
      versions: {
        where: { isActive: true },
        select: {
          id: true,
          lessons: {
            where: { id: lessonId },
            select: { id: true, moduleId: true, courseVersionId: true },
          },
        },
      },
    },
  });

  assert(course, "Cursus niet gevonden.");
  if (user.role === "REVIEWER") {
    assert(course.reviewerId === user.id, "Reviewer is niet gekoppeld aan deze cursus.");
  }

  const activeVersion = course.versions[0] ?? null;
  const lesson = activeVersion?.lessons[0] ?? null;
  assert(activeVersion, "Geen actieve cursusversie gevonden.");
  assert(lesson, "Les niet gevonden in de actieve cursusversie.");
  assert(lesson.courseVersionId === activeVersion.id, "Les hoort niet bij de actieve cursusversie.");

  const saved = await prisma.communityAssignmentSubmission.upsert({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId,
      },
    },
    update: {
      title,
      prompt,
      answer,
      courseId,
      courseVersionId: activeVersion.id,
      moduleId: lesson.moduleId,
      submittedAt: new Date(),
    },
    create: {
      userId: user.id,
      courseId,
      courseVersionId: activeVersion.id,
      moduleId: lesson.moduleId,
      lessonId,
      title,
      prompt,
      answer,
    },
    select: {
      submittedAt: true,
      updatedAt: true,
    },
  });

  if (stepKey) {
    await upsertLessonStepProgress({
      userId: user.id,
      lessonId,
      stepKey,
    });
  }

  await revalidateLearningPaths({ courseId, lessonId });

  return {
    submittedAt: saved.submittedAt.toISOString(),
    updatedAt: saved.updatedAt.toISOString(),
  };
}

export async function startAssessmentAttemptAction(formData: FormData) {
  const user = await requireUser();
  const courseId = getString(formData, "courseId");
  const assessmentId = getString(formData, "assessmentId");

  assert(courseId, "Cursus ontbreekt.");
  assert(assessmentId, "Toets ontbreekt.");
  assert(
    canMutateLearnerProgress(user.role, true),
    "Reviewer-/beheerpreview mag geen toetspogingen aanmaken."
  );

  await assertCourseAccessibleForUser({
    userId: user.id,
    role: user.role,
    courseId,
  });

  await ensureEnrollmentForUser(user.id, courseId);
  const activeCourseVersionId = await getActiveCourseVersionId(courseId);

  const attempt = await prisma.$transaction(
    async (tx) => {
      const [enrollment, assessment, existingAttempts] = await Promise.all([
        tx.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId,
            },
          },
        }),
        tx.assessment.findUnique({
          where: { id: assessmentId },
          include: {
            courseVersion: {
              include: {
                lessons: {
                  select: {
                    id: true,
                    isRequired: true,
                    type: true,
                  },
                },
              },
            },
          },
        }),
        tx.assessmentAttempt.findMany({
          where: {
            userId: user.id,
            assessmentId,
          },
          orderBy: { attemptNumber: "desc" },
        }),
      ]);

      assert(enrollment, "Geen LMS-inschrijving gevonden voor deze cursus.");
      assert(assessment, "Toets niet gevonden.");
      assert(assessment.courseVersion.courseId === courseId, "Toets hoort niet bij deze cursus.");
      assert(assessment.courseVersionId === activeCourseVersionId, "Toets hoort niet bij de actieve cursusversie.");
      assert(existingAttempts.length < assessment.maxAttempts, "Maximum aantal toetspogingen bereikt.");
      assert(
        existingAttempts.every((attempt) => attempt.submittedAt !== null),
        "Er staat al een actieve toetspoging open. Lever die eerst in."
      );

      const latestFailedAttempt = existingAttempts.find(
        (attempt) => attempt.submittedAt !== null && attempt.passed === false
      );

      if (latestFailedAttempt?.submittedAt) {
        const progressEntries = await tx.lessonProgress.findMany({
          where: {
            userId: user.id,
            lessonId: { in: assessment.courseVersion.lessons.map((lesson) => lesson.id) },
          },
          select: {
            lessonId: true,
            completedAt: true,
          },
        });

        assert(
          canStartAssessmentResitAfterFailedAttempt({
            latestFailedAttemptSubmittedAt: latestFailedAttempt.submittedAt,
            requiredLessons: assessment.courseVersion.lessons,
            progressEntries,
          }),
          "Doorloop eerst alle verplichte lesinhoud opnieuw voordat je de toets herkansing start."
        );
      }

      if (enrollment.status === "NOT_STARTED") {
        await tx.enrollment.update({
          where: { id: enrollment.id },
          data: {
            status: "IN_PROGRESS",
            startedAt: enrollment.startedAt ?? new Date(),
          },
        });
      }

      return tx.assessmentAttempt.create({
        data: {
          assessmentId,
          userId: user.id,
          courseVersionId: assessment.courseVersionId,
          attemptNumber: (existingAttempts[0]?.attemptNumber ?? 0) + 1,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  await revalidateLearningPaths({ courseId });
  return { attemptId: attempt.id, attemptNumber: attempt.attemptNumber };
}

export async function submitAssessmentAttemptAction(formData: FormData) {
  const user = await requireUser();
  const courseId = getString(formData, "courseId");
  const attemptId = getString(formData, "attemptId");
  const responses = parseAssessmentResponses(formData);

  assert(courseId, "Cursus ontbreekt.");
  assert(attemptId, "Toetspoging ontbreekt.");
  assert(
    canMutateLearnerProgress(user.role, true),
    "Reviewer-/beheerpreview mag geen toetsresultaten opslaan."
  );

  await assertCourseAccessibleForUser({
    userId: user.id,
    role: user.role,
    courseId,
  });

  const activeCourseVersionId = await getActiveCourseVersionId(courseId);

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: {
        include: {
          courseVersion: true,
          questions: {
            orderBy: { order: "asc" },
            include: {
              options: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  assert(attempt, "Toetspoging niet gevonden.");
  assert(attempt.userId === user.id, "Niet toegestaan.");
  assert(attempt.submittedAt === null, "Deze poging is al ingeleverd.");
  assert(
    attempt.assessment.courseVersion.courseId === courseId,
    "Toetspoging hoort niet bij deze cursus."
  );
  assert(
    attempt.courseVersionId === activeCourseVersionId,
    "Toetspoging hoort niet bij de actieve cursusversie."
  );

  const evaluated = buildAssessmentAnswerRecords({
    questions: attempt.assessment.questions.map((question) => ({
      id: question.id,
      type: question.type,
      points: question.points,
      options: question.options.map((option) => ({
        id: option.id,
        isCorrect: option.isCorrect,
      })),
    })),
    responses,
    passPercentage: attempt.assessment.passPercentage,
  });

  await prisma.$transaction(async (tx) => {
    await tx.assessmentAnswer.createMany({
      data: evaluated.answers.map((answer) => ({
        attemptId: attempt.id,
        questionId: answer.questionId,
        selectedOptionIds: answer.selectedOptionIds,
        textAnswer: answer.textAnswer,
        isCorrect: answer.isCorrect,
        awardedPoints: answer.awardedPoints,
      })),
    });

    await tx.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        submittedAt: new Date(),
        scoreRaw: evaluated.scoreRaw,
        scorePercentage: evaluated.scorePercentage,
        passed: evaluated.passed,
      },
    });

    if (attempt.assessment.lessonId) {
      const existingAssessmentLessonProgress = await tx.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId: attempt.assessment.lessonId,
          },
        },
      });

      await tx.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId: attempt.assessment.lessonId,
          },
        },
        update: {
          status: evaluated.passed ? "COMPLETED" : "IN_PROGRESS",
          startedAt: existingAssessmentLessonProgress?.startedAt ?? new Date(),
          completedAt: evaluated.passed ? new Date() : null,
          lastViewedAt: new Date(),
        },
        create: {
          userId: user.id,
          lessonId: attempt.assessment.lessonId,
          status: evaluated.passed ? "COMPLETED" : "IN_PROGRESS",
          startedAt: new Date(),
          completedAt: evaluated.passed ? new Date() : null,
          lastViewedAt: new Date(),
        },
      });
    }
  });

  const completion = await syncEnrollmentCompletionState({
    userId: user.id,
    courseId,
  });

  await revalidateLearningPaths({
    courseId,
    lessonId: attempt.assessment.lessonId ?? undefined,
  });

  return {
    attemptId: attempt.id,
    scoreRaw: evaluated.scoreRaw,
    scorePercentage: evaluated.scorePercentage,
    passed: evaluated.passed,
    courseCompleted: completion.courseCompleted,
    certificateId: completion.certificateId,
  };
}


export async function saveCourseAccreditationMetadataAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  assert(courseId, "Cursus ontbreekt.");

  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const studyLoadMinutes = getOptionalNumber(formData, "studyLoadMinutes");
  const requiredQuestionCount = getOptionalNumber(formData, "requiredQuestionCount");
  const accreditationKind = getString(formData, "accreditationKind");
  const status = getString(formData, "status");
  const changeSummary = getOptionalString(formData, "changeSummary") ?? "Accreditatie-metadata bijgewerkt.";
  const visibilityPresetValue = getString(formData, "visibilityPreset");
  const visibilityPreset = isContentVisibilityPreset(visibilityPresetValue) ? visibilityPresetValue : "MANUAL";
  const manualVisibility = {
    visibleToAll: formData.get("visibleToAll") === "on" || formData.get("visibleToAll") === "true",
    visibleToRoles: getAllowedArray(formData, "visibleToRoles", COURSE_VISIBILITY_ROLES),
    visibleToAudienceProfiles: getAllowedArray(formData, "visibleToAudienceProfiles", AUDIENCE_PROFILES),
    visibleToUserIds: getCommaSeparatedStrings(formData, "visibleToUserIds"),
  };
  const visibility = visibilityPreset === "MANUAL"
    ? manualVisibility
    : applyContentVisibilityPreset(visibilityPreset);

  assert(title, "Titel is verplicht.");
  assert(description, "Beschrijving is verplicht.");
  assert(studyLoadMinutes !== null && studyLoadMinutes > 0, "Studielast moet groter zijn dan 0.");
  assert(
    accreditationKind === "VAKINHOUDELIJK" || accreditationKind === "BEROEPSGERELATEERD",
    "Ongeldige accreditatiesoort."
  );
  assert(
    status === "CONCEPT" || status === "REVIEW" || status === "PUBLISHED" || status === "ARCHIVED",
    "Ongeldige cursusstatus."
  );

  const { course, activeVersion } = await getActiveVersionForManagement(courseId);
  assert(status !== "PUBLISHED" || course.status === "PUBLISHED", "Gebruik de accreditatie-publiceerknop om een e-learning te publiceren.");
  const shouldNotifyCourseUpdate = course.status === "PUBLISHED";

  await prisma.$transaction(async (tx) => {
    await tx.course.update({
      where: { id: courseId },
      data: {
        title,
        description,
        audience: getOptionalString(formData, "audience"),
        visibleToAll: visibility.visibleToAll,
        visibleToRoles: visibility.visibleToRoles,
        visibleToAudienceProfiles: visibility.visibleToAudienceProfiles,
        visibleToUserIds: visibility.visibleToUserIds,
        accreditationRegister: getOptionalString(formData, "accreditationRegister"),
        accreditationKind,
        accreditationActivityId: getOptionalString(formData, "accreditationActivityId"),
        providerName: getOptionalString(formData, "providerName"),
        providerSignatureName: getOptionalString(formData, "providerSignatureName"),
        studyLoadMinutes,
        requiredQuestionCount,
        status,
        isMandatory: formData.get("isMandatory") === "on",
        versionDate: getOptionalDate(formData, "versionDate"),
        revisionDueAt: getOptionalDate(formData, "revisionDueAt"),
        authorExperts: parseAuthorExpertsInput(getString(formData, "authorExperts")),
      },
    });

    await tx.courseVersion.update({
      where: { id: activeVersion.id },
      data: { changeSummary },
    });

    await tx.courseChangeLog.create({
      data: {
        courseId,
        courseVersionId: activeVersion.id,
        changedById: user.id,
        changeType: "ACCREDITATION_METADATA",
        summary: changeSummary,
      },
    });
  });

  if (shouldNotifyCourseUpdate) {
    await createCourseNotifications(courseId, "updated");
  }
  await revalidateLearningPaths({ courseId });
}

export async function saveCourseBuilderModuleAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  const moduleId = getOptionalString(formData, "moduleId");
  const title = getString(formData, "moduleTitle");
  const estimatedMinutes = getOptionalNumber(formData, "moduleEstimatedMinutes");
  const introduction = getOptionalString(formData, "moduleIntroduction");
  const summary = getOptionalString(formData, "moduleSummary");
  const workForms = parseWorkFormsInput(getString(formData, "moduleWorkForms"));

  assert(courseId, "Cursus ontbreekt.");
  assert(title.length >= 3, "Moduletitel is te kort.");
  assert(estimatedMinutes !== null && estimatedMinutes > 0, "Moduleduur is verplicht.");

  const { course, activeVersion } = await getActiveVersionForManagement(courseId);
  const existingModule = moduleId ? activeVersion.modules.find((entry) => entry.id === moduleId) : null;
  const shouldNotifyCourseUpdate = course.status === "PUBLISHED";

  await prisma.$transaction(async (tx) => {
    const savedModule = existingModule
      ? await tx.courseModule.update({
          where: { id: existingModule.id },
          data: {
            title,
            introduction,
            summary,
            estimatedMinutes,
            workForms,
          },
          select: { order: true, title: true },
        })
      : await tx.courseModule.create({
          data: {
            courseVersionId: activeVersion.id,
            order: getNextModuleOrder(activeVersion.modules),
            title,
            introduction,
            summary,
            estimatedMinutes,
            workForms,
          },
          select: { order: true, title: true },
        });

    await tx.courseChangeLog.create({
      data: {
        courseId,
        courseVersionId: activeVersion.id,
        changedById: user.id,
        changeType: existingModule ? "LMS_MODULE_UPDATED" : "LMS_MODULE_CREATED",
        summary: `Module ${savedModule.order}: ${savedModule.title} ${existingModule ? "bijgewerkt" : "aangemaakt"}.`,
      },
    });
  });

  if (shouldNotifyCourseUpdate) {
    await createCourseNotifications(courseId, "updated");
  }
  await revalidateLearningPaths({ courseId });
}

export async function duplicateCourseBuilderModuleAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  const moduleId = getString(formData, "moduleId");

  assert(courseId, "Cursus ontbreekt.");
  assert(moduleId, "Module ontbreekt.");

  const { course, activeVersion } = await getActiveVersionForManagement(courseId);
  const source = activeVersion.modules.find((entry) => entry.id === moduleId);
  assert(source, "Module niet gevonden.");
  const shouldNotifyCourseUpdate = course.status === "PUBLISHED";

  await prisma.$transaction(async (tx) => {
    const created = await tx.courseModule.create({
      data: {
        courseVersionId: activeVersion.id,
        order: getNextModuleOrder(activeVersion.modules),
        title: `${source.title} kopie`,
        introduction: source.introduction,
        summary: source.summary,
        estimatedMinutes: source.estimatedMinutes,
        workForms: source.workForms,
      },
      select: { order: true, title: true },
    });

    await tx.courseChangeLog.create({
      data: {
        courseId,
        courseVersionId: activeVersion.id,
        changedById: user.id,
        changeType: "LMS_MODULE_DUPLICATED",
        summary: `Module ${source.order} gedupliceerd naar module ${created.order}: ${created.title}.`,
      },
    });
  });

  if (shouldNotifyCourseUpdate) {
    await createCourseNotifications(courseId, "updated");
  }
  await revalidateLearningPaths({ courseId });
}

export async function moveCourseBuilderModuleAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  const moduleId = getString(formData, "moduleId");
  const direction = getString(formData, "direction");

  assert(courseId, "Cursus ontbreekt.");
  assert(moduleId, "Module ontbreekt.");
  assert(direction === "up" || direction === "down", "Richting ontbreekt.");

  const { course, activeVersion } = await getActiveVersionForManagement(courseId);
  const reordered = reorderModulesAfterMove(activeVersion.modules, moduleId, direction);
  const moved = activeVersion.modules.find((entry) => entry.id === moduleId);
  assert(moved, "Module niet gevonden.");
  const shouldNotifyCourseUpdate = course.status === "PUBLISHED";

  await prisma.$transaction(async (tx) => {
    for (const courseModule of reordered) {
      await tx.courseModule.update({ where: { id: courseModule.id }, data: { order: -courseModule.order } });
    }
    for (const courseModule of reordered) {
      await tx.courseModule.update({ where: { id: courseModule.id }, data: { order: courseModule.order } });
    }
    await tx.courseChangeLog.create({
      data: {
        courseId,
        courseVersionId: activeVersion.id,
        changedById: user.id,
        changeType: "LMS_MODULE_REORDERED",
        summary: `Modulevolgorde aangepast voor ${moved.title}.`,
      },
    });
  });

  if (shouldNotifyCourseUpdate) {
    await createCourseNotifications(courseId, "updated");
  }
  await revalidateLearningPaths({ courseId });
}

export async function deleteCourseBuilderModuleAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  const moduleId = getString(formData, "moduleId");

  assert(courseId, "Cursus ontbreekt.");
  assert(moduleId, "Module ontbreekt.");

  const { course, activeVersion } = await getActiveVersionForManagement(courseId);
  const courseModule = activeVersion.modules.find((entry) => entry.id === moduleId);
  assert(courseModule, "Module niet gevonden.");
  const linkedLessons = activeVersion.lessons.filter((lesson) => lesson.moduleId === moduleId);
  const linkedObjectiveCount = activeVersion.objectives.filter((objective) => objective.moduleId === moduleId).length;
  const linkedLiteratureCount = activeVersion.literature.filter((reference) => reference.moduleId === moduleId).length;
  const linkedCompetencyCount = activeVersion.competencies.filter((reference) => reference.moduleId === moduleId).length;
  assert(linkedLessons.length === 0, "Verplaats of verwijder eerst de lessen in deze module.");
  assert(
    linkedObjectiveCount + linkedLiteratureCount + linkedCompetencyCount === 0,
    "Ontkoppel eerst leerdoelen, literatuur en competenties van deze module.",
  );
  const shouldNotifyCourseUpdate = course.status === "PUBLISHED";

  await prisma.$transaction(async (tx) => {
    await tx.courseModule.delete({ where: { id: moduleId } });
    const remainingModules = activeVersion.modules.filter((entry) => entry.id !== moduleId);
    const normalized = remainingModules
      .sort((left, right) => left.order - right.order)
      .map((entry, index) => ({ id: entry.id, order: index + 1 }));
    for (const entry of normalized) {
      await tx.courseModule.update({ where: { id: entry.id }, data: { order: entry.order } });
    }
    await tx.courseChangeLog.create({
      data: {
        courseId,
        courseVersionId: activeVersion.id,
        changedById: user.id,
        changeType: "LMS_MODULE_DELETED",
        summary: `Module ${courseModule.order}: ${courseModule.title} verwijderd.`,
      },
    });
  });

  if (shouldNotifyCourseUpdate) {
    await createCourseNotifications(courseId, "updated");
  }
  await revalidateLearningPaths({ courseId });
}

export async function saveCourseBuilderLessonAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  const moduleId = getOptionalString(formData, "moduleId");
  const lessonId = getOptionalString(formData, "lessonId");

  assert(courseId, "Cursus ontbreekt.");

  const lessonInput = parseLessonBuilderInput({
    title: getString(formData, "lessonTitle"),
    description: getOptionalString(formData, "lessonDescription"),
    type: getString(formData, "lessonType"),
    content: getString(formData, "lessonContent"),
    mediaUrl: getOptionalString(formData, "lessonMediaUrl"),
    mediaLabel: getOptionalString(formData, "lessonMediaLabel"),
    order: getString(formData, "lessonOrder"),
    estimatedMinutes: getString(formData, "lessonEstimatedMinutes"),
    isRequired: formData.get("lessonIsRequired") === "on",
  });

  const { course, activeVersion } = await getActiveVersionForManagement(courseId);
  assert(!moduleId || activeVersion.modules.some((entry) => entry.id === moduleId), "Module hoort niet bij deze cursusversie.");
  const existingLesson = lessonId ? activeVersion.lessons.find((entry) => entry.id === lessonId) : null;
  assert(!lessonId || existingLesson, "Les niet gevonden.");
  const shouldNotifyCourseUpdate = course.status === "PUBLISHED";

  await prisma.$transaction(async (tx) => {
    const savedLesson = existingLesson
      ? await tx.lesson.update({
          where: { id: existingLesson.id },
          data: {
            moduleId,
            title: lessonInput.title,
            description: lessonInput.description,
            type: lessonInput.type,
            content: lessonInput.content,
            order: lessonInput.order,
            estimatedMinutes: lessonInput.estimatedMinutes,
            isRequired: lessonInput.isRequired,
          },
          select: { id: true, title: true },
        })
      : await tx.lesson.create({
          data: {
            courseVersionId: activeVersion.id,
            moduleId,
            title: lessonInput.title,
            slug: buildLessonSlug(lessonInput.title, activeVersion.lessons.map((lesson) => lesson.slug)),
            description: lessonInput.description,
            type: lessonInput.type,
            content: lessonInput.content,
            order: lessonInput.order,
            estimatedMinutes: lessonInput.estimatedMinutes,
            isRequired: lessonInput.isRequired,
          },
          select: { id: true, title: true },
        });

    await tx.courseChangeLog.create({
      data: {
        courseId,
        courseVersionId: activeVersion.id,
        changedById: user.id,
        changeType: existingLesson ? "LMS_LESSON_UPDATED" : "LMS_LESSON_CREATED",
        summary: `Les ${savedLesson.title} ${existingLesson ? "bijgewerkt" : "aangemaakt"}.`,
      },
    });
  });

  if (shouldNotifyCourseUpdate) {
    await createCourseNotifications(courseId, "updated");
  }
  await revalidateLearningPaths({ courseId, lessonId: existingLesson?.id });
}

export async function saveCourseAccreditationStructureAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  assert(courseId, "Cursus ontbreekt.");

  const modules = parseModulesInput(getString(formData, "modules"));
  const objectives = parseLearningObjectivesInput(getString(formData, "learningObjectives"));
  const literature = parseLiteratureReferencesInput(getString(formData, "literature"));
  const competencies = parseCompetencyReferencesInput(getString(formData, "competencies"));
  const changeSummary = getOptionalString(formData, "changeSummary") ?? "Accreditatie-structuur bijgewerkt.";

  assert(objectives.length >= 3 && objectives.length <= 6, "Vul 3 tot 6 leerdoelen in.");

  const { course, activeVersion } = await getActiveVersionForManagement(courseId);
  const shouldNotifyCourseUpdate = course.status === "PUBLISHED";

  await prisma.$transaction(async (tx) => {
    const modulesByOrder = new Map<number, { id: string }>();

    for (const courseModule of modules) {
      const existingModule = activeVersion.modules.find((entry) => entry.order === courseModule.order);
      const savedModule = existingModule
        ? await tx.courseModule.update({
            where: { id: existingModule.id },
            data: {
              title: courseModule.title,
              introduction: courseModule.introduction,
              summary: courseModule.summary,
              estimatedMinutes: courseModule.estimatedMinutes,
              workForms: courseModule.workForms,
            },
            select: { id: true },
          })
        : await tx.courseModule.create({
            data: {
              courseVersionId: activeVersion.id,
              order: courseModule.order,
              title: courseModule.title,
              introduction: courseModule.introduction,
              summary: courseModule.summary,
              estimatedMinutes: courseModule.estimatedMinutes,
              workForms: courseModule.workForms,
            },
            select: { id: true },
          });

      modulesByOrder.set(courseModule.order, savedModule);
    }

    await tx.questionLearningObjective.deleteMany({
      where: { learningObjective: { courseVersionId: activeVersion.id } },
    });
    await tx.learningObjective.deleteMany({ where: { courseVersionId: activeVersion.id } });
    await tx.literatureReference.deleteMany({ where: { courseVersionId: activeVersion.id } });
    await tx.competencyReference.deleteMany({ where: { courseVersionId: activeVersion.id } });

    await tx.learningObjective.createMany({
      data: objectives.map((objective) => ({
        courseVersionId: activeVersion.id,
        moduleId: objective.moduleOrder ? modulesByOrder.get(objective.moduleOrder)?.id ?? null : null,
        code: objective.code,
        text: objective.text,
        order: objective.order,
      })),
    });

    await tx.literatureReference.createMany({
      data: literature.map((reference) => ({
        courseVersionId: activeVersion.id,
        moduleId: reference.moduleOrder ? modulesByOrder.get(reference.moduleOrder)?.id ?? null : null,
        title: reference.title,
        source: reference.source,
        url: reference.url,
        guideline: reference.guideline,
        year: reference.year,
        order: reference.order,
      })),
    });

    await tx.competencyReference.createMany({
      data: competencies.map((reference) => ({
        courseVersionId: activeVersion.id,
        moduleId: reference.moduleOrder ? modulesByOrder.get(reference.moduleOrder)?.id ?? null : null,
        name: reference.name,
        framework: reference.framework,
        description: reference.description,
      })),
    });

    await tx.courseVersion.update({
      where: { id: activeVersion.id },
      data: { changeSummary },
    });

    await tx.courseChangeLog.create({
      data: {
        courseId,
        courseVersionId: activeVersion.id,
        changedById: user.id,
        changeType: "ACCREDITATION_STRUCTURE",
        summary: changeSummary,
      },
    });
  });

  if (shouldNotifyCourseUpdate) {
    await createCourseNotifications(courseId, "updated");
  }
  await revalidateLearningPaths({ courseId });
}

export async function saveAssessmentBuilderAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  const assessmentId = getOptionalString(formData, "assessmentId");
  const title = getString(formData, "assessmentTitle");
  const description = getOptionalString(formData, "assessmentDescription");
  const lessonId = getOptionalString(formData, "assessmentLessonId");
  const passPercentage = getOptionalNumber(formData, "passPercentage") ?? 70;
  const maxAttempts = getOptionalNumber(formData, "maxAttempts") ?? 3;
  const timeLimitMinutes = getOptionalNumber(formData, "timeLimitMinutes");

  assert(courseId, "Cursus ontbreekt.");
  assert(title.length >= 3, "Toetstitel is te kort.");
  assert(passPercentage >= 1 && passPercentage <= 100, "Slagingsnorm moet tussen 1 en 100 liggen.");
  assert(maxAttempts > 0, "Maximum pogingen is verplicht.");

  const { course, activeVersion } = await getActiveVersionForManagement(courseId);
  const shouldNotifyCourseUpdate = course.status === "PUBLISHED";
  const normalizedLessonId = lessonId && lessonId !== "__none" ? lessonId : null;
  if (normalizedLessonId) {
    assert(
      activeVersion.lessons.some((lesson) => lesson.id === normalizedLessonId),
      "Gekoppelde toetsles hoort niet bij deze cursusversie.",
    );
  }

  if (assessmentId) {
    const existingAssessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    assert(existingAssessment?.courseVersionId === activeVersion.id, "Toets hoort niet bij de actieve cursusversie.");
  }

  if (normalizedLessonId) {
    const duplicateLessonAssessment = await prisma.assessment.findFirst({
      where: {
        courseVersionId: activeVersion.id,
        lessonId: normalizedLessonId,
        ...(assessmentId ? { id: { not: assessmentId } } : {}),
      },
    });
    assert(!duplicateLessonAssessment, "Deze toetsles heeft al een gekoppelde toets.");
  }

  await prisma.$transaction(async (tx) => {
    const assessment = assessmentId
      ? await tx.assessment.update({
          where: { id: assessmentId },
          data: {
            title,
            description,
            lessonId: normalizedLessonId,
            passPercentage,
            maxAttempts,
            timeLimitMinutes,
            shuffleQuestions: formData.get("shuffleQuestions") === "on",
            shuffleOptions: formData.get("shuffleOptions") === "on",
            isRequiredForCompletion: formData.get("isRequiredForCompletion") === "on",
          },
        })
      : await tx.assessment.create({
          data: {
            courseVersionId: activeVersion.id,
            title,
            description,
            lessonId: normalizedLessonId,
            passPercentage,
            maxAttempts,
            timeLimitMinutes,
            shuffleQuestions: formData.get("shuffleQuestions") === "on",
            shuffleOptions: formData.get("shuffleOptions") === "on",
            isRequiredForCompletion: formData.get("isRequiredForCompletion") === "on",
          },
        });

    await tx.courseChangeLog.create({
      data: {
        courseId,
        courseVersionId: activeVersion.id,
        changedById: user.id,
        changeType: assessmentId ? "ASSESSMENT_UPDATED" : "ASSESSMENT_CREATED",
        summary: `${assessmentId ? "Toets bijgewerkt" : "Toets aangemaakt"}: ${assessment.title}.`,
      },
    });
  });

  if (shouldNotifyCourseUpdate) {
    await createCourseNotifications(courseId, "updated");
  }
  await revalidateLearningPaths({ courseId, lessonId: normalizedLessonId ?? undefined });
}

export async function saveAssessmentQuestionAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  const assessmentId = getString(formData, "assessmentId");
  const questionId = getOptionalString(formData, "questionId");

  assert(courseId, "Cursus ontbreekt.");
  assert(assessmentId, "Toets ontbreekt.");

  const { course, activeVersion } = await getActiveVersionForManagement(courseId);
  const shouldNotifyCourseUpdate = course.status === "PUBLISHED";
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  assert(assessment?.courseVersionId === activeVersion.id, "Toets hoort niet bij de actieve cursusversie.");

  const questionInput = parseQuestionBuilderInput({
    prompt: getString(formData, "questionPrompt"),
    type: getString(formData, "questionType"),
    explanation: getOptionalString(formData, "questionExplanation"),
    order: getString(formData, "questionOrder"),
    points: getString(formData, "questionPoints"),
    options: getOptionalString(formData, "questionOptions"),
    objectiveIds: formData.getAll("objectiveIds").map((value) => String(value)),
  });

  const objectiveIds = new Set(activeVersion.objectives.map((objective) => objective.id));
  assert(questionInput.objectiveIds.every((objectiveId) => objectiveIds.has(objectiveId)), "Een gekoppeld leerdoel hoort niet bij deze cursusversie.");

  if (questionId) {
    const existingQuestion = await prisma.question.findUnique({ where: { id: questionId } });
    assert(existingQuestion?.assessmentId === assessmentId, "Vraag hoort niet bij deze toets.");
  }

  await prisma.$transaction(async (tx) => {
    const question = questionId
      ? await tx.question.update({
          where: { id: questionId },
          data: {
            type: questionInput.type,
            prompt: questionInput.prompt,
            explanation: questionInput.explanation,
            order: questionInput.order,
            points: questionInput.points,
          },
        })
      : await tx.question.create({
          data: {
            assessmentId,
            type: questionInput.type,
            prompt: questionInput.prompt,
            explanation: questionInput.explanation,
            order: questionInput.order,
            points: questionInput.points,
          },
        });

    await tx.questionLearningObjective.deleteMany({ where: { questionId: question.id } });
    await tx.questionOption.deleteMany({ where: { questionId: question.id } });

    if (questionInput.options.length) {
      await tx.questionOption.createMany({
        data: questionInput.options.map((option) => ({
          questionId: question.id,
          label: option.label,
          isCorrect: option.isCorrect,
          order: option.order,
        })),
      });
    }

    await tx.questionLearningObjective.createMany({
      data: questionInput.objectiveIds.map((learningObjectiveId) => ({
        questionId: question.id,
        learningObjectiveId,
      })),
      skipDuplicates: true,
    });

    await tx.courseChangeLog.create({
      data: {
        courseId,
        courseVersionId: activeVersion.id,
        changedById: user.id,
        changeType: questionId ? "QUESTION_UPDATED" : "QUESTION_CREATED",
        summary: `${questionId ? "Toetsvraag bijgewerkt" : "Toetsvraag toegevoegd"}: ${assessment.title}.`,
      },
    });
  });

  if (shouldNotifyCourseUpdate) {
    await createCourseNotifications(courseId, "updated");
  }
  await revalidateLearningPaths({ courseId, lessonId: assessment.lessonId ?? undefined });
}

export async function deleteAssessmentQuestionAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  const assessmentId = getString(formData, "assessmentId");
  const questionId = getString(formData, "questionId");

  assert(courseId, "Cursus ontbreekt.");
  assert(assessmentId, "Toets ontbreekt.");
  assert(questionId, "Vraag ontbreekt.");

  const { course, activeVersion } = await getActiveVersionForManagement(courseId);
  const shouldNotifyCourseUpdate = course.status === "PUBLISHED";
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { assessment: true, answers: true },
  });
  assert(question?.assessmentId === assessmentId, "Vraag hoort niet bij deze toets.");
  assert(question.assessment.courseVersionId === activeVersion.id, "Toetsvraag hoort niet bij de actieve cursusversie.");
  assert(question.answers.length === 0, "Deze vraag heeft al antwoorden/pogingen. Archiveer of maak een nieuwe toetsversie in plaats van verwijderen.");

  await prisma.$transaction(async (tx) => {
    await tx.questionLearningObjective.deleteMany({ where: { questionId } });
    await tx.questionOption.deleteMany({ where: { questionId } });
    await tx.question.delete({ where: { id: questionId } });
    await tx.courseChangeLog.create({
      data: {
        courseId,
        courseVersionId: activeVersion.id,
        changedById: user.id,
        changeType: "QUESTION_DELETED",
        summary: `Toetsvraag verwijderd uit ${question.assessment.title}.`,
      },
    });
  });

  if (shouldNotifyCourseUpdate) {
    await createCourseNotifications(courseId, "updated");
  }
  await revalidateLearningPaths({ courseId, lessonId: question.assessment.lessonId ?? undefined });
}

export async function saveAssessmentAccreditationRulesAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  const assessmentId = getString(formData, "assessmentId");
  const passPercentage = getOptionalNumber(formData, "passPercentage");
  const maxAttempts = getOptionalNumber(formData, "maxAttempts");

  assert(courseId, "Cursus ontbreekt.");
  assert(assessmentId, "Toets ontbreekt.");
  assert(passPercentage !== null && passPercentage > 0, "Slagingsnorm is verplicht.");
  assert(maxAttempts !== null && maxAttempts > 0, "Maximum pogingen is verplicht.");

  const { course, activeVersion } = await getActiveVersionForManagement(courseId);
  const shouldNotifyCourseUpdate = course.status === "PUBLISHED";
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  assert(assessment?.courseVersionId === activeVersion.id, "Toets hoort niet bij de actieve cursusversie.");

  await prisma.$transaction(async (tx) => {
    await tx.assessment.update({
      where: { id: assessmentId },
      data: {
        passPercentage,
        maxAttempts,
        shuffleQuestions: formData.get("shuffleQuestions") === "on",
        shuffleOptions: formData.get("shuffleOptions") === "on",
        isRequiredForCompletion: formData.get("isRequiredForCompletion") === "on",
      },
    });

    await tx.courseChangeLog.create({
      data: {
        courseId,
        courseVersionId: activeVersion.id,
        changedById: user.id,
        changeType: "ASSESSMENT_RULES",
        summary: `Toetsnormen bijgewerkt voor ${assessment.title}.`,
      },
    });
  });

  if (shouldNotifyCourseUpdate) {
    await createCourseNotifications(courseId, "updated");
  }
  await revalidateLearningPaths({ courseId });
}

export async function applyStandardEvaluationTemplateAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  assert(courseId, "Cursus ontbreekt.");

  const { course, activeVersion } = await getActiveVersionForManagement(courseId);
  const shouldNotifyCourseUpdate = course.status === "PUBLISHED";
  const questions = buildStandardEvaluationQuestionTemplate();

  await prisma.$transaction(async (tx) => {
    const existingForm = await tx.evaluationForm.findFirst({
      where: { courseVersionId: activeVersion.id, title: STANDARD_EVALUATION_FORM_TITLE },
      select: { id: true },
    });

    const form = existingForm
      ? await tx.evaluationForm.update({
          where: { id: existingForm.id },
          data: { isRequired: true },
          select: { id: true },
        })
      : await tx.evaluationForm.create({
          data: {
            courseVersionId: activeVersion.id,
            title: STANDARD_EVALUATION_FORM_TITLE,
            isRequired: true,
          },
          select: { id: true },
        });

    await tx.evaluationQuestion.deleteMany({ where: { evaluationFormId: form.id } });
    await tx.evaluationQuestion.createMany({
      data: questions.map((question) => ({
        evaluationFormId: form.id,
        label: question.label,
        type: question.type,
        order: question.order,
        isRequired: question.isRequired,
      })),
    });

    await tx.courseChangeLog.create({
      data: {
        courseId,
        courseVersionId: activeVersion.id,
        changedById: user.id,
        changeType: "EVALUATION_TEMPLATE",
        summary: "Standaardevaluatie Kwaliteitshuis toegepast.",
      },
    });
  });

  if (shouldNotifyCourseUpdate) {
    await createCourseNotifications(courseId, "updated");
  }
  await revalidateLearningPaths({ courseId });
}

export async function markRequiredLiteratureReadAction(formData: FormData) {
  const user = await requireUser();
  const courseId = getString(formData, "courseId");

  assert(courseId, "Cursus ontbreekt.");

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      enrollments: {
        where: { userId: user.id },
        select: { id: true },
      },
      versions: {
        where: { isActive: true },
        include: {
          lessons: { orderBy: { order: "asc" } },
          literature: true,
        },
      },
    },
  });

  assert(course, "Cursus niet gevonden.");
  const activeVersion = course.versions[0] ?? null;
  assert(activeVersion, "Geen actieve cursusversie gevonden.");

  const canMarkLiterature =
    user.role === "BEHEERDER" ||
    (user.role === "REVIEWER" && course.reviewerId === user.id) ||
    course.enrollments.length > 0;
  assert(canMarkLiterature, "Je hebt geen toegang tot deze verplichte literatuur.");

  const requiredLiterature = activeVersion.literature.filter((reference) =>
    reference.guideline?.toLowerCase().includes("verplichte"),
  );
  assert(requiredLiterature.length > 0, "Er is geen verplichte literatuur gekoppeld aan deze cursus.");

  const progressLesson = getRequiredLiteratureProgressLesson(activeVersion.lessons);
  assert(progressLesson, "Geen voortgangsanker gevonden voor de verplichte literatuur.");

  await upsertLessonStepProgress({
    userId: user.id,
    lessonId: progressLesson.id,
    stepKey: REQUIRED_LITERATURE_STEP_KEY,
  });

  revalidatePath(`/lms/courses/${courseId}`);
  revalidatePath(`/lms/courses/${courseId}/literature`);
  revalidatePath("/academy");
  redirect(`/lms/courses/${courseId}/literature?gelezen=1`);
}

export async function submitCourseEvaluationAction(formData: FormData) {
  const user = await requireUser();
  const courseId = getString(formData, "courseId");
  const evaluationFormId = getString(formData, "evaluationFormId");
  const actualStudyMinutes = getOptionalNumber(formData, "actualStudyMinutes");

  assert(courseId, "Cursus ontbreekt.");
  assert(evaluationFormId, "Evaluatieformulier ontbreekt.");

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      enrollments: {
        where: { userId: user.id },
        select: { id: true },
      },
      versions: {
        where: { isActive: true },
        include: {
          evaluationForms: {
            include: { questions: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });

  assert(course, "Cursus niet gevonden.");
  const activeVersion = course.versions[0] ?? null;
  assert(activeVersion, "Geen actieve cursusversie gevonden.");

  const evaluationForm = activeVersion.evaluationForms.find((form) => form.id === evaluationFormId) ?? null;
  assert(evaluationForm, "Evaluatieformulier hoort niet bij deze cursus.");

  const canSubmitEvaluation =
    user.role === "BEHEERDER" ||
    (user.role === "REVIEWER" && course.reviewerId === user.id) ||
    course.enrollments.length > 0;
  assert(canSubmitEvaluation, "Je hebt geen toegang tot deze evaluatie.");

  const answers = buildEvaluationAnswerRecords(evaluationForm.questions, (fieldName) => formData.get(fieldName));

  await prisma.$transaction(async (tx) => {
    const existingSubmission = await tx.evaluationSubmission.findUnique({
      where: {
        evaluationFormId_userId: {
          evaluationFormId,
          userId: user.id,
        },
      },
      select: { id: true },
    });

    const submission = existingSubmission
      ? await tx.evaluationSubmission.update({
          where: { id: existingSubmission.id },
          data: {
            submittedAt: new Date(),
            actualStudyMinutes,
          },
          select: { id: true },
        })
      : await tx.evaluationSubmission.create({
          data: {
            evaluationFormId,
            userId: user.id,
            actualStudyMinutes,
          },
          select: { id: true },
        });

    await tx.evaluationAnswer.deleteMany({ where: { evaluationSubmissionId: submission.id } });
    await tx.evaluationAnswer.createMany({
      data: answers.map((answer) => ({
        evaluationSubmissionId: submission.id,
        evaluationQuestionId: answer.evaluationQuestionId,
        rating: answer.rating ?? null,
        text: answer.text ?? null,
        booleanValue: answer.booleanValue ?? null,
      })),
    });
  });

  revalidatePath(`/lms/courses/${courseId}`);
  revalidatePath(`/lms/courses/${courseId}/evaluation`);
  redirect(`/lms/courses/${courseId}/evaluation?ingediend=1`);
}

export async function publishCourseAccreditationReadyAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  assert(courseId, "Cursus ontbreekt.");

  const course = await getCourseDetail(courseId);
  assert(course, "Cursus niet gevonden.");
  assert(course.activeVersion, "Geen actieve cursusversie gevonden.");

  const checklist = buildAccreditationChecklist({
    title: course.title,
    audience: course.audience,
    accreditationRegister: course.accreditationRegister,
    accreditationKind: course.accreditationKind,
    accreditationActivityId: course.accreditationActivityId,
    providerName: course.providerName,
    providerSignatureName: course.providerSignatureName,
    studyLoadMinutes: course.studyLoadMinutes,
    versionDate: course.versionDate,
    authorExperts: course.authorExperts,
    requiredQuestionCount: course.requiredQuestionCount,
    reviewerName: course.reviewerName,
    activeVersion: course.activeVersion,
    changeLogCount: course.activeVersion.changeLogs.length,
  });

  assertAccreditationPublishable(checklist);

  await prisma.$transaction(async (tx) => {
    await tx.course.update({
      where: { id: courseId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    await tx.courseVersion.update({
      where: { id: course.activeVersion!.id },
      data: { changeSummary: "E-learning accreditatie-ready gepubliceerd." },
    });

    await tx.courseChangeLog.create({
      data: {
        courseId,
        courseVersionId: course.activeVersion!.id,
        changedById: user.id,
        changeType: "ACCREDITATION_PUBLISHED",
        summary: "E-learning gepubliceerd na groene accreditatiechecklist.",
      },
    });
  });

  await createCourseNotifications(courseId, course.status === "PUBLISHED" ? "updated" : "published");
  await revalidateLearningPaths({ courseId });
}
