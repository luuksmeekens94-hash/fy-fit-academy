import { StatusBadge } from "@/components/status-badge";
import { buildAccreditationChecklist } from "@/lib/lms/accreditation-checklist";
import type { CourseDetail } from "@/lib/lms/types";

function formatDate(date: Date | null) {
  if (!date) {
    return "Nog niet ingevuld";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatKind(kind: CourseDetail["accreditationKind"]) {
  return kind === "VAKINHOUDELIJK" ? "Vakinhoudelijk" : "Beroepsgerelateerd";
}

function formatWorkForm(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

function getChecklistTone(status: "complete" | "missing" | "warning") {
  if (status === "complete") {
    return "success" as const;
  }

  if (status === "warning") {
    return "warning" as const;
  }

  return "neutral" as const;
}

type AccreditationPanelProps = {
  course: CourseDetail;
  mode?: "beheer" | "reviewer";
};

export function AccreditationPanel({ course, mode = "beheer" }: AccreditationPanelProps) {
  const checklist = buildAccreditationChecklist({
    title: course.title,
    audience: course.audience,
    accreditationRegister: course.accreditationRegister,
    accreditationKind: course.accreditationKind,
    studyLoadMinutes: course.studyLoadMinutes,
    versionDate: course.versionDate,
    authorExperts: course.authorExperts,
    requiredQuestionCount: course.requiredQuestionCount,
    reviewerName: course.reviewerName,
    activeVersion: course.activeVersion,
    changeLogCount: course.activeVersion?.changeLogs.length ?? 0,
  });

  const modules = course.activeVersion?.modules ?? [];
  const objectives = course.activeVersion?.objectives ?? [];
  const literature = course.activeVersion?.literature ?? [];
  const competencies = course.activeVersion?.competencies ?? [];
  const assessments = course.activeVersion?.assessments ?? [];
  const evaluationForms = course.activeVersion?.evaluationForms ?? [];
  const changeLogs = course.activeVersion?.changeLogs ?? [];

  return (
    <section className="card-surface rounded-[32px] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
            Accreditatie-ready LMS
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Kwaliteitshuis-checklist en reviewer-preview
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
            Deze cockpit toont of de e-learning voldoende metadata, leerdoelen, modules, toetsing,
            evaluatie en bewijsvoering bevat voor accreditatie. In reviewer-modus kan de commissie
            inhoud bekijken zonder echte voortgangsdata te vervuilen.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatusBadge
            label={checklist.isPublishable ? "Publiceerbaar" : `${checklist.criticalOpenCount} blokkades`}
            tone={checklist.isPublishable ? "success" : "warning"}
          />
          <StatusBadge label={mode === "reviewer" ? "Reviewer-preview" : "Beheerweergave"} tone="brand" />
          <StatusBadge label={`${checklist.completedCount}/${checklist.totalCount} checks`} tone="neutral" />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] bg-white/85 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Register</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{course.accreditationRegister ?? "Nog niet ingevuld"}</p>
        </div>
        <div className="rounded-[24px] bg-white/85 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Soort</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{formatKind(course.accreditationKind)}</p>
        </div>
        <div className="rounded-[24px] bg-white/85 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Versiedatum</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{formatDate(course.versionDate)}</p>
        </div>
        <div className="rounded-[24px] bg-white/85 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Reviewer</p>
          <p className="mt-2 text-sm font-semibold text-slate-950">{course.reviewerName ?? "Niet gekoppeld"}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {checklist.items.map((item) => (
          <div key={item.id} className="rounded-[24px] border border-[var(--border)] bg-white/85 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-950">{item.label}</h3>
              <StatusBadge label={item.status} tone={getChecklistTone(item.status)} />
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.message}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-[28px] bg-[var(--brand-soft)] p-5">
          <h3 className="text-lg font-semibold text-slate-950">Leerdoelen</h3>
          <div className="mt-4 space-y-3">
            {objectives.length ? objectives.map((objective) => (
              <div key={objective.id} className="rounded-2xl bg-white/85 p-4 text-sm leading-6 text-[var(--ink-soft)]">
                <span className="font-semibold text-[var(--brand-deep)]">{objective.code}</span> — {objective.text}
              </div>
            )) : <p className="text-sm text-[var(--ink-soft)]">Nog geen leerdoelen vastgelegd.</p>}
          </div>
        </div>

        <div className="rounded-[28px] bg-[var(--teal-soft)] p-5">
          <h3 className="text-lg font-semibold text-slate-950">Toetsing en evaluatie</h3>
          <div className="mt-4 space-y-3">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="rounded-2xl bg-white/85 p-4 text-sm leading-6 text-[var(--ink-soft)]">
                <p className="font-semibold text-slate-950">{assessment.title}</p>
                <p>{assessment.questionCount} vragen • {assessment.passPercentage}% norm • max. {assessment.maxAttempts} pogingen • antwoorden randomiseren: {assessment.shuffleOptions ? "ja" : "nee"}</p>
              </div>
            ))}
            {evaluationForms.map((form) => (
              <div key={form.id} className="rounded-2xl bg-white/85 p-4 text-sm leading-6 text-[var(--ink-soft)]">
                <p className="font-semibold text-slate-950">{form.title}</p>
                <p>{form.questionCount} evaluatievragen • verplicht: {form.isRequired ? "ja" : "nee"}</p>
              </div>
            ))}
            {!assessments.length && !evaluationForms.length ? <p className="text-sm text-[var(--ink-soft)]">Nog geen toets/evaluatie vastgelegd.</p> : null}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] bg-white/85 p-5">
        <h3 className="text-lg font-semibold text-slate-950">Versiebeheer en wijzigingslog</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
          Actieve versie: {course.activeVersion?.versionNumber ?? "geen"}. {course.activeVersion?.changeSummary ?? "Nog geen wijzigingssamenvatting."}
        </p>
        <div className="mt-4 space-y-3">
          {changeLogs.length ? changeLogs.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-[var(--border)] p-4 text-sm leading-6 text-[var(--ink-soft)]">
              <p className="font-semibold text-slate-950">{entry.changeType} • {formatDate(entry.changedAt)}</p>
              <p>{entry.summary}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">Door {entry.changedByName}</p>
            </div>
          )) : <p className="text-sm text-[var(--ink-soft)]">Nog geen wijzigingslog vastgelegd.</p>}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-950">Modules, literatuur en competenties</h3>
        {modules.length ? modules.map((module) => {
          const moduleObjectives = objectives.filter((objective) => objective.moduleId === module.id);
          const moduleLiterature = literature.filter((reference) => reference.moduleId === module.id);
          const moduleCompetencies = competencies.filter((reference) => reference.moduleId === module.id);

          return (
            <div key={module.id} className="rounded-[28px] border border-[var(--border)] bg-white/85 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge label={`Module ${module.order}`} tone="brand" />
                <StatusBadge label={`${module.estimatedMinutes} minuten`} tone="neutral" />
                {module.workForms.map((workForm) => (
                  <StatusBadge key={workForm} label={formatWorkForm(workForm)} tone="neutral" />
                ))}
              </div>
              <h4 className="mt-4 text-lg font-semibold text-slate-950">{module.title}</h4>
              {module.introduction ? <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{module.introduction}</p> : null}
              {module.summary ? <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]"><span className="font-semibold">Samenvatting:</span> {module.summary}</p> : null}
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Leerdoelen</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{moduleObjectives.map((entry) => entry.code).join(", ") || "Geen"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Literatuur</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{moduleLiterature.map((entry) => entry.title).join(", ") || "Geen"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Competenties</p>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">{moduleCompetencies.map((entry) => entry.name).join(", ") || "Geen"}</p>
                </div>
              </div>
            </div>
          );
        }) : <p className="text-sm text-[var(--ink-soft)]">Nog geen modules vastgelegd.</p>}
      </div>
    </section>
  );
}
