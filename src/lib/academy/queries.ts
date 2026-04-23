import "server-only";

import { cache } from "react";

import {
  getAssessmentDetail,
  getCourseBySlug,
  getEnrollmentDetailForUser,
  getLessonDetail,
  getLessonProgressForVersion,
  getMyAttempts,
} from "../lms/queries";
import type { CourseDetail, EnrollmentDetail } from "../lms/types";
import { prisma } from "../prisma";
import {
  buildAcademyCourseCardView,
  buildAcademyCourseDetailView,
  buildAcademyLessonDetailView,
} from "./mappers";
import type {
  AcademyCourseCardView,
  AcademyCourseDetailView,
  AcademyLessonDetailView,
} from "./types";

function buildDefaultEnrollmentDetail(userId: string, course: CourseDetail): EnrollmentDetail {
  const requiredAssessmentCount =
    course.activeVersion?.assessments.filter((assessment) => assessment.isRequiredForCompletion).length ?? 0;

  return {
    id: `virtual-${course.id}-${userId}`,
    userId,
    courseId: course.id,
    courseTitle: course.title,
    courseSlug: course.slug,
    status: "NOT_STARTED",
    assignmentType: course.isMandatory ? "REQUIRED" : "OPTIONAL",
    deadlineAt: null,
    startedAt: null,
    completedAt: null,
    progress: 0,
    activeVersionId: course.activeVersion?.id ?? null,
    lessonCount: course.activeVersion?.lessons.length ?? 0,
    completedLessonCount: 0,
    requiredAssessmentCount,
    passedRequiredAssessmentCount: 0,
    certificateId: null,
  };
}

async function getPublishedAcademyCourses(): Promise<CourseDetail[]> {
  const publishedCourses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  const entries = await Promise.all(publishedCourses.map((course) => getCourseBySlug(course.slug)));

  return entries.filter((entry): entry is CourseDetail => entry !== null);
}

export const getMyAcademyCourses = cache(async (userId: string): Promise<AcademyCourseCardView[]> => {
  const courses = await getPublishedAcademyCourses();
  const entries = await Promise.all(
    courses.map(async (course) => {
      const enrollmentDetail =
        (await getEnrollmentDetailForUser(userId, course.id)) ?? buildDefaultEnrollmentDetail(userId, course);

      return buildAcademyCourseCardView({
        course,
        enrollment: enrollmentDetail,
      });
    }),
  );

  return entries;
});

export const getAcademyCourseBySlugForUser = cache(
  async (
    userId: string,
    courseSlug: string,
    includeUnpublished = false,
  ): Promise<AcademyCourseDetailView | null> => {
    const course = await getCourseBySlug(courseSlug);

    if (!course || (!includeUnpublished && course.status !== "PUBLISHED")) {
      return null;
    }

    const enrollment =
      (await getEnrollmentDetailForUser(userId, course.id)) ?? buildDefaultEnrollmentDetail(userId, course);

    const progressEntries = course.activeVersion
      ? await getLessonProgressForVersion(userId, course.activeVersion.id)
      : [];

    return buildAcademyCourseDetailView({
      course,
      enrollment,
      progressEntries,
    });
  },
);

export const getAcademyLessonBySlugsForUser = cache(
  async (
    userId: string,
    courseSlug: string,
    lessonSlug: string,
    includeUnpublished = false,
  ): Promise<AcademyLessonDetailView | null> => {
    const course = await getCourseBySlug(courseSlug);

    if (!course || !course.activeVersion || (!includeUnpublished && course.status !== "PUBLISHED")) {
      return null;
    }

    const lessonSummary = course.activeVersion.lessons.find((lesson) => lesson.slug === lessonSlug);

    if (!lessonSummary) {
      return null;
    }

    const [lesson, progressEntries] = await Promise.all([
      getLessonDetail(lessonSummary.id),
      getLessonProgressForVersion(userId, course.activeVersion.id),
    ]);

    const enrollment =
      (await getEnrollmentDetailForUser(userId, course.id)) ?? buildDefaultEnrollmentDetail(userId, course);

    if (!lesson || lesson.courseVersionId !== course.activeVersion.id) {
      return null;
    }

    const assessmentSummary =
      lesson.type === "ASSESSMENT"
        ? course.activeVersion.assessments.find((assessment) => assessment.lessonId === lesson.id) ?? null
        : null;

    const [assessment, attempts] = assessmentSummary
      ? await Promise.all([
          getAssessmentDetail(assessmentSummary.id),
          getMyAttempts(userId, assessmentSummary.id),
        ])
      : [null, []];

    if (lesson.type === "ASSESSMENT" && !assessment) {
      return null;
    }

    return buildAcademyLessonDetailView({
      course,
      enrollment,
      lesson,
      progressEntries,
      assessment,
      attempts,
    });
  },
);
