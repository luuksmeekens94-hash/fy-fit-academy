import type { ReactNode } from "react";

import type { LessonMedia } from "@/lib/lms/lesson-media";
import { parseLessonRichText } from "@/lib/lms/lesson-rich-text";

const headingPattern = /^(Module\s+\d+|Les\s+\d+\.|\d+(?:\.\d+)?\s+|\d+(?:\.\d+)?[A-ZÀ-ÿ]|Focus$|Leerdoelen$|Even voorstellen:?$|Casus:?$|Samenvatting:?$|Kernpunten:?$|Reflectie:?$)/i;
const urlPattern = /(https?:\/\/[^\s)]+)(?=[\s)]|$)/g;
const bareDoiPattern = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi;
const figureMarkerPattern = /^Figuur\s+\d+\b/i;
const literatureMarkerPattern = /^Literatuur\s*:?/i;
const quizMarkerPattern = /^Toetsvragen\s+Module\s+\d+\s*$/i;

type LiteratureItem = {
  id: string;
  title: string;
  source: string | null;
  url: string | null;
  guideline: string | null;
  year: number | null;
};

type FigureItem = {
  src: string;
  caption: string;
};

type LessonMediaBlockProps = {
  media: LessonMedia;
  figures?: FigureItem[];
  literature?: LiteratureItem[];
};

function MediaVideo({ src }: { src: string }) {
  return (
    <div className="my-8 overflow-hidden rounded-[30px] border border-slate-900/10 bg-slate-950 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.85)]">
      <video src={src} controls preload="none" className="w-full" />
    </div>
  );
}

function MediaImage({ src, caption = "Afbeelding bij lesmateriaal" }: { src: string; caption?: string }) {
  return (
    <figure className="my-9 overflow-hidden rounded-[30px] border border-[var(--border)] bg-white shadow-[0_24px_70px_-48px_rgba(35,27,18,0.75)]">
      <div className="bg-[linear-gradient(135deg,var(--brand-wash),var(--sage-soft))] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
        Figuur in de module
      </div>
      <div className="bg-white p-3 sm:p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={caption} loading="lazy" decoding="async" className="mx-auto max-h-[560px] w-full rounded-[20px] object-contain" />
      </div>
      <figcaption className="border-t border-[var(--border)] bg-white px-5 py-4 text-sm leading-6 text-[var(--ink-soft)]">
        {caption}
      </figcaption>
    </figure>
  );
}

function isOfficeDownload(src: string) {
  return /\.(docx?|xlsx?|pptx?)(?:$|[?#])/i.test(src);
}

function fileNameFromSrc(src: string) {
  const pathPart = src.split(/[?#]/)[0] ?? "";
  return decodeURIComponent(pathPart.split("/").filter(Boolean).pop() ?? "document");
}

function MediaDocument({ src, label }: { src: string; label: string }) {
  const shouldDownload = isOfficeDownload(src);

  return (
    <a
      href={src}
      target={shouldDownload ? undefined : "_blank"}
      rel={shouldDownload ? undefined : "noreferrer"}
      download={shouldDownload ? fileNameFromSrc(src) : undefined}
      className="my-5 flex items-center justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-white px-5 py-4 text-sm font-semibold text-[var(--foreground)] shadow-[0_18px_50px_-44px_rgba(35,27,18,0.7)] transition hover:-translate-y-0.5 hover:border-[var(--teal)]"
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--teal)]">Document</span>
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 rounded-full bg-[var(--sage-soft)] px-3 py-1 text-xs text-slate-700">{shouldDownload ? "Downloaden" : "Openen"}</span>
    </a>
  );
}

function renderTextWithLinks(text: string) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(urlPattern)) {
    const url = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }

    parts.push(
      <a
        key={`${url}-${index}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-[var(--brand-deep)] underline decoration-[var(--brand)]/35 underline-offset-4 transition hover:text-[var(--brand)]"
      >
        {url}
      </a>,
    );
    lastIndex = index + url.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : text;
}

function extractUrl(text: string) {
  const directUrl = text.match(urlPattern)?.[0] ?? null;
  if (directUrl) {
    return directUrl;
  }

  const bareDoi = text.match(bareDoiPattern)?.[0]?.replace(/[.,;]+$/, "") ?? null;
  return bareDoi ? `https://doi.org/${bareDoi}` : null;
}

type LiteratureLink = {
  url: string;
  label: string;
  display: string;
};

function getKnownReferenceUrl(text: string) {
  const normalized = text.toLowerCase();

  if (normalized.includes("neurosensory mapping") && normalized.includes("dye") && normalized.includes("1998")) {
    return "https://doi.org/10.1177/03635465980260060601";
  }

  return null;
}

function cleanReferenceText(text: string) {
  return text
    .replace(urlPattern, "")
    .replace(bareDoiPattern, "")
    .replace(/\s+/g, " ")
    .trim();
}

function referenceStartsNewCitation(text: string) {
  const trimmed = text.trim();

  return /^[A-Za-zÀ-ÿ][^,]{1,90},\s+(?:[A-Z]\.|[A-Z][a-zà-ÿ]+).+\(\d{4}\)/u.test(trimmed);
}

function groupLiteratureReferences(entries: string[]) {
  const groups: string[] = [];

  entries.forEach((entry) => {
    const trimmed = entry.trim();
    if (!trimmed || quizMarkerPattern.test(trimmed)) {
      return;
    }

    if (groups.length === 0 || referenceStartsNewCitation(trimmed)) {
      groups.push(trimmed);
      return;
    }

    groups[groups.length - 1] = `${groups[groups.length - 1]} ${trimmed}`.replace(/\s+/g, " ").trim();
  });

  return groups;
}

function resolveLiteratureLink(reference: string): LiteratureLink {
  const directUrl = extractUrl(reference) ?? getKnownReferenceUrl(reference);
  const title = cleanReferenceText(reference);

  if (directUrl) {
    return {
      url: directUrl,
      label: "Open artikel",
      display: directUrl.replace(/^https?:\/\//, ""),
    };
  }

  const scholarQuery = encodeURIComponent(title || reference);
  return {
    url: `https://scholar.google.com/scholar?q=${scholarQuery}`,
    label: "Zoek bronartikel",
    display: "Google Scholar",
  };
}

function formatLiteratureTitle(text: string) {
  return cleanReferenceText(text);
}

function InlineLiteratureBox({ references }: { references: string[] }) {
  const citationLabels = references.filter((entry) => /^\(.+\)$/.test(entry.trim()));
  const citationEntries = groupLiteratureReferences(references.filter((entry) => !/^\(.+\)$/.test(entry.trim())));

  return (
    <section className="my-9 overflow-hidden rounded-[30px] border border-[var(--border)] bg-white shadow-[0_22px_70px_-50px_rgba(35,27,18,0.8)]">
      <div className="bg-[linear-gradient(135deg,#fff7ed,#eef7ef)] px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">Literatuur</p>
        <h3 className="display-font mt-2 text-2xl font-semibold text-slate-950">Onderbouwing bij deze les</h3>
        {citationLabels.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {citationLabels.map((label) => (
              <span key={label} className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--brand-deep)] ring-1 ring-[var(--border)]">
                {label.replace(/^\(|\)$/g, "")}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid gap-3 bg-white px-5 py-5 sm:px-6">
        {citationEntries.map((reference, index) => {
          const link = resolveLiteratureLink(reference);
          const title = formatLiteratureTitle(reference);

          return (
            <div key={`${reference}-${index}`} className="rounded-[22px] border border-[var(--border)] bg-[var(--brand-wash)]/35 p-4">
              <p className="text-sm font-semibold leading-7 text-slate-950">{title || "Literatuurreferentie"}</p>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_-24px_rgba(141,79,18,0.95)] transition hover:bg-[var(--brand-deep)]"
              >
                <span>{link.label}</span>
                <span className="truncate opacity-90">{link.display}</span>
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LiteratureCards({ literature }: { literature: LiteratureItem[] }) {
  if (literature.length === 0) {
    return null;
  }

  return (
    <section className="my-10 rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,#fffdfa,#f7f4ec)] p-5 shadow-[0_18px_55px_-48px_rgba(35,27,18,0.7)] sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">Literatuur</p>
      <h3 className="display-font mt-2 text-2xl font-semibold text-slate-950">Bronnen bij deze module</h3>
      <div className="mt-5 grid gap-3">
        {literature.map((reference) => {
          const link = reference.url
            ? {
                url: reference.url,
                label: "Open bronbestand",
                display: reference.url.replace(/^https?:\/\//, ""),
              }
            : resolveLiteratureLink([reference.title, reference.source, reference.year ? String(reference.year) : null].filter(Boolean).join(" "));
          const content = (
            <>
              <span className="block text-sm font-semibold leading-6 text-slate-950">{reference.title}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--ink-soft)]">
                {[reference.source, reference.guideline, reference.year ? String(reference.year) : null].filter(Boolean).join(" · ") || "Literatuurreferentie"}
              </span>
              <span className="mt-3 inline-flex max-w-full rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold text-white">
                {link.label}
              </span>
            </>
          );

          return (
            <a
              key={reference.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-[22px] border border-[var(--border)] bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--brand)]"
            >
              {content}
            </a>
          );
        })}
      </div>
    </section>
  );
}

function looksLikeHeading(text: string) {
  const trimmed = text.trim();
  return trimmed.length <= 96 && headingPattern.test(trimmed);
}

function isFigureMarker(text: string) {
  return figureMarkerPattern.test(text.trim());
}

function isLiteratureMarker(text: string) {
  return literatureMarkerPattern.test(text.trim());
}

function isQuizMarker(text: string) {
  return quizMarkerPattern.test(text.trim());
}

function LessonVideos({ videos }: { videos: string[] }) {
  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="my-9 space-y-4">
      <div className="rounded-[24px] border border-[var(--border)] bg-[var(--brand-wash)]/55 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-deep)]">Video</p>
        <p className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">Bekijk eerst de videodemonstratie en ga daarna door naar de literatuur.</p>
      </div>
      {videos.map((src) => (
        <MediaVideo key={src} src={src} />
      ))}
    </section>
  );
}

function LessonText({ text, figures = [], videos = [] }: { text: string; figures?: FigureItem[]; videos?: string[] }) {
  const blocks = parseLessonRichText(text);
  const figureMarkerIndexes = blocks
    .map((block, index) => (block.type === "paragraph" && isFigureMarker(block.text) ? index : null))
    .filter((index): index is number => index !== null);
  const figureByBlockIndex = new Map(
    figureMarkerIndexes.map((blockIndex, figureIndex) => [blockIndex, figures[figureIndex]] as const),
  );
  const inlineFigureCount = Math.min(figureMarkerIndexes.length, figures.length);
  const firstLiteratureBlockIndex = blocks.findIndex((block) => block.type === "paragraph" && isLiteratureMarker(block.text));

  const nodes: ReactNode[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (index === firstLiteratureBlockIndex) {
      nodes.push(<LessonVideos key="lesson-videos-before-literature" videos={videos} />);
    }

    if (block.type === "paragraph" && isQuizMarker(block.text)) {
      continue;
    }

    if (block.type === "bulletList") {
      nodes.push(
        <ul key={`list-${index}`} className="my-7 grid gap-3 pl-0">
          {block.items.map((item, itemIndex) => (
            <li
              key={`${item.label ?? item.text}-${itemIndex}`}
              className="flex gap-3 rounded-2xl bg-[var(--sage-soft)]/60 px-4 py-3 text-[1rem] leading-7 ring-1 ring-[var(--border)]"
            >
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--teal)]" />
              <span>
                {item.label ? <span className="font-semibold italic text-[var(--foreground)]">{item.label}: </span> : null}
                {renderTextWithLinks(item.text)}
              </span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (isFigureMarker(block.text)) {
      const figure = figureByBlockIndex.get(index) ?? null;
      if (figure) {
        nodes.push(<MediaImage key={`inline-figure-${index}-${figure.src}`} src={figure.src} caption={figure.caption} />);
      } else {
        nodes.push(
          <p key={`figure-marker-${index}`} className="rounded-2xl bg-[var(--brand-wash)]/55 px-4 py-3 text-sm font-semibold text-[var(--brand-deep)]">
            {block.text}
          </p>,
        );
      }
      continue;
    }

    if (isLiteratureMarker(block.text)) {
      const references: string[] = [];
      let lookahead = index + 1;

      while (lookahead < blocks.length) {
        const candidate = blocks[lookahead];
        if (candidate.type !== "paragraph") {
          break;
        }
        if (looksLikeHeading(candidate.text) || isFigureMarker(candidate.text) || isLiteratureMarker(candidate.text) || isQuizMarker(candidate.text)) {
          break;
        }
        references.push(candidate.text);
        lookahead += 1;
      }

      if (references.length > 0) {
        nodes.push(<InlineLiteratureBox key={`inline-literature-${index}`} references={references} />);
        index = lookahead - 1;
        continue;
      }
    }

    if (looksLikeHeading(block.text)) {
      nodes.push(
        <h3 key={`heading-${index}`} className="display-font border-b border-[var(--border)] pb-3 pt-7 text-2xl font-semibold leading-tight text-[var(--foreground)] first:pt-0 lg:text-3xl">
          {block.text}
        </h3>,
      );
      continue;
    }

    nodes.push(
      <p key={`text-${index}`} className="whitespace-pre-line text-[1.04rem] leading-9 text-[var(--ink-soft)]">
        {renderTextWithLinks(block.text)}
      </p>,
    );
  }

  if (firstLiteratureBlockIndex === -1) {
    nodes.push(<LessonVideos key="lesson-videos-after-text" videos={videos} />);
  }

  figures.slice(inlineFigureCount).forEach((figure) => {
    nodes.push(<MediaImage key={`fallback-figure-${figure.src}`} src={figure.src} caption={figure.caption} />);
  });

  return <div className="lesson-prose space-y-5">{nodes}</div>;
}

export function LessonMediaBlock({ media, figures = [], literature = [] }: LessonMediaBlockProps) {
  const hasInlineLiterature = /(^|\n)\s*Literatuur\s*:?/i.test(media.text);
  const videos = media.blocks.filter((block) => block.type === "video").map((block) => block.src);
  const firstTextBlockIndex = media.blocks.findIndex((block) => block.type === "text");

  return (
    <div className="mx-auto max-w-[82ch] space-y-5">
      {media.blocks.map((block, index) => {
        if (block.type === "video") {
          return firstTextBlockIndex === -1 ? <MediaVideo key={`${block.src}-${index}`} src={block.src} /> : null;
        }

        if (block.type === "image") {
          return <MediaImage key={`${block.src}-${index}`} src={block.src} />;
        }

        if (block.type === "document") {
          return <MediaDocument key={`${block.src}-${index}`} src={block.src} label={block.label} />;
        }

        return <LessonText key={`text-${index}`} text={block.text} figures={figures} videos={index === firstTextBlockIndex ? videos : []} />;
      })}

      {!hasInlineLiterature ? <LiteratureCards literature={literature} /> : null}
    </div>
  );
}
