import Link from "next/link";
import { notFound } from "next/navigation";

import { AcademyCompleteLessonButton } from "@/components/academy/academy-complete-lesson-button";
import { AcademyLessonSidebar } from "@/components/academy/academy-lesson-sidebar";
import { AcademyStatusPanel } from "@/components/academy/academy-status-panel";
import { AssessmentRunner } from "@/components/lms/assessment-runner";
import { LessonMediaBlock } from "@/components/lms/lesson-media-block";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getAcademyLessonBySlugsForUser } from "@/lib/academy/queries";
import { extractLessonMedia } from "@/lib/lms/lesson-media";

export default async function AcademyLessonDetailPage({
  params,
}: PageProps<"/academy/[courseSlug]/lessons/[lessonSlug]">) {
  const user = await requireUser();
  const { courseSlug, lessonSlug } = await params;
  const lesson = await getAcademyLessonBySlugsForUser(
    user.id,
    courseSlug,
    lessonSlug,
    user.role === "BEHEERDER",
  );

  if (!lesson) {
    notFound();
  }

  const lessonMedia = extractLessonMedia(lesson.content);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Academy les ${lesson.order}`}
        title={lesson.title}
        description={lesson.description ?? "Werk deze les stap voor stap door binnen je Academy leerpad."}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="card-surface overflow-hidden rounded-[34px] p-0">
            <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[linear-gradient(135deg,rgba(246,234,215,0.5),rgba(255,253,250,0.9))] px-6 py-5">
              <StatusBadge label={lesson.type} tone="neutral" />
              {lesson.isRequired ? <StatusBadge label="Verplicht" tone="brand" /> : null}
              <StatusBadge label={`${lesson.estimatedMinutes} minuten`} tone="neutral" />
              <StatusBadge label={lesson.enrollment.status} tone={lesson.enrollment.status === "COMPLETED" ? "success" : lesson.enrollment.status === "IN_PROGRESS" ? "warning" : "neutral"} />
            </div>

            <div className="grid gap-4 px-6 py-5">
              <AcademyStatusPanel
                tone={lesson.completionState.tone}
                title={lesson.completionState.title}
                message={lesson.completionState.message}
              />
              {lesson.assessmentState ? (
                <AcademyStatusPanel
                  tone={lesson.assessmentState.tone}
                  title={lesson.assessmentState.title}
                  message={lesson.assessmentState.message}
                />
              ) : null}
            </div>

            {lesson.type !== "ASSESSMENT" ? (
              <div className="mx-3 mb-3 rounded-[30px] border border-[var(--border)] bg-white/88 px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:px-7 lg:px-9 lg:py-8">
                <LessonMediaBlock media={lessonMedia} />
              </div>
            ) : null}
          </section>

          {lesson.type === "ASSESSMENT" && lesson.assessment ? (
            <AssessmentRunner
              courseId={lesson.course.id}
              assessment={lesson.assessment}
              initialAttempts={lesson.attempts}
              variant="academy"
            />
          ) : null}

          <section className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[var(--border)] bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/academy/${lesson.course.slug}`}
                className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]"
              >
                Terug naar e-learning
              </Link>
              {lesson.type !== "ASSESSMENT" ? (
                <AcademyCompleteLessonButton
                  courseId={lesson.course.id}
                  lessonId={lesson.id}
                  isCompleted={lesson.status === "COMPLETED"}
                />
              ) : (
                <span className="inline-flex rounded-full bg-[var(--brand-soft)] px-5 py-3 text-sm font-semibold text-[var(--brand-deep)] ring-1 ring-[var(--border)]">
                  Rond de toets af om deze les te voltooien
                </span>
              )}
            </div>

            {lesson.sidebar.nextLesson ? (
              <Link
                href={lesson.sidebar.nextLesson.href}
                className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
              >
                Volgende les: {lesson.sidebar.nextLesson.title} →
              </Link>
            ) : null}
          </section>
        </div>

        <AcademyLessonSidebar sidebar={lesson.sidebar} />
      </div>
    </div>
  );
}
