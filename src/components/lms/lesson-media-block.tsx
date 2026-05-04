import type { LessonMedia } from "@/lib/lms/lesson-media";

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

export function LessonMediaBlock({ media }: LessonMediaBlockProps) {
  return (
    <div className="space-y-1">
      {media.blocks.map((block, index) => {
        if (block.type === "video") {
          return <MediaVideo key={`${block.src}-${index}`} src={block.src} />;
        }

        if (block.type === "image") {
          return <MediaImage key={`${block.src}-${index}`} src={block.src} />;
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
