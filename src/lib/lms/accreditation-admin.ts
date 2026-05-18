import type { LessonType, WorkForm } from "@prisma/client";

import type { CourseAuthorExpert } from "./types";

const WORK_FORM_LABELS: Record<string, WorkForm> = {
  video: "VIDEO",
  tekst: "TEKST",
  text: "TEKST",
  casus: "CASUS",
  reflectie: "REFLECTIE",
  podcast: "PODCAST",
  toets: "TOETS",
  quiz: "TOETS",
  mixed: "MIXED",
  mix: "MIXED",
};

function splitRows(value: string) {
  return value
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);
}

function splitParts(row: string) {
  return row.split("||").map((part) => part.trim());
}

function optionalString(value: string | undefined) {
  return value && value.trim().length ? value.trim() : null;
}

function optionalNumber(value: string | undefined) {
  const normalized = optionalString(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function parsePositiveInt(value: string | undefined, message: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(message);
  }

  return parsed;
}

function parseWorkForms(value: string | undefined) {
  const entries = (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!entries.length) {
    return ["TEKST"] satisfies WorkForm[];
  }

  return entries.map((entry) => {
    const workForm = WORK_FORM_LABELS[entry] ?? (entry.toUpperCase() as WorkForm);
    if (!["VIDEO", "TEKST", "CASUS", "REFLECTIE", "PODCAST", "TOETS", "MIXED"].includes(workForm)) {
      throw new Error(`Onbekende werkvorm: ${entry}`);
    }

    return workForm;
  });
}

const LESSON_TYPES = ["TEXT", "VIDEO", "DOCUMENT", "CASE", "REFLECTION", "ASSESSMENT"] as const satisfies LessonType[];

export type LessonBuilderInput = {
  title?: string | null;
  description?: string | null;
  type?: string | null;
  content?: string | null;
  order?: string | number | null;
  estimatedMinutes?: string | number | null;
  isRequired?: string | boolean | null;
};

export type ParsedLessonBuilderInput = {
  title: string;
  description: string | null;
  type: LessonType;
  content: string;
  order: number;
  estimatedMinutes: number;
  isRequired: boolean;
};

function normalizeSlugPart(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function buildLessonSlug(title: string, existingSlugs: readonly string[]) {
  const base = normalizeSlugPart(title) || "les";
  const existing = new Set(existingSlugs);

  if (!existing.has(base)) {
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (existing.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

export function parseLessonBuilderInput(input: LessonBuilderInput): ParsedLessonBuilderInput {
  const title = optionalString(String(input.title ?? ""));
  const description = optionalString(String(input.description ?? ""));
  const content = String(input.content ?? "").trim();
  const type = String(input.type ?? "TEXT").trim().toUpperCase() as LessonType;
  const order = parsePositiveInt(String(input.order ?? ""), "Lesvolgorde moet een positief getal zijn.");
  const estimatedMinutes = parsePositiveInt(
    String(input.estimatedMinutes ?? ""),
    "Lesduur moet een positief getal zijn.",
  );

  if (!title || title.length < 3) {
    throw new Error("Lestitel is te kort.");
  }

  if (!LESSON_TYPES.includes(type)) {
    throw new Error(`Onbekend lestype: ${input.type}`);
  }

  if (["VIDEO", "DOCUMENT"].includes(type) && content.length < 5) {
    throw new Error("Video- of documentlessen hebben een link of beschrijving nodig.");
  }

  if (!["VIDEO", "DOCUMENT"].includes(type) && content.length < 10) {
    throw new Error("Lesinhoud is te kort.");
  }

  return {
    title,
    description,
    type,
    content,
    order,
    estimatedMinutes,
    isRequired: input.isRequired === true || input.isRequired === "on" || input.isRequired === "true",
  };
}

export function getNextModuleOrder(modules: readonly { order: number }[]) {
  return Math.max(0, ...modules.map((module) => module.order)) + 1;
}

export function reorderModulesAfterMove<T extends { id: string; order: number }>(
  modules: readonly T[],
  moduleId: string,
  direction: "up" | "down",
) {
  const sorted = [...modules].sort((left, right) => left.order - right.order);
  const currentIndex = sorted.findIndex((module) => module.id === moduleId);

  if (currentIndex === -1) {
    throw new Error("Module niet gevonden.");
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= sorted.length) {
    return sorted.map((module, index) => ({ ...module, order: index + 1 }));
  }

  const [current] = sorted.splice(currentIndex, 1);
  sorted.splice(targetIndex, 0, current);

  return sorted.map((module, index) => ({ ...module, order: index + 1 }));
}

export function parseWorkFormsInput(value: string | undefined) {
  return parseWorkForms(value);
}

export function parseAuthorExpertsInput(value: string): CourseAuthorExpert[] {
  return splitRows(value).map((row, index) => {
    const [name, role, organization, registrationNumber] = splitParts(row);

    if (!name || !role) {
      throw new Error(`Auteur-regel ${index + 1} heeft minimaal naam en rol nodig.`);
    }

    return {
      name,
      role,
      ...(organization ? { organization } : {}),
      ...(registrationNumber ? { registrationNumber } : {}),
    };
  });
}

export type ParsedCourseModule = {
  order: number;
  title: string;
  estimatedMinutes: number;
  introduction: string | null;
  summary: string | null;
  workForms: WorkForm[];
};

export function parseModulesInput(value: string): ParsedCourseModule[] {
  return splitRows(value).map((row, index) => {
    const [order, title, estimatedMinutes, introduction, summary, workForms] = splitParts(row);

    if (!order || !title || !estimatedMinutes) {
      throw new Error(`Module-regel ${index + 1} heeft minimaal volgorde, titel en duur nodig.`);
    }

    return {
      order: parsePositiveInt(order, `Module-regel ${index + 1} heeft een geldige volgorde nodig.`),
      title,
      estimatedMinutes: parsePositiveInt(
        estimatedMinutes,
        `Module-regel ${index + 1} heeft een geldige duur nodig.`,
      ),
      introduction: optionalString(introduction),
      summary: optionalString(summary),
      workForms: parseWorkForms(workForms),
    };
  });
}

export type ParsedLearningObjective = {
  code: string;
  text: string;
  order: number;
  moduleOrder: number | null;
};

export function parseLearningObjectivesInput(value: string): ParsedLearningObjective[] {
  return splitRows(value).map((row, index) => {
    const [code, text, moduleOrder] = splitParts(row);

    if (!code || !text) {
      throw new Error(`Leerdoel-regel ${index + 1} heeft minimaal code en tekst nodig.`);
    }

    return {
      code,
      text,
      order: index + 1,
      moduleOrder: optionalNumber(moduleOrder),
    };
  });
}

export type ParsedLiteratureReference = {
  order: number;
  title: string;
  source: string | null;
  url: string | null;
  guideline: string | null;
  year: number | null;
  moduleOrder: number | null;
};

export function parseLiteratureReferencesInput(value: string): ParsedLiteratureReference[] {
  return splitRows(value).map((row, index) => {
    const [order, title, source, url, guideline, year, moduleOrder] = splitParts(row);

    if (!order || !title) {
      throw new Error(`Literatuur-regel ${index + 1} heeft minimaal volgorde en titel nodig.`);
    }

    return {
      order: parsePositiveInt(order, `Literatuur-regel ${index + 1} heeft een geldige volgorde nodig.`),
      title,
      source: optionalString(source),
      url: optionalString(url),
      guideline: optionalString(guideline),
      year: optionalNumber(year),
      moduleOrder: optionalNumber(moduleOrder),
    };
  });
}

export type ParsedCompetencyReference = {
  name: string;
  framework: string | null;
  description: string | null;
  moduleOrder: number | null;
};

export function parseCompetencyReferencesInput(value: string): ParsedCompetencyReference[] {
  return splitRows(value).map((row, index) => {
    const [name, framework, description, moduleOrder] = splitParts(row);

    if (!name) {
      throw new Error(`Competentie-regel ${index + 1} heeft minimaal een naam nodig.`);
    }

    return {
      name,
      framework: optionalString(framework),
      description: optionalString(description),
      moduleOrder: optionalNumber(moduleOrder),
    };
  });
}
