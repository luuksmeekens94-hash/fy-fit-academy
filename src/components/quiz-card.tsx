"use client";

import { useState } from "react";

import type { QuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

type QuizCardProps = {
  questions: QuizQuestion[];
};

export function QuizCard({ questions }: QuizCardProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  return (
    <div className="space-y-6">
      {questions.map((question, index) => {
        const selected = answers[question.id];
        const hasAnswered = selected !== undefined;
        const correct = selected === question.correctIndex;

        return (
          <div
            key={question.id}
            className="rounded-[24px] border border-[var(--border)] bg-[var(--brand-soft)]/40 p-5"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
              Vraag {index + 1}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">{question.question}</h3>
            <div className="mt-4 grid gap-3">
              {question.options.map((option, optionIndex) => {
                const isSelected = selected === optionIndex;
                const isCorrect = question.correctIndex === optionIndex;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: optionIndex,
                      }))
                    }
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                      isSelected
                        ? "border-[var(--brand)] bg-white text-slate-950 shadow-sm"
                        : "border-[var(--border)] bg-white/80 text-[var(--ink-soft)] hover:border-[var(--brand)]/45",
                      hasAnswered && isCorrect
                        ? "ring-2 ring-[var(--success)]/20"
                        : "",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {hasAnswered ? (
              <p
                className={cn(
                  "mt-4 rounded-2xl px-4 py-3 text-sm leading-6",
                  correct
                    ? "bg-[var(--success-soft)] text-[var(--success)]"
                    : "bg-[var(--danger-soft)] text-[var(--danger)]",
                )}
              >
                {correct ? "Goed gezien. " : "Bijna. "}
                {question.explanation}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
