export type LessonRichTextBlock =
  | { type: "paragraph"; text: string }
  | { type: "bulletList"; items: Array<{ text: string; label?: string }> };

const explicitBulletPattern = /^\s*(?:[-*•●]\s+)(.+)$/;
const labelledBulletPattern = /^([A-ZÀ-Ý][\p{L}\p{M}'’/-]{2,35}(?:\s+[A-ZÀ-Ýa-zà-ÿ][\p{L}\p{M}'’/-]{2,35}){0,2}):\s+(.+)$/u;

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function parseExplicitBullet(paragraph: string) {
  const match = paragraph.match(explicitBulletPattern);
  return match?.[1]?.trim() ?? null;
}

function parseLabelledBullet(paragraph: string) {
  const match = paragraph.match(labelledBulletPattern);
  if (!match?.[1] || !match[2]) {
    return null;
  }

  return {
    label: match[1].trim(),
    text: match[2].trim(),
  };
}

export function parseLessonRichText(text: string): LessonRichTextBlock[] {
  const paragraphs = splitParagraphs(text);
  const blocks: LessonRichTextBlock[] = [];
  let index = 0;

  while (index < paragraphs.length) {
    const explicitBullet = parseExplicitBullet(paragraphs[index]);
    if (explicitBullet) {
      const items: Array<{ text: string }> = [];

      while (index < paragraphs.length) {
        const item = parseExplicitBullet(paragraphs[index]);
        if (!item) {
          break;
        }
        items.push({ text: item });
        index += 1;
      }

      blocks.push({ type: "bulletList", items });
      continue;
    }

    const labelledItems: Array<{ label: string; text: string }> = [];
    let labelledIndex = index;

    while (labelledIndex < paragraphs.length) {
      const item = parseLabelledBullet(paragraphs[labelledIndex]);
      if (!item) {
        break;
      }
      labelledItems.push(item);
      labelledIndex += 1;
    }

    if (labelledItems.length >= 2) {
      blocks.push({ type: "bulletList", items: labelledItems });
      index = labelledIndex;
      continue;
    }

    blocks.push({ type: "paragraph", text: paragraphs[index] });
    index += 1;
  }

  return blocks;
}
