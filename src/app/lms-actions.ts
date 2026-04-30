"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAssessmentAnswerRecords } from "@/lib/lms/action-helpers";
import { issueCertificate } from "@/lib/lms/certificates";
import { isCourseCompleted } from "@/lib/lms/rules";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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
  role: "MEDEWERKER" | "TEAMLEIDER" | "BEHEERDER" | "REVIEWER";
  courseId: string;
}) {
  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: { id: true, status: true },
  });

  assert(course, "Cursus niet gevonden.");
  assert(
    params.role === "BEHEERDER" || params.role === "REVIEWER" || course.status === "PUBLISHED",
    "Cursus is niet beschikbaar."
  );
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

export async function startAssessmentAttemptAction(formData: FormData) {
  const user = await requireUser();
  const courseId = getString(formData, "courseId");
  const assessmentId = getString(formData, "assessmentId");

  assert(courseId, "Cursus ontbreekt.");
  assert(assessmentId, "Toets ontbreekt.");

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
            courseVersion: true,
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
