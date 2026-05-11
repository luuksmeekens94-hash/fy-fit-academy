import Link from "next/link";

import {
  applyStandardEvaluationTemplateAction,
  publishCourseAccreditationReadyAction,
} from "@/app/lms-actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { buildAcademyAdminCockpit } from "@/lib/academy-admin-cockpit";
import { getAllCourses } from "@/lib/lms/queries";

const qualityChecks = [
  "3–6 leerdoelen",
  "70%-norm",
  "Max. 3 pogingen",
  "Randomisatie",
  "Evaluatie klaar",
  "Versielog gevuld",
];

const evaluationItems = [
  "Relevantie voor dagelijkse praktijk",
  "Toepasbaarheid morgen",
  "Kwaliteit inhoud/docent",
  "Toets sluit aan op leerdoelen",
  "Studielast klopt",
];

const publicationSteps = [
  "Concept vullen",
  "Reviewer-preview controleren",
  "Accreditatiecheck afronden",
  "Publiceren",
  "Archiveren bij nieuwe versie",
];

export default async function AcademyAdminPage() {
  await requireRole(["BEHEERDER"]);
  const courses = await getAllCourses();
  const cockpit = buildAcademyAdminCockpit({ courses });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academybeheer"
        title="Volwassen beheerflow voor e-learning en accreditatie"
        description="Eén cockpit voor toetsvragen, evaluaties, accreditatiebewijs en cursusversies. Operationele admin blijft in Admin; inhoudelijke LMS-preview blijft in LMS cockpit."
      />

      <section className="academy-gradient-panel brand-mark-surface overflow-hidden rounded-[34px] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)] lg:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr] xl:items-end">
          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap gap-2">
              <StatusBadge label="Kwaliteitshuis-ready" tone="brand" />
              <StatusBadge label={`${cockpit.metrics.reviewCourses} in review`} tone="warning" />
              <StatusBadge label={`${cockpit.metrics.accreditationReadyCourses} accreditatie-ready`} tone="success" />
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 lg:text-4xl">
              Van losse cursus naar aantoonbare Academy-publicatie.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--ink-soft)]">
              Deze beheerlaag houdt toetsing, evaluatie, accreditatie en versiebeheer bij elkaar. Niet rommelen in de krochten; gewoon één cockpit waar je kunt zien wat publiceerbaar is.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">Publicatiecheck</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {qualityChecks.map((check) => (
                <div key={check} className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)] shadow-[0_0_0_5px_rgba(10,127,80,0.12)]" />
                  <span className="text-sm font-semibold text-slate-900">{check}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Cursussen", value: cockpit.metrics.totalCourses, detail: "Alle LMS-cursussen in beheer." },
          { label: "Gepubliceerd", value: cockpit.metrics.publishedCourses, detail: "Live voor deelnemers of zichtbaarheid." },
          { label: "In review", value: cockpit.metrics.reviewCourses, detail: "Klaar voor inhoudelijke controle." },
          { label: "Accreditatie-ready", value: cockpit.metrics.accreditationReadyCourses, detail: "Register en toetsnorm aanwezig." },
        ].map((metric) => (
          <div key={metric.label} className="card-surface rounded-[28px] p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">{metric.label}</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className="card-surface rounded-[30px] p-3">
        <div className="grid gap-2 md:grid-cols-4">
          {cockpit.workflows.map((workflow) => (
            <a key={workflow.key} href={workflow.href} className="group rounded-[24px] border border-transparent p-4 transition hover:border-[var(--brand)] hover:bg-white/80">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)] shadow-[0_0_0_5px_rgba(223,130,28,0.14)]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{workflow.status}</span>
              </div>
              <h2 className="text-base font-semibold text-slate-950">{workflow.title}</h2>
              <p className="mt-2 min-h-16 text-sm leading-6 text-[var(--ink-soft)]">{workflow.description}</p>
              <p className="mt-4 text-sm font-semibold text-[var(--brand-deep)] transition group-hover:translate-x-1">{workflow.cta} →</p>
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div id="toetsvragen" className="card-surface overflow-hidden rounded-[34px]">
          <div className="bg-[var(--brand-soft)]/65 p-6">
            <StatusBadge label="Toetsvragenbeheer" tone="brand" />
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-950">Vragenbank en toetsnorm</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
              Check per cursus of normering, pogingen, randomisatie en leerdoelkoppeling aantoonbaar zijn voordat je publiceert.
            </p>
          </div>
          <div className="grid gap-3 p-6 md:grid-cols-2">
            <input placeholder="Vraagbank / toetsblok" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
            <input placeholder="Leerdoelcodes, bijv. LO1, LO2" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
            <label className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink-soft)]">
              Cesuur (%)
              <input type="number" defaultValue={70} className="mt-1 w-full bg-transparent text-base font-semibold text-slate-950 outline-none" />
            </label>
            <label className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink-soft)]">
              Pogingen
              <input type="number" defaultValue={3} className="mt-1 w-full bg-transparent text-base font-semibold text-slate-950 outline-none" />
            </label>
            <p className="md:col-span-2 text-xs leading-5 text-[var(--ink-soft)]">
              Beheerflow is gekoppeld aan het bestaande assessmentmodel via de cursusdetailpagina; normen en leerdoelkoppeling blijven server-side gevalideerd.
            </p>
          </div>
        </div>

        <div id="evaluaties" className="card-surface rounded-[34px] p-6">
          <StatusBadge label="Evaluatiebeheer" tone="success" />
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-950">Evaluatie-template</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            Borg feedback als vaste accreditatielaag, niet als vergeten formulier na afloop.
          </p>
          <form action={applyStandardEvaluationTemplateAction} className="mt-5 grid gap-3 rounded-[28px] bg-[var(--success-soft)] p-4">
            <select
              name="courseId"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--success)]"
              required
            >
              <option value="">Kies cursus voor standaard evaluatie</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <div className="space-y-2">
              {evaluationItems.map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-[18px] border border-white/80 bg-white/85 p-3 text-sm font-medium text-slate-900">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-xs font-bold text-[var(--success)]">{index + 1}</span>
                  {item}
                </div>
              ))}
            </div>
            <button className="rounded-full bg-[var(--success)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95">
              Kwaliteitshuis-template opslaan
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div id="accreditatie" className="card-surface rounded-[32px] p-6">
          <StatusBadge label="Accreditatiecockpit" tone="warning" />
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-950">Cursussen die aandacht vragen</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            Prioriteer eerst de cursussen waar publicatie, review of bewijsvoering wringt.
          </p>
          <div className="mt-5 space-y-3">
            {cockpit.coursesNeedingAttention.length ? cockpit.coursesNeedingAttention.map((course) => (
              <Link key={course.id} href={course.href} className="block rounded-[22px] border border-[var(--border)] bg-white/85 p-4 transition hover:-translate-y-0.5 hover:border-[var(--brand)]">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={course.status} tone="neutral" />
                  <p className="font-semibold text-slate-950">{course.title}</p>
                </div>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{course.reason}</p>
              </Link>
            )) : (
              <p className="rounded-[22px] bg-white/80 p-4 text-sm text-[var(--ink-soft)]">Alle cursussen hebben de basale accreditatievelden op orde.</p>
            )}
          </div>
        </div>

        <div id="versies" className="card-surface rounded-[32px] p-6">
          <StatusBadge label="Versiebeheer" tone="neutral" />
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-slate-950">Publicatieflow</h2>
          <div className="mt-5 space-y-3">
            {publicationSteps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-[22px] border border-[var(--border)] bg-white/85 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand-deep)]">{index + 1}</span>
                <p className="text-sm font-medium text-slate-900">{step}</p>
              </div>
            ))}
          </div>
          <form action={publishCourseAccreditationReadyAction} className="mt-5 grid gap-3 rounded-[24px] border border-[var(--border)] bg-white/85 p-4">
            <select
              name="courseId"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
              required
            >
              <option value="">Kies cursus om accreditatie-ready te publiceren</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <button className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]">
              Server-side check + publiceren
            </button>
          </form>
          <Link href="/lms" className="mt-3 inline-flex rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]">
            Open LMS cockpit
          </Link>
        </div>
      </section>
    </div>
  );
}
