export type LessonMedia = {
  text: string;
  videos: string[];
  images: string[];
};

const mediaPathPattern = /\/lms\/[^\s)]+\.(?:mp4|png|jpg|jpeg|webp)/gi;
const mediaReferenceLinePattern = /^\s*(?:[-•]\s*)?(?:Video:\s*)?\/lms\/[^\s)]+\.(?:mp4|png|jpg|jpeg|webp)\s*$/i;
const mediaIntroLinePattern = /^\s*(?:Afbeeldingen bij deze les|Video bij deze les|Bekijk de video bij deze module)\s*:?\s*$/i;

export function extractLessonMedia(content: string): LessonMedia {
  const mediaPaths = Array.from(new Set(content.match(mediaPathPattern) ?? []));
  const videos = mediaPaths.filter((path) => path.toLowerCase().endsWith(".mp4"));
  const images = mediaPaths.filter((path) => /\.(png|jpg|jpeg|webp)$/i.test(path));

  const text = content
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => !mediaReferenceLinePattern.test(line))
    .filter((line) => !mediaIntroLinePattern.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, videos, images };
}
