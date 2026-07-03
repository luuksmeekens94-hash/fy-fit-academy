"use client";

import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import type { AssessmentDetail } from "@/lib/lms/types";
import { cn } from "@/lib/utils";

type ReviewerAssessmentPreviewProps = {
  assessment: AssessmentDetail;
};

type Responses = Record<string, string[]>;

function isQuestionCorrect(question: AssessmentDetail["questions"][number], selectedIds: string[]) {
  const correctIds = question.options.filter((option) => option.isCorrect).map((option) => option.id).sort();
  const answerIds = [...selectedIds].sort();

  return correctIds.length > 0 && correctIds.length === answerIds.length && correctIds.every((id, index) => id === answerIds[index]);
}

export function ReviewerAssessmentPreview({ assessment }: ReviewerAssessmentPreviewProps) {
  const [started, setStarted] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<Responses>({});

  const score = useMemo(() => {
    const raw = assessment.questions.reduce((total, question) => {
      const selected = responses[question.id] ?? [];
      return total + (isQuestionCorrect(question, selected) ? question.points : 0);
    }, 0);
    const max = assessment.questions.reduce((total, question) => total + question.points, 0);
    const percentage = max > 0 ? Math.round((raw / max) * 100) : 0;

    return { raw, max, percentage, passed: percentage >= assessment.passPercentage };
  }, [assessment, responses]);

  const unanswered = assessment.questions.filter((question) => (responses[question.id] ?? []).length === 0).length;

  function setSingleAnswer(questionId: string, optionId: string) {
    setResponses((current) => ({ ...current, [questionId]: [optionId] }));
  }

  function setMultipleAnswer(questionId: string, optionId: string, checked: boolean) {
    setResponses((current) => {
      const selected = current[questionId] ?? [];
      return {
        ...current,
        [questionId]: checked
          ? Array.from(new Set([...selected, optionId]))
          : selected.filter((id) => id !== optionId),
      };
    });
  }

  if (!started) {
    return (
      <section className="card-surface overflow-hidden rounded-[34px]">
        <div className="academy-gradient-panel px-6 py-7 sm:px-8 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">Toetsing</p>
          <h2 className="display-font mt-3 text-3xl font-semibold text-slate-950 lg:text-4xl">{assessment.title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--ink-soft)]">
            {assessment.description ?? "Beantwoord de vragen zoals een cursist dat zou doen. De reviewer kan de volledige toets doorlopen zonder dat er iets wordt opgeslagen."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge label={`${assessment.questions.length} vragen`} tone="neutral" />
            <StatusBadge label={`${assessment.passPercentage}% norm`} tone="brand" />
            <StatusBadge label="review zonder opslag" tone="success" />
          </div>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-7 rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_-24px_rgba(141,79,18,0.9)] transition hover:bg-[var(--brand-deep)]"
          >
            Start toets
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="card-surface rounded-[34px] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">Toetsing</p>
            <h2 className="display-font mt-2 text-3xl font-semibold text-slate-950">{assessment.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
              Kies de antwoorden en lever de toets lokaal in. Er wordt geen toetspoging, score of voortgang opgeslagen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={`${assessment.questions.length} vragen`} tone="neutral" />
            <StatusBadge label={submitted ? `${score.percentage}%` : `${unanswered} open`} tone={submitted ? (score.passed ? "success" : "warning") : "neutral"} />
          </div>
        </div>
      </div>

      {submitted ? (
        <div className={cn(
          "rounded-[28px] px-6 py-5 text-sm leading-7 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)]",
          score.passed ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100" : "bg-amber-50 text-amber-900 ring-1 ring-amber-100",
        )}>
          <p className="font-semibold">Reviewscore: {score.percentage}% ({score.raw}/{score.max} punten)</p>
          <p className="mt-1">Dit is alleen lokale reviewerfeedback. Er is niets opgeslagen in de Academy.</p>
        </div>
      ) : null}

      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        {assessment.questions.map((question, index) => {
          const selected = responses[question.id] ?? [];
          const correct = submitted ? isQuestionCorrect(question, selected) : null;
          const inputType = question.type === "MULTIPLE_RESPONSE" ? "checkbox" : "radio";

          return (
            <fieldset key={question.id} className="card-surface rounded-[30px] p-5 sm:p-6">
              <legend className="px-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                Vraag {index + 1}
              </legend>
              <h3 className="mt-3 text-xl font-semibold leading-8 text-slate-950">{question.prompt}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                {question.type === "MULTIPLE_RESPONSE" ? "Kies alle juiste opties." : "Kies één antwoord."}
              </p>

              <div className="mt-5 grid gap-3">
                {question.options.map((option) => {
                  const checked = selected.includes(option.id);
                  const showCorrect = submitted && option.isCorrect;
                  const showWrong = submitted && checked && !option.isCorrect;

                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium leading-6 transition",
                        checked && !submitted ? "border-[var(--brand)] bg-white text-slate-950 shadow-sm" : "border-[var(--border)] bg-white/86 text-[var(--ink-soft)] hover:border-[var(--brand)]/40",
                        showCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "",
                        showWrong ? "border-red-200 bg-red-50 text-red-900" : "",
                      )}
                    >
                      <input
                        type={inputType}
                        name={question.id}
                        checked={checked}
                        onChange={(event) => {
                          setSubmitted(false);
                          if (question.type === "MULTIPLE_RESPONSE") {
                            setMultipleAnswer(question.id, option.id, event.target.checked);
                          } else {
                            setSingleAnswer(question.id, option.id);
                          }
                        }}
                        className="mt-1 size-4 border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]"
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>

              {submitted ? (
                <div className={cn(
                  "mt-4 rounded-2xl px-4 py-3 text-sm leading-6",
                  correct ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900",
                )}>
                  <p className="font-semibold">{correct ? "Goed beantwoord." : "Nog niet juist."}</p>
                  {question.explanation ? <p className="mt-1">{question.explanation}</p> : null}
                </div>
              ) : null}
            </fieldset>
          );
        })}

        <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[28px] border border-[var(--border)] bg-white/95 p-4 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <p className="text-sm leading-6 text-[var(--ink-soft)]">
            {unanswered === 0 ? "Alle vragen zijn ingevuld." : `Nog ${unanswered} vraag${unanswered === 1 ? "" : "en"} open.`}
          </p>
          <button
            type="submit"
            disabled={unanswered > 0}
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Lever toets in voor review
          </button>
        </div>
      </form>
    </section>
  );
}
