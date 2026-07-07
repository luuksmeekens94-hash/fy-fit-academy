import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AcademyCourseHero } from "@/components/academy/academy-course-hero";
import { AcademyCourseIntro } from "@/components/academy/academy-course-intro";
import { AcademyLessonList } from "@/components/academy/academy-lesson-list";
import { AcademyStartButton } from "@/components/academy/academy-start-button";
import { AcademyStatusPanel } from "@/components/academy/academy-status-panel";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { getAcademyCourseBySlugForUser } from "@/lib/academy/queries";
import { canUsePersonalLms } from "@/lib/roles";

function looksLikeLegacyAcademyId(value: string) {
  return /^c[a-z0-9]{20,}$/i.test(value);
}

export default async function AcademyCourseDetailPage({
  params,
}: PageProps<"/academy/[courseSlug]">) {
  const user = await requireUser();
  if (!canUsePersonalLms(user.role)) {
    redirect("/");
  }

  const { courseSlug } = await params;
  const course = await getAcademyCourseBySlugForUser(
    user.id,
    courseSlug,
    user.role === "BEHEERDER",
  );

  if (!course) {
    if (looksLikeLegacyAcademyId(courseSlug)) {
      redirect("/academy");
    }

    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academy e-learning"
        title={course.title}
        description={course.description}
      />

      <AcademyCourseHero
        course={course}
        action={<AcademyStartButton courseId={course.id} isStarted={course.status !== "NOT_STARTED"} />}
      />

      <AcademyStatusPanel
        tone={course.completionState.tone}
        title={course.completionState.title}
        message={course.completionState.message}
      />

      <AcademyCourseIntro sections={course.introSections} />

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-950">Lessen</h2>
          <p className="text-sm leading-7 text-[var(--ink-soft)]">
            Doorloop de lessen in volgorde, rond de toets af en vul daarna de evaluatie in om deze e-learning compleet te maken.
          </p>
        </div>
        <AcademyLessonList lessons={course.lessons} />
      </section>

      {course.requiredLiterature.length ? (
        <section className="card-surface flex flex-col gap-4 rounded-[24px] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">Stap 5 · Verplichte literatuur</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Twee artikelen lezen</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              Lees de verplichte literatuur na de modules. Deze stap telt mee voor de voortgang van de e-learning.
            </p>
          </div>
          <Link href={`/lms/courses/${course.id}/literature`} className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]">
            Literatuur openen
          </Link>
        </section>
      ) : null}

      {course.evaluationStep ? (
        <section className="card-surface flex flex-col gap-4 rounded-[24px] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">Stap 6 · Evaluatie</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Evaluatieformulier invullen</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
              Vul na de verplichte literatuur de evaluatie in. Je antwoorden worden opgeslagen voor Fy-Fit.
            </p>
          </div>
          <Link href={course.evaluationStep.href} className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]">
            {course.evaluationStep.status === "COMPLETED" ? "Evaluatie bekijken" : "Evaluatie invullen"}
          </Link>
        </section>
      ) : null}
    </div>
  );
}
