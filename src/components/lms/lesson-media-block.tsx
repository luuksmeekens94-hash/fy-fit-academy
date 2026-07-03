import type { LessonMedia } from "@/lib/lms/lesson-media";
import { parseLessonRichText } from "@/lib/lms/lesson-rich-text";

const headingPattern = /^(Module\s+\d+|Les\s+\d+\.|\d+(?:\.\d+)?\s+|\d+(?:\.\d+)?[A-ZÀ-ÿ]|Focus$|Leerdoelen$|Even voorstellen:?$|Casus:?$|Samenvatting:?$|Kernpunten:?$|Reflectie:?$)/i;

type LessonMediaBlockProps = {
  media: LessonMedia;
};

function MediaVideo({ src }: { src: string }) {
  return (
    <div className="my-8 overflow-hidden rounded-[26px] border border-[var(--border)] bg-slate-950 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.85)]">
      <video src={src} controls preload="metadata" className="w-full" />
    </div>
  );
}

function MediaImage({ src }: { src: string }) {
  return (
    <figure className="my-8 overflow-hidden rounded-[26px] border border-[var(--border)] bg-white shadow-[0_18px_50px_-44px_rgba(35,27,18,0.7)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Afbeelding bij lesmateriaal" className="w-full object-contain" />
    </figure>
  );
}

function MediaDocument({ src, label }: { src: string; label: string }) {
  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="my-5 flex items-center justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-white px-5 py-4 text-sm font-semibold text-[var(--foreground)] shadow-[0_18px_50px_-44px_rgba(35,27,18,0.7)] transition hover:-translate-y-0.5 hover:border-[var(--teal)]"
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-[var(--teal)]">Document</span>
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 rounded-full bg-[var(--sage-soft)] px-3 py-1 text-xs text-slate-700">Openen</span>
    </a>
  );
}

function looksLikeHeading(text: string) {
  const trimmed = text.trim();
  return trimmed.length <= 96 && headingPattern.test(trimmed);
}

function LessonText({ text }: { text: string }) {
  const blocks = parseLessonRichText(text);

  return (
    <div className="lesson-prose space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "bulletList") {
          return (
            <ul key={`list-${index}`} className="my-7 grid gap-3 pl-0">
              {block.items.map((item, itemIndex) => (
                <li
                  key={`${item.label ?? item.text}-${itemIndex}`}
                  className="flex gap-3 rounded-2xl bg-[var(--sage-soft)]/60 px-4 py-3 text-[1rem] leading-7 ring-1 ring-[var(--border)]"
                >
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--teal)]" />
                  <span>
                    {item.label ? <span className="font-semibold italic text-[var(--foreground)]">{item.label}: </span> : null}
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (looksLikeHeading(block.text)) {
          return (
            <h3 key={`heading-${index}`} className="display-font border-b border-[var(--border)] pb-3 pt-7 text-2xl font-semibold leading-tight text-[var(--foreground)] first:pt-0 lg:text-3xl">
              {block.text}
            </h3>
          );
        }

        return (
          <p key={`text-${index}`} className="whitespace-pre-line text-[1.04rem] leading-9 text-[var(--ink-soft)]">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

export function LessonMediaBlock({ media }: LessonMediaBlockProps) {
  return (
    <div className="mx-auto max-w-[78ch] space-y-5">
      {media.blocks.map((block, index) => {
        if (block.type === "video") {
          return <MediaVideo key={`${block.src}-${index}`} src={block.src} />;
        }

        if (block.type === "image") {
          return <MediaImage key={`${block.src}-${index}`} src={block.src} />;
        }

        if (block.type === "document") {
          return <MediaDocument key={`${block.src}-${index}`} src={block.src} label={block.label} />;
        }

        return <LessonText key={`text-${index}`} text={block.text} />;
      })}
    </div>
  );
}
