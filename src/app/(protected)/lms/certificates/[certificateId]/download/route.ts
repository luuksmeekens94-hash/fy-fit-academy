import { Role } from "@prisma/client";

import { requireUser } from "@/lib/auth";
import { buildCertificateDownload } from "@/lib/lms/certificate-evidence";
import { getCertificateEvidence } from "@/lib/lms/queries";

type CertificateDownloadRouteProps = {
  params: Promise<{
    certificateId: string;
  }>;
};

export async function GET(_request: Request, { params }: CertificateDownloadRouteProps) {
  const user = await requireUser();
  const { certificateId } = await params;
  const evidence = await getCertificateEvidence(certificateId);

  if (!evidence) {
    return new Response("Certificaat niet gevonden", { status: 404 });
  }

  const canDownload =
    evidence.userId === user.id || user.role === Role.BEHEERDER || user.role === Role.REVIEWER;

  if (!canDownload) {
    return new Response("Geen toegang tot dit certificaat", { status: 403 });
  }

  const download = buildCertificateDownload(evidence);

  return new Response(download.body, {
    headers: {
      "Content-Type": download.contentType,
      "Content-Disposition": `attachment; filename="${download.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
