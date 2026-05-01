import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";

import { buildDemoElearningSeedSpec } from "./demo-elearning-seed-data.ts";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://placeholder:***@localhost:5432/fyfitacademy?schema=public",
  }),
});

async function deleteDemoCourse(courseSlug: string) {
  const existingCourse = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      versions: {
        include: {
          lessons: true,
          assessments: {
            include: {
              questions: true,
            },
          },
          evaluationForms: true,
        },
      },
      enrollments: true,
      certificates: true,
    },
  });

  if (!existingCourse) {
    return;
  }

  const versionIds = existingCourse.versions.map((version) => version.id);
  const lessonIds = existingCourse.versions.flatMap((version) =>
    version.lessons.map((lesson) => lesson.id)
  );
  const assessmentIds = existingCourse.versions.flatMap((version) =>
    version.assessments.map((assessment) => assessment.id)
  );
  const questionIds = existingCourse.versions.flatMap((version) =>
    version.assessments.flatMap((assessment) => assessment.questions.map((question) => question.id))
  );
  const evaluationFormIds = existingCourse.versions.flatMap((version) =>
    version.evaluationForms.map((form) => form.id)
  );
  const enrollmentIds = existingCourse.enrollments.map((enrollment) => enrollment.id);
  const certificateIds = existingCourse.certificates.map((certificate) => certificate.id);

  await prisma.$transaction(async (tx) => {
    if (questionIds.length > 0) {
      await tx.assessmentAnswer.deleteMany({ where: { questionId: { in: questionIds } } });
      await tx.questionLearningObjective.deleteMany({ where: { questionId: { in: questionIds } } });
      await tx.questionOption.deleteMany({ where: { questionId: { in: questionIds } } });
    }

    if (assessmentIds.length > 0) {
      await tx.assessmentAttempt.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
      await tx.question.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
      await tx.assessment.deleteMany({ where: { id: { in: assessmentIds } } });
    }

    if (evaluationFormIds.length > 0) {
      await tx.evaluationAnswer.deleteMany({
        where: { question: { evaluationFormId: { in: evaluationFormIds } } },
      });
      await tx.evaluationSubmission.deleteMany({
        where: { evaluationFormId: { in: evaluationFormIds } },
      });
      await tx.evaluationQuestion.deleteMany({
        where: { evaluationFormId: { in: evaluationFormIds } },
      });
      await tx.evaluationForm.deleteMany({ where: { id: { in: evaluationFormIds } } });
    }

    if (lessonIds.length > 0) {
      await tx.lessonProgress.deleteMany({ where: { lessonId: { in: lessonIds } } });
      await tx.lesson.deleteMany({ where: { id: { in: lessonIds } } });
    }

    if (certificateIds.length > 0) {
      await tx.certificate.deleteMany({ where: { id: { in: certificateIds } } });
    }

    if (enrollmentIds.length > 0) {
      await tx.enrollment.deleteMany({ where: { id: { in: enrollmentIds } } });
    }

    if (versionIds.length > 0) {
      await tx.courseChangeLog.deleteMany({ where: { courseVersionId: { in: versionIds } } });
      await tx.questionLearningObjective.deleteMany({
        where: { learningObjective: { courseVersionId: { in: versionIds } } },
      });
      await tx.learningObjective.deleteMany({ where: { courseVersionId: { in: versionIds } } });
      await tx.literatureReference.deleteMany({ where: { courseVersionId: { in: versionIds } } });
      await tx.competencyReference.deleteMany({ where: { courseVersionId: { in: versionIds } } });
      await tx.courseModule.deleteMany({ where: { courseVersionId: { in: versionIds } } });
      await tx.courseVersion.deleteMany({ where: { id: { in: versionIds } } });
    }

    await tx.courseChangeLog.deleteMany({ where: { courseId: existingCourse.id } });
    await tx.course.delete({ where: { id: existingCourse.id } });
  });
}

async function main() {
  const demoSeed = buildDemoElearningSeedSpec();

  const [admin, reviewer] = await Promise.all([
    prisma.user.findFirst({
      where: { role: Role.BEHEERDER, isActive: true },
      orderBy: { email: "asc" },
    }),
    prisma.user.findFirst({
      where: { role: Role.REVIEWER, isActive: true },
      orderBy: { email: "asc" },
    }),
  ]);

  if (!admin) {
    throw new Error("Geen actieve beheerder gevonden voor demo-import.");
  }

  await deleteDemoCourse(demoSeed.cleanup.courseSlug);

  const createdCourse = await prisma.course.create({
    data: {
      title: demoSeed.course.title,
      slug: demoSeed.course.slug,
      description: demoSeed.course.description,
      audience: demoSeed.course.audience,
      learningObjectives: demoSeed.course.learningObjectives,
      goal: demoSeed.course.goal,
      focus: demoSeed.course.focus,
      learnerOutcomes: demoSeed.course.learnerOutcomes,
      accreditationRegister: demoSeed.course.accreditationRegister,
      accreditationKind: demoSeed.course.accreditationKind,
      versionDate: new Date(demoSeed.course.versionDate),
      authorExperts: demoSeed.course.authorExperts,
      requiredQuestionCount: demoSeed.course.requiredQuestionCount,
      studyLoadMinutes: demoSeed.course.studyLoadMinutes,
      status: demoSeed.course.status,
      isMandatory: demoSeed.course.isMandatory,
      authorId: admin.id,
      reviewerId: reviewer?.id,
      publishedAt: new Date(demoSeed.course.publishedAt),
      revisionDueAt: new Date(demoSeed.course.revisionDueAt),
      versions: {
        create: {
          versionNumber: demoSeed.version.versionNumber,
          changeSummary: demoSeed.version.changeSummary,
          isActive: demoSeed.version.isActive,
          createdById: admin.id,
        },
      },
    },
    include: { versions: true },
  });

  const activeVersion = createdCourse.versions[0];
  if (!activeVersion) {
    throw new Error("Demo-import kon geen actieve cursusversie aanmaken.");
  }

  const modulesByKey = new Map<string, { id: string }>();
  for (const moduleSpec of demoSeed.modules) {
    const courseModule = await prisma.courseModule.create({
      data: {
        courseVersionId: activeVersion.id,
        title: moduleSpec.title,
        description: moduleSpec.description,
        introduction: moduleSpec.introduction,
        summary: moduleSpec.summary,
        order: moduleSpec.order,
        estimatedMinutes: moduleSpec.estimatedMinutes,
        workForms: moduleSpec.workForms,
      },
    });
    modulesByKey.set(moduleSpec.key, courseModule);
  }

  const objectivesByCode = new Map<string, { id: string }>();
  for (const objectiveSpec of demoSeed.learningObjectives) {
    const courseModule = modulesByKey.get(objectiveSpec.moduleKey);
    const objective = await prisma.learningObjective.create({
      data: {
        courseVersionId: activeVersion.id,
        moduleId: courseModule?.id,
        code: objectiveSpec.code,
        text: objectiveSpec.text,
        order: objectiveSpec.order,
      },
    });
    objectivesByCode.set(objectiveSpec.code, objective);
  }

  for (const literatureSpec of demoSeed.literatureReferences) {
    const courseModule = modulesByKey.get(literatureSpec.moduleKey);
    await prisma.literatureReference.create({
      data: {
        courseVersionId: activeVersion.id,
        moduleId: courseModule?.id,
        title: literatureSpec.title,
        source: literatureSpec.source,
        url: literatureSpec.url,
        guideline: literatureSpec.guideline,
        year: literatureSpec.year,
        order: literatureSpec.order,
      },
    });
  }

  for (const competencySpec of demoSeed.competencyReferences) {
    const courseModule = modulesByKey.get(competencySpec.moduleKey);
    await prisma.competencyReference.create({
      data: {
        courseVersionId: activeVersion.id,
        moduleId: courseModule?.id,
        name: competencySpec.name,
        framework: competencySpec.framework,
        description: competencySpec.description,
      },
    });
  }

  await prisma.evaluationForm.create({
    data: {
      courseVersionId: activeVersion.id,
      title: demoSeed.evaluationForm.title,
      isRequired: demoSeed.evaluationForm.isRequired,
      questions: {
        create: demoSeed.evaluationForm.questions.map((question) => ({
          label: question.label,
          type: question.type,
          order: question.order,
          isRequired: question.isRequired,
        })),
      },
    },
  });

  const lessonModuleBySlug = new Map<string, string>();
  for (const moduleSpec of demoSeed.modules) {
    const courseModule = modulesByKey.get(moduleSpec.key);
    if (!courseModule) {
      continue;
    }
    for (const slug of moduleSpec.lessonSlugs) {
      lessonModuleBySlug.set(slug, courseModule.id);
    }
  }

  const createdLessons = await Promise.all(
    demoSeed.lessons.map((lesson) =>
      prisma.lesson.create({
        data: {
          courseVersionId: activeVersion.id,
          moduleId: lessonModuleBySlug.get(lesson.slug),
          title: lesson.title,
          slug: lesson.slug,
          description: lesson.description,
          type: lesson.type,
          content: lesson.content,
          order: lesson.order,
          isRequired: lesson.isRequired,
          estimatedMinutes: lesson.estimatedMinutes,
          publishedAt: new Date(demoSeed.course.publishedAt),
        },
      })
    )
  );

  const lessonsBySlug = new Map(createdLessons.map((lesson) => [lesson.slug, lesson]));
  for (const assessmentSpec of demoSeed.assessments) {
    const assessmentLesson = lessonsBySlug.get(assessmentSpec.lessonSlug);
    if (!assessmentLesson) {
      throw new Error(`Assessment lesson not found: ${assessmentSpec.lessonSlug}`);
    }

    const createdAssessment = await prisma.assessment.create({
      data: {
        courseVersionId: activeVersion.id,
        lessonId: assessmentLesson.id,
        title: assessmentSpec.title,
        description: assessmentSpec.description,
        passPercentage: assessmentSpec.passPercentage,
        maxAttempts: assessmentSpec.maxAttempts,
        timeLimitMinutes: assessmentSpec.timeLimitMinutes,
        shuffleQuestions: assessmentSpec.shuffleQuestions,
        shuffleOptions: assessmentSpec.shuffleOptions,
        showFeedbackImmediately: assessmentSpec.showFeedbackImmediately,
        isRequiredForCompletion: assessmentSpec.isRequiredForCompletion,
        questions: {
          create: assessmentSpec.questions.map((question, index) => ({
            type: question.type,
            prompt: question.prompt,
            explanation: question.explanation,
            order: index + 1,
            points: question.points,
            options: {
              create: question.options.map((option, optionIndex) => ({
                label: option.label,
                isCorrect: option.isCorrect,
                order: optionIndex + 1,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    for (const [index, questionSpec] of assessmentSpec.questions.entries()) {
      const createdQuestion = createdAssessment.questions[index];
      if (!createdQuestion) {
        continue;
      }

      await prisma.questionLearningObjective.createMany({
        data: questionSpec.learningObjectiveCodes.map((code) => {
          const objective = objectivesByCode.get(code);
          if (!objective) {
            throw new Error(`Learning objective not found for code ${code}`);
          }
          return {
            questionId: createdQuestion.id,
            learningObjectiveId: objective.id,
          };
        }),
      });
    }
  }

  await prisma.courseChangeLog.create({
    data: {
      courseId: createdCourse.id,
      courseVersionId: activeVersion.id,
      changedById: admin.id,
      changeType: "DEMO_IMPORT",
      summary: "Sprint 12A tijdelijke demo-e-learning Module 1 geïmporteerd.",
      details: {
        temporary: true,
        source: "OneDrive aangeleverd voorbeeldmateriaal",
        cleanupCourseSlug: demoSeed.cleanup.courseSlug,
        assetRoot: demoSeed.cleanup.assetRoot,
        moduleCount: demoSeed.modules.length,
        lessonCount: demoSeed.lessons.length,
        questionCount: demoSeed.assessments.reduce(
          (total, assessment) => total + assessment.questions.length,
          0
        ),
      },
    },
  });

  console.log(`Demo-e-learning geïmporteerd: ${createdCourse.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
