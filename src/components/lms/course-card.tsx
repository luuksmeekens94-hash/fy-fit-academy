import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/lms/progress-bar";
import type { EnrollmentSummary } from "@/lib/lms/types";

function getEnrollmentTone(status: EnrollmentSummary["status"]) {
  if (status === "COMPLETED") {
    return "success" as const;
  }

  if (status === "IN_PROGRESS") {
    return "warning" as const;
  }

  return "brand" as const;
}

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

type CourseCardProps = {
  enrollment: EnrollmentSummary;
};

export function CourseCard({ enrollment }: CourseCardProps) {
  return (
    <Link
      href={`/lms/courses/${enrollment.courseId}`}
      className="card-surface rounded-[32px] p-6 transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-[var(--teal-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
            LMS cursus
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">{enrollment.courseTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              {enrollment.assignmentType === "REQUIRED"
                ? "Verplichte scholing binnen het LMS-traject."
                : "Optionele cursus binnen het LMS-traject."}
            </p>
          </div>
        </div>
        <StatusBadge label={enrollment.status} tone={getEnrollmentTone(enrollment.status)} />
      </div>

      <div className="mt-5">
        <ProgressBar value={enrollment.progress} label="Cursusvoortgang" />
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
        <span>Deadline {formatDate(enrollment.deadlineAt)}</span>
        <span>•</span>
        <span>{enrollment.assignmentType === "REQUIRED" ? "Verplicht" : "Optioneel"}</span>
      </div>
    </Link>
  );
}
