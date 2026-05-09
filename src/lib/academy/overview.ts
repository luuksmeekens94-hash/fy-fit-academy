import type { AudienceProfile } from "@/lib/types";

import type { AcademyCourseCardView } from "./types";

type AcademyOverviewCopy = {
  eyebrow: string;
  title: string;
  description: string;
  focusTags: string[];
  emptyStateTitle: string;
  emptyStateText: string;
};

type AcademyOverviewSection = {
  id: "search" | "continue" | "recommended" | "completed" | "all";
  title: string;
  description: string;
  courses: AcademyCourseCardView[];
};

type AcademyOverviewStats = {
  total: number;
  inProgress: number;
  completed: number;
  needToKnow: number;
};

type AcademyOverview = {
  copy: AcademyOverviewCopy;
  stats: AcademyOverviewStats;
  sections: AcademyOverviewSection[];
  isSearching: boolean;
  query: string;
  emptyState: {
    title: string;
    text: string;
  };
};

const ACADEMY_OVERVIEW_COPY: Record<AudienceProfile, AcademyOverviewCopy> = {
  FYSIOTHERAPEUT: {
    eyebrow: "Academy · Fysiotherapeut",
    title: "E-learnings voor jouw werk als fysiotherapeut",
    description:
      "Richtlijnen, klinisch redeneren, casuïstiek en reflectie staan hier compact bij elkaar, zodat je snel ziet wat nu relevant is.",
    focusTags: ["Klinisch redeneren", "Richtlijnen", "Casuïstiek", "Reflectie"],
    emptyStateTitle: "Nog geen e-learnings voor fysiotherapeuten",
    emptyStateText:
      "Zodra er content voor fysiotherapeuten wordt gepubliceerd, verschijnt die hier automatisch op basis van jouw doelgroep.",
  },
  PRAKTIJKONDERSTEUNER: {
    eyebrow: "Academy · Praktijkondersteuner",
    title: "E-learnings voor praktijkondersteuners",
    description:
      "Communicatie, service, AVG, werkafspraken en patiëntinformatie krijgen hier een eigen volwassen plek naast de fysio-leerlijnen.",
    focusTags: ["Communicatie", "Werkafspraken", "Service", "AVG"],
    emptyStateTitle: "Nog geen e-learnings voor praktijkondersteuners",
    emptyStateText:
      "Zodra er content voor praktijkondersteuners wordt gepubliceerd, verschijnt die hier als eigen leeromgeving voor leren, informatie en ontwikkeling.",
  },
  FITCOACH: {
    eyebrow: "Academy · Fitcoach",
    title: "E-learnings voor fitcoaches",
    description:
      "Coaching, leefstijl, training, bewegen en samenwerking met fysio worden hier gebundeld tot een helder leerpad.",
    focusTags: ["Coaching", "Leefstijl", "Training", "Samenwerking"],
    emptyStateTitle: "Nog geen e-learnings voor fitcoaches",
    emptyStateText:
      "Zodra er content voor fitcoaches wordt gepubliceerd, verschijnt die hier automatisch als eigen leeromgeving.",
  },
};

function cloneCourse(course: AcademyCourseCardView): AcademyCourseCardView {
  return { ...course };
}

function cloneCourses(courses: AcademyCourseCardView[]): AcademyCourseCardView[] {
  return courses.map(cloneCourse);
}

function matchesQuery(course: AcademyCourseCardView, query: string) {
  if (!query) {
    return true;
  }

  return [course.title, course.description, course.goal ?? "", course.assignmentLabel].some((value) =>
    value.toLowerCase().includes(query),
  );
}

function buildEmptyState(copy: AcademyOverviewCopy, query: string) {
  if (query) {
    const label = copy.title.toLowerCase().replace("e-learnings voor ", "");

    return {
      title: "Geen zoekresultaten",
      text: `Er zijn geen e-learnings gevonden voor '${query}' binnen jouw ${label}-omgeving. Probeer een andere zoekterm.`,
    };
  }

  return {
    title: copy.emptyStateTitle,
    text: copy.emptyStateText,
  };
}

export function getAcademyOverviewCopy(audienceProfile: AudienceProfile): AcademyOverviewCopy {
  const copy = ACADEMY_OVERVIEW_COPY[audienceProfile];

  return {
    ...copy,
    focusTags: [...copy.focusTags],
  };
}

export function buildAcademyOverview(
  audienceProfile: AudienceProfile,
  courses: AcademyCourseCardView[],
  rawQuery = "",
): AcademyOverview {
  const copy = getAcademyOverviewCopy(audienceProfile);
  const query = rawQuery.toLowerCase().trim();
  const visibleCourses = courses.filter((course) => matchesQuery(course, query));
  const inProgressCourses = visibleCourses.filter((course) => course.status === "IN_PROGRESS");
  const completedCourses = visibleCourses.filter((course) => course.status === "COMPLETED");
  const recommendedCourses = visibleCourses.filter(
    (course) => course.status === "NOT_STARTED" && course.assignmentLabel === "Need to know",
  );
  const niceToKnowCourses = visibleCourses.filter(
    (course) => course.status === "NOT_STARTED" && course.assignmentLabel !== "Need to know",
  );
  const sections: AcademyOverviewSection[] = [];

  if (query) {
    if (visibleCourses.length > 0) {
      sections.push({
        id: "search",
        title: "Zoekresultaten",
        description: "Alle e-learnings die passen bij je zoekopdracht binnen jouw doelgroepomgeving.",
        courses: cloneCourses(visibleCourses),
      });
    }
  } else {
    if (inProgressCourses.length > 0) {
      sections.push({
        id: "continue",
        title: "Ga verder waar je gebleven was",
        description: "Deze e-learnings zijn al in beweging. Pak de draad snel weer op.",
        courses: cloneCourses(inProgressCourses),
      });
    }

    if (recommendedCourses.length > 0) {
      sections.push({
        id: "recommended",
        title: "Aanbevolen voor jou",
        description: "Need to know-content die past bij jouw doelgroep en nu handig is om op te pakken.",
        courses: cloneCourses(recommendedCourses),
      });
    }

    if (completedCourses.length > 0) {
      sections.push({
        id: "completed",
        title: "Afgerond en terug te kijken",
        description: "Gebruik afgeronde e-learnings opnieuw als naslag of voorbereiding op reflectie.",
        courses: cloneCourses(completedCourses),
      });
    }

    if (niceToKnowCourses.length > 0) {
      sections.push({
        id: "all",
        title: "Verder beschikbaar",
        description: "Nice to know-verdieping die voor jou zichtbaar is wanneer je extra wilt doorpakken.",
        courses: cloneCourses(niceToKnowCourses),
      });
    } else if (sections.length === 0 && visibleCourses.length > 0) {
      sections.push({
        id: "all",
        title: "Alle beschikbare e-learnings",
        description: "Alles wat voor jou zichtbaar is binnen de Academy.",
        courses: cloneCourses(visibleCourses),
      });
    }
  }

  return {
    copy,
    stats: {
      total: courses.length,
      inProgress: courses.filter((course) => course.status === "IN_PROGRESS").length,
      completed: courses.filter((course) => course.status === "COMPLETED").length,
      needToKnow: courses.filter((course) => course.assignmentLabel === "Need to know").length,
    },
    sections,
    isSearching: query.length > 0,
    query,
    emptyState: buildEmptyState(copy, query),
  };
}
