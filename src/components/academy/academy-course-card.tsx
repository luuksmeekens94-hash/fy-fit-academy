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
      className="card-surface rounded-[22px] p-5 transition hover:-translate-y-0.5 hover:border-[var(--brand)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-deep)]">
              E-learning
            </div>
            <StatusBadge label={course.status} tone={course.status === "COMPLETED" ? "success" : course.status === "IN_PROGRESS" ? "warning" : "neutral"} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{course.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--ink-soft)]">{course.description}</p>
          </div>
        </div>
        <StatusBadge label={course.assignmentLabel} tone={course.assignmentLabel === "Need to know" ? "brand" : "neutral"} />
      </div>

      {course.goal ? (
        <p className="mt-4 rounded-[18px] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-deep)]">
          {course.goal}
        </p>
      ) : null}

      <div className="mt-4">
        <ProgressBar value={course.progressPercentage} label={course.progressLabel} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <StatusBadge label={`${course.studyLoadMinutes} minuten`} tone="neutral" />
        <span className="text-sm text-[var(--ink-soft)]">Deadline {formatDate(course.deadlineAt)}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-sm text-[var(--ink-soft)]">
        <span className="font-semibold text-[var(--brand-deep)]">{course.ctaLabel}</span>
      </div>
    </Link>
  );
}
