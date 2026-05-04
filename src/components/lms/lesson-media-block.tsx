import type { LessonMedia } from "@/lib/lms/lesson-media";

type LessonMediaBlockProps = {
  media: LessonMedia;
};

export function LessonMediaBlock({ media }: LessonMediaBlockProps) {
  return (
    <>
      {media.text ? <p className="whitespace-pre-line">{media.text}</p> : null}

      {media.videos.length > 0 ? (
        <div className="mt-6 space-y-4">
          {media.videos.map((videoPath) => (
            <video
              key={videoPath}
              src={videoPath}
              controls
              preload="metadata"
              className="w-full rounded-[24px] border border-[var(--border)] bg-slate-950"
            />
          ))}
        </div>
      ) : null}

      {media.images.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {media.images.map((imagePath) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={imagePath}
              src={imagePath}
              alt="Afbeelding bij lesmateriaal"
              className="w-full rounded-[24px] border border-[var(--border)] bg-white object-contain"
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
