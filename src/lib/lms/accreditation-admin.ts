import type { WorkForm } from "@prisma/client";

import type { CourseAuthorExpert } from "./types";

const WORK_FORM_LABELS: Record<string, WorkForm> = {
  video: "VIDEO",
  tekst: "TEKST",
  text: "TEKST",
  casus: "CASUS",
  reflectie: "REFLECTIE",
  podcast: "PODCAST",
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
    if (!["VIDEO", "TEKST", "CASUS", "REFLECTIE", "PODCAST"].includes(workForm)) {
      throw new Error(`Onbekende werkvorm: ${entry}`);
    }

    return workForm;
  });
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
