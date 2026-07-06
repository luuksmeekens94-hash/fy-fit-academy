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
import { prisma } from "@/lib/prisma";
import { getLearnerLmsRedirectPath } from "@/lib/lms/route-access";
import {
  buildReviewerModuleProgress,
  buildReviewerTheorySubLessons,
  summarizeReviewerCourseProgress,
} from "@/lib/lms/reviewer-sublessons";
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


async function ReviewerCourseFlow({ course, userId }: { course: NonNullable<Awaited<ReturnType<typeof getCourseDetail>>>; userId: string }) {
  const lessons = course.activeVersion?.lessons ?? [];
  const lessonIds = lessons.map((lesson) => lesson.id);
  const [stepProgress, assignmentSubmissions] = await Promise.all([
    prisma.lessonStepProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { lessonId: true, stepKey: true },
    }),
    prisma.communityAssignmentSubmission.findMany({
      where: { userId, courseId: course.id },
      select: { lessonId: true },
    }),
  ]);
  const completedStepKeysByLessonId = new Map<string, Set<string>>();

  stepProgress.forEach((entry) => {
    const current = completedStepKeysByLessonId.get(entry.lessonId) ?? new Set<string>();
    current.add(entry.stepKey);
    completedStepKeysByLessonId.set(entry.lessonId, current);
  });

  const moduleProgress = buildReviewerModuleProgress({
    lessons,
    completedStepKeysByLessonId,
    submittedAssignmentLessonIds: new Set(assignmentSubmissions.map((entry) => entry.lessonId)),
  });
  const courseProgress = summarizeReviewerCourseProgress(moduleProgress);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accreditatie-review"
        title={course.title}
        description="Doorloop de e-learning stap voor stap. Je voortgang wordt op dit overzicht bijgehouden."
      />

      <section className="card-surface rounded-[32px] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
              E-learning doorlopen
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {courseProgress.isCompleted ? "Alle modules afgerond" : courseProgress.isStarted ? `${courseProgress.percentage}% doorlopen` : "Start bij module 1"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
              Open een module, rond de losse lessen af en ga daarna door met de opdracht en kennischeck.
            </p>
          </div>
          <div className="min-w-[220px]">
            <ProgressBar value={courseProgress.percentage} label={`${courseProgress.completedModules}/${courseProgress.totalModules} modules afgerond`} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {lessons.map((lesson, index) => {
          const progress = moduleProgress.find((entry) => entry.lessonId === lesson.id) ?? null;
          const subLessons = buildReviewerTheorySubLessons(lesson.content);
          const href = progress
            ? `/lms/courses/${course.id}/lessons/${lesson.id}${progress.firstSubLessonHrefSuffix}`
            : `/lms/courses/${course.id}/lessons/${lesson.id}`;
          const statusLabel = progress?.isCompleted
            ? "Afgerond"
            : progress?.isStarted
              ? `${progress.percentage}% doorlopen`
              : lesson.type === "ASSESSMENT"
                ? "Eindtoets"
                : "Nog te starten";
          const statusTone = progress?.isCompleted ? "success" : progress?.isStarted ? "warning" : "neutral";

          return (
            <Link
              key={lesson.id}
              href={href}
              className="card-surface flex flex-col gap-4 rounded-[28px] p-5 transition hover:-translate-y-0.5 hover:border-[var(--brand)] lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex flex-1 gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand-deep)]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={statusLabel} tone={statusTone} />
                    {progress ? <StatusBadge label={`${subLessons.length} lessen`} tone="neutral" /> : null}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{lesson.title}</h3>
                  {lesson.description ? (
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">{lesson.description}</p>
                  ) : null}
                  {progress ? (
                    <div className="mt-4 max-w-xl">
                      <ProgressBar value={progress.percentage} label={`${progress.completedSteps}/${progress.totalSteps} stappen`} />
                    </div>
                  ) : null}
                </div>
              </div>
              <span className="self-start rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white lg:self-center">
                {progress?.isStarted ? "Ga verder" : "Open"}
              </span>
            </Link>
          );
        })}
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
    return await ReviewerCourseFlow({ course, userId: user.id });
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
  const communitySubmissions = user.role === "BEHEERDER"
    ? await prisma.communityAssignmentSubmission.findMany({
        where: { courseId: course.id },
        orderBy: { submittedAt: "desc" },
        take: 12,
        select: {
          id: true,
          title: true,
          answer: true,
          submittedAt: true,
          user: { select: { name: true, email: true } },
          lesson: { select: { title: true } },
        },
      })
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
            <StatusBadge label="commissiepreview" tone="success" />
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--brand-deep)]">
            Previewmodus actief: je kunt inhoud, leerdoelen, literatuur, toetsopbouw, evaluatie en rapportages rustig nalopen.
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

      {user.role === "BEHEERDER" ? (
        <section className="card-surface overflow-hidden rounded-[32px]">
          <div className="academy-gradient-panel px-6 py-6 sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
              Community-opdrachten
            </p>
            <h2 className="display-font mt-2 text-3xl font-semibold text-slate-950">Ingeleverde moduleopdrachten</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
              De laatste antwoorden uit de community-opdrachten. Deze worden opgeslagen zodra een cursist/reviewer op Inleveren klikt.
            </p>
          </div>
          <div className="grid gap-4 bg-white px-5 py-5 sm:px-8">
            {communitySubmissions.length ? communitySubmissions.map((submission) => (
              <article key={submission.id} className="rounded-[26px] border border-[var(--border)] bg-[var(--brand-wash)]/35 p-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                      {submission.lesson.title}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">{submission.title}</h3>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      {submission.user.name} · {submission.user.email} · {formatDate(submission.submittedAt)}
                    </p>
                  </div>
                  <StatusBadge label="ingeleverd" tone="success" />
                </div>
                <p className="mt-4 whitespace-pre-line rounded-[20px] bg-white/85 px-4 py-3 text-sm leading-7 text-[var(--ink-soft)]">
                  {submission.answer}
                </p>
              </article>
            )) : (
              <div className="rounded-[26px] border border-dashed border-[var(--border)] bg-white/80 p-5 text-sm leading-7 text-[var(--ink-soft)]">
                Nog geen community-opdrachten ingeleverd voor deze e-learning.
              </div>
            )}
          </div>
        </section>
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
