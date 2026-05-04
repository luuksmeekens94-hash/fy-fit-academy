import type { LessonMedia } from "@/lib/lms/lesson-media";
import { parseLessonRichText } from "@/lib/lms/lesson-rich-text";

type LessonMediaBlockProps = {
  media: LessonMedia;
};

function MediaVideo({ src }: { src: string }) {
  return (
    <video
      src={src}
      controls
      preload="metadata"
      className="my-6 w-full rounded-[24px] border border-[var(--border)] bg-slate-950"
    />
  );
}

function MediaImage({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Afbeelding bij lesmateriaal"
      className="my-6 w-full rounded-[24px] border border-[var(--border)] bg-white object-contain"
    />
  );
}

function LessonText({ text }: { text: string }) {
  const blocks = parseLessonRichText(text);

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "bulletList") {
          return (
            <ul key={`list-${index}`} className="space-y-4 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={`${item.label ?? item.text}-${itemIndex}`} className="list-disc pl-2 marker:text-[var(--brand)]">
                  {item.label ? <span className="font-semibold italic text-slate-900">{item.label}: </span> : null}
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`text-${index}`} className="whitespace-pre-line">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

export function LessonMediaBlock({ media }: LessonMediaBlockProps) {
  return (
    <div className="space-y-5">
      {media.blocks.map((block, index) => {
        if (block.type === "video") {
          return <MediaVideo key={`${block.src}-${index}`} src={block.src} />;
        }

        if (block.type === "image") {
          return <MediaImage key={`${block.src}-${index}`} src={block.src} />;
        }

        return <LessonText key={`text-${index}`} text={block.text} />;
      })}
    </div>
  );
}
