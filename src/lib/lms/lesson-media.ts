export type LessonMediaBlock =
  | { type: "text"; text: string }
  | { type: "video"; src: string }
  | { type: "image"; src: string }
  | { type: "document"; src: string; label: string };

export type LessonMedia = {
  text: string;
  videos: string[];
  images: string[];
  documents: string[];
  blocks: LessonMediaBlock[];
};

const mediaPathPattern = /(?:https?:\/\/[^\s)]+|\/lms\/[^\s)]+)\.(?:mp4|png|jpg|jpeg|webp|pdf|doc|docx|ppt|pptx|xls|xlsx)/gi;
const mediaReferenceLinePattern = /^\s*(?:[-•]\s*)?(?:(?:[A-Za-zÀ-ÿ\d][^:]{0,80}):\s*)?(?:https?:\/\/[^\s)]+|\/lms\/[^\s)]+)\.(?:mp4|png|jpg|jpeg|webp|pdf|doc|docx|ppt|pptx|xls|xlsx)\s*$/i;
const mediaIntroLinePattern = /^\s*(?:Afbeeldingen bij deze les|Media bij deze les|Video bij deze les|Bekijk de video bij deze module)\s*:?\s*$/i;
const documentExtensionPattern = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx)$/i;

function normalizeText(text: string) {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function labelFromLine(line: string) {
  const label = line.replace(/^\s*[-•]\s*/, "").match(/^([^:]{2,80}):\s*(?:https?:\/\/|\/lms\/)/i)?.[1]?.trim();
  return label || "Document bij deze les";
}

function toMediaBlock(path: string, line = ""): LessonMediaBlock {
  if (path.toLowerCase().endsWith(".mp4")) {
    return { type: "video", src: path };
  }

  if (documentExtensionPattern.test(path)) {
    return { type: "document", src: path, label: labelFromLine(line) };
  }

  return { type: "image", src: path };
}

export function extractLessonMedia(content: string | null | undefined): LessonMedia {
  const safeContent = content ?? "";
  const mediaPaths = Array.from(new Set(safeContent.match(mediaPathPattern) ?? []));
  const videos = mediaPaths.filter((path) => path.toLowerCase().endsWith(".mp4"));
  const images = mediaPaths.filter((path) => /\.(png|jpg|jpeg|webp)$/i.test(path));
  const documents = mediaPaths.filter((path) => documentExtensionPattern.test(path));
  const blocks: LessonMediaBlock[] = [];
  const textLines: string[] = [];
  let pendingTextLines: string[] = [];

  function flushTextBlock() {
    const text = normalizeText(pendingTextLines.join("\n"));
    if (text) {
      blocks.push({ type: "text", text });
    }
    pendingTextLines = [];
  }

  for (const rawLine of safeContent.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const lineMediaPaths = Array.from(new Set(line.match(mediaPathPattern) ?? []));

    if (mediaIntroLinePattern.test(line)) {
      continue;
    }

    if (lineMediaPaths.length === 0) {
      pendingTextLines.push(line);
      textLines.push(line);
      continue;
    }

    const lineWithoutMedia = normalizeText(
      lineMediaPaths.reduce((cleanedLine, mediaPath) => cleanedLine.replace(mediaPath, ""), line)
        .replace(/^\s*(?:[-•]\s*)?(?:[A-Za-zÀ-ÿ\d][^:]{0,80}:\s*)?\s*$/i, "")
    );

    if (lineWithoutMedia && !mediaReferenceLinePattern.test(line)) {
      pendingTextLines.push(lineWithoutMedia);
      textLines.push(lineWithoutMedia);
    }

    flushTextBlock();
    for (const mediaPath of lineMediaPaths) {
      blocks.push(toMediaBlock(mediaPath, line));
    }
  }

  flushTextBlock();

  const text = normalizeText(
    textLines
      .filter((line) => !mediaReferenceLinePattern.test(line))
      .filter((line) => !mediaIntroLinePattern.test(line))
      .join("\n")
  );

  return { text, videos, images, documents, blocks };
}
