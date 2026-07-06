import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { completeLessonAction } from "@/app/lms-actions";
import { AssessmentRunner } from "@/components/lms/assessment-runner";
import { LessonMediaBlock } from "@/components/lms/lesson-media-block";
import { ReviewerAssessmentPreview } from "@/components/lms/reviewer-assessment-preview";
import { ReviewerLessonProgressButton } from "@/components/lms/reviewer-lesson-progress-button";
import { ReviewerModulePractice } from "@/components/lms/reviewer-module-practice";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractLessonMedia } from "@/lib/lms/lesson-media";
import {
  buildReviewerTheorySubLessons,
  buildSubLessonHrefSuffix,
  getAssignmentStepKey,
  getKnowledgeCheckStepKey,
} from "@/lib/lms/reviewer-sublessons";
import { getLearnerLmsRedirectPath } from "@/lib/lms/route-access";
import { getReviewerPreviewMode } from "@/lib/lms/reviewer-preview";
import {
  getAssessmentDetail,
  getCourseDetail,
  getEnrollmentDetailForUser,
  getLessonDetail,
  getLessonProgressForVersion,
  getMyAttempts,
} from "@/lib/lms/queries";

type LmsLessonDetailPageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
  searchParams: Promise<{ stap?: string; les?: string }>;
};

type ReviewerStep = "theorie" | "opdracht" | "toetsvragen";

function getProgressTone(status: string) {
  if (status === "COMPLETED") {
    return "success" as const;
  }

  if (status === "IN_PROGRESS") {
    return "warning" as const;
  }

  return "brand" as const;
}

function getReviewerStep(value: string | undefined): ReviewerStep {
  if (value === "opdracht" || value === "toetsvragen") {
    return value;
  }

  return "theorie";
}

function getModuleNumberFromLessonTitle(title: string) {
  return title.match(/Module\s+(\d+)/i)?.[1] ?? null;
}

function countFigureMarkers(text: string) {
  return text.split(/\r?\n/).filter((line) => /^\s*Figuur\s+\d+\b/i.test(line.trim())).length;
}

function getReviewerFigureItems(moduleNumber: string | null) {
  if (!moduleNumber) {
    return [];
  }

  const figureMap: Record<string, { src: string; caption: string }[]> = {
    "1": [
      {
        src: "/lms/pfp/figures/module-1-figuur-1.png",
        caption: "Figuur 1. Envelope of Function: load, frequentie en de envelope of function als basis voor klinisch redeneren bij PFP.",
      },
    ],
    "2": [
      {
        src: "/lms/pfp/figures/module-2-figuur-1.png",
        caption: "Figuur 2. Stroomdiagram LLROM: subgroepindeling en klinisch redeneren bij PFP.",
      },
    ],
    "3": [
      {
        src: "/lms/pfp/figures/module-3-figuur-1.png",
        caption: "Figuur 2. Stroomdiagram LLROM: subgroepindeling voor gerichte fase-1 behandeling.",
      },
      {
        src: "/lms/pfp/figures/module-3-figuur-2.png",
        caption: "Figuur 3. Evidence-based klinische benaderingen voor PFP en PT, inclusief optimale behandeling en tijdspaden.",
      },
    ],
  };

  return figureMap[moduleNumber] ?? [];
}

function getReviewerAssignment(moduleNumber: string | null) {
  const assignmentMap: Record<string, { title: string; prompt: string }> = {
    "1": {
      title: "Community opdracht – Casusreflectie Module 1",
      prompt:
        "Lees onderstaande casus en beantwoord de reflectievragen. Deel je antwoorden in de community.\n\nCasus: Je ziet een 28-jarige recreatieve hardloopster met drie maanden toenemende pijn rondom haar rechter knieschijf. Een eerdere behandelaar vertelde haar dat ze “last heeft van kraakbeenslijtage” en adviseerde te stoppen met hardlopen. Ze durft nauwelijks meer te bewegen. De MRI toont geen structurele afwijkingen.\n\n1. Welk verouderd verklaringsmodel hanteerde de eerdere behandelaar? Hoe zou jij dit reframen vanuit het homeostasemodel?\n2. Beschrijf aan de hand van het Envelope of Function-model wat er waarschijnlijk aan de hand is.\n3. Formuleer een concrete educatieve boodschap die aansluit bij “niets stuk, wel van slag”.",
    },
    "2": {
      title: "Community opdracht – Praktijkopdracht Module 2",
      prompt:
        "Voer de DSDT en de LLROM-test uit bij een collega of patiënt. Noteer de uitkomsten en beantwoord:\n\n1. Wat is de MPFH en hoe verhoudt deze zich tot de referentiewaarden (39-45°)?\n2. In welke subgroep (1, 2 of 3) deel je de proefpersoon in op basis van de LLROM?\n3. Waar voelde de proefpersoon spanning of pijn? Hoe richt je op basis daarvan de behandeling?",
    },
    "3": {
      title: "Community opdracht – Behandelplan Module 3",
      prompt:
        "Stel een behandelplan op voor een eigen PFP-patiënt volgens het 3-fasenmodel:\n\n1. Welke educatieve boodschap geef je en hoe sluit deze aan bij het homeostasemodel?\n2. Welke LLROM-interventies voer je uit in fase 1 en in welke subgroep valt je patiënt?\n3. Beschrijf je belastingsmanagement: welke VAS-grenzen hanteer je en hoe stel je bij?\n4. Wanneer zou je de diagnose heroverwegen?",
    },
    "4": {
      title: "Community opdracht – Jouw klinische samenvatting",
      prompt:
        "Kijk terug op een recente patiënt met anterieure kniepijn en beantwoord:\n\n- Welke verouderde overtuiging over PFP kwam jij of je patiënt tegen?\n- Welke objectieve maat (DSDT/LLROM) zou jij voortaan standaard inzetten?\n- Hoe zou jij in maximaal drie zinnen uitleggen: “niets stuk, wel van slag”?",
    },
  };

  return moduleNumber ? assignmentMap[moduleNumber] ?? null : null;
}

export default async function LmsLessonDetailPage({ params, searchParams }: LmsLessonDetailPageProps) {
  const user = await requireUser();
  const { courseId, lessonId } = await params;
  const { stap, les } = await searchParams;
  const reviewerStep = getReviewerStep(stap);

  const [course, enrollment, lesson] = await Promise.all([
    getCourseDetail(courseId),
    getEnrollmentDetailForUser(user.id, courseId),
    getLessonDetail(lessonId),
  ]);

  if (!course || !lesson || !course.activeVersion) {
    notFound();
  }

  if (user.role === "REVIEWER" && course.reviewerId !== user.id) {
    notFound();
  }

  const previewState = getReviewerPreviewMode(user.role, Boolean(enrollment));

  if (!enrollment && !previewState.canViewWithoutEnrollment) {
    notFound();
  }

  if (lesson.courseVersionId !== course.activeVersion.id) {
    notFound();
  }

  const academyRedirectPath = getLearnerLmsRedirectPath(user.role, {
    courseSlug: course.slug,
    lessonSlug: lesson.slug,
  });

  if (academyRedirectPath) {
    redirect(academyRedirectPath);
  }

  const progressEntries = await getLessonProgressForVersion(user.id, course.activeVersion.id);
  const progress = progressEntries.find((entry) => entry.lessonId === lesson.id);
  const assessmentSummary =
    lesson.type === "ASSESSMENT"
      ? course.activeVersion.assessments.find((entry) => entry.lessonId === lesson.id) ?? null
      : null;

  if (lesson.type === "ASSESSMENT" && !assessmentSummary) {
    notFound();
  }

  const courseAssessmentSummary = course.activeVersion.assessments[0] ?? null;
  const [assessment, attempts, courseAssessment] = await Promise.all([
    assessmentSummary ? getAssessmentDetail(assessmentSummary.id) : Promise.resolve(null),
    assessmentSummary ? getMyAttempts(user.id, assessmentSummary.id) : Promise.resolve([]),
    courseAssessmentSummary && lesson.type !== "ASSESSMENT" && user.role === "REVIEWER"
      ? getAssessmentDetail(courseAssessmentSummary.id)
      : Promise.resolve(null),
  ]);

  if (lesson.type === "ASSESSMENT" && !assessment) {
    notFound();
  }

  const moduleNumber = getModuleNumberFromLessonTitle(lesson.title);
  const moduleQuestionPrefix = moduleNumber ? `M${moduleNumber}-` : null;
  const moduleQuestions = moduleQuestionPrefix
    ? courseAssessment?.questions.filter((question) => question.objectiveCodes.some((code) => code.startsWith(moduleQuestionPrefix))) ?? []
    : [];

  const lessonMedia = extractLessonMedia(lesson.content);
  const theorySubLessons = buildReviewerTheorySubLessons(lessonMedia.text);
  const lessonIndex = course.activeVersion.lessons.findIndex((entry) => entry.id === lesson.id);
  const previousLesson = lessonIndex > 0 ? course.activeVersion.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 ? course.activeVersion.lessons[lessonIndex + 1] ?? null : null;
  const isReviewer = user.role === "REVIEWER";
  const isReviewerModuleFlow = isReviewer && lesson.type !== "ASSESSMENT" && moduleQuestions.length > 0;
  const lessonBaseHref = `/lms/courses/${courseId}/lessons/${lesson.id}`;
  const selectedTheorySubLesson = isReviewerModuleFlow
    ? theorySubLessons.find((subLesson) => subLesson.key === les) ?? theorySubLessons[0] ?? null
    : null;
  const selectedTheoryIndex = selectedTheorySubLesson
    ? theorySubLessons.findIndex((subLesson) => subLesson.key === selectedTheorySubLesson.key)
    : -1;
  const previousTheorySubLesson = selectedTheoryIndex > 0 ? theorySubLessons[selectedTheoryIndex - 1] : null;
  const nextTheorySubLesson = selectedTheoryIndex >= 0 ? theorySubLessons[selectedTheoryIndex + 1] ?? null : null;
  const isLastTheorySubLesson = selectedTheoryIndex >= 0 && selectedTheoryIndex === theorySubLessons.length - 1;
  const theoryHref = selectedTheorySubLesson ? `${lessonBaseHref}${buildSubLessonHrefSuffix(selectedTheorySubLesson.key)}` : lessonBaseHref;
  const assignmentHref = `${lessonBaseHref}?stap=opdracht`;
  const questionsHref = `${lessonBaseHref}?stap=toetsvragen`;
  const courseHref = `/lms/courses/${courseId}`;
  const lmsHref = "/lms";
  const nextLessonHref = nextLesson ? `/lms/courses/${courseId}/lessons/${nextLesson.id}` : null;
  const nextModuleHref = nextLesson ? `${nextLessonHref}${buildSubLessonHrefSuffix(buildReviewerTheorySubLessons(extractLessonMedia(nextLesson.content).text)[0]?.key ?? "theorie")}` : null;
  const currentTheoryMedia = selectedTheorySubLesson
    ? {
        text: selectedTheorySubLesson.text,
        videos: isLastTheorySubLesson ? lessonMedia.videos : [],
        images: [],
        documents: isLastTheorySubLesson ? lessonMedia.documents : [],
        blocks: [
          { type: "text" as const, text: selectedTheorySubLesson.text },
          ...(isLastTheorySubLesson ? lessonMedia.blocks.filter((block) => block.type === "video" || block.type === "document") : []),
        ],
      }
    : lessonMedia;
  const moduleId = moduleNumber
    ? course.activeVersion.objectives.find((objective) => objective.code.startsWith(`M${moduleNumber}-`))?.moduleId ?? null
    : null;
  const moduleLiterature = moduleId
    ? course.activeVersion.literature.filter((reference) => reference.moduleId === moduleId)
    : [];
  const reviewerFigures = isReviewerModuleFlow ? getReviewerFigureItems(moduleNumber) : [];
  const selectedFigureOffset = selectedTheorySubLesson
    ? theorySubLessons.slice(0, Math.max(selectedTheoryIndex, 0)).reduce((total, subLesson) => total + countFigureMarkers(subLesson.text), 0)
    : 0;
  const selectedFigureCount = selectedTheorySubLesson ? countFigureMarkers(selectedTheorySubLesson.text) : reviewerFigures.length;
  const currentReviewerFigures = selectedTheorySubLesson
    ? reviewerFigures.slice(selectedFigureOffset, selectedFigureOffset + selectedFigureCount)
    : reviewerFigures;
  const reviewerAssignment = getReviewerAssignment(moduleNumber);
  const reviewerAssignmentSubmission = isReviewerModuleFlow
    ? await prisma.communityAssignmentSubmission.findUnique({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId: lesson.id,
          },
        },
        select: {
          answer: true,
          submittedAt: true,
        },
      })
    : null;
  const reviewerCompletedStepKeys = isReviewerModuleFlow
    ? new Set(
        (await prisma.lessonStepProgress.findMany({
          where: { userId: user.id, lessonId: lesson.id },
          select: { stepKey: true },
        })).map((entry) => entry.stepKey),
      )
    : new Set<string>();
  const assignmentStepKey = getAssignmentStepKey(moduleNumber);
  const knowledgeCheckStepKey = getKnowledgeCheckStepKey(moduleNumber);
  const currentTheoryCompleted = selectedTheorySubLesson ? reviewerCompletedStepKeys.has(selectedTheorySubLesson.key) : false;
  const minimumPassPercentage = courseAssessment?.passPercentage ?? 70;
  const stepLabel = isReviewerModuleFlow
    ? reviewerStep === "theorie"
      ? selectedTheorySubLesson?.label ?? "Theorie"
      : reviewerStep === "opdracht"
        ? "Opdracht"
        : "Kennischeck"
    : lesson.type === "ASSESSMENT"
      ? "Eindtoets"
      : "Onderdeel";
  const progressValue = isReviewerModuleFlow
    ? Math.round(
        (((reviewerStep === "theorie" ? Math.max(selectedTheoryIndex, 0) + 1 : reviewerStep === "opdracht" ? theorySubLessons.length + 1 : theorySubLessons.length + 2)) /
          Math.max(theorySubLessons.length + 2, 1)) *
          100,
      )
    : Math.round(((Math.max(lessonIndex, 0) + 1) / course.activeVersion.lessons.length) * 100);

  return (
    <div className="space-y-6">
      {isReviewer ? (
        <section className="sticky top-3 z-20 rounded-[28px] border border-[var(--border)] bg-white/92 p-4 shadow-[0_18px_60px_-44px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">Voortgang e-learning</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {isReviewerModuleFlow
                  ? `Module ${moduleNumber} · ${stepLabel} · ${progressValue}%`
                  : `Stap ${Math.max(lessonIndex, 0) + 1} van ${course.activeVersion.lessons.length} · ${stepLabel}`}
              </p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-xl">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand),var(--teal))] transition-all"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={courseHref} className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]">
                  Module-overzicht
                </Link>
                <Link href={lmsHref} className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]">
                  E-learning overzicht
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <PageHeader
        eyebrow={isReviewer ? (moduleNumber ? `Module ${moduleNumber} · ${stepLabel}` : stepLabel) : `LMS les ${lesson.order}`}
        title={selectedTheorySubLesson && reviewerStep === "theorie" ? selectedTheorySubLesson.title : lesson.title}
        description={lesson.description ?? "Doorloop dit onderdeel rustig en ga daarna verder naar de volgende stap."}
      />

      {lesson.type !== "ASSESSMENT" && (!isReviewerModuleFlow || reviewerStep === "theorie") ? (
        <section className="overflow-hidden rounded-[38px] border border-[var(--border)] bg-white shadow-[0_28px_80px_-44px_rgba(35,27,18,0.55)]">
          <div className="academy-gradient-panel px-6 py-6 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">
                  {lesson.type === "VIDEO" ? "Module met video" : lesson.type === "DOCUMENT" ? "Ondersteunende documenten" : "E-learning module"}
                </p>
                <h2 className="display-font mt-2 text-3xl font-semibold leading-tight text-slate-950 lg:text-4xl">
                  {selectedTheorySubLesson && reviewerStep === "theorie" ? selectedTheorySubLesson.title : lesson.title}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {isReviewer && currentTheoryCompleted ? <StatusBadge label="Les afgerond" tone="success" /> : null}
                {!isReviewer ? <StatusBadge label={enrollment ? progress?.status ?? "NOT_STARTED" : previewState.label} tone={enrollment ? getProgressTone(progress?.status ?? "NOT_STARTED") : "brand"} /> : null}
              </div>
            </div>
          </div>

          <div className="bg-white px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
            <LessonMediaBlock media={currentTheoryMedia} figures={currentReviewerFigures} literature={moduleLiterature} />
          </div>

          {isReviewerModuleFlow && selectedTheorySubLesson ? (
            <div className="border-t border-[var(--border)] bg-[var(--brand-wash)]/45 px-5 py-5 sm:px-8 lg:px-12">
              <div className="mx-auto flex max-w-[82ch] flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm leading-6 text-[var(--ink-soft)]">
                  <p className="font-semibold text-slate-950">
                    {currentTheoryCompleted ? "Deze les is afgerond." : "Rond deze les af om je voortgang bij te werken."}
                  </p>
                  <p>{selectedTheoryIndex + 1} van {theorySubLessons.length} theorielessen in deze module.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {previousTheorySubLesson ? (
                    <Link href={`${lessonBaseHref}${buildSubLessonHrefSuffix(previousTheorySubLesson.key)}`} className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-center text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]">
                      Vorige les
                    </Link>
                  ) : null}
                  <ReviewerLessonProgressButton
                    courseId={courseId}
                    lessonId={lesson.id}
                    stepKey={selectedTheorySubLesson.key}
                    nextHref={nextTheorySubLesson ? `${lessonBaseHref}${buildSubLessonHrefSuffix(nextTheorySubLesson.key)}` : assignmentHref}
                    label={nextTheorySubLesson ? `Ga door met ${nextTheorySubLesson.label}` : "Door met opdracht"}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {isReviewerModuleFlow && reviewerStep !== "theorie" ? (
        <ReviewerModulePractice
          courseId={courseId}
          lessonId={lesson.id}
          moduleTitle={lesson.title}
          questions={moduleQuestions}
          phase={reviewerStep === "opdracht" ? "assignment" : "questions"}
          assignmentTitle={reviewerAssignment?.title ?? `Opdracht bij ${lesson.title}`}
          assignmentPrompt={reviewerAssignment?.prompt ?? "Noteer kort hoe je de theorie uit deze module zou toepassen in een patiëntcasus."}
          initialAssignmentText={reviewerAssignmentSubmission?.answer ?? ""}
          initialAssignmentSubmittedAt={reviewerAssignmentSubmission?.submittedAt.toISOString() ?? null}
          assignmentStepKey={assignmentStepKey}
          knowledgeCheckStepKey={knowledgeCheckStepKey}
          minimumPassPercentage={minimumPassPercentage}
          theoryHref={theoryHref}
          assignmentHref={assignmentHref}
          questionsHref={questionsHref}
          nextHref={nextModuleHref}
          courseHref={courseHref}
          lmsHref={lmsHref}
        />
      ) : null}

      {lesson.type === "ASSESSMENT" && assessment && isReviewer ? (
        <ReviewerAssessmentPreview assessment={assessment} />
      ) : null}

      {lesson.type === "ASSESSMENT" && assessment && !isReviewer && previewState.canMutateProgress ? (
        <AssessmentRunner courseId={courseId} assessment={assessment} initialAttempts={attempts} />
      ) : null}

      {lesson.type === "ASSESSMENT" && assessment && !isReviewer && !previewState.canMutateProgress ? (
        <ReviewerAssessmentPreview assessment={assessment} />
      ) : null}

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={courseHref}
            className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]"
          >
            Module-overzicht
          </Link>
          {isReviewer ? (
            <Link
              href={lmsHref}
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]"
            >
              E-learning overzicht
            </Link>
          ) : null}
          {isReviewerModuleFlow && reviewerStep !== "theorie" ? (
            <Link
              href={theoryHref}
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]"
            >
              Theorie
            </Link>
          ) : null}
          {isReviewerModuleFlow && reviewerStep === "toetsvragen" ? (
            <Link
              href={assignmentHref}
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]"
            >
              Opdracht
            </Link>
          ) : null}
          {previousLesson ? (
            <Link
              href={`/lms/courses/${courseId}/lessons/${previousLesson.id}`}
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]"
            >
              Vorige stap
            </Link>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {lesson.type !== "ASSESSMENT" && !isReviewer && previewState.canMutateProgress ? (
            progress?.status === "COMPLETED" ? (
              <span className="inline-flex rounded-full bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                Les afgerond
              </span>
            ) : (
              <form action={completeLessonAction}>
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="lessonId" value={lesson.id} />
                <button
                  type="submit"
                  className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
                >
                  Markeer les als afgerond
                </button>
              </form>
            )
          ) : null}


          {nextLesson && !isReviewerModuleFlow ? (
            <Link
              href={nextLessonHref ?? "#"}
              className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
            >
              {isReviewer ? "Door naar volgende module" : "Volgende stap"}
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
