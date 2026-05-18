import { put } from "@vercel/blob";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildLmsUploadPath, validateLmsUploadFile, type ValidatedLmsUploadFile } from "@/lib/lms/media-upload";

export const runtime = "nodejs";

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await requireUser();

  if (user.role !== "BEHEERDER") {
    return jsonResponse({ error: "Alleen beheerders mogen LMS-media uploaden." }, 403);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return jsonResponse(
      {
        error: "Vercel Blob is nog niet gekoppeld. Stel BLOB_READ_WRITE_TOKEN in op Vercel en lokaal.",
        code: "BLOB_TOKEN_MISSING",
      },
      503,
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const courseId = String(formData.get("courseId") ?? "").trim();
  const lessonId = String(formData.get("lessonId") ?? "").trim() || null;

  if (!(file instanceof File)) {
    return jsonResponse({ error: "Geen bestand ontvangen." }, 400);
  }

  if (!courseId) {
    return jsonResponse({ error: "Cursus ontbreekt." }, 400);
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      versions: {
        where: { isActive: true },
        select: {
          id: true,
          lessons: { where: lessonId ? { id: lessonId } : undefined, select: { id: true } },
        },
        take: 1,
      },
    },
  });

  const activeVersion = course?.versions[0] ?? null;
  if (!course || !activeVersion) {
    return jsonResponse({ error: "Cursus of actieve versie niet gevonden." }, 404);
  }

  if (lessonId && activeVersion.lessons.length === 0) {
    return jsonResponse({ error: "Les hoort niet bij deze cursus." }, 400);
  }

  let validatedFile: ValidatedLmsUploadFile;
  try {
    validatedFile = validateLmsUploadFile(file);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Bestand is ongeldig." }, 400);
  }

  const pathname = buildLmsUploadPath({
    courseId,
    lessonId,
    safeBaseName: validatedFile.safeBaseName,
    extension: validatedFile.extension,
  });

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return jsonResponse({
      url: blob.url,
      pathname: blob.pathname,
      mediaKind: validatedFile.mediaKind,
      fileName: validatedFile.name,
      size: validatedFile.size,
      contentType: validatedFile.type,
    });
  } catch {
    return jsonResponse({ error: "Upload naar Vercel Blob is mislukt. Controleer Blob-configuratie en probeer opnieuw." }, 502);
  }
}
