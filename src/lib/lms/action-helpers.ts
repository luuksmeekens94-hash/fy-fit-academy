import { checkMultipleResponse, checkSingleChoice, calculateScore } from "./scoring.ts";

export type AssessmentQuestionForEvaluation = {
  id: string;
  type: "MULTIPLE_CHOICE" | "MULTIPLE_RESPONSE" | "TRUE_FALSE" | "OPEN_TEXT";
  points: number;
  options: { id: string; isCorrect: boolean }[];
};

export type AssessmentResponseValue = string[] | { textAnswer: string };

export function buildAssessmentAnswerRecords(params: {
  questions: AssessmentQuestionForEvaluation[];
  responses: Record<string, AssessmentResponseValue | undefined>;
  passPercentage: number;
}): {
  answers: {
    questionId: string;
    selectedOptionIds: string[];
    textAnswer: string | null;
    isCorrect: boolean;
    awardedPoints: number;
  }[];
  scoreRaw: number;
  scorePercentage: number;
  passed: boolean;
} {
  const answers = params.questions.map((question) => {
    const response = params.responses[question.id];
    const textAnswer =
      response && !Array.isArray(response) ? response.textAnswer.trim() : null;
    const selectedOptionIds = Array.isArray(response) ? response : [];

    if (question.type === "OPEN_TEXT") {
      return {
        questionId: question.id,
        selectedOptionIds: [],
        textAnswer,
        isCorrect: false,
        awardedPoints: 0,
      };
    }

    const isCorrect =
      question.type === "MULTIPLE_RESPONSE"
        ? checkMultipleResponse(selectedOptionIds, question.options)
        : checkSingleChoice(
            selectedOptionIds[0] ?? "",
            question.options.find((option) => option.isCorrect)?.id ?? ""
          );

    return {
      questionId: question.id,
      selectedOptionIds,
      textAnswer,
      isCorrect,
      awardedPoints: isCorrect ? question.points : 0,
    };
  });

  const totalPoints = params.questions.reduce(
    (sum, question) => sum + question.points,
    0
  );
  const score = calculateScore(answers, totalPoints, params.passPercentage);

  return {
    answers,
    scoreRaw: score.scoreRaw,
    scorePercentage: score.scorePercentage,
    passed: score.passed,
  };
}

export function resolveEnrollmentStatusAfterLessonCompletion(params: {
  currentStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "EXPIRED";
  courseCompleted: boolean;
}): {
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED" | "EXPIRED" | "NOT_STARTED";
  shouldSetStartedAt: boolean;
  shouldSetCompletedAt: boolean;
} {
  if (params.courseCompleted) {
    return {
      status: "COMPLETED",
      shouldSetStartedAt: false,
      shouldSetCompletedAt: true,
    };
  }

  if (params.currentStatus === "NOT_STARTED") {
    return {
      status: "IN_PROGRESS",
      shouldSetStartedAt: true,
      shouldSetCompletedAt: false,
    };
  }

  return {
    status: params.currentStatus,
    shouldSetStartedAt: false,
    shouldSetCompletedAt: false,
  };
}
