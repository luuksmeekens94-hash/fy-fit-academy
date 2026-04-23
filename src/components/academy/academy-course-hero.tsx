import { ProgressBar } from "@/components/lms/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import type { AcademyCourseDetailView } from "@/lib/academy/types";

type AcademyCourseHeroProps = {
  course: AcademyCourseDetailView;
  action: React.ReactNode;
};

export function AcademyCourseHero({ course, action }: AcademyCourseHeroProps) {
  return (
    <section className="card-surface rounded-[32px] p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <StatusBadge label={course.status} tone={course.status === "COMPLETED" ? "success" : course.status === "IN_PROGRESS" ? "warning" : "neutral"} />
            {course.isMandatory ? <StatusBadge label="Verplicht" tone="brand" /> : <StatusBadge label="Aanbevolen" tone="neutral" />}
            <StatusBadge label={`${course.studyLoadMinutes} minuten`} tone="neutral" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-950">{course.title}</h2>
            <p className="max-w-3xl text-base leading-7 text-[var(--ink-soft)]">{course.description}</p>
          </div>
        </div>
        <div>{action}</div>
      </div>

      <div className="mt-6">
        <ProgressBar value={course.progressPercentage} label={course.progressLabel} />
      </div>
    </section>
  );
}
