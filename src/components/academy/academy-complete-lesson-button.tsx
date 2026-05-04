import { completeLessonAction } from "@/app/lms-actions";

type AcademyCompleteLessonButtonProps = {
  courseId: string;
  lessonId: string;
  isCompleted?: boolean;
};

export function AcademyCompleteLessonButton({ courseId, lessonId, isCompleted = false }: AcademyCompleteLessonButtonProps) {
  if (isCompleted) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
        Les afgerond
      </span>
    );
  }

  return (
    <form action={completeLessonAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <button
        type="submit"
        className="btn-primary px-5 py-3 text-sm"
      >
        Markeer les als afgerond
      </button>
    </form>
  );
}
