import { notFound, redirect } from "next/navigation";

import { AcademyCourseHero } from "@/components/academy/academy-course-hero";
import { AcademyCourseIntro } from "@/components/academy/academy-course-intro";
import { AcademyLessonList } from "@/components/academy/academy-lesson-list";
import { AcademyStartButton } from "@/components/academy/academy-start-button";
import { AcademyStatusPanel } from "@/components/academy/academy-status-panel";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { getAcademyCourseBySlugForUser } from "@/lib/academy/queries";

function looksLikeLegacyAcademyId(value: string) {
  return /^c[a-z0-9]{20,}$/i.test(value);
}

export default async function AcademyCourseDetailPage({
  params,
}: PageProps<"/academy/[courseSlug]">) {
  const user = await requireUser();
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
            Doorloop de lessen in volgorde en rond de toets af om deze e-learning compleet te maken.
          </p>
        </div>
        <AcademyLessonList lessons={course.lessons} />
      </section>
    </div>
  );
}
