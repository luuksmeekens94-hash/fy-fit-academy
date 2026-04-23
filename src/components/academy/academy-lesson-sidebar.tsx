import Link from "next/link";

import { ProgressBar } from "@/components/lms/progress-bar";
import type { AcademyLessonSidebarView } from "@/lib/academy/types";

type AcademyLessonSidebarProps = {
  sidebar: AcademyLessonSidebarView;
};

export function AcademyLessonSidebar({ sidebar }: AcademyLessonSidebarProps) {
  return (
    <aside className="card-surface rounded-[32px] p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">Jouw voortgang</p>
      <div className="mt-4">
        <ProgressBar value={sidebar.progressPercentage} label={sidebar.progressLabel} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[var(--ink-soft)]">{sidebar.currentLessonLabel}</p>

      <div className="mt-6 space-y-3">
        <Link
          href={sidebar.courseHref}
          className="block rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-[var(--brand)]"
        >
          Terug naar {sidebar.courseTitle}
        </Link>
        {sidebar.previousLesson ? (
          <Link
            href={sidebar.previousLesson.href}
            className="block rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] transition hover:border-[var(--brand)]"
          >
            ← {sidebar.previousLesson.title}
          </Link>
        ) : null}
        {sidebar.nextLesson ? (
          <Link
            href={sidebar.nextLesson.href}
            className="block rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] transition hover:border-[var(--brand)]"
          >
            {sidebar.nextLesson.title} →
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
