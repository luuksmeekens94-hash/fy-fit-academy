import Link from "next/link";
import { notFound } from "next/navigation";

import { submitCourseEvaluationAction } from "@/app/lms-actions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReviewerPreviewMode } from "@/lib/lms/reviewer-preview";
import { getCourseDetail, getEnrollmentDetailForUser } from "@/lib/lms/queries";

const agreementLabels = [
  "Helemaal oneens",
  "Oneens",
  "Neutraal",
  "Eens",
  "Helemaal eens",
];

const evaluationSections = [
  { title: "1. Algemene indruk", from: 1, to: 3, helper: "Geef een cijfer van 1 tot 10." },
  { title: "2. Inhoudelijke beoordeling", from: 4, to: 10, helper: "Geef aan in hoeverre je het eens bent met de stellingen." },
  { title: "3. Praktische toepasbaarheid", from: 11, to: 15, helper: "Geef aan in hoeverre je het eens bent met de stellingen." },
  { title: "4. Didactiek en werkvormen", from: 16, to: 22, helper: "Beoordeel de werkvormen, video’s, opdrachten en toetsvragen." },
  { title: "5. Inzicht en bewustwording", from: 23, to: 24, helper: "Beschrijf wat deze e-learning heeft veranderd in je klinisch redeneren." },
  { title: "6. Suggesties en verbeterpunten", from: 25, to: 26, helper: "Geef mee wat beter of uitgebreider kan." },
  { title: "7. Aanbeveling", from: 27, to: 28, helper: "Geef aan of je deze e-learning aan collega’s zou aanraden." },
];

type EvaluationPageProps = {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ ingediend?: string }>;
};

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function CourseEvaluationPage({ params, searchParams }: EvaluationPageProps) {
  const user = await requireUser();
  const { courseId } = await params;
  const { ingediend } = await searchParams;

  const [course, enrollment] = await Promise.all([
    getCourseDetail(courseId),
    getEnrollmentDetailForUser(user.id, courseId),
  ]);

  if (!course?.activeVersion) {
    notFound();
  }

  if (user.role === "REVIEWER" && course.reviewerId !== user.id) {
    notFound();
  }

  const previewState = getReviewerPreviewMode(user.role, Boolean(enrollment));
  const canView = Boolean(enrollment) || previewState.canViewWithoutEnrollment || user.role === "BEHEERDER";

  if (!canView) {
    notFound();
  }

  const evaluationForm = course.activeVersion.evaluationForms.find((form) => form.isRequired) ?? course.activeVersion.evaluationForms[0] ?? null;

  if (!evaluationForm) {
    notFound();
  }

  const submission = await prisma.evaluationSubmission.findUnique({
    where: {
      evaluationFormId_userId: {
        evaluationFormId: evaluationForm.id,
        userId: user.id,
      },
    },
    include: {
      answers: true,
    },
  });

  const answersByQuestionId = new Map(submission?.answers.map((answer) => [answer.evaluationQuestionId, answer]) ?? []);
  const submittedAtLabel = formatDate(submission?.submittedAt);
  const groupedQuestions = evaluationSections
    .map((section) => ({
      ...section,
      questions: evaluationForm.questions.filter((question) => question.order >= section.from && question.order <= section.to),
    }))
    .filter((section) => section.questions.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evaluatie"
        title="Evaluatieformulier"
        description="Vul na de modules het evaluatieformulier in. De vragen volgen het opgestelde evaluatieformulier voor deze PFP e-learning."
      />

      <section className="card-surface rounded-[32px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label={submission ? "ingediend" : "nog in te vullen"} tone={submission ? "success" : "warning"} />
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">{evaluationForm.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">
              {submittedAtLabel
                ? `Laatst ingediend op ${submittedAtLabel}. Je kunt je antwoorden hieronder aanpassen en opnieuw verzenden.`
                : "Beantwoord de vragen zorgvuldig. De antwoorden worden gekoppeld aan deze e-learning."}
            </p>
          </div>
          <Link href={`/lms/courses/${course.id}`} className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]">
            E-learning overzicht
          </Link>
        </div>
      </section>

      {ingediend ? (
        <section className="rounded-[28px] border border-emerald-100 bg-emerald-50 px-6 py-5 text-sm leading-7 text-emerald-800">
          <p className="font-semibold">Evaluatie opgeslagen.</p>
          <p>Dank je. Fy-Fit kan deze evaluatie nu terugzien in het LMS-beheer.</p>
        </section>
      ) : null}

      <form action={submitCourseEvaluationAction} className="space-y-6">
        <input type="hidden" name="courseId" value={course.id} />
        <input type="hidden" name="evaluationFormId" value={evaluationForm.id} />

        {groupedQuestions.map((section) => (
          <section key={section.title} className="card-surface space-y-5 rounded-[34px] p-5 sm:p-7 lg:p-9">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">{section.title}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{section.helper}</p>
            </div>

            <div className="space-y-5">
              {section.questions.map((question) => {
                const existingAnswer = answersByQuestionId.get(question.id);

                return (
                  <fieldset key={question.id} className="rounded-[28px] border border-[var(--border)] bg-white/92 p-5">
                    <legend className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-deep)]">
                      Vraag {question.order}{question.isRequired ? " · verplicht" : " · optioneel"}
                    </legend>
                    <h3 className="mt-3 text-lg font-semibold leading-7 text-slate-950">{question.label}</h3>

                    {question.type === "SCALE_1_10" ? (
                      <div className="mt-4 grid gap-2 sm:grid-cols-5 lg:grid-cols-10">
                        {Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => (
                          <label key={rating} className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--brand-wash)]/35 p-3 text-sm transition hover:border-[var(--brand)]">
                            <span className="text-lg font-semibold text-slate-950">{rating}</span>
                            <span className="text-[0.68rem] leading-4 text-[var(--ink-soft)]">{rating === 1 ? "slecht" : rating === 10 ? "uitstekend" : ""}</span>
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={rating}
                              required={question.isRequired}
                              defaultChecked={existingAnswer?.rating === rating}
                              className="mt-auto size-4 border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]"
                            />
                          </label>
                        ))}
                      </div>
                    ) : question.type === "SCALE_1_5" ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-5">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <label key={rating} className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--brand-wash)]/35 p-3 text-sm transition hover:border-[var(--brand)]">
                            <span className="text-lg font-semibold text-slate-950">{rating}</span>
                            <span className="text-xs leading-5 text-[var(--ink-soft)]">{agreementLabels[rating - 1]}</span>
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={rating}
                              required={question.isRequired}
                              defaultChecked={existingAnswer?.rating === rating}
                              className="mt-auto size-4 border-[var(--border)] text-[var(--brand)] focus:ring-[var(--brand)]"
                            />
                          </label>
                        ))}
                      </div>
                    ) : question.type === "YES_NO" ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <label className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold">
                          <input type="radio" name={`question-${question.id}`} value="yes" required={question.isRequired} defaultChecked={existingAnswer?.booleanValue === true} className="mr-2" />
                          Ja
                        </label>
                        <label className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold">
                          <input type="radio" name={`question-${question.id}`} value="no" required={question.isRequired} defaultChecked={existingAnswer?.booleanValue === false} className="mr-2" />
                          Nee
                        </label>
                      </div>
                    ) : (
                      <textarea
                        name={`question-${question.id}`}
                        required={question.isRequired}
                        defaultValue={existingAnswer?.text ?? ""}
                        rows={4}
                        className="mt-4 w-full rounded-[22px] border border-[var(--border)] bg-white px-4 py-4 text-sm leading-7 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                        placeholder="Schrijf je antwoord hier..."
                      />
                    )}
                  </fieldset>
                );
              })}
            </div>
          </section>
        ))}

        <div className="card-surface flex flex-col gap-3 rounded-[26px] p-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm leading-6 text-[var(--ink-soft)]">
            Verzenden legt je evaluatie vast voor Fy-Fit. Je kunt later terugkomen en opnieuw verzenden.
          </p>
          <button type="submit" className="rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-deep)]">
            {submission ? "Evaluatie bijwerken" : "Evaluatie verzenden"}
          </button>
        </div>
      </form>
    </div>
  );
}
