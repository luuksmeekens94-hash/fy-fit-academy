import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { buildAcademyAdminCockpit } from "@/lib/academy-admin-cockpit";
import { getAllCourses } from "@/lib/lms/queries";

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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Cursussen", value: cockpit.metrics.totalCourses, detail: "Alle LMS-cursussen in beheer." },
          { label: "Gepubliceerd", value: cockpit.metrics.publishedCourses, detail: "Live voor deelnemers of zichtbaarheid." },
          { label: "In review", value: cockpit.metrics.reviewCourses, detail: "Klaar voor inhoudelijke controle." },
          { label: "Accreditatie-ready", value: cockpit.metrics.accreditationReadyCourses, detail: "Register en toetsnorm aanwezig." },
        ].map((metric) => (
          <div key={metric.label} className="card-surface rounded-[28px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">{metric.label}</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-4">
        {cockpit.workflows.map((workflow) => (
          <a key={workflow.key} href={workflow.href} className="card-surface rounded-[28px] p-5 transition hover:-translate-y-0.5 hover:border-[var(--brand)]">
            <StatusBadge label={workflow.status} tone="neutral" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950">{workflow.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{workflow.description}</p>
            <p className="mt-5 text-sm font-semibold text-[var(--brand-deep)]">{workflow.cta} →</p>
          </a>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div id="toetsvragen" className="card-surface rounded-[32px] p-6">
          <StatusBadge label="Toetsvragenbeheer" tone="brand" />
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Vragenbank en toetsnorm</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            Check per cursus of de 70%-norm, maximaal 3 pogingen, randomisatie en leerdoelkoppeling aantoonbaar zijn voordat je publiceert.
          </p>
          <div className="mt-5 grid gap-3 rounded-[28px] bg-[var(--brand-soft)] p-5 md:grid-cols-2">
            <input placeholder="Vraagbank / toetsblok" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
            <input placeholder="Leerdoelcodes, bijv. LO1, LO2" className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
            <input type="number" defaultValue={70} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
            <input type="number" defaultValue={3} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
            <p className="md:col-span-2 text-xs leading-5 text-[var(--ink-soft)]">
              Beheerflow nu expliciet; opslag sluit later aan op bestaande cursus-/assessmentmodel en server actions.
            </p>
          </div>
        </div>

        <div id="evaluaties" className="card-surface rounded-[32px] p-6">
          <StatusBadge label="Evaluatiebeheer" tone="success" />
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Evaluatie-template</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            Borg vragen over relevantie, toepasbaarheid, kwaliteit, toetsfit, studielast en verbeterpunten als vaste accreditatielaag.
          </p>
          <div className="mt-5 space-y-3">
            {["Relevantie voor dagelijkse praktijk", "Toepasbaarheid morgen", "Kwaliteit inhoud/docent", "Toets sluit aan op leerdoelen", "Studielast klopt"].map((item) => (
              <div key={item} className="rounded-[22px] border border-[var(--border)] bg-white/85 p-4 text-sm font-medium text-slate-900">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div id="accreditatie" className="card-surface rounded-[32px] p-6">
          <StatusBadge label="Accreditatiecockpit" tone="warning" />
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Cursussen die aandacht vragen</h2>
          <div className="mt-5 space-y-3">
            {cockpit.coursesNeedingAttention.length ? cockpit.coursesNeedingAttention.map((course) => (
              <Link key={course.id} href={course.href} className="block rounded-[22px] border border-[var(--border)] bg-white/85 p-4 transition hover:border-[var(--brand)]">
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
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Publicatieflow</h2>
          <div className="mt-5 space-y-3">
            {["Concept vullen", "Reviewer-preview controleren", "Accreditatiecheck afronden", "Publiceren", "Archiveren bij nieuwe versie"].map((step, index) => (
              <div key={step} className="flex gap-3 rounded-[22px] border border-[var(--border)] bg-white/85 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand-deep)]">{index + 1}</span>
                <p className="text-sm font-medium text-slate-900">{step}</p>
              </div>
            ))}
          </div>
          <Link href="/lms" className="mt-5 inline-flex rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">
            Open LMS cockpit
          </Link>
        </div>
      </section>
    </div>
  );
}
