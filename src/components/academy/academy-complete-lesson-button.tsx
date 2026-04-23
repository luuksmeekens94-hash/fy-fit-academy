import { completeLessonAction } from "@/app/lms-actions";

type AcademyCompleteLessonButtonProps = {
  courseId: string;
  lessonId: string;
};

export function AcademyCompleteLessonButton({ courseId, lessonId }: AcademyCompleteLessonButtonProps) {
  return (
    <form action={completeLessonAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <button
        type="submit"
        className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
      >
        Markeer les als afgerond
      </button>
    </form>
  );
}
