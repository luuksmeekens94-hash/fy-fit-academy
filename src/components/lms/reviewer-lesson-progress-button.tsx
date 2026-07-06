"use client";

import { useState, useTransition } from "react";

import { markReviewerLessonStepAction } from "@/app/lms-actions";

type ReviewerLessonProgressButtonProps = {
  courseId: string;
  lessonId: string;
  stepKey: string;
  nextHref: string;
  label: string;
};

export function ReviewerLessonProgressButton({
  courseId,
  lessonId,
  stepKey,
  nextHref,
  label,
}: ReviewerLessonProgressButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function completeStep() {
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("courseId", courseId);
        formData.set("lessonId", lessonId);
        formData.set("stepKey", stepKey);
        await markReviewerLessonStepAction(formData);
        window.location.href = nextHref;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Voortgang opslaan is niet gelukt. Probeer het opnieuw.");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={completeStep}
        disabled={isPending}
        className="rounded-full bg-[var(--brand)] px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Voortgang opslaan..." : label}
      </button>
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
