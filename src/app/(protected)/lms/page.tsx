import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { CourseCard } from "@/components/lms/course-card";
import { requireUser } from "@/lib/auth";
import { getLearnerLmsRedirectPath } from "@/lib/lms/route-access";
import { getAllCourses, getMyEnrollments } from "@/lib/lms/queries";
import { buildReviewerCoursePreviewSummary } from "@/lib/lms/reviewer-preview";
import { redirect } from "next/navigation";

export default async function LmsOverviewPage() {
  const user = await requireUser();

  const academyRedirectPath = getLearnerLmsRedirectPath(user.role);

  if (academyRedirectPath) {
    redirect(academyRedirectPath);
  }

  const isPreviewUser = user.role === "REVIEWER" || user.role === "BEHEERDER";
  const [enrollments, reviewerCourses] = await Promise.all([
    getMyEnrollments(user.id),
    isPreviewUser ? getAllCourses() : Promise.resolve([]),
  ]);
  const reviewerPreviewSummary = isPreviewUser
    ? buildReviewerCoursePreviewSummary(reviewerCourses)
    : null;

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

      {reviewerPreviewSummary ? (
        <section className="card-surface rounded-[32px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
                Reviewer-preview
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Accreditatiecommissie toegang
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
                Je kunt alle e-learnings openen zonder inschrijving, voortgang, toetspogingen, evaluaties of certificaten aan te maken. Deze weergave is dus veilig voor commissiecontrole.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm lg:min-w-72">
              <div className="rounded-[20px] border border-[var(--border)] bg-white/85 p-4">
                <p className="text-[var(--ink-soft)]">Totaal</p>
                <p className="text-2xl font-semibold text-slate-950">{reviewerPreviewSummary.totalCourses}</p>
              </div>
              <div className="rounded-[20px] border border-[var(--border)] bg-white/85 p-4">
                <p className="text-[var(--ink-soft)]">Gepubliceerd</p>
                <p className="text-2xl font-semibold text-slate-950">{reviewerPreviewSummary.publishedCourses}</p>
              </div>
              <div className="rounded-[20px] border border-[var(--border)] bg-white/85 p-4">
                <p className="text-[var(--ink-soft)]">Concept</p>
                <p className="text-2xl font-semibold text-slate-950">{reviewerPreviewSummary.draftCourses}</p>
              </div>
              <div className="rounded-[20px] border border-[var(--border)] bg-white/85 p-4">
                <p className="text-[var(--ink-soft)]">Studielast</p>
                <p className="text-2xl font-semibold text-slate-950">{reviewerPreviewSummary.totalStudyLoadMinutes}m</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {reviewerPreviewSummary.items.map((course) => (
              <Link
                key={course.id}
                href={course.previewPath}
                className="rounded-[24px] border border-[var(--border)] bg-white/85 p-5 transition hover:-translate-y-0.5 hover:border-[var(--brand)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-deep)]">
                    {course.status}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {course.studyLoadMinutes} minuten
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-950">{course.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                  Register: {course.displayAccreditationRegister} · versies: {course.versionCount} · inschrijvingen: {course.enrollmentCount}
                </p>
                <p className="mt-3 text-sm font-semibold text-[var(--brand-deep)]">Open veilige preview →</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {enrollments.length ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {enrollments.map((enrollment) => (
            <CourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </section>
      ) : (
        <section className="card-surface rounded-[32px] p-6">
          <p className="text-base leading-7 text-[var(--ink-soft)]">
            {reviewerPreviewSummary
              ? "Je reviewer-preview gebruikt geen persoonlijke LMS-inschrijvingen. De e-learnings staan hierboven als veilige commissiepreview."
              : "Er staan nog geen LMS-cursussen voor je klaar. Zodra er scholing wordt toegewezen, verschijnt die hier."}
          </p>
        </section>
      )}

      <section className="card-surface rounded-[32px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Korte stand van zaken</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
              Je hebt op dit moment {completedCount} cursus{completedCount === 1 ? "" : "sen"} afgerond.
              Je certificaten staan in een apart archief en zijn daar direct print-/PDF-waardig te downloaden.
            </p>
          </div>
          <Link className="btn-primary shrink-0" href="/lms/certificates">
            Mijn certificaten
          </Link>
        </div>
      </section>
    </div>
  );
}
