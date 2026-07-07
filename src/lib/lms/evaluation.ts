import type { EvaluationQuestionType } from "@prisma/client";

export type EvaluationQuestionInput = {
  id: string;
  label: string;
  type: EvaluationQuestionType;
  isRequired: boolean;
};

export type EvaluationAnswerRecordInput = {
  evaluationQuestionId: string;
  rating?: number;
  text?: string;
  booleanValue?: boolean;
};

function requireValue(value: string, message: string) {
  if (!value.trim()) {
    throw new Error(message);
  }
}

export function buildEvaluationAnswerRecords(
  questions: EvaluationQuestionInput[],
  getValue: (fieldName: string) => FormDataEntryValue | string | null | undefined,
): EvaluationAnswerRecordInput[] {
  return questions.map((question) => {
    const fieldName = `question-${question.id}`;
    const rawValue = String(getValue(fieldName) ?? "").trim();

    if (question.isRequired) {
      requireValue(rawValue, `Vul de vraag "${question.label}" in.`);
    }

    if (question.type === "SCALE_1_5" || question.type === "SCALE_1_10") {
      const rating = Number(rawValue);
      const maxRating = question.type === "SCALE_1_10" ? 10 : 5;
      if (!Number.isInteger(rating) || rating < 1 || rating > maxRating) {
        throw new Error(`Geef bij "${question.label}" een score van 1 tot en met ${maxRating}.`);
      }

      return {
        evaluationQuestionId: question.id,
        rating,
      };
    }

    if (question.type === "YES_NO") {
      if (rawValue !== "yes" && rawValue !== "no") {
        throw new Error(`Kies ja of nee bij "${question.label}".`);
      }

      return {
        evaluationQuestionId: question.id,
        booleanValue: rawValue === "yes",
      };
    }

    return {
      evaluationQuestionId: question.id,
      text: rawValue || undefined,
    };
  });
}

export function summarizeEvaluationRatings(
  submissions: Array<{
    answers: Array<{ rating: number | null }>;
  }>,
) {
  const ratings = submissions.flatMap((submission) => submission.answers.map((answer) => answer.rating).filter((rating): rating is number => typeof rating === "number"));
  const averageRating = ratings.length ? Math.round((ratings.reduce((total, rating) => total + rating, 0) / ratings.length) * 10) / 10 : null;

  return {
    submissionCount: submissions.length,
    ratingCount: ratings.length,
    averageRating,
  };
}
