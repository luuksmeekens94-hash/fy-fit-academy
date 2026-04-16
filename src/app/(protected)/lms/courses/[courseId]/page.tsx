import { notFound } from "next/navigation";

import { startEnrollmentAction } from "@/app/lms-actions";
import { LessonList } from "@/components/lms/lesson-list";
import { ProgressBar } from "@/components/lms/progress-bar";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import {
  getCertificateForCourseAndUser,
  getCourseDetail,
  getEnrollmentDetailForUser,
  getLessonProgressForVersion,
} from "@/lib/lms/queries";

type LmsCourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
};

function getEnrollmentTone(status: string) {
  if (status === "COMPLETED") {
    return "success" as const;
  }

  if (status === "IN_PROGRESS") {
    return "warning" as const;
  }

  return "brand" as const;
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Geen datum";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function LmsCourseDetailPage({ params }: LmsCourseDetailPageProps) {
  const user = await requireUser();
  const { courseId } = await params;

  const [course, enrollment, certificate] = await Promise.all([
    getCourseDetail(courseId),
    getEnrollmentDetailForUser(user.id, courseId),
    getCertificateForCourseAndUser(user.id, courseId),
  ]);

  if (!course || !enrollment) {
    notFound();
  }

  const progressEntries = course.activeVersion
    ? await getLessonProgressForVersion(user.id, course.activeVersion.id)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="LMS cursus"
        title={course.title}
        description={course.description}
      />

      <section className="card-surface rounded-[32px] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <StatusBadge label={enrollment.status} tone={getEnrollmentTone(enrollment.status)} />
              {course.isMandatory ? <StatusBadge label="Verplicht" tone="brand" /> : null}
              <StatusBadge label={`${course.studyLoadMinutes} minuten`} tone="neutral" />
            </div>
            <p className="max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
              Doelgroep: {course.audience ?? "Nog niet ingevuld"}
              <br />
              Leerdoelen: {course.learningObjectives ?? "Nog niet ingevuld"}
            </p>
          </div>

          {enrollment.status === "NOT_STARTED" ? (
            <form action={startEnrollmentAction}>
              <input type="hidden" name="courseId" value={course.id} />
              <button
                type="submit"
                className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
              >
                Start cursus
              </button>
            </form>
          ) : null}
        </div>

        <div className="mt-6">
          <ProgressBar value={enrollment.progress} label="Totale cursusvoortgang" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Lessen"
          value={`${enrollment.completedLessonCount}/${enrollment.lessonCount}`}
          detail="Aantal lessen dat op dit moment als afgerond staat geregistreerd."
        />
        <StatCard
          label="Verplichte toetsen"
          value={`${enrollment.passedRequiredAssessmentCount}/${enrollment.requiredAssessmentCount}`}
          detail="Aantal verplichte toetsen dat al met een voldoende resultaat is afgesloten."
        />
        <StatCard
          label="Deadline"
          value={formatDate(enrollment.deadlineAt)}
          detail="Doeldatum waarop deze cursus idealiter volledig is afgerond."
        />
      </section>

      {certificate ? (
        <section className="card-surface rounded-[32px] p-6">
          <h2 className="text-xl font-semibold text-slate-950">Certificaat beschikbaar</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            Deze cursus is afgerond op {formatDate(certificate.issuedAt)}. Certificaatcode: {certificate.certificateCode}.
          </p>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-950">Lessen en onderdelen</h2>
          <p className="text-sm leading-7 text-[var(--ink-soft)]">
            Werk de verplichte lessen af en rond daarna de toetsles af om de cursus volledig te voltooien.
          </p>
        </div>
        <LessonList course={course} progressEntries={progressEntries} />
      </section>
    </div>
  );
}
