"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  startAssessmentAttemptAction,
  submitAssessmentAttemptAction,
} from "@/app/lms-actions";
import { StatusBadge } from "@/components/status-badge";
import {
  getActiveAssessmentAttempt,
  getLatestCompletedAssessmentAttempt,
  getRemainingAssessmentAttempts,
} from "@/lib/lms/assessment-runner-helpers";
import type {
  AssessmentDetail,
  AttemptResult,
  QuestionDetail,
} from "@/lib/lms/types";
import { cn } from "@/lib/utils";

type AssessmentRunnerProps = {
  courseId: string;
  assessment: AssessmentDetail;
  initialAttempts: AttemptResult[];
};

type AssessmentResponses = Record<string, string[] | { textAnswer: string }>;

type SubmissionFeedback = {
  attemptNumber: number;
  scoreRaw: number;
  scorePercentage: number;
  passed: boolean;
  courseCompleted: boolean;
  certificateId: string | null;
} | null;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Er ging iets mis tijdens de toetsactie.";
}

function formatDateTime(value: Date | string | null) {
  if (!value) {
    return "Nog niet beschikbaar";
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAnswerCount(question: QuestionDetail, response: string[] | { textAnswer: string } | undefined) {
  if (question.type === "OPEN_TEXT") {
    return response && !Array.isArray(response) && response.textAnswer.trim() ? 1 : 0;
  }

  return Array.isArray(response) ? response.length : 0;
}

export function AssessmentRunner({
  courseId,
  assessment,
  initialAttempts,
}: AssessmentRunnerProps) {
  const router = useRouter();
  const [attempts, setAttempts] = useState(initialAttempts);
  const [responses, setResponses] = useState<AssessmentResponses>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<SubmissionFeedback>(null);
  const [isStarting, startTransition] = useTransition();
  const [isSubmitting, submitTransition] = useTransition();

  const activeAttempt = useMemo(() => getActiveAssessmentAttempt(attempts), [attempts]);
  const latestCompletedAttempt = useMemo(
    () => getLatestCompletedAssessmentAttempt(attempts),
    [attempts],
  );
  const hasPassed = attempts.some((attempt) => attempt.passed === true);
  const hasUnsupportedOpenText = assessment.questions.some((question) => question.type === "OPEN_TEXT");
  const remainingAttempts = getRemainingAssessmentAttempts(assessment.maxAttempts, attempts);
  const unansweredQuestions = assessment.questions.filter(
    (question) => getAnswerCount(question, responses[question.id]) === 0,
  ).length;

  async function handleStartAttempt() {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("courseId", courseId);
        formData.set("assessmentId", assessment.id);

        const result = await startAssessmentAttemptAction(formData);

        setAttempts((current) => [
          ...current,
          {
            id: result.attemptId,
            attemptNumber: result.attemptNumber,
            startedAt: new Date(),
            submittedAt: null,
            scoreRaw: null,
            scorePercentage: null,
            passed: null,
          },
        ]);
        setResponses({});
        setFeedback(null);
        router.refresh();
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      }
    });
  }

  async function handleSubmitAttempt() {
    if (!activeAttempt) {
      setErrorMessage("Er is geen actieve toetspoging om in te leveren.");
      return;
    }

    if (unansweredQuestions > 0) {
      setErrorMessage(
        `Beantwoord nog ${unansweredQuestions} vraag${unansweredQuestions === 1 ? "" : "en"} voordat je de toets inlevert.`,
      );
      return;
    }

    setErrorMessage(null);

    submitTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("courseId", courseId);
        formData.set("attemptId", activeAttempt.id);
        formData.set("answers", JSON.stringify(responses));

        const result = await submitAssessmentAttemptAction(formData);

        setAttempts((current) =>
          current.map((attempt) =>
            attempt.id === activeAttempt.id
              ? {
                  ...attempt,
                  submittedAt: new Date(),
                  scoreRaw: result.scoreRaw,
                  scorePercentage: result.scorePercentage,
                  passed: result.passed,
                }
              : attempt,
          ),
        );
        setFeedback({
          attemptNumber: activeAttempt.attemptNumber,
          scoreRaw: result.scoreRaw,
          scorePercentage: result.scorePercentage,
          passed: result.passed,
          courseCompleted: result.courseCompleted,
          certificateId: result.certificateId,
        });
        setResponses({});
        router.refresh();
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      }
    });
  }

  function updateSingleChoice(questionId: string, optionId: string) {
    setResponses((current) => ({
      ...current,
      [questionId]: [optionId],
    }));
  }

  function updateMultipleResponse(questionId: string, optionId: string, checked: boolean) {
    setResponses((current) => {
      const selected = Array.isArray(current[questionId]) ? current[questionId] : [];
      const nextSelected = checked
        ? Array.from(new Set([...selected, optionId]))
        : selected.filter((value) => value !== optionId);

      return {
        ...current,
        [questionId]: nextSelected,
      };
    });
  }

  function updateOpenText(questionId: string, value: string) {
    setResponses((current) => ({
      ...current,
      [questionId]: { textAnswer: value },
    }));
  }

  return (
    <section className="space-y-5 rounded-[32px] border border-[var(--border)] bg-white p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.28)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <StatusBadge label={`Cesuur ${assessment.passPercentage}%`} tone="brand" />
            <StatusBadge label={`${assessment.questions.length} vragen`} tone="neutral" />
            <StatusBadge label={`${remainingAttempts} poging${remainingAttempts === 1 ? "" : "en"} over`} tone="neutral" />
          </div>
          <div className="space-y-2 text-sm leading-7 text-[var(--ink-soft)]">
            <p>{assessment.description ?? "Deze toets controleert of je de belangrijkste principes uit de cursus beheerst."}</p>
            <p>
              Maximaal {assessment.maxAttempts} pogingen.
              {assessment.timeLimitMinutes
                ? ` Richttijd: ${assessment.timeLimitMinutes} minuten.`
                : " Geen tijdslimiet ingesteld."}
            </p>
          </div>
        </div>

        {!activeAttempt && !hasPassed && !hasUnsupportedOpenText && remainingAttempts > 0 ? (
          <button
            type="button"
            onClick={() => void handleStartAttempt()}
            disabled={isStarting}
            className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarting ? "Toets wordt gestart..." : "Start toets"}
          </button>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-[24px] border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-sm leading-6 text-[var(--danger)]">
          {errorMessage}
        </div>
      ) : null}

      {feedback ? (
        <div
          className={cn(
            "rounded-[24px] px-5 py-4 text-sm leading-6",
            feedback.passed
              ? "bg-[var(--success-soft)] text-[var(--success)]"
              : "bg-[var(--danger-soft)] text-[var(--danger)]",
          )}
        >
          {assessment.showFeedbackImmediately ? (
            <>
              <p className="font-semibold">
                Poging {feedback.attemptNumber}: {feedback.scorePercentage}% ({feedback.scoreRaw} punten)
              </p>
              <p className="mt-1">
                {feedback.passed
                  ? "Voldoende — deze toets staat als gehaald geregistreerd."
                  : "Nog niet voldoende. Je kunt een nieuwe poging starten zolang je nog pogingen over hebt."}
              </p>
            </>
          ) : (
            <p className="font-semibold">
              Poging {feedback.attemptNumber} is ontvangen en verwerkt.
            </p>
          )}
          {feedback.courseCompleted ? (
            <p className="mt-1">
              De cursus is nu volledig afgerond{feedback.certificateId ? " en het certificaat is gekoppeld." : "."}
            </p>
          ) : null}
        </div>
      ) : null}

      {hasUnsupportedOpenText ? (
        <div className="rounded-[24px] border border-[var(--border)] bg-slate-50 px-5 py-4 text-sm leading-6 text-[var(--ink-soft)]">
          Deze toets bevat open vragen en vraagt daardoor nog een handmatige beoordelingsflow. In deze MVP is die variant nog niet aangesloten op de learner UI.
        </div>
      ) : null}

      {latestCompletedAttempt ? (
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--brand-soft)]/40 px-5 py-4 text-sm leading-6 text-[var(--ink-soft)]">
          Laatste ingeleverde poging: poging {latestCompletedAttempt.attemptNumber} op {formatDateTime(latestCompletedAttempt.submittedAt)}
          {assessment.showFeedbackImmediately && latestCompletedAttempt.scorePercentage !== null
            ? ` — ${latestCompletedAttempt.scorePercentage}% (${latestCompletedAttempt.passed ? "voldoende" : "onvoldoende"}).`
            : "."}
        </div>
      ) : null}

      {activeAttempt ? (
        <div className="space-y-5">
          <div className="rounded-[24px] border border-[var(--border)] bg-slate-50 px-5 py-4 text-sm leading-6 text-[var(--ink-soft)]">
            Actieve poging {activeAttempt.attemptNumber}. Beantwoord alle vragen en lever daarna de toets in.
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmitAttempt();
            }}
          >
            {assessment.questions.map((question, index) => {
              const response = responses[question.id];
              const selectedOptionIds = Array.isArray(response) ? response : [];
              const textAnswer = response && !Array.isArray(response) ? response.textAnswer : "";

              return (
                <fieldset
                  key={question.id}
                  className="rounded-[28px] border border-[var(--border)] bg-[var(--brand-soft)]/35 p-5"
                >
                  <legend className="px-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                    Vraag {index + 1}
                  </legend>
                  <div className="mt-3 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{question.prompt}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                        {question.type === "MULTIPLE_RESPONSE"
                          ? "Kies alle juiste opties."
                          : question.type === "OPEN_TEXT"
                            ? "Geef een kort open antwoord."
                            : "Kies één optie."}
                      </p>
                    </div>

                    {question.type === "OPEN_TEXT" ? (
                      <textarea
                        value={textAnswer}
                        onChange={(event) => updateOpenText(question.id, event.target.value)}
                        rows={5}
                        className="w-full rounded-[24px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-[var(--brand)]"
                        placeholder="Typ hier je antwoord"
                      />
                    ) : (
                      <div className="grid gap-3">
                        {question.options.map((option) => {
                          const inputType = question.type === "MULTIPLE_RESPONSE" ? "checkbox" : "radio";
                          const checked = selectedOptionIds.includes(option.id);

                          return (
                            <label
                              key={option.id}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition",
                                checked
                                  ? "border-[var(--brand)] bg-white text-slate-950 shadow-sm"
                                  : "border-[var(--border)] bg-white/85 text-[var(--ink-soft)] hover:border-[var(--brand)]/40",
                              )}
                            >
                              <input
                                type={inputType}
                                name={question.id}
                                checked={checked}
                                onChange={(event) => {
                                  if (question.type === "MULTIPLE_RESPONSE") {
                                    updateMultipleResponse(question.id, option.id, event.target.checked);
                                  } else {
                                    updateSingleChoice(question.id, option.id);
                                  }
                                }}
                                className="mt-1 size-4 border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]"
                              />
                              <span>{option.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </fieldset>
              );
            })}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--border)] bg-slate-50 px-5 py-4">
              <p className="text-sm leading-6 text-[var(--ink-soft)]">
                {unansweredQuestions === 0
                  ? "Alle vragen zijn ingevuld. Je kunt de toets nu inleveren."
                  : `Nog ${unansweredQuestions} vraag${unansweredQuestions === 1 ? "" : "en"} open.`}
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Toets wordt ingeleverd..." : "Lever toets in"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {!activeAttempt && !hasPassed && remainingAttempts === 0 ? (
        <div className="rounded-[24px] border border-[var(--border)] bg-slate-50 px-5 py-4 text-sm leading-6 text-[var(--ink-soft)]">
          Het maximum aantal pogingen is bereikt. Neem contact op met een beheerder of teamleider als een extra poging nodig is.
        </div>
      ) : null}

      {attempts.length ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-950">Pogingsoverzicht</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {attempts
              .slice()
              .sort((left, right) => right.attemptNumber - left.attemptNumber)
              .map((attempt) => (
                <div
                  key={attempt.id}
                  className="rounded-[24px] border border-[var(--border)] bg-white px-4 py-4 text-sm leading-6 text-[var(--ink-soft)]"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge label={`Poging ${attempt.attemptNumber}`} tone="neutral" />
                    <StatusBadge
                      label={
                        attempt.submittedAt === null
                          ? "Actief"
                          : attempt.passed
                            ? "Voldoende"
                            : "Onvoldoende"
                      }
                      tone={
                        attempt.submittedAt === null
                          ? "warning"
                          : attempt.passed
                            ? "success"
                            : "neutral"
                      }
                    />
                  </div>
                  <p className="mt-3">Gestart op {formatDateTime(attempt.startedAt)}.</p>
                  <p>
                    {attempt.submittedAt
                      ? assessment.showFeedbackImmediately && attempt.scorePercentage !== null
                        ? `Ingeleverd op ${formatDateTime(attempt.submittedAt)} — score ${attempt.scorePercentage}%.`
                        : `Ingeleverd op ${formatDateTime(attempt.submittedAt)}.`
                      : "Nog niet ingeleverd."}
                  </p>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
