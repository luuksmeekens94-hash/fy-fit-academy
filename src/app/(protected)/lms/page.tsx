import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { CourseCard } from "@/components/lms/course-card";
import { requireUser } from "@/lib/auth";
import { getLearnerLmsRedirectPath } from "@/lib/lms/route-access";
import { getMyEnrollments } from "@/lib/lms/queries";
import { redirect } from "next/navigation";

export default async function LmsOverviewPage() {
  const user = await requireUser();

  const academyRedirectPath = getLearnerLmsRedirectPath(user.role);

  if (academyRedirectPath) {
    redirect(academyRedirectPath);
  }

  const enrollments = await getMyEnrollments(user.id);

  const completedCount = enrollments.filter((entry) => entry.status === "COMPLETED").length;
  const inProgressCount = enrollments.filter((entry) => entry.status === "IN_PROGRESS").length;
  const requiredCount = enrollments.filter((entry) => entry.assignmentType === "REQUIRED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="LMS"
        title="Mijn LMS cursussen"
        description="Hier zie je welke cursussen voor je klaarstaan, hoe ver je bent en welke scholing nog om aandacht vraagt."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Totaal"
          value={String(enrollments.length)}
          detail="Aantal LMS-cursussen dat nu aan jouw account gekoppeld is."
        />
        <StatCard
          label="In uitvoering"
          value={String(inProgressCount)}
          detail="Cursussen die al gestart zijn en nog niet zijn afgerond."
        />
        <StatCard
          label="Verplicht"
          value={String(requiredCount)}
          detail="Scholing die direct onderdeel is van jouw leerpad of teamafspraak."
        />
      </section>

      {enrollments.length ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {enrollments.map((enrollment) => (
            <CourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </section>
      ) : (
        <section className="card-surface rounded-[32px] p-6">
          <p className="text-base leading-7 text-[var(--ink-soft)]">
            Er staan nog geen LMS-cursussen voor je klaar. Zodra er scholing wordt toegewezen, verschijnt die hier.
          </p>
        </section>
      )}

      <section className="card-surface rounded-[32px] p-6">
        <h2 className="text-xl font-semibold text-slate-950">Korte stand van zaken</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
          Je hebt op dit moment {completedCount} cursus{completedCount === 1 ? "" : "sen"} afgerond.
          De eerste medewerkerflow van het LMS is hiermee zichtbaar; toetsafname en certificaatweergave worden in de volgende stap verder aangesloten op de UI.
        </p>
      </section>
    </div>
  );
}
