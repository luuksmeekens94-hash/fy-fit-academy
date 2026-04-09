"server-only";

import { prisma } from "@/lib/prisma";

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

  // Voorkom dubbele certificaten voor dezelfde cursus
  const existing = await prisma.certificate.findFirst({
    where: { userId, courseId },
  });

  if (existing) return existing;

  return prisma.certificate.create({
    data: {
      userId,
      courseId,
      courseVersionId,
      scorePercentage,
      studyLoadMinutes,
    },
  });
}
