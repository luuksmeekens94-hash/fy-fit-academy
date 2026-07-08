import Link from "next/link";
import { notFound } from "next/navigation";

import { markRequiredLiteratureReadAction } from "@/app/lms-actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getReviewerPreviewMode } from "@/lib/lms/reviewer-preview";
import { getCourseDetail, getEnrollmentDetailForUser } from "@/lib/lms/queries";
import { getRequiredLiteratureProgressLesson, REQUIRED_LITERATURE_STEP_KEY } from "@/lib/lms/required-literature";
import { prisma } from "@/lib/prisma";

type LiteraturePageProps = {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ gelezen?: string }>;
};

export default async function RequiredLiteraturePage({ params, searchParams }: LiteraturePageProps) {
  const user = await requireUser();
  const { courseId } = await params;
  const { gelezen } = await searchParams;

  const [course, enrollment] = await Promise.all([
    getCourseDetail(courseId),
    getEnrollmentDetailForUser(user.id, courseId),
  ]);

  if (!course?.activeVersion) {
    notFound();
  }

  if (user.role === "REVIEWER" && course.reviewerId !== user.id) {
    notFound();
  }

  const previewState = getReviewerPreviewMode(user.role, Boolean(enrollment));
  const canView = Boolean(enrollment) || previewState.canViewWithoutEnrollment || user.role === "BEHEERDER";

  if (!canView) {
    notFound();
  }

  const requiredLiterature = course.activeVersion.literature.filter((reference) =>
    reference.guideline?.toLowerCase().includes("verplichte"),
  );

  if (!requiredLiterature.length) {
    notFound();
  }

  const progressLesson = getRequiredLiteratureProgressLesson(course.activeVersion.lessons);
  const progress = progressLesson
    ? await prisma.lessonStepProgress.findUnique({
        where: {
          userId_lessonId_stepKey: {
            userId: user.id,
            lessonId: progressLesson.id,
            stepKey: REQUIRED_LITERATURE_STEP_KEY,
          },
        },
        select: { completedAt: true },
      })
    : null;

  const isCompleted = Boolean(progress);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Verplichte literatuur"
        title="Verplichte literatuur lezen"
        description="Lees de verplichte artikelen als onderdeel van de zelfstudie. In de e-learning staan ze nu per module op de plek waar ze worden getoetst."
      />

      <section className="card-surface rounded-[32px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label={isCompleted ? "gelezen" : "nog te lezen"} tone={isCompleted ? "success" : "warning"} />
              <StatusBadge label="telt mee voor voortgang" tone="brand" />
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Twee verplichte artikelen</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
              Deze literatuur hoort bij de toetsing en zelfstudie van de e-learning. Markeer deze stap als gelezen wanneer je beide artikelen hebt doorgenomen.
            </p>
          </div>
          <Link href={`/lms/courses/${course.id}`} className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]">
            E-learning overzicht
          </Link>
        </div>
      </section>

      {gelezen ? (
        <section className="rounded-[28px] border border-emerald-100 bg-emerald-50 px-6 py-5 text-sm leading-7 text-emerald-800">
          <p className="font-semibold">Verplichte literatuur gemarkeerd als gelezen.</p>
          <p>Deze stap telt nu mee in de voortgang van de e-learning.</p>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        {requiredLiterature.map((reference) => (
          <article key={reference.id} className="card-surface rounded-[28px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">Verplicht artikel</p>
            <h3 className="mt-2 text-lg font-semibold leading-7 text-slate-950">{reference.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
              {[reference.source, reference.year ? String(reference.year) : null].filter(Boolean).join(" · ")}
            </p>
            {reference.url ? (
              <a href={reference.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]">
                Open artikel
              </a>
            ) : null}
          </article>
        ))}
      </section>

      <section className="card-surface rounded-[30px] p-6">
        <h2 className="text-xl font-semibold text-slate-950">Zelfstudie-bijlagen</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
          Deze bestanden onderbouwen hoe de verplichte literatuur meetelt in de zelfstudie en accreditatie.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/lms/pfp/zelfstudie-onderdelen.docx" target="_blank" rel="noreferrer" className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]">
            Open zelfstudie-onderdelen
          </a>
          <a href="/lms/pfp/zelfstudie-literatuur.xlsx" target="_blank" rel="noreferrer" className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]">
            Open zelfstudie-literatuur
          </a>
        </div>
      </section>

      <form action={markRequiredLiteratureReadAction} className="card-surface flex flex-col gap-4 rounded-[30px] p-6 lg:flex-row lg:items-center lg:justify-between">
        <input type="hidden" name="courseId" value={course.id} />
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Literatuur gelezen?</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            Bevestig dit pas nadat je beide verplichte artikelen hebt doorgenomen.
          </p>
        </div>
        <button type="submit" className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]">
          {isCompleted ? "Opnieuw bevestigen" : "Markeer als gelezen"}
        </button>
      </form>
    </div>
  );
}
