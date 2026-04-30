import {
  publishCourseAccreditationReadyAction,
  saveAssessmentAccreditationRulesAction,
  saveCourseAccreditationMetadataAction,
  saveCourseAccreditationStructureAction,
} from "@/app/lms-actions";
import { StatusBadge } from "@/components/status-badge";
import { buildAccreditationChecklist } from "@/lib/lms/accreditation-checklist";
import { buildAccreditationEvidenceExport } from "@/lib/lms/accreditation-evidence";
import {
  exportParticipantCompletionReportCsv,
  exportParticipantCompletionReportMarkdown,
  type ParticipantCompletionReport,
} from "@/lib/lms/participant-report";
import type { CourseDetail } from "@/lib/lms/types";


function formatInputDate(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatAuthorExperts(experts: CourseDetail["authorExperts"]) {
  return experts
    .map((expert) => [expert.name, expert.role, expert.organization ?? "", expert.registrationNumber ?? ""].join("||"))
    .join("\n");
}

function formatModules(course: CourseDetail) {
  return (course.activeVersion?.modules ?? [])
    .map((module) => [
      module.order,
      module.title,
      module.estimatedMinutes,
      module.introduction ?? "",
      module.summary ?? "",
      module.workForms.join(", ").toLowerCase(),
    ].join("||"))
    .join("\n");
}

function formatObjectives(course: CourseDetail) {
  const modulesById = new Map((course.activeVersion?.modules ?? []).map((module) => [module.id, module.order]));

  return (course.activeVersion?.objectives ?? [])
    .map((objective) => [objective.code, objective.text, objective.moduleId ? modulesById.get(objective.moduleId) ?? "" : ""].join("||"))
    .join("\n");
}

function formatLiterature(course: CourseDetail) {
  const modulesById = new Map((course.activeVersion?.modules ?? []).map((module) => [module.id, module.order]));

  return (course.activeVersion?.literature ?? [])
    .map((reference) => [
      reference.order,
      reference.title,
      reference.source ?? "",
      reference.url ?? "",
      reference.guideline ?? "",
      reference.year ?? "",
      reference.moduleId ? modulesById.get(reference.moduleId) ?? "" : "",
    ].join("||"))
    .join("\n");
}

function formatCompetencies(course: CourseDetail) {
  const modulesById = new Map((course.activeVersion?.modules ?? []).map((module) => [module.id, module.order]));

  return (course.activeVersion?.competencies ?? [])
    .map((reference) => [
      reference.name,
      reference.framework ?? "",
      reference.description ?? "",
      reference.moduleId ? modulesById.get(reference.moduleId) ?? "" : "",
    ].join("||"))
    .join("\n");
}

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
  completionReport?: ParticipantCompletionReport[];
};

export function AccreditationPanel({ course, mode = "beheer", completionReport = [] }: AccreditationPanelProps) {
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
  const evidenceExport = buildAccreditationEvidenceExport(course, checklist);
  const participantReportMarkdown = exportParticipantCompletionReportMarkdown(completionReport);
  const participantReportCsv = exportParticipantCompletionReportCsv(completionReport);

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

      {mode === "beheer" ? (
        <div className="mt-6 rounded-[28px] border border-[var(--border)] bg-white/85 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Publicatieblokkade</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                Publiceren kan pas als alle kritieke Kwaliteitshuis-checks groen zijn. Waarschuwingen blijven zichtbaar,
                maar blokkeren publicatie niet.
              </p>
            </div>
            <form action={publishCourseAccreditationReadyAction}>
              <input type="hidden" name="courseId" value={course.id} />
              <button
                type="submit"
                disabled={!checklist.isPublishable || course.status === "PUBLISHED"}
                className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {course.status === "PUBLISHED" ? "Al gepubliceerd" : "Publiceer accreditatie-ready"}
              </button>
            </form>
          </div>
          {!checklist.isPublishable ? (
            <p className="mt-3 text-sm font-semibold text-amber-700">
              Nog {checklist.criticalOpenCount} kritieke blokkade(s). Los deze op voordat de e-learning live mag.
            </p>
          ) : null}
        </div>
      ) : null}

      {mode === "beheer" ? (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <form action={saveCourseAccreditationMetadataAction} className="rounded-[28px] bg-[var(--brand-soft)] p-5">
            <input type="hidden" name="courseId" value={course.id} />
            <h3 className="text-lg font-semibold text-slate-950">Algemene gegevens beheren</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Velden voor titel, doelgroep, register, soort, studielast, auteurs en versiebeheer.
            </p>
            <div className="mt-4 grid gap-3">
              <input name="title" defaultValue={course.title} placeholder="Titel e-learning" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" required />
              <textarea name="description" defaultValue={course.description} rows={3} placeholder="Beschrijving" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" required />
              <input name="audience" defaultValue={course.audience ?? ""} placeholder="Doelgroep" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
              <div className="grid gap-3 md:grid-cols-2">
                <input name="accreditationRegister" defaultValue={course.accreditationRegister ?? ""} placeholder="Register" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
                <select name="accreditationKind" defaultValue={course.accreditationKind} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
                  <option value="VAKINHOUDELIJK">Vakinhoudelijk</option>
                  <option value="BEROEPSGERELATEERD">Beroepsgerelateerd</option>
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input name="studyLoadMinutes" type="number" defaultValue={course.studyLoadMinutes} placeholder="Studielast in minuten" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" required />
                <input name="requiredQuestionCount" type="number" defaultValue={course.requiredQuestionCount ?? ""} placeholder="Min. MC-vragen" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input name="versionDate" type="date" defaultValue={formatInputDate(course.versionDate)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
                <input name="revisionDueAt" type="date" defaultValue={formatInputDate(course.revisionDueAt)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
              </div>
              <textarea name="authorExperts" defaultValue={formatAuthorExperts(course.authorExperts)} rows={4} placeholder="Naam||Rol||Organisatie||Registratienummer" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm" />
              <input name="changeSummary" defaultValue="Accreditatie-metadata bijgewerkt." className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
              <button type="submit" className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">Algemene gegevens opslaan</button>
            </div>
          </form>

          <form action={saveCourseAccreditationStructureAction} className="rounded-[28px] bg-[var(--teal-soft)] p-5">
            <input type="hidden" name="courseId" value={course.id} />
            <h3 className="text-lg font-semibold text-slate-950">Leerstructuur beheren</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Eén regel per item. Modules: volgorde||titel||duur||intro||samenvatting||werkvormen.
            </p>
            <div className="mt-4 grid gap-3">
              <textarea name="modules" defaultValue={formatModules(course)} rows={5} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm" />
              <textarea name="learningObjectives" defaultValue={formatObjectives(course)} rows={5} placeholder="LO1||Tekst leerdoel||modulevolgorde" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm" />
              <textarea name="literature" defaultValue={formatLiterature(course)} rows={4} placeholder="1||Titel||Bron||URL||Richtlijn||Jaar||modulevolgorde" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm" />
              <textarea name="competencies" defaultValue={formatCompetencies(course)} rows={4} placeholder="Naam||Framework||Beschrijving||modulevolgorde" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm" />
              <input name="changeSummary" defaultValue="Accreditatie-structuur bijgewerkt." className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm" />
              <button type="submit" className="rounded-full bg-[var(--teal)] px-5 py-3 text-sm font-semibold text-white">Leerstructuur opslaan</button>
            </div>
          </form>
        </div>
      ) : null}

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

      <div className="mt-6 rounded-[28px] bg-slate-950 p-5 text-white">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Accreditatie-export</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Markdown-dossier voor Kwaliteitshuis: algemene gegevens, leerdoelen, modules, toetsing,
              evaluatie, reviewer-info, bewijsvelden en wijzigingslog.
            </p>
          </div>
          <StatusBadge label="Copy/paste dossier" tone="neutral" />
        </div>
        <textarea
          readOnly
          value={evidenceExport}
          rows={14}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 p-4 font-mono text-xs leading-6 text-white outline-none"
        />
      </div>

      <div className="mt-6 rounded-[28px] bg-white/85 p-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Deelnemerrapportage</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              Export voor afrondingsbewijs: deelnemer, registratienummer, e-learning, datum afronding,
              toets-score, pogingen, status, certificaat en evaluatie.
            </p>
          </div>
          <StatusBadge label={`${completionReport.length} deelnemers`} tone="brand" />
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <textarea
            readOnly
            value={participantReportMarkdown}
            rows={12}
            className="w-full rounded-2xl border border-[var(--border)] bg-white p-4 font-mono text-xs leading-6 text-slate-900 outline-none"
          />
          <textarea
            readOnly
            value={participantReportCsv}
            rows={12}
            className="w-full rounded-2xl border border-[var(--border)] bg-white p-4 font-mono text-xs leading-6 text-slate-900 outline-none"
          />
        </div>
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
                {mode === "beheer" ? (
                  <form action={saveAssessmentAccreditationRulesAction} className="mt-4 grid gap-3 rounded-2xl border border-[var(--border)] bg-white p-4">
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="assessmentId" value={assessment.id} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input name="passPercentage" type="number" defaultValue={assessment.passPercentage} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                      <input name="maxAttempts" type="number" defaultValue={assessment.maxAttempts} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm" />
                    </div>
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                      <input type="checkbox" name="shuffleQuestions" defaultChecked={assessment.shuffleQuestions} className="h-4 w-4" />
                      Vragen randomiseren
                    </label>
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                      <input type="checkbox" name="shuffleOptions" defaultChecked={assessment.shuffleOptions} className="h-4 w-4" />
                      Antwoordvolgorde randomiseren
                    </label>
                    <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                      <input type="checkbox" name="isRequiredForCompletion" defaultChecked={assessment.isRequiredForCompletion} className="h-4 w-4" />
                      Vereist voor certificaat
                    </label>
                    <button type="submit" className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">Toetsnormen opslaan</button>
                  </form>
                ) : null}
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
