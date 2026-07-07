import { extractLessonMedia } from "@/lib/lms/lesson-media";

export type ReviewerTheorySubLesson = {
  key: string;
  label: string;
  title: string;
  text: string;
  order: number;
};

export type ReviewerProgressLessonInput = {
  id: string;
  title: string;
  content?: string | null;
  order: number;
  type?: string;
};

export type ReviewerModuleProgress = {
  lessonId: string;
  moduleNumber: string;
  title: string;
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  isStarted: boolean;
  isCompleted: boolean;
  firstSubLessonHrefSuffix: string;
  nextStepHrefSuffix: string;
  nextStepLabel: string;
};

export type ReviewerModuleStepLink = {
  key: string;
  label: string;
  hrefSuffix: string;
  kind: "theory" | "assignment" | "knowledge-check";
};

const lessonHeadingPattern = /^\s*Les\s+(\d+\.\d+)\s*:?\s*(.*)$/i;
const moduleTitlePattern = /^Module\s+(\d+)/i;

function normalizeText(text: string | null | undefined) {
  return (text ?? "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function getModuleNumberFromTitle(title: string) {
  return title.match(moduleTitlePattern)?.[1] ?? null;
}

export function isReviewerTheoryModule(lesson: { title: string; type?: string }) {
  const moduleNumber = getModuleNumberFromTitle(lesson.title);
  return Boolean(moduleNumber && Number(moduleNumber) >= 1 && Number(moduleNumber) <= 4 && lesson.type !== "ASSESSMENT");
}

export function buildReviewerTheorySubLessons(text: string | null | undefined): ReviewerTheorySubLesson[] {
  const normalized = normalizeText(text);
  if (!normalized) {
    return [];
  }

  const lines = normalized.split("\n");
  const preface: string[] = [];
  const sections: ReviewerTheorySubLesson[] = [];
  let current: { key: string; label: string; title: string; lines: string[] } | null = null;

  function flushCurrent() {
    if (!current) {
      return;
    }

    const content = normalizeText(current.lines.join("\n"));
    if (content) {
      sections.push({
        key: current.key,
        label: current.label,
        title: current.title,
        text: content,
        order: sections.length + 1,
      });
    }
    current = null;
  }

  for (const line of lines) {
    const match = line.match(lessonHeadingPattern);

    if (match?.[1]) {
      flushCurrent();
      const lessonNumber = match[1];
      const headingRemainder = match[2]?.trim() ?? "";
      const label = `Les ${lessonNumber}`;
      const title = headingRemainder ? `${label}: ${headingRemainder}` : label;
      const key = `les-${lessonNumber.replace(/\./g, "-")}`;
      current = {
        key,
        label,
        title,
        lines: sections.length === 0 ? [...preface, line] : [line],
      };
      preface.length = 0;
      continue;
    }

    if (current) {
      current.lines.push(line);
    } else {
      preface.push(line);
    }
  }

  flushCurrent();

  if (sections.length) {
    return sections;
  }

  return [
    {
      key: "theorie",
      label: "Theorie",
      title: "Theorie",
      text: normalized,
      order: 1,
    },
  ];
}

export function getAssignmentStepKey(moduleNumber: string | null) {
  return moduleNumber ? `module-${moduleNumber}-opdracht` : "opdracht";
}

export function getKnowledgeCheckStepKey(moduleNumber: string | null) {
  return moduleNumber ? `module-${moduleNumber}-kennischeck` : "kennischeck";
}

export function buildSubLessonHrefSuffix(stepKey: string) {
  return `?les=${encodeURIComponent(stepKey)}`;
}

export function buildReviewerModuleStepLinks(lesson: ReviewerProgressLessonInput): ReviewerModuleStepLink[] {
  if (!isReviewerTheoryModule(lesson)) {
    return [];
  }

  const moduleNumber = getModuleNumberFromTitle(lesson.title);
  const media = extractLessonMedia(lesson.content);
  const subLessons = buildReviewerTheorySubLessons(media.text);

  return [
    ...subLessons.map((subLesson) => ({
      key: subLesson.key,
      label: subLesson.label,
      hrefSuffix: buildSubLessonHrefSuffix(subLesson.key),
      kind: "theory" as const,
    })),
    {
      key: getAssignmentStepKey(moduleNumber),
      label: "Opdracht",
      hrefSuffix: "?stap=opdracht",
      kind: "assignment" as const,
    },
    {
      key: getKnowledgeCheckStepKey(moduleNumber),
      label: "Kennischeck",
      hrefSuffix: "?stap=toetsvragen",
      kind: "knowledge-check" as const,
    },
  ];
}

export function buildReviewerModuleProgress(params: {
  lessons: ReviewerProgressLessonInput[];
  completedStepKeysByLessonId: Map<string, Set<string>>;
  submittedAssignmentLessonIds: Set<string>;
}): ReviewerModuleProgress[] {
  return params.lessons
    .filter(isReviewerTheoryModule)
    .map((lesson) => {
      const moduleNumber = getModuleNumberFromTitle(lesson.title) ?? "";
      const stepLinks = buildReviewerModuleStepLinks(lesson);
      const subLessons = stepLinks.filter((step) => step.kind === "theory");
      const completedKeys = params.completedStepKeysByLessonId.get(lesson.id) ?? new Set<string>();
      const effectiveCompletedKeys = new Set(completedKeys);

      if (params.submittedAssignmentLessonIds.has(lesson.id)) {
        effectiveCompletedKeys.add(getAssignmentStepKey(moduleNumber));
      }

      const completedSteps = stepLinks.filter((step) => effectiveCompletedKeys.has(step.key)).length;
      const totalSteps = stepLinks.length;
      const percentage = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;
      const firstSubLesson = subLessons[0] ?? null;
      const nextStep = stepLinks.find((step) => !effectiveCompletedKeys.has(step.key)) ?? firstSubLesson ?? stepLinks[0] ?? null;

      return {
        lessonId: lesson.id,
        moduleNumber,
        title: lesson.title,
        totalSteps,
        completedSteps,
        percentage,
        isStarted: completedSteps > 0,
        isCompleted: completedSteps >= totalSteps,
        firstSubLessonHrefSuffix: firstSubLesson ? buildSubLessonHrefSuffix(firstSubLesson.key) : "",
        nextStepHrefSuffix: nextStep?.hrefSuffix ?? "",
        nextStepLabel: nextStep?.label ?? "Open module",
      };
    });
}

export function summarizeReviewerCourseProgress(modules: ReviewerModuleProgress[]) {
  const totalSteps = modules.reduce((total, module) => total + module.totalSteps, 0);
  const completedSteps = modules.reduce((total, module) => total + module.completedSteps, 0);
  const percentage = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return {
    totalSteps,
    completedSteps,
    percentage,
    completedModules: modules.filter((module) => module.isCompleted).length,
    totalModules: modules.length,
    isStarted: completedSteps > 0,
    isCompleted: totalSteps > 0 && completedSteps >= totalSteps,
  };
}
