import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { completeLessonAction } from "@/app/lms-actions";
import { AssessmentRunner } from "@/components/lms/assessment-runner";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
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

  const canCompleteLesson =
    previewState.canMutateProgress &&
    Boolean(enrollment) &&
    lesson.type !== "ASSESSMENT" &&
    progress?.status !== "COMPLETED";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`LMS les ${lesson.order}`}
        title={lesson.title}
        description={lesson.description ?? "Deze les hoort bij het eerste LMS-traject van de Academy."}
      />

      <section className="card-surface rounded-[32px] p-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge label={lesson.type} tone="neutral" />
          <StatusBadge
            label={enrollment ? progress?.status ?? "NOT_STARTED" : previewState.label}
            tone={enrollment ? getProgressTone(progress?.status ?? "NOT_STARTED") : "brand"}
          />
          {lesson.isRequired ? <StatusBadge label="Verplicht" tone="brand" /> : null}
          <StatusBadge label={`${lesson.estimatedMinutes} minuten`} tone="neutral" />
        </div>

        <div className="mt-6 rounded-[28px] bg-white px-5 py-5 text-base leading-8 text-[var(--ink-soft)]">
          <p>{lesson.content}</p>
        </div>
      </section>

      {previewState.isPreview ? (
        <section className="rounded-[28px] border border-[var(--brand)] bg-[var(--brand-soft)] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge label={previewState.label} tone="brand" />
            <StatusBadge label="read-only" tone="success" />
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--brand-deep)]">
            Reviewer-preview actief: deze les kan volledig bekeken worden, maar knoppen voor voortgang, toetspogingen en resultaatopslag zijn uitgeschakeld om rapportages schoon te houden.
          </p>
        </section>
      ) : null}

      {lesson.type === "ASSESSMENT" && assessment && previewState.canMutateProgress ? (
        <AssessmentRunner courseId={courseId} assessment={assessment} initialAttempts={attempts} />
      ) : null}

      {lesson.type === "ASSESSMENT" && assessment && !previewState.canMutateProgress ? (
        <section className="card-surface rounded-[32px] p-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge label="Toetspreview" tone="brand" />
            <StatusBadge label={`${assessment.questions.length} vragen`} tone="neutral" />
            <StatusBadge label={`${assessment.passPercentage}% norm`} tone="neutral" />
            <StatusBadge label={`max. ${assessment.maxAttempts} pogingen`} tone="neutral" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-950">Toetsopbouw voor reviewer</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            Deze preview toont de toetsinstellingen zonder poging, score of voortgangsdata aan te maken.
          </p>
        </section>
      ) : null}

      <section className="flex flex-wrap items-center gap-3">
        <Link
          href={`/lms/courses/${courseId}`}
          className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]"
        >
          Terug naar cursus
        </Link>

        {canCompleteLesson ? (
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
        ) : null}
      </section>

      <section className="card-surface rounded-[32px] p-6">
        <h2 className="text-xl font-semibold text-slate-950">Cursuscontext</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
          {enrollment
            ? `Je voortgang in deze cursus staat momenteel op ${enrollment.progress}%. Werk de verplichte lessen af en rond daarna de toets af om het certificaat vrij te spelen.`
            : "Previewmodus: je bekijkt de lesinhoud zonder voortgang, toetsresultaten of certificaatdata aan te maken."}
        </p>
      </section>
    </div>
  );
}
