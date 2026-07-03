"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import type { AssessmentDetail } from "@/lib/lms/types";
import { cn } from "@/lib/utils";

type ReviewerModulePracticeProps = {
  moduleTitle: string;
  questions: AssessmentDetail["questions"];
  phase: "assignment" | "questions";
  assignmentTitle: string;
  assignmentPrompt: string;
  theoryHref: string;
  assignmentHref: string;
  questionsHref: string;
  nextHref?: string | null;
  courseHref: string;
  lmsHref: string;
};

type Responses = Record<string, string[]>;

function isQuestionCorrect(question: AssessmentDetail["questions"][number], selectedIds: string[]) {
  const correctIds = question.options.filter((option) => option.isCorrect).map((option) => option.id).sort();
  const answerIds = [...selectedIds].sort();

  return correctIds.length > 0 && correctIds.length === answerIds.length && correctIds.every((id, index) => id === answerIds[index]);
}

function StepPill({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ring-1",
        active ? "bg-slate-950 text-white ring-slate-950" : done ? "bg-emerald-50 text-emerald-800 ring-emerald-100" : "bg-white text-[var(--ink-soft)] ring-[var(--border)]",
      )}
    >
      {label}
    </span>
  );
}

export function ReviewerModulePractice({
  moduleTitle,
  questions,
  phase,
  assignmentTitle,
  assignmentPrompt,
  theoryHref,
  assignmentHref,
  questionsHref,
  nextHref,
  courseHref,
  lmsHref,
}: ReviewerModulePracticeProps) {
  const [assignmentText, setAssignmentText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<Responses>({});

  const unanswered = questions.filter((question) => (responses[question.id] ?? []).length === 0).length;
  const score = useMemo(() => {
    const raw = questions.reduce((total, question) => total + (isQuestionCorrect(question, responses[question.id] ?? []) ? 1 : 0), 0);
    return { raw, total: questions.length, percentage: questions.length ? Math.round((raw / questions.length) * 100) : 0 };
  }, [questions, responses]);

  function setSingleAnswer(questionId: string, optionId: string) {
    setSubmitted(false);
    setResponses((current) => ({ ...current, [questionId]: [optionId] }));
  }

  function setMultipleAnswer(questionId: string, optionId: string, checked: boolean) {
    setSubmitted(false);
    setResponses((current) => {
      const selected = current[questionId] ?? [];
      return {
        ...current,
        [questionId]: checked ? Array.from(new Set([...selected, optionId])) : selected.filter((id) => id !== optionId),
      };
    });
  }

  const phaseTitle = phase === "assignment" ? "Opdracht uitvoeren" : "Moduletoets maken";
  const phaseDescription = phase === "assignment"
    ? "Werk eerst de opdracht uit. Daarna ga je door naar de moduletoetsvragen. Dit is bewust een aparte stap, zoals bij een cursist."
    : "Beantwoord de vragen echt. Na controle kun je pas inhoudelijk door naar de volgende module of terug naar het overzicht.";

  return (
    <section className="space-y-6 rounded-[38px] border border-[var(--border)] bg-[linear-gradient(180deg,#fffdfa,#f7f4ec)] p-5 shadow-[0_28px_80px_-48px_rgba(35,27,18,0.55)] sm:p-7 lg:p-9">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand-deep)]">Cursist-stap</p>
          <h2 className="display-font mt-2 text-3xl font-semibold leading-tight text-slate-950 lg:text-4xl">{phaseTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{phaseDescription}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StepPill label="Theorie" done />
          <StepPill label="Opdracht" active={phase === "assignment"} done={phase === "questions"} />
          <StepPill label="Toetsvragen" active={phase === "questions"} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[24px] border border-[var(--border)] bg-white/82 p-3">
        <Link href={theoryHref} className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]">
          Terug naar theorie
        </Link>
        <Link href={courseHref} className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]">
          Module-overzicht
        </Link>
        <Link href={lmsHref} className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]">
          E-learning overzicht
        </Link>
      </div>

      {phase === "assignment" ? (
        <div className="rounded-[30px] border border-[var(--border)] bg-white/92 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label="Stap 2" tone="brand" />
            <StatusBadge label="praktijkopdracht" tone="neutral" />
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-slate-950">{assignmentTitle || `Opdracht bij ${moduleTitle}`}</h3>
          <div className="mt-3 whitespace-pre-line rounded-[24px] border border-[var(--border)] bg-[var(--brand-wash)]/45 px-4 py-4 text-sm leading-7 text-[var(--ink-soft)]">
            {assignmentPrompt}
          </div>
          <textarea
            value={assignmentText}
            onChange={(event) => setAssignmentText(event.target.value)}
            rows={8}
            className="mt-5 w-full rounded-[24px] border border-[var(--border)] bg-white px-4 py-3 text-base leading-8 text-slate-950 outline-none transition focus:border-[var(--brand)]"
            placeholder="Schrijf hier je opdrachtantwoord zoals een cursist dat zou doen..."
          />
          <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--brand-wash)]/55 p-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm leading-6 text-[var(--ink-soft)]">
              {assignmentText.trim() ? "Opdracht ingevuld. Je kunt door naar de toetsvragen." : "Vul eerst kort de opdracht in voordat je doorgaat."}
            </p>
            {assignmentText.trim() ? (
              <Link href={questionsHref} className="rounded-full bg-[var(--brand)] px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]">
                Door met toetsvragen
              </Link>
            ) : (
              <span className="rounded-full bg-slate-200 px-6 py-3 text-center text-sm font-semibold text-slate-500">Door met toetsvragen</span>
            )}
          </div>
        </div>
      ) : null}

      {phase === "questions" ? (
        <div className="rounded-[30px] border border-[var(--border)] bg-white/92 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label="Stap 3" tone="brand" />
            <StatusBadge label={`${questions.length} modulevragen`} tone="neutral" />
            <StatusBadge label={submitted ? `${score.percentage}%` : `${unanswered} open`} tone={submitted ? (score.percentage >= 70 ? "success" : "warning") : "neutral"} />
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-slate-950">Toetsvragen bij {moduleTitle}</h3>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            Beantwoord alle vragen. Dit is alleen lokale reviewerfeedback; er wordt niets opgeslagen in de Academy.
          </p>

          <form
            className="mt-5 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            {questions.map((question, index) => {
              const selected = responses[question.id] ?? [];
              const correct = submitted ? isQuestionCorrect(question, selected) : null;
              const inputType = question.type === "MULTIPLE_RESPONSE" ? "checkbox" : "radio";

              return (
                <fieldset key={question.id} className="rounded-[26px] border border-[var(--border)] bg-[var(--brand-wash)]/50 p-5">
                  <legend className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">Vraag {index + 1}</legend>
                  <h4 className="mt-2 text-lg font-semibold leading-8 text-slate-950">{question.prompt}</h4>
                  <div className="mt-4 grid gap-3">
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
                    <div className={cn("mt-4 rounded-2xl px-4 py-3 text-sm leading-6", correct ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900")}>
                      <p className="font-semibold">{correct ? "Goed beantwoord." : "Nog niet juist."}</p>
                      {question.explanation ? <p className="mt-1">{question.explanation}</p> : null}
                    </div>
                  ) : null}
                </fieldset>
              );
            })}

            <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-white p-4 md:flex-row md:items-center md:justify-between">
              <p className="text-sm leading-6 text-[var(--ink-soft)]">
                {unanswered === 0 ? "Alle vragen zijn beantwoord." : `Nog ${unanswered} ${unanswered === 1 ? "vraag" : "vragen"} open.`} {submitted ? `Reviewscore: ${score.raw}/${score.total}.` : "Controleer daarna je antwoorden."}
              </p>
              <button
                type="submit"
                disabled={unanswered > 0}
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Controleer antwoorden
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--brand-wash)]/55 p-4">
            <Link href={assignmentHref} className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]">
              Terug naar opdracht
            </Link>
            {submitted && nextHref ? (
              <Link href={nextHref} className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]">
                Door naar volgende module
              </Link>
            ) : submitted ? (
              <Link href={courseHref} className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]">
                Terug naar module-overzicht
              </Link>
            ) : (
              <span className="rounded-full bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500">
                Door naar volgende module
              </span>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
