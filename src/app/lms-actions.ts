"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildAssessmentAnswerRecords } from "@/lib/lms/action-helpers";
import {
  parseAuthorExpertsInput,
  parseCompetencyReferencesInput,
  parseLearningObjectivesInput,
  parseLiteratureReferencesInput,
  parseModulesInput,
} from "@/lib/lms/accreditation-admin";
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
        include: { modules: true },
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


export async function saveCourseAccreditationMetadataAction(formData: FormData) {
  const user = await requireAccreditationManager();
  const courseId = getString(formData, "courseId");
  assert(courseId, "Cursus ontbreekt.");

  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const studyLoadMinutes = getOptionalNumber(formData, "studyLoadMinutes");
  const requiredQuestionCount = getOptionalNumber(formData, "requiredQuestionCount");
  const accreditationKind = getString(formData, "accreditationKind");
  const changeSummary = getOptionalString(formData, "changeSummary") ?? "Accreditatie-metadata bijgewerkt.";

  assert(title, "Titel is verplicht.");
  assert(description, "Beschrijving is verplicht.");
  assert(studyLoadMinutes !== null && studyLoadMinutes > 0, "Studielast moet groter zijn dan 0.");
  assert(
    accreditationKind === "VAKINHOUDELIJK" || accreditationKind === "BEROEPSGERELATEERD",
    "Ongeldige accreditatiesoort."
  );

  const { activeVersion } = await getActiveVersionForManagement(courseId);

  await prisma.$transaction(async (tx) => {
    await tx.course.update({
      where: { id: courseId },
      data: {
        title,
        description,
        audience: getOptionalString(formData, "audience"),
        accreditationRegister: getOptionalString(formData, "accreditationRegister"),
        accreditationKind,
        studyLoadMinutes,
        requiredQuestionCount,
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

  await revalidateLearningPaths({ courseId });
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

  const { activeVersion } = await getActiveVersionForManagement(courseId);

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

  await revalidateLearningPaths({ courseId });
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

  const { activeVersion } = await getActiveVersionForManagement(courseId);
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

  await revalidateLearningPaths({ courseId });
}
