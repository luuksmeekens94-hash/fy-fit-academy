import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { startEnrollmentAction } from "@/app/lms-actions";
import { AccreditationPanel } from "@/components/lms/accreditation-panel";
import { LessonList } from "@/components/lms/lesson-list";
import { ProgressBar } from "@/components/lms/progress-bar";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { getLearnerLmsRedirectPath } from "@/lib/lms/route-access";
import { getReviewerPreviewMode } from "@/lib/lms/reviewer-preview";
import {
  getCertificateForCourseAndUser,
  getCourseDetail,
  getCourseParticipantCompletionReport,
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


function ReviewerCourseFlow({ course }: { course: NonNullable<Awaited<ReturnType<typeof getCourseDetail>>> }) {
  const lessons = course.activeVersion?.lessons ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accreditatie-review"
        title={course.title}
        description="Doorloop de e-learning stap voor stap. Alles wat de reviewer nodig heeft staat in deze flow."
      />

      <section className="card-surface rounded-[32px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
              Revieweromgeving
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">E-learning doorlopen</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
              Open de onderdelen in volgorde. De module-inhoud, video’s, toetsing, evaluatie en ondersteunende documenten zijn read-only zichtbaar; er wordt geen voortgang, score of certificaat aangemaakt.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 font-semibold text-[var(--brand-deep)]">
              {lessons.length} stappen
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
              read-only
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {lessons.map((lesson, index) => (
          <Link
            key={lesson.id}
            href={`/lms/courses/${course.id}/lessons/${lesson.id}`}
            className="card-surface flex flex-col gap-4 rounded-[28px] p-5 transition hover:-translate-y-0.5 hover:border-[var(--brand)] lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand-deep)]">
                {index + 1}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={lesson.type === "ASSESSMENT" ? "Toetsing" : lesson.type === "DOCUMENT" ? "Documenten" : lesson.type === "VIDEO" ? "Module + video" : "Module"} tone="neutral" />
                  {lesson.estimatedMinutes > 0 ? <StatusBadge label={`${lesson.estimatedMinutes} min`} tone="neutral" /> : null}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">{lesson.title}</h3>
                {lesson.description ? (
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">{lesson.description}</p>
                ) : null}
              </div>
            </div>
            <span className="self-start rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white lg:self-center">
              Open
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}

export default async function LmsCourseDetailPage({ params }: LmsCourseDetailPageProps) {
  const user = await requireUser();
  const { courseId } = await params;

  const [course, enrollment, certificate] = await Promise.all([
    getCourseDetail(courseId),
    getEnrollmentDetailForUser(user.id, courseId),
    getCertificateForCourseAndUser(user.id, courseId),
  ]);

  if (!course) {
    notFound();
  }

  if (user.role === "REVIEWER" && course.reviewerId !== user.id) {
    notFound();
  }

  if (user.role === "REVIEWER") {
    return <ReviewerCourseFlow course={course} />;
  }

  const previewState = getReviewerPreviewMode(user.role, Boolean(enrollment));

  if (!enrollment && !previewState.canViewWithoutEnrollment) {
    notFound();
  }

  const academyRedirectPath = getLearnerLmsRedirectPath(user.role, {
    courseSlug: course.slug,
  });

  if (academyRedirectPath) {
    redirect(academyRedirectPath);
  }

  const progressEntries = course.activeVersion
    ? await getLessonProgressForVersion(user.id, course.activeVersion.id)
    : [];
  const participantReport = previewState.canViewWithoutEnrollment
    ? await getCourseParticipantCompletionReport(course.id)
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
              <StatusBadge
                label={enrollment?.status ?? previewState.label}
                tone={enrollment ? getEnrollmentTone(enrollment.status) : "brand"}
              />
              {course.isMandatory ? <StatusBadge label="Need to know" tone="brand" /> : null}
              <StatusBadge label={`${course.studyLoadMinutes} minuten`} tone="neutral" />
            </div>
            <p className="max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
              Doelgroep: {course.audience ?? "Nog niet ingevuld"}
              <br />
              Leerdoelen: {course.learningObjectives ?? "Nog niet ingevuld"}
            </p>
          </div>

          {enrollment?.status === "NOT_STARTED" ? (
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
          <ProgressBar value={enrollment?.progress ?? 0} label={enrollment ? "Totale cursusvoortgang" : "Preview zonder gebruikersvoortgang"} />
        </div>
      </section>

      {previewState.isPreview ? (
        <section className="rounded-[28px] border border-[var(--brand)] bg-[var(--brand-soft)] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge label={previewState.label} tone="brand" />
            <StatusBadge label="geen datavervuiling" tone="success" />
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--brand-deep)]">
            Previewmodus actief: je kunt inhoud, leerdoelen, literatuur, toetsopbouw, evaluatie en rapportages bekijken zonder inschrijving, voortgang, toetspogingen, evaluaties of certificaten aan te maken.
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Lessen"
          value={enrollment ? `${enrollment.completedLessonCount}/${enrollment.lessonCount}` : `${course.activeVersion?.lessons.length ?? 0}`}
          detail="Aantal lessen dat op dit moment als afgerond staat geregistreerd."
        />
        <StatCard
          label="Need-to-know toetsen"
          value={enrollment ? `${enrollment.passedRequiredAssessmentCount}/${enrollment.requiredAssessmentCount}` : `${course.activeVersion?.assessments.filter((assessment) => assessment.isRequiredForCompletion).length ?? 0}`}
          detail="Aantal need-to-know toetsen dat al met een voldoende resultaat is afgesloten."
        />
        <StatCard
          label="Deadline"
          value={formatDate(enrollment?.deadlineAt ?? null)}
          detail="Doeldatum waarop deze cursus idealiter volledig is afgerond."
        />
      </section>

      {previewState.canViewWithoutEnrollment ? (
        <AccreditationPanel
          course={course}
          mode={previewState.mode === "reviewer" ? "reviewer" : "beheer"}
          completionReport={participantReport}
        />
      ) : null}

      {certificate ? (
        <section className="card-surface rounded-[32px] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Certificaat/deelnamebewijs beschikbaar</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
                Deze cursus is afgerond op {formatDate(certificate.issuedAt)}. Certificaatcode: {certificate.certificateCode}.
                Download opent als printwaardige HTML zodat je via de browser direct als PDF kunt opslaan.
              </p>
            </div>
            <Link
              href={`/lms/certificates/${certificate.id}/download`}
              className="rounded-full bg-[var(--brand)] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
            >
              Open certificaat
            </Link>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-950">Lessen en onderdelen</h2>
          <p className="text-sm leading-7 text-[var(--ink-soft)]">
            Doorloop de need-to-know lessen en rond daarna de toetsles af om de cursus volledig te voltooien.
          </p>
        </div>
        <LessonList course={course} progressEntries={progressEntries} />
      </section>
    </div>
  );
}
