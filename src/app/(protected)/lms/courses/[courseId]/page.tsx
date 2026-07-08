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
  buildReviewerModuleStepLinks,
  buildReviewerModuleProgress,
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
import { isRequiredLiteratureReference } from "@/lib/lms/required-literature";

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

function formatEvaluationAnswerValue(answer: { rating: number | null; booleanValue: boolean | null; text: string | null; question?: { type?: string } }) {
  if (answer.rating !== null) {
    return `${answer.rating}/${answer.question?.type === "SCALE_1_10" ? 10 : 5}`;
  }

  if (answer.booleanValue !== null) {
    return answer.booleanValue ? "Ja" : "Nee";
  }

  return answer.text || "Geen antwoord";
}


async function ReviewerCourseFlow({ course, userId }: { course: NonNullable<Awaited<ReturnType<typeof getCourseDetail>>>; userId: string }) {
  const lessons = course.activeVersion?.lessons ?? [];
  const lessonIds = lessons.map((lesson) => lesson.id);
  const evaluationForm = course.activeVersion?.evaluationForms.find((form) => form.isRequired) ?? course.activeVersion?.evaluationForms[0] ?? null;
  const [stepProgress, assignmentSubmissions, evaluationSubmission] = await Promise.all([
    prisma.lessonStepProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { lessonId: true, stepKey: true },
    }),
    prisma.communityAssignmentSubmission.findMany({
      where: { userId, courseId: course.id },
      select: { lessonId: true },
    }),
    evaluationForm
      ? prisma.evaluationSubmission.findUnique({
          where: {
            evaluationFormId_userId: {
              evaluationFormId: evaluationForm.id,
              userId,
            },
          },
          select: { id: true, submittedAt: true },
        })
      : Promise.resolve(null),
  ]);
  const completedStepKeysByLessonId = new Map<string, Set<string>>();

  stepProgress.forEach((entry) => {
    const current = completedStepKeysByLessonId.get(entry.lessonId) ?? new Set<string>();
    current.add(entry.stepKey);
    completedStepKeysByLessonId.set(entry.lessonId, current);
  });

  const requiredLiterature = course.activeVersion?.literature.filter(isRequiredLiteratureReference) ?? [];
  const requiredLiteratureModuleIds = new Set(
    requiredLiterature
      .map((reference) => reference.moduleId)
      .filter((moduleId): moduleId is string => Boolean(moduleId)),
  );
  const moduleProgress = buildReviewerModuleProgress({
    lessons,
    completedStepKeysByLessonId,
    submittedAssignmentLessonIds: new Set(assignmentSubmissions.map((entry) => entry.lessonId)),
    requiredLiteratureModuleIds,
  });
  const moduleSummary = summarizeReviewerCourseProgress(moduleProgress);
  const evaluationStepCount = evaluationForm ? 1 : 0;
  const completedEvaluationSteps = evaluationSubmission ? 1 : 0;
  const totalCourseSteps = moduleSummary.totalSteps + evaluationStepCount;
  const completedCourseSteps = moduleSummary.completedSteps + completedEvaluationSteps;
  const coursePercentage = totalCourseSteps ? Math.round((completedCourseSteps / totalCourseSteps) * 100) : moduleSummary.percentage;
  const moduleLessonIds = new Set(moduleProgress.map((entry) => entry.lessonId));
  const supportingLessons = lessons.filter((lesson) => !moduleLessonIds.has(lesson.id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="E-learning"
        title={course.title}
        description="Doorloop de modules zoals een cursist dat doet. Je kunt altijd direct naar een les, opdracht, kennischeck of evaluatie."
      />

      <section className="card-surface rounded-[32px] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
              E-learning doorlopen
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {completedCourseSteps >= totalCourseSteps && totalCourseSteps > 0 ? "E-learning afgerond" : completedCourseSteps > 0 ? `${coursePercentage}% doorlopen` : "Start bij module 1"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
              Open de volgende stap of spring kort terug naar een specifieke les wanneer je iets opnieuw wilt bekijken.
            </p>
          </div>
          <div className="min-w-[220px]">
            <ProgressBar value={coursePercentage} label={`${completedCourseSteps}/${totalCourseSteps} stappen afgerond`} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {moduleProgress.map((progress, index) => {
          const lesson = lessons.find((entry) => entry.id === progress.lessonId);
          if (!lesson) return null;
          const hasRequiredLiterature = Boolean(lesson.moduleId && requiredLiteratureModuleIds.has(lesson.moduleId));
          const stepLinks = buildReviewerModuleStepLinks(lesson, { hasRequiredLiterature });
          const theoryStepCount = stepLinks.filter((step) => step.kind === "theory").length;
          const href = `/lms/courses/${course.id}/lessons/${lesson.id}${progress.nextStepHrefSuffix || progress.firstSubLessonHrefSuffix}`;
          const statusLabel = progress.isCompleted ? "Afgerond" : progress.isStarted ? `${progress.percentage}% doorlopen` : "Nog te starten";
          const statusTone = progress.isCompleted ? "success" : progress.isStarted ? "warning" : "neutral";
          const primaryLabel = progress.isCompleted ? "Opnieuw bekijken" : progress.isStarted ? "Ga verder" : "Open";
          const moduleDescription = hasRequiredLiterature
            ? `Lees eerst de verplichte literatuur, doorloop daarna ${theoryStepCount} lessen en maak vervolgens de opdracht en kennischeck van deze module.`
            : `Doorloop ${theoryStepCount} lessen, daarna de opdracht en kennischeck van deze module.`;

          return (
            <article key={lesson.id} className="card-surface flex flex-col gap-4 rounded-[28px] p-5 transition hover:border-[var(--brand)] lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand-deep)]">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={statusLabel} tone={statusTone} />
                    <StatusBadge label={`${theoryStepCount} lessen`} tone="neutral" />
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{lesson.title}</h3>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">{moduleDescription}</p>
                  <div className="mt-4 max-w-xl">
                    <ProgressBar value={progress.percentage} label={`${progress.completedSteps}/${progress.totalSteps} stappen`} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {stepLinks.map((step) => (
                      <Link key={step.key} href={`/lms/courses/${course.id}/lessons/${lesson.id}${step.hrefSuffix}`} className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)] hover:bg-[var(--brand-wash)]">
                        {step.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <Link href={href} className="self-start rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)] lg:self-center">
                {primaryLabel}
              </Link>
            </article>
          );
        })}

        {evaluationForm ? (
          <article className="card-surface flex flex-col gap-4 rounded-[28px] p-5 transition hover:border-[var(--brand)] lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand-deep)]">{moduleProgress.length + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={evaluationSubmission ? "Ingevuld" : "Nog in te vullen"} tone={evaluationSubmission ? "success" : "warning"} />
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">Evaluatieformulier</h3>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">Vul na de modules de evaluatie in. De antwoorden worden opgeslagen voor Fy-Fit.</p>
                <div className="mt-4 max-w-xl">
                  <ProgressBar value={evaluationSubmission ? 100 : 0} label={evaluationSubmission ? "Evaluatie ingevuld" : "Nog niet ingevuld"} />
                </div>
              </div>
            </div>
            <Link href={`/lms/courses/${course.id}/evaluation`} className="self-start rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)] lg:self-center">
              {evaluationSubmission ? "Bekijken" : "Invullen"}
            </Link>
          </article>
        ) : null}

        {supportingLessons.map((lesson, index) => {
          const displayTitle = lesson.type === "DOCUMENT" ? "Accreditatieondersteunende documenten en bronmateriaal" : lesson.type === "ASSESSMENT" ? "Volledige toetsvragenbank" : lesson.title;
          const description = lesson.type === "DOCUMENT"
            ? "Naslagwerk: formats, onderbouwing, literatuur en het PDF-evaluatieformulier."
            : lesson.type === "ASSESSMENT"
              ? "Naslag van de volledige vragenbank bij deze e-learning."
              : lesson.description;

          return (
            <article key={lesson.id} className="card-surface flex flex-col gap-4 rounded-[28px] p-5 transition hover:border-[var(--brand)] lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand-deep)]">{moduleProgress.length + evaluationStepCount + index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={lesson.type === "DOCUMENT" ? "Naslagwerk" : "Naslag"} tone="neutral" />
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{displayTitle}</h3>
                  {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">{description}</p> : null}
                </div>
              </div>
              <Link href={`/lms/courses/${course.id}/lessons/${lesson.id}`} className="self-start rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)] lg:self-center">
                Open
              </Link>
            </article>
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
  const activeEvaluationFormIds = course.activeVersion?.evaluationForms.map((form) => form.id) ?? [];
  const [communitySubmissions, evaluationSubmissions] = user.role === "BEHEERDER"
    ? await Promise.all([
        prisma.communityAssignmentSubmission.findMany({
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
        }),
        prisma.evaluationSubmission.findMany({
          where: { evaluationFormId: { in: activeEvaluationFormIds } },
          orderBy: { submittedAt: "desc" },
          take: 20,
          include: {
            user: { select: { name: true, email: true } },
            answers: {
              include: { question: true },
              orderBy: { question: { order: "asc" } },
            },
          },
        }),
      ])
    : [[], []];

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
        <>
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

        <section className="card-surface overflow-hidden rounded-[32px]">
          <div className="academy-gradient-panel px-6 py-6 sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
              Evaluatiedata
            </p>
            <h2 className="display-font mt-2 text-3xl font-semibold text-slate-950">Ingevulde evaluatieformulieren</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
              Antwoorden van cursisten/reviewers op stap 5. Hiermee kan Fy-Fit de evaluatiegegevens terugzien.
            </p>
          </div>
          <div className="grid gap-4 bg-white px-5 py-5 sm:px-8">
            {evaluationSubmissions.length ? evaluationSubmissions.map((submission) => (
              <article key={submission.id} className="rounded-[26px] border border-[var(--border)] bg-[var(--brand-wash)]/35 p-5">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{submission.user.name}</h3>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      {submission.user.email} · {formatDate(submission.submittedAt)}
                      {submission.actualStudyMinutes ? ` · ${submission.actualStudyMinutes} minuten zelfstudie` : ""}
                    </p>
                  </div>
                  <StatusBadge label="evaluatie ingevuld" tone="success" />
                </div>
                <div className="mt-4 grid gap-3">
                  {submission.answers.map((answer) => (
                    <div key={answer.id} className="rounded-[18px] bg-white/85 px-4 py-3 text-sm leading-6">
                      <p className="font-semibold text-slate-950">{answer.question.label}</p>
                      <p className="mt-1 text-[var(--ink-soft)]">
                        {formatEvaluationAnswerValue(answer)}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            )) : (
              <div className="rounded-[26px] border border-dashed border-[var(--border)] bg-white/80 p-5 text-sm leading-7 text-[var(--ink-soft)]">
                Nog geen evaluatieformulieren ingevuld voor deze e-learning.
              </div>
            )}
          </div>
        </section>
        </>
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
