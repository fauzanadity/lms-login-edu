import type { Question, QuestionPayload } from '@/types/questions'

/**
 * Score calculation result
 */
export interface ScoreResult {
  /** Total score (sum of all auto-gradable questions) */
  totalScore: number
  /** Maximum possible score for auto-gradable questions */
  maxPossibleScore: number
  /** Number of correct answers */
  correctCount: number
  /** Number of incorrect answers */
  incorrectCount: number
  /** Number of unanswered questions */
  unansweredCount: number
  /** Whether the exercise contains manual-grade questions */
  hasManualGradeQuestions: boolean
  /** Per-question scoring breakdown */
  breakdown: QuestionScoreBreakdown[]
}

export interface QuestionScoreBreakdown {
  questionId: number
  questionType: string
  isAutoGradable: boolean
  score: number
  maxScore: number
  status: 'correct' | 'incorrect' | 'unanswered' | 'pending_manual'
}

/**
 * Calculates the score for an attempt.
 * 
 * Algorithm: O(n) where n = number of questions.
 * - Fetches all questions once (from the provided payload)
 * - Iterates through each question and compares with student answers
 * - Accumulates score based on each question's scoring config
 * - Skips essay/short_answer questions (marked for manual grading)
 * 
 * @param questionsPayload - The questions JSON from the exercise
 * @param answers - Student's answers keyed by question ID
 * @returns Score result with breakdown
 */
export function calculateScore(
  questionsPayload: QuestionPayload,
  answers: Record<string, unknown>
): ScoreResult {
  const { questions } = questionsPayload
  let totalScore = 0
  let maxPossibleScore = 0
  let correctCount = 0
  let incorrectCount = 0
  let unansweredCount = 0
  let hasManualGradeQuestions = false
  const breakdown: QuestionScoreBreakdown[] = []

  for (const question of questions) {
    const isAutoGradable = !isManualGradeQuestion(question)
    const studentAnswer = answers[question.id.toString()]

    if (!isAutoGradable) {
      // Essay / Short Answer — needs manual grading
      hasManualGradeQuestions = true
      const maxScore = 'max_score' in question ? (question as { max_score: number }).max_score : 0
      breakdown.push({
        questionId: question.id,
        questionType: question.type,
        isAutoGradable: false,
        score: 0,
        maxScore,
        status: 'pending_manual',
      })
      continue
    }

    // Auto-gradable question
    const maxQuestionScore = question.scoring.correct
    maxPossibleScore += maxQuestionScore

    if (!studentAnswer || studentAnswer === '' || studentAnswer === null || studentAnswer === undefined) {
      // Unanswered
      totalScore += question.scoring.unanswered
      unansweredCount++
      breakdown.push({
        questionId: question.id,
        questionType: question.type,
        isAutoGradable: true,
        score: question.scoring.unanswered,
        maxScore: maxQuestionScore,
        status: 'unanswered',
      })
    } else if (isCorrectAnswer(question, studentAnswer)) {
      // Correct
      totalScore += question.scoring.correct
      correctCount++
      breakdown.push({
        questionId: question.id,
        questionType: question.type,
        isAutoGradable: true,
        score: question.scoring.correct,
        maxScore: maxQuestionScore,
        status: 'correct',
      })
    } else {
      // Incorrect
      totalScore += question.scoring.incorrect
      incorrectCount++
      breakdown.push({
        questionId: question.id,
        questionType: question.type,
        isAutoGradable: true,
        score: question.scoring.incorrect,
        maxScore: maxQuestionScore,
        status: 'incorrect',
      })
    }
  }

  return {
    totalScore,
    maxPossibleScore,
    correctCount,
    incorrectCount,
    unansweredCount,
    hasManualGradeQuestions,
    breakdown,
  }
}

/**
 * Checks if a question requires manual grading
 */
function isManualGradeQuestion(question: Question): boolean {
  return question.type === 'essay' || question.type === 'short_answer'
}

/**
 * Checks if a student's answer is correct for a given question
 */
function isCorrectAnswer(question: Question, answer: unknown): boolean {
  switch (question.type) {
    case 'multiple_choice':
    case 'listening':
      return answer === question.correct_answer

    case 'matching': {
      // Answer should be an object mapping left keys to right keys
      if (typeof answer !== 'object' || answer === null) return false
      const pairs = answer as Record<string, string>
      const correctPairs = question.correct_pairs
      
      // All pairs must match
      if (Object.keys(pairs).length !== correctPairs.length) return false
      return correctPairs.every(
        (pair) => pairs[pair.left] === pair.right
      )
    }

    default:
      return false
  }
}
