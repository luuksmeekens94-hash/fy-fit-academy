import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth";
import { buildParticipantReportDownload } from "@/lib/lms/participant-report";
import { getCourseDetail, getCourseParticipantCompletionReport } from "@/lib/lms/queries";

type ParticipantReportRouteProps = {
  params: Promise<{
    courseId: string;
    format: string;
  }>;
};

export async function GET(_request: Request, { params }: ParticipantReportRouteProps) {
  await requireRole([Role.BEHEERDER, Role.REVIEWER]);

  const { courseId, format } = await params;
  if (format !== "csv" && format !== "markdown") {
    return new Response("Ongeldig exportformaat", { status: 400 });
  }

  const [course, rows] = await Promise.all([
    getCourseDetail(courseId),
    getCourseParticipantCompletionReport(courseId),
  ]);

  if (!course) {
    return new Response("Cursus niet gevonden", { status: 404 });
  }

  const download = buildParticipantReportDownload({
    rows,
    courseSlug: course.slug,
    format,
  });

  return new Response(download.body, {
    headers: {
      "Content-Type": download.contentType,
      "Content-Disposition": `attachment; filename="${download.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
