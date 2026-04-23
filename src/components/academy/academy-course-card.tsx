import Link from "next/link";

import { ProgressBar } from "@/components/lms/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import type { AcademyCourseCardView } from "@/lib/academy/types";

type AcademyCourseCardProps = {
  course: AcademyCourseCardView;
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Geen deadline";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function AcademyCourseCard({ course }: AcademyCourseCardProps) {
  return (
    <Link
      href={course.href}
      className="card-surface rounded-[32px] p-6 transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
            E-learning
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">{course.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{course.description}</p>
          </div>
        </div>
        <StatusBadge label={course.assignmentLabel} tone={course.assignmentLabel === "Verplicht" ? "brand" : "neutral"} />
      </div>

      {course.goal ? (
        <p className="mt-4 rounded-[24px] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-deep)]">
          {course.goal}
        </p>
      ) : null}

      <div className="mt-5">
        <ProgressBar value={course.progressPercentage} label={course.progressLabel} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <StatusBadge label={course.status} tone={course.status === "COMPLETED" ? "success" : course.status === "IN_PROGRESS" ? "warning" : "neutral"} />
        <StatusBadge label={`${course.studyLoadMinutes} minuten`} tone="neutral" />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--ink-soft)]">
        <span>Deadline {formatDate(course.deadlineAt)}</span>
        <span className="font-semibold text-[var(--brand-deep)]">{course.ctaLabel}</span>
      </div>
    </Link>
  );
}
