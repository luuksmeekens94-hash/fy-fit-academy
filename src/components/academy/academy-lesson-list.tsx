import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import type { AcademyLessonListItemView } from "@/lib/academy/types";

type AcademyLessonListProps = {
  lessons: AcademyLessonListItemView[];
};

function getTone(status: AcademyLessonListItemView["status"]) {
  if (status === "COMPLETED") return "success" as const;
  if (status === "IN_PROGRESS") return "warning" as const;
  return "neutral" as const;
}

export function AcademyLessonList({ lessons }: AcademyLessonListProps) {
  return (
    <div className="space-y-4">
      {lessons.map((lesson) => (
        <Link
          key={lesson.id}
          href={lesson.href}
          className="card-surface flex flex-col gap-4 rounded-[28px] p-5 transition hover:-translate-y-0.5 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand-deep)]">
                {lesson.order}
              </span>
              <StatusBadge label={lesson.type} tone="neutral" />
              {lesson.isRequired ? <StatusBadge label="Verplicht" tone="brand" /> : null}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">{lesson.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">{lesson.estimatedMinutes} minuten</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge label={lesson.status} tone={getTone(lesson.status)} />
            <span className="text-sm font-medium text-[var(--brand-deep)]">Open les</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
