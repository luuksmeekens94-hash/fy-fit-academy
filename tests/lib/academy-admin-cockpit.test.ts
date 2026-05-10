import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAcademyAdminCockpit,
  canAccessAcademyAdminCockpit,
} from "../../src/lib/academy-admin-cockpit.ts";
import type { CourseSummary } from "../../src/lib/lms/types.ts";

test("academy-admin cockpit is beheerder-only", () => {
  assert.equal(canAccessAcademyAdminCockpit("BEHEERDER"), true);
  assert.equal(canAccessAcademyAdminCockpit("REVIEWER"), false);
  assert.equal(canAccessAcademyAdminCockpit("PRAKTIJKHOUDER"), false);
  assert.equal(canAccessAcademyAdminCockpit("PRAKTIJKMANAGER"), false);
});

test("academy-admin cockpit bundelt toetsvragen, evaluaties, accreditatie en versiebeheer", () => {
  const cockpit = buildAcademyAdminCockpit({
    courses: [
      course("c1", "PUBLISHED", "KRF", 2, 18, 3, new Date("2026-01-01")),
      course("c2", "REVIEW", null, 1, null, 0, null),
      course("c3", "CONCEPT", "SKF", 1, 12, 0, null),
    ],
  });

  assert.deepEqual(cockpit.metrics, {
    totalCourses: 3,
    publishedCourses: 1,
    reviewCourses: 1,
    accreditationReadyCourses: 2,
  });
  assert.deepEqual(
    cockpit.workflows.map((workflow) => workflow.key),
    ["question-bank", "evaluations", "accreditation", "versioning"],
  );
  assert.equal(cockpit.workflows.every((workflow) => workflow.href.startsWith("/academybeheer")), true);
  assert.deepEqual(cockpit.coursesNeedingAttention.map((course) => course.id), ["c2", "c3"]);
});

function course(
  id: string,
  status: CourseSummary["status"],
  accreditationRegister: string | null,
  versionCount: number,
  requiredQuestionCount: number | null,
  enrollmentCount: number,
  versionDate: Date | null,
): CourseSummary {
  return {
    id,
    title: id,
    slug: id,
    description: "",
    status,
    isMandatory: false,
    studyLoadMinutes: 60,
    accreditationRegister,
    accreditationKind: "VAKINHOUDELIJK",
    visibleToAll: true,
    visibleToRoles: [],
    visibleToAudienceProfiles: [],
    visibleToUserIds: [],
    versionDate,
    requiredQuestionCount,
    authorName: "Beheerder",
    publishedAt: status === "PUBLISHED" ? new Date("2026-02-01") : null,
    versionCount,
    enrollmentCount,
  };
}
