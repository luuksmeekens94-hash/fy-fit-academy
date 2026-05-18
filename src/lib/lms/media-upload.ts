export type LmsMediaKind = "video" | "image" | "document";

export type LmsUploadFileLike = {
  name: string;
  size: number;
  type: string;
};

export type ValidatedLmsUploadFile = {
  name: string;
  extension: string;
  mediaKind: LmsMediaKind;
  safeBaseName: string;
  size: number;
  type: string;
};

export const LMS_UPLOAD_MAX_BYTES = 250 * 1024 * 1024;

const MIME_KIND_MAP: Record<string, LmsMediaKind> = {
  "video/mp4": "video",
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-powerpoint": "document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "document",
  "application/vnd.ms-excel": "document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
};

const EXTENSION_KIND_MAP: Record<string, LmsMediaKind> = {
  mp4: "video",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  pdf: "document",
  doc: "document",
  docx: "document",
  ppt: "document",
  pptx: "document",
  xls: "document",
  xlsx: "document",
};

export function getMediaKindFromMimeType(mimeType: string) {
  return MIME_KIND_MAP[mimeType.toLowerCase()] ?? null;
}

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function normalizePathSegment(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function validateLmsUploadFile(file: LmsUploadFileLike): ValidatedLmsUploadFile {
  if (!file.name || file.name.trim().length < 3) {
    throw new Error("Bestandsnaam ontbreekt.");
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    throw new Error("Bestand is leeg of ongeldig.");
  }

  if (file.size > LMS_UPLOAD_MAX_BYTES) {
    throw new Error("Bestand is te groot. Maximaal 250 MB per upload.");
  }

  const extension = getExtension(file.name);
  const kindFromMime = getMediaKindFromMimeType(file.type);
  const kindFromExtension = EXTENSION_KIND_MAP[extension] ?? null;
  const mediaKind = kindFromMime ?? kindFromExtension;

  if (!extension || !mediaKind) {
    throw new Error("Bestandstype wordt niet ondersteund. Upload video, afbeelding, PDF, Word, PowerPoint of Excel.");
  }

  const safeBaseName = normalizePathSegment(file.name.replace(new RegExp(`\\.${extension}$`, "i"), "")) || "lms-media";

  return {
    name: file.name,
    extension,
    mediaKind,
    safeBaseName,
    size: file.size,
    type: file.type,
  };
}

export function buildLmsUploadPath(input: {
  courseId: string;
  lessonId?: string | null;
  safeBaseName: string;
  extension: string;
  now?: Date;
}) {
  const date = (input.now ?? new Date()).toISOString().slice(0, 10);
  const courseSegment = normalizePathSegment(input.courseId) || "course";
  const lessonSegment = normalizePathSegment(input.lessonId ?? "new-lesson") || "new-lesson";
  const baseName = normalizePathSegment(input.safeBaseName) || "lms-media";

  return `lms/${courseSegment}/${lessonSegment}/${date}/${baseName}.${input.extension.toLowerCase()}`;
}
