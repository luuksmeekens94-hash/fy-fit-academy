export type LessonMediaBlock =
  | { type: "text"; text: string }
  | { type: "video"; src: string }
  | { type: "image"; src: string };

export type LessonMedia = {
  text: string;
  videos: string[];
  images: string[];
  blocks: LessonMediaBlock[];
};

const mediaPathPattern = /\/lms\/[^\s)]+\.(?:mp4|png|jpg|jpeg|webp)/gi;
const mediaReferenceLinePattern = /^\s*(?:[-•]\s*)?(?:Video:\s*)?\/lms\/[^\s)]+\.(?:mp4|png|jpg|jpeg|webp)\s*$/i;
const mediaIntroLinePattern = /^\s*(?:Afbeeldingen bij deze les|Media bij deze les|Video bij deze les|Bekijk de video bij deze module)\s*:?\s*$/i;

function normalizeText(text: string) {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function toMediaBlock(path: string): LessonMediaBlock {
  if (path.toLowerCase().endsWith(".mp4")) {
    return { type: "video", src: path };
  }

  return { type: "image", src: path };
}

export function extractLessonMedia(content: string): LessonMedia {
  const mediaPaths = Array.from(new Set(content.match(mediaPathPattern) ?? []));
  const videos = mediaPaths.filter((path) => path.toLowerCase().endsWith(".mp4"));
  const images = mediaPaths.filter((path) => /\.(png|jpg|jpeg|webp)$/i.test(path));
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

  for (const rawLine of content.split(/\r?\n/)) {
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
        .replace(/^\s*(?:[-•]\s*)?(?:Video:\s*)?\s*$/i, "")
    );

    if (lineWithoutMedia && !mediaReferenceLinePattern.test(line)) {
      pendingTextLines.push(lineWithoutMedia);
      textLines.push(lineWithoutMedia);
    }

    flushTextBlock();
    for (const mediaPath of lineMediaPaths) {
      blocks.push(toMediaBlock(mediaPath));
    }
  }

  flushTextBlock();

  const text = normalizeText(
    textLines
      .filter((line) => !mediaReferenceLinePattern.test(line))
      .filter((line) => !mediaIntroLinePattern.test(line))
      .join("\n")
  );

  return { text, videos, images, blocks };
}
