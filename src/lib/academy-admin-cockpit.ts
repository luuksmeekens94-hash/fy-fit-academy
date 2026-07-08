import type { Role } from "@/lib/types";
import type { CourseSummary } from "@/lib/lms/types";

export type AcademyAdminWorkflowKey = "question-bank" | "evaluations" | "accreditation" | "versioning";

export type AcademyAdminWorkflow = {
  key: AcademyAdminWorkflowKey;
  title: string;
  description: string;
  href: string;
  cta: string;
  status: string;
};

export type AcademyAdminCockpit = {
  metrics: {
    totalCourses: number;
    publishedCourses: number;
    reviewCourses: number;
    accreditationReadyCourses: number;
  };
  workflows: AcademyAdminWorkflow[];
  coursesNeedingAttention: Array<{
    id: string;
    title: string;
    status: CourseSummary["status"];
    reason: string;
    href: string;
  }>;
  submissionLinks: Array<{
    id: string;
    title: string;
    evaluationHref: string;
    assignmentHref: string;
  }>;
};

export function canAccessAcademyAdminCockpit(role: Role) {
  return role === "BEHEERDER";
}

export function buildAcademyAdminCockpit(input: { courses: CourseSummary[] }): AcademyAdminCockpit {
  const metrics = {
    totalCourses: input.courses.length,
    publishedCourses: input.courses.filter((course) => course.status === "PUBLISHED").length,
    reviewCourses: input.courses.filter((course) => course.status === "REVIEW").length,
    accreditationReadyCourses: input.courses.filter(
      (course) => Boolean(course.accreditationRegister) && Boolean(course.requiredQuestionCount),
    ).length,
  };

  return {
    metrics,
    workflows: [
      {
        key: "question-bank",
        title: "Toetsvragenbeheer",
        description: "Controleer normering, vraagenaantallen, randomisatie en koppeling met leerdoelen.",
        href: "/academybeheer#toetsvragen",
        cta: "Open vragenbankflow",
        status: `${input.courses.filter((course) => course.requiredQuestionCount).length} cursussen met toetsnorm`,
      },
      {
        key: "evaluations",
        title: "Evaluatiebeheer",
        description: "Borg evaluatievragen rond relevantie, toepasbaarheid, kwaliteit en studielast.",
        href: "/academybeheer#evaluaties",
        cta: "Beheer evaluaties",
        status: "Accreditatie-eis",
      },
      {
        key: "accreditation",
        title: "Accreditatiecockpit",
        description: "Zie welke cursussen register, toetsnorm, publicatiestatus en bewijsvelden missen.",
        href: "/academybeheer#accreditatie",
        cta: "Check dossier",
        status: `${metrics.accreditationReadyCourses}/${metrics.totalCourses} ready`,
      },
      {
        key: "versioning",
        title: "Versiebeheer en publicatie",
        description: "Stuur op concept, review, publicatie, archief en changelog voordat deelnemers starten.",
        href: "/academybeheer#versies",
        cta: "Bekijk versies",
        status: `${metrics.reviewCourses} in review`,
      },
    ],
    coursesNeedingAttention: input.courses
      .filter(
        (course) =>
          course.status !== "PUBLISHED" ||
          !course.accreditationRegister ||
          !course.requiredQuestionCount ||
          course.versionCount < 1,
      )
      .map((course) => ({
        id: course.id,
        title: course.title,
        status: course.status,
        reason: getCourseAttentionReason(course),
        href: `/lms/courses/${course.id}`,
      })),
    submissionLinks: input.courses.map((course) => ({
      id: course.id,
      title: course.title,
      evaluationHref: `/lms/courses/${course.id}#evaluatieantwoorden`,
      assignmentHref: `/lms/courses/${course.id}#opdrachtantwoorden`,
    })),
  };
}

function getCourseAttentionReason(course: CourseSummary) {
  if (course.status !== "PUBLISHED") {
    return `Status ${course.status.toLowerCase()} vraagt nog publicatie-/reviewbesluit.`;
  }

  if (!course.accreditationRegister) {
    return "Accreditatieregister ontbreekt.";
  }

  if (!course.requiredQuestionCount) {
    return "Toetsnorm of verplicht vraagenaantal ontbreekt.";
  }

  if (course.versionCount < 1) {
    return "Er is nog geen cursusversie vastgelegd.";
  }

  return "Compleet.";
}
