import type { AcademyCourseCardView } from "./types";

export type AcademyDashboardSection = {
  id: "search" | "continue" | "recommended" | "completed" | "all";
  title: string;
  description: string;
  courses: AcademyCourseCardView[];
};

type AcademyDashboardSource = {
  isSearching: boolean;
  stats: {
    total: number;
    inProgress: number;
    completed: number;
    needToKnow: number;
  };
  sections: AcademyDashboardSection[];
};

export type AcademyDashboardModel = {
  primaryCourse: AcademyCourseCardView | null;
  stats: AcademyDashboardSource["stats"];
  sections: AcademyDashboardSection[];
};

function cloneCourse(course: AcademyCourseCardView): AcademyCourseCardView {
  return { ...course };
}

export function getAcademyAssignmentLabel(label: string) {
  if (label === "Need to know") return "Verplicht";
  if (label === "Nice to know") return "Verdieping";
  return label;
}

function cloneSection(section: AcademyDashboardSection): AcademyDashboardSection {
  return {
    ...section,
    courses: section.courses.map(cloneCourse),
  };
}

export function buildAcademyDashboardModel(source: AcademyDashboardSource): AcademyDashboardModel {
  const sections = source.sections.map(cloneSection);

  if (source.isSearching) {
    return {
      primaryCourse: null,
      stats: { ...source.stats },
      sections,
    };
  }

  const primarySection = sections.find((section) => section.id === "continue" && section.courses.length > 0)
    ?? sections.find((section) => section.id === "recommended" && section.courses.length > 0);
  const primaryCourse = primarySection?.courses[0] ?? null;
  const remainingSections = primaryCourse
    ? sections
        .map((section) => ({
          ...section,
          courses: section.courses.filter((course) => course.id !== primaryCourse.id),
        }))
        .filter((section) => section.courses.length > 0)
    : sections;

  return {
    primaryCourse: primaryCourse ? cloneCourse(primaryCourse) : null,
    stats: { ...source.stats },
    sections: remainingSections,
  };
}
