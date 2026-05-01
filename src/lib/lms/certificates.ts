"server-only";

import { prisma } from "@/lib/prisma";
import { buildCertificateSnapshot } from "./certificate-snapshot";

export async function buildCertificateSnapshotForUser(params: {
  userId: string;
  courseId: string;
  courseVersionId: string;
  completedAtFallback?: Date;
}) {
  const [user, course, courseVersion, enrollment, attempts, evaluationSubmissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.userId },
      select: { name: true, professionalRegistrationNumber: true },
    }),
    prisma.course.findUnique({
      where: { id: params.courseId },
      select: { title: true, accreditationRegister: true, accreditationKind: true },
    }),
    prisma.courseVersion.findUnique({
      where: { id: params.courseVersionId },
      select: {
        versionNumber: true,
        evaluationForms: { select: { id: true } },
      },
    }),
    prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: params.userId,
          courseId: params.courseId,
        },
      },
      select: { completedAt: true },
    }),
    prisma.assessmentAttempt.findMany({
      where: {
        userId: params.userId,
        courseVersionId: params.courseVersionId,
        submittedAt: { not: null },
      },
      select: { id: true },
    }),
    prisma.evaluationSubmission.findMany({
      where: {
        userId: params.userId,
        evaluationForm: { courseVersionId: params.courseVersionId },
      },
      select: { id: true },
    }),
  ]);

  if (!user || !course || !courseVersion) {
    return null;
  }

  return buildCertificateSnapshot({
    participantName: user.name,
    professionalRegistrationNumber: user.professionalRegistrationNumber,
    courseTitle: course.title,
    completedAt: enrollment?.completedAt ?? params.completedAtFallback ?? new Date(),
    attemptCount: attempts.length,
    evaluationCompleted: courseVersion.evaluationForms.length === 0 || evaluationSubmissions.length > 0,
    versionNumber: courseVersion.versionNumber,
    accreditationRegister: course.accreditationRegister,
    accreditationKind: course.accreditationKind,
  });
}

/**
 * Genereert een certificaat voor een gebruiker na succesvolle cursusafronding.
 * Geeft het nieuwe certificaat terug (of het bestaande als al uitgereikt).
 */
export async function issueCertificate(params: {
  userId: string;
  courseId: string;
  courseVersionId: string;
  scorePercentage: number | null;
  studyLoadMinutes: number | null;
}) {
  const { userId, courseId, courseVersionId, scorePercentage, studyLoadMinutes } = params;

  const snapshot = await buildCertificateSnapshotForUser({ userId, courseId, courseVersionId });

  // Voorkom dubbele certificaten voor dezelfde cursus
  const existing = await prisma.certificate.findFirst({
    where: { userId, courseId },
  });

  if (existing) {
    if (
      snapshot &&
      (!existing.participantName ||
        !existing.registrationNumber ||
        !existing.courseTitle ||
        existing.completedAt === null ||
        existing.attemptCount === null ||
        !existing.courseVersionNumber ||
        !existing.accreditationRegisterSnapshot ||
        existing.accreditationKindSnapshot === null)
    ) {
      return prisma.certificate.update({
        where: { id: existing.id },
        data: snapshot,
      });
    }

    return existing;
  }

  return prisma.certificate.create({
    data: {
      userId,
      courseId,
      courseVersionId,
      scorePercentage,
      studyLoadMinutes,
      ...(snapshot ?? {}),
    },
  });
}

export async function backfillCertificateSnapshots(certificateIds?: string[]) {
  const certificates = await prisma.certificate.findMany({
    where: certificateIds?.length ? { id: { in: certificateIds } } : undefined,
    orderBy: { issuedAt: "asc" },
  });

  let scanned = 0;
  let updated = 0;
  let skipped = 0;

  for (const certificate of certificates) {
    scanned += 1;

    const needsBackfill =
      !certificate.participantName ||
      !certificate.registrationNumber ||
      !certificate.courseTitle ||
      certificate.completedAt === null ||
      certificate.attemptCount === null ||
      !certificate.courseVersionNumber ||
      !certificate.accreditationRegisterSnapshot ||
      certificate.accreditationKindSnapshot === null;

    if (!needsBackfill) {
      skipped += 1;
      continue;
    }

    const snapshot = await buildCertificateSnapshotForUser({
      userId: certificate.userId,
      courseId: certificate.courseId,
      courseVersionId: certificate.courseVersionId,
      completedAtFallback: certificate.issuedAt,
    });

    if (!snapshot) {
      skipped += 1;
      continue;
    }

    await prisma.certificate.update({
      where: { id: certificate.id },
      data: snapshot,
    });
    updated += 1;
  }

  return { scanned, updated, skipped };
}
