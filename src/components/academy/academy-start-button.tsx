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
        className="btn-primary px-5 py-3 text-sm"
      >
        {isStarted ? "Hervat e-learning" : "Start e-learning"}
      </button>
    </form>
  );
}
