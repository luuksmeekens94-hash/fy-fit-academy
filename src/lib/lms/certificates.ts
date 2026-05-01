"server-only";

import { prisma } from "@/lib/prisma";
import { buildCertificateSnapshot } from "./certificate-snapshot";

async function buildCertificateSnapshotForUser(params: {
  userId: string;
  courseId: string;
  courseVersionId: string;
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
    completedAt: enrollment?.completedAt ?? new Date(),
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
    if (snapshot && (!existing.participantName || !existing.courseTitle || existing.attemptCount === null)) {
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
