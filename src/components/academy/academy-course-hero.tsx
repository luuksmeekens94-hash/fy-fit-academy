import { ProgressBar } from "@/components/lms/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import type { AcademyCourseDetailView } from "@/lib/academy/types";

type AcademyCourseHeroProps = {
  course: AcademyCourseDetailView;
  action: React.ReactNode;
};

export function AcademyCourseHero({ course, action }: AcademyCourseHeroProps) {
  return (
    <section className="card-surface overflow-hidden rounded-[34px] p-0">
      <div className="border-b border-[var(--border)] bg-[linear-gradient(135deg,rgba(246,234,215,0.66),rgba(231,239,235,0.42),rgba(255,253,250,0.9))] px-6 py-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <StatusBadge label={course.status} tone={course.status === "COMPLETED" ? "success" : course.status === "IN_PROGRESS" ? "warning" : "neutral"} />
              {course.isMandatory ? <StatusBadge label="Verplicht" tone="brand" /> : <StatusBadge label="Aanbevolen" tone="neutral" />}
              <StatusBadge label={`${course.studyLoadMinutes} minuten`} tone="neutral" />
            </div>
            <div className="space-y-2">
              <h2 className="display-font text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)] md:text-4xl">{course.title}</h2>
              <p className="max-w-3xl text-base leading-7 text-[var(--ink-soft)]">{course.description}</p>
            </div>
          </div>
          <div className="shrink-0">{action}</div>
        </div>
      </div>

      <div className="px-6 py-5">
        <ProgressBar value={course.progressPercentage} label={course.progressLabel} />
      </div>
    </section>
  );
}
