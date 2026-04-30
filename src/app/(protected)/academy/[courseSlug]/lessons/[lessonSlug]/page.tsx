import Link from "next/link";
import { notFound } from "next/navigation";

import { AcademyCompleteLessonButton } from "@/components/academy/academy-complete-lesson-button";
import { AcademyLessonSidebar } from "@/components/academy/academy-lesson-sidebar";
import { AcademyStatusPanel } from "@/components/academy/academy-status-panel";
import { AssessmentRunner } from "@/components/lms/assessment-runner";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getAcademyLessonBySlugsForUser } from "@/lib/academy/queries";

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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Academy les ${lesson.order}`}
        title={lesson.title}
        description={lesson.description ?? "Werk deze les stap voor stap door binnen je Academy leerpad."}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="card-surface rounded-[32px] p-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge label={lesson.type} tone="neutral" />
              {lesson.isRequired ? <StatusBadge label="Verplicht" tone="brand" /> : null}
              <StatusBadge label={`${lesson.estimatedMinutes} minuten`} tone="neutral" />
              <StatusBadge label={lesson.enrollment.status} tone={lesson.enrollment.status === "COMPLETED" ? "success" : lesson.enrollment.status === "IN_PROGRESS" ? "warning" : "neutral"} />
            </div>

            <div className="mt-6 grid gap-4">
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

            <div className="mt-6 rounded-[28px] bg-white px-5 py-5 text-base leading-8 text-[var(--ink-soft)]">
              <p>{lesson.content}</p>
            </div>
          </section>

          {lesson.type === "ASSESSMENT" && lesson.assessment ? (
            <AssessmentRunner
              courseId={lesson.course.id}
              assessment={lesson.assessment}
              initialAttempts={lesson.attempts}
              variant="academy"
            />
          ) : null}

          <section className="flex flex-wrap items-center gap-3">
            <Link
              href={`/academy/${lesson.course.slug}`}
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]"
            >
              Terug naar e-learning
            </Link>
            {lesson.canCompleteLesson ? (
              <AcademyCompleteLessonButton courseId={lesson.course.id} lessonId={lesson.id} />
            ) : null}
          </section>
        </div>

        <AcademyLessonSidebar sidebar={lesson.sidebar} />
      </div>
    </div>
  );
}
