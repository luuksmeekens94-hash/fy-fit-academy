import { startEnrollmentAction } from "@/app/lms-actions";

type AcademyStartButtonProps = {
  courseId: string;
  isStarted: boolean;
};

export function AcademyStartButton({ courseId, isStarted }: AcademyStartButtonProps) {
  return (
    <form action={startEnrollmentAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <button
        type="submit"
        className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]"
      >
        {isStarted ? "Hervat e-learning" : "Start e-learning"}
      </button>
    </form>
  );
}
