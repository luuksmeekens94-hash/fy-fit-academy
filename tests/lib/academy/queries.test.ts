import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAcademyCourseCardView,
  buildAcademyCourseDetailView,
  buildAcademyLessonDetailView,
} from "../../../src/lib/academy/mappers.ts";
import type {
  CourseDetail,
  EnrollmentDetail,
  LessonDetail,
  LessonProgressInfo,
} from "../../../src/lib/lms/types.ts";

function makeCourse(): CourseDetail {
  return {
    id: "course-1",
    title: "Consultvoering basis",
    slug: "consultvoering-basis",
    description: "Leer de basis van consultvoering binnen Fy-fit.",
    audience: "Nieuwe medewerkers",
    learningObjectives: "Samenvatten, kaderen en afsluiten.",
    goal: "Zeker en helder een consult kunnen openen en afronden.",
    focus: "Rust, regie en gezamenlijke besluitvorming.",
    learnerOutcomes: [
      "Je opent een consult met duidelijk kader.",
      "Je sluit af met een concrete volgende stap.",
    ],
    studyLoadMinutes: 55,
    status: "PUBLISHED",
    isMandatory: true,
    authorId: "user-1",
    authorName: "Sjoerd",
    reviewerId: null,
    reviewerName: null,
    publishedAt: new Date("2026-04-01T08:00:00.000Z"),
    revisionDueAt: new Date("2026-10-01T08:00:00.000Z"),
    createdAt: new Date("2026-03-01T08:00:00.000Z"),
    updatedAt: new Date("2026-04-01T08:00:00.000Z"),
    activeVersion: {
      id: "version-1",
      courseId: "course-1",
      versionNumber: "1.0",
      changeSummary: "Initial",
      isActive: true,
      createdAt: new Date("2026-04-01T08:00:00.000Z"),
      lessons: [
        {
          id: "lesson-1",
          title: "Intro",
          slug: "intro",
          type: "TEXT",
          order: 1,
          isRequired: true,
          estimatedMinutes: 10,
        },
        {
          id: "lesson-2",
          title: "Praktijkcasus",
          slug: "praktijkcasus",
          type: "CASE",
          order: 2,
          isRequired: true,
          estimatedMinutes: 15,
        },
        {
          id: "lesson-3",
          title: "Toets",
          slug: "toets",
          type: "ASSESSMENT",
          order: 3,
          isRequired: true,
          estimatedMinutes: 20,
        },
      ],
      assessments: [
        {
          id: "assessment-1",
          lessonId: "lesson-3",
          title: "Toets consultvoering",
          passPercentage: 80,
          maxAttempts: 3,
          isRequiredForCompletion: true,
        },
      ],
    },
  };
}

function makeEnrollment(): EnrollmentDetail {
  return {
    id: "enrollment-1",
    userId: "user-1",
    courseId: "course-1",
    courseTitle: "Consultvoering basis",
    courseSlug: "consultvoering-basis",
    status: "IN_PROGRESS",
    assignmentType: "REQUIRED",
    deadlineAt: new Date("2026-04-22T17:00:00.000Z"),
    startedAt: new Date("2026-04-08T09:00:00.000Z"),
    completedAt: null,
    progress: 33,
    activeVersionId: "version-1",
    lessonCount: 3,
    completedLessonCount: 1,
    requiredAssessmentCount: 1,
    passedRequiredAssessmentCount: 0,
    certificateId: null,
  };
}

function makeProgressEntries(): LessonProgressInfo[] {
  return [
    {
      lessonId: "lesson-1",
      status: "COMPLETED",
      completedAt: new Date("2026-04-08T09:10:00.000Z"),
    },
    {
      lessonId: "lesson-2",
      status: "IN_PROGRESS",
      completedAt: null,
    },
    {
      lessonId: "lesson-3",
      status: "NOT_STARTED",
      completedAt: null,
    },
  ];
}

function makeLesson(): LessonDetail {
  return {
    id: "lesson-2",
    courseVersionId: "version-1",
    title: "Praktijkcasus",
    slug: "praktijkcasus",
    description: "Werk een praktijksituatie door.",
    type: "CASE",
    content: "Casusinhoud",
    order: 2,
    isRequired: true,
    estimatedMinutes: 15,
  };
}

test("buildAcademyCourseCardView maps enrollment and intro metadata to Academy card copy", () => {
  const card = buildAcademyCourseCardView({
    course: makeCourse(),
    enrollment: makeEnrollment(),
  });

  assert.equal(card.slug, "consultvoering-basis");
  assert.equal(card.progressLabel, "33% afgerond");
  assert.equal(card.ctaLabel, "Ga verder");
  assert.equal(card.goal, "Zeker en helder een consult kunnen openen en afronden.");
});

test("buildAcademyCourseDetailView returns intro sections and lesson links in Academy order", () => {
  const detail = buildAcademyCourseDetailView({
    course: makeCourse(),
    enrollment: makeEnrollment(),
    progressEntries: makeProgressEntries(),
  });

  assert.deepEqual(detail.introSections.map((section) => section.label), [
    "Doel van deze e-learning",
    "Focus",
    "Leerdoelen",
  ]);
  assert.equal(detail.lessons[1]?.href, "/academy/consultvoering-basis/lessons/praktijkcasus");
  assert.equal(detail.lessons[1]?.status, "IN_PROGRESS");
});

test("buildAcademyLessonDetailView calculates previous and next lesson links", () => {
  const lessonView = buildAcademyLessonDetailView({
    course: makeCourse(),
    enrollment: makeEnrollment(),
    lesson: makeLesson(),
    progressEntries: makeProgressEntries(),
  });

  assert.equal(lessonView.sidebar.previousLesson?.href, "/academy/consultvoering-basis/lessons/intro");
  assert.equal(lessonView.sidebar.nextLesson?.href, "/academy/consultvoering-basis/lessons/toets");
  assert.equal(lessonView.sidebar.progressPercentage, 33);
});
