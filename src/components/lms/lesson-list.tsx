import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import type { CourseDetail, LessonProgressInfo } from "@/lib/lms/types";

function getLessonTone(progress: LessonProgressInfo["status"]) {
  if (progress === "COMPLETED") {
    return "success" as const;
  }

  if (progress === "IN_PROGRESS") {
    return "warning" as const;
  }

  return "brand" as const;
}

type LessonListProps = {
  course: CourseDetail;
  progressEntries: LessonProgressInfo[];
};

export function LessonList({ course, progressEntries }: LessonListProps) {
  if (!course.activeVersion) {
    return null;
  }

  return (
    <div className="space-y-4">
      {course.activeVersion.lessons.map((lesson) => {
        const progress = progressEntries.find((entry) => entry.lessonId === lesson.id);
        const status = progress?.status ?? "NOT_STARTED";

        return (
          <Link
            key={lesson.id}
            href={`/lms/courses/${course.id}/lessons/${lesson.id}`}
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
                <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">
                  {lesson.estimatedMinutes} minuten • {lesson.type === "ASSESSMENT"
                    ? "Toetsles"
                    : "Lesonderdeel"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge label={status} tone={getLessonTone(status)} />
              <span className="text-sm font-medium text-[var(--brand-deep)]">Open les</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
