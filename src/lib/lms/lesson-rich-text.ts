export type LessonRichTextBlock =
  | { type: "paragraph"; text: string }
  | { type: "bulletList"; items: Array<{ text: string; label?: string }> };

const explicitBulletPattern = /^\s*(?:[-*•●▪▫‣◦□]\s+)(.+)$/;
const labelledBulletPattern = /^([A-ZÀ-Ý][\p{L}\p{M}'’/-]{2,35}(?:\s+[A-ZÀ-Ýa-zà-ÿ][\p{L}\p{M}'’/-]{2,35}){0,2}):\s+(.+)$/u;

function normalizePdfBullets(text: string) {
  const lines = text.replace(/\uF0B7/g, "").split("\n");
  const normalized: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index]?.trim() ?? "";
    const next = lines[index + 1]?.trim() ?? "";

    if (/^[•●▪▫‣◦□]$/.test(current)) {
      if (next) {
        normalized.push(`- ${next}`);
        index += 1;
      }
      continue;
    }

    if (/^[•●▪▫‣◦□]\s*/.test(current)) {
      normalized.push(current.replace(/^[•●▪▫‣◦□]\s*/, "- "));
      continue;
    }

    normalized.push(lines[index] ?? "");
  }

  return normalized.join("\n");
}

function isStandaloneHeadingLine(line: string) {
  return /^(Module\s+\d+|Focus|Leerdoelen|Even voorstellen:?|Les\s+\d+(?:\.\d+)?:?.*|Figuur\s+\d+.*|Literatuur:?|Toetsvragen\s+Module\s+\d+|Casus:?|Samenvatting:?|Kernpunten:?|Reflectie:?)$/i.test(line);
}

function splitParagraphs(text: string) {
  const lines = normalizePdfBullets(text).split("\n").map((line) => line.trim());
  const paragraphs: string[] = [];
  let current: string[] = [];

  function flush() {
    const value = current.join(" ").replace(/\s+/g, " ").trim();
    if (value) {
      paragraphs.push(value);
    }
    current = [];
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";

    if (!line) {
      flush();
      continue;
    }

    if (/^[-*•●▪▫‣◦]\s+/.test(line)) {
      flush();
      const itemLines = [line.replace(/^[-*•●▪▫‣◦]\s+/, "")];

      while (index + 1 < lines.length) {
        const next = lines[index + 1]?.trim() ?? "";
        if (!next || /^[-*•●▪▫‣◦]\s+/.test(next) || isStandaloneHeadingLine(next)) {
          break;
        }
        itemLines.push(next);
        index += 1;
      }

      paragraphs.push(`- ${itemLines.join(" ").replace(/\s+/g, " ").trim()}`);
      continue;
    }

    if (isStandaloneHeadingLine(line)) {
      flush();
      paragraphs.push(line);
      continue;
    }

    current.push(line);
  }

  flush();
  return paragraphs;
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

function looksLikeContinuation(text: string) {
  const trimmed = text.trim();
  return Boolean(trimmed) && !parseExplicitBullet(trimmed) && !isStandaloneHeadingLine(trimmed);
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

        const lines = [item];
        index += 1;

        while (index < paragraphs.length && looksLikeContinuation(paragraphs[index])) {
          lines.push(paragraphs[index]);
          index += 1;
        }

        items.push({ text: lines.join(" ").replace(/\s+/g, " ").trim() });
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
