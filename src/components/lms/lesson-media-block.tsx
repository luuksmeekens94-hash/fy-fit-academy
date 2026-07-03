import type { LessonMedia } from "@/lib/lms/lesson-media";
import { parseLessonRichText } from "@/lib/lms/lesson-rich-text";

const headingPattern = /^(Module\s+\d+|Les\s+\d+\.|\d+(?:\.\d+)?\s+|\d+(?:\.\d+)?[A-ZÀ-ÿ]|Focus$|Leerdoelen$|Even voorstellen:?$|Casus:?$|Samenvatting:?$|Kernpunten:?$|Reflectie:?$)/i;

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
      <video src={src} controls preload="metadata" className="w-full" />
    </div>
  );
}

function MediaImage({ src, caption = "Afbeelding bij lesmateriaal" }: { src: string; caption?: string }) {
  return (
    <figure className="my-9 overflow-hidden rounded-[30px] border border-[var(--border)] bg-white shadow-[0_24px_70px_-48px_rgba(35,27,18,0.75)]">
      <div className="bg-[var(--brand-wash)]/55 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
        Figuur
      </div>
      <div className="bg-white p-3 sm:p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={caption} className="mx-auto max-h-[560px] w-full rounded-[20px] object-contain" />
      </div>
      <figcaption className="border-t border-[var(--border)] bg-white px-5 py-4 text-sm leading-6 text-[var(--ink-soft)]">
        {caption}
      </figcaption>
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
          const content = (
            <>
              <span className="block text-sm font-semibold leading-6 text-slate-950">{reference.title}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--ink-soft)]">
                {[reference.source, reference.guideline, reference.year ? String(reference.year) : null].filter(Boolean).join(" · ") || "Literatuurreferentie"}
              </span>
            </>
          );

          if (reference.url) {
            return (
              <a
                key={reference.id}
                href={reference.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-[22px] border border-[var(--border)] bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-[var(--brand)]"
              >
                {content}
              </a>
            );
          }

          return (
            <div key={reference.id} className="rounded-[22px] border border-[var(--border)] bg-white px-4 py-4">
              {content}
            </div>
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

export function LessonMediaBlock({ media, figures = [], literature = [] }: LessonMediaBlockProps) {
  const figureInjectionIndex = media.blocks.findIndex((block, index) => block.type === "text" && index > 0);

  return (
    <div className="mx-auto max-w-[82ch] space-y-5">
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

        const textBlock = <LessonText key={`text-${index}`} text={block.text} />;
        if (figures.length > 0 && index === figureInjectionIndex) {
          return (
            <div key={`text-and-figures-${index}`}>
              {textBlock}
              {figures.map((figure) => <MediaImage key={figure.src} src={figure.src} caption={figure.caption} />)}
            </div>
          );
        }

        return textBlock;
      })}

      {figureInjectionIndex === -1 ? figures.map((figure) => <MediaImage key={figure.src} src={figure.src} caption={figure.caption} />) : null}
      <LiteratureCards literature={literature} />
    </div>
  );
}
