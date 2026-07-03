import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { completeLessonAction } from "@/app/lms-actions";
import { AssessmentRunner } from "@/components/lms/assessment-runner";
import { LessonMediaBlock } from "@/components/lms/lesson-media-block";
import { ReviewerAssessmentPreview } from "@/components/lms/reviewer-assessment-preview";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { extractLessonMedia } from "@/lib/lms/lesson-media";
import { getLearnerLmsRedirectPath } from "@/lib/lms/route-access";
import { getReviewerPreviewMode } from "@/lib/lms/reviewer-preview";
import {
  getAssessmentDetail,
  getCourseDetail,
  getEnrollmentDetailForUser,
  getLessonDetail,
  getLessonProgressForVersion,
  getMyAttempts,
} from "@/lib/lms/queries";

type LmsLessonDetailPageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

function getProgressTone(status: string) {
  if (status === "COMPLETED") {
    return "success" as const;
  }

  if (status === "IN_PROGRESS") {
    return "warning" as const;
  }

  return "brand" as const;
}

export default async function LmsLessonDetailPage({ params }: LmsLessonDetailPageProps) {
  const user = await requireUser();
  const { courseId, lessonId } = await params;

  const [course, enrollment, lesson] = await Promise.all([
    getCourseDetail(courseId),
    getEnrollmentDetailForUser(user.id, courseId),
    getLessonDetail(lessonId),
  ]);

  if (!course || !lesson || !course.activeVersion) {
    notFound();
  }

  if (user.role === "REVIEWER" && course.reviewerId !== user.id) {
    notFound();
  }

  const previewState = getReviewerPreviewMode(user.role, Boolean(enrollment));

  if (!enrollment && !previewState.canViewWithoutEnrollment) {
    notFound();
  }

  if (lesson.courseVersionId !== course.activeVersion.id) {
    notFound();
  }

  const academyRedirectPath = getLearnerLmsRedirectPath(user.role, {
    courseSlug: course.slug,
    lessonSlug: lesson.slug,
  });

  if (academyRedirectPath) {
    redirect(academyRedirectPath);
  }

  const progressEntries = await getLessonProgressForVersion(user.id, course.activeVersion.id);
  const progress = progressEntries.find((entry) => entry.lessonId === lesson.id);
  const assessmentSummary =
    lesson.type === "ASSESSMENT"
      ? course.activeVersion.assessments.find((entry) => entry.lessonId === lesson.id) ?? null
      : null;

  if (lesson.type === "ASSESSMENT" && !assessmentSummary) {
    notFound();
  }

  const [assessment, attempts] = assessmentSummary
    ? await Promise.all([
        getAssessmentDetail(assessmentSummary.id),
        getMyAttempts(user.id, assessmentSummary.id),
      ])
    : [null, []];

  if (lesson.type === "ASSESSMENT" && !assessment) {
    notFound();
  }

  const lessonMedia = extractLessonMedia(lesson.content);
  const lessonIndex = course.activeVersion.lessons.findIndex((entry) => entry.id === lesson.id);
  const previousLesson = lessonIndex > 0 ? course.activeVersion.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 ? course.activeVersion.lessons[lessonIndex + 1] ?? null : null;
  const isReviewer = user.role === "REVIEWER";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={isReviewer ? `Stap ${lesson.order}` : `LMS les ${lesson.order}`}
        title={lesson.title}
        description={lesson.description ?? "Doorloop dit onderdeel rustig en ga daarna verder naar de volgende stap."}
      />

      {lesson.type !== "ASSESSMENT" ? (
        <section className="overflow-hidden rounded-[38px] border border-[var(--border)] bg-white shadow-[0_28px_80px_-44px_rgba(35,27,18,0.55)]">
          <div className="academy-gradient-panel px-6 py-6 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
                  {lesson.type === "VIDEO" ? "Module met video" : lesson.type === "DOCUMENT" ? "Ondersteunende documenten" : "E-learning module"}
                </p>
                <h2 className="display-font mt-2 text-3xl font-semibold leading-tight text-slate-950 lg:text-4xl">
                  {lesson.title}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {isReviewer ? <StatusBadge label="review zonder opslag" tone="success" /> : null}
                {!isReviewer ? <StatusBadge label={enrollment ? progress?.status ?? "NOT_STARTED" : previewState.label} tone={enrollment ? getProgressTone(progress?.status ?? "NOT_STARTED") : "brand"} /> : null}
              </div>
            </div>
          </div>

          <div className="bg-white px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
            <LessonMediaBlock media={lessonMedia} />
          </div>
        </section>
      ) : null}

      {lesson.type === "ASSESSMENT" && assessment && isReviewer ? (
        <ReviewerAssessmentPreview assessment={assessment} />
      ) : null}

      {lesson.type === "ASSESSMENT" && assessment && !isReviewer && previewState.canMutateProgress ? (
        <AssessmentRunner courseId={courseId} assessment={assessment} initialAttempts={attempts} />
      ) : null}

      {lesson.type === "ASSESSMENT" && assessment && !isReviewer && !previewState.canMutateProgress ? (
        <ReviewerAssessmentPreview assessment={assessment} />
      ) : null}

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/lms/courses/${courseId}`}
            className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]"
          >
            Overzicht
          </Link>
          {previousLesson ? (
            <Link
              href={`/lms/courses/${courseId}/lessons/${previousLesson.id}`}
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]"
            >
              Vorige stap
            </Link>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {lesson.type !== "ASSESSMENT" && !isReviewer && previewState.canMutateProgress ? (
            progress?.status === "COMPLETED" ? (
              <span className="inline-flex rounded-full bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                Les afgerond
              </span>
            ) : (
              <form action={completeLessonAction}>
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="lessonId" value={lesson.id} />
                <button
                  type="submit"
                  className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
                >
                  Markeer les als afgerond
                </button>
              </form>
            )
          ) : null}

          {nextLesson ? (
            <Link
              href={`/lms/courses/${courseId}/lessons/${nextLesson.id}`}
              className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
            >
              Volgende stap
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
