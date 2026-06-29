/**
 * Login Edu — Question Schema Contract
 * 
 * This file defines the TypeScript types for the questions JSON payload
 * stored in exercises.questions_json. Any external tool (e.g. a question 
 * builder app) that produces JSON for this system MUST conform to these types.
 * 
 * See SCHEMA.md for the full human-readable documentation.
 */

export interface ScoringConfig {
  /** Points awarded for a correct answer (positive number) */
  correct: number
  /** Points for an incorrect answer (can be negative, e.g. -1 for UTBK) */
  incorrect: number
  /** Points for an unanswered question (usually 0) */
  unanswered: number
}

export interface BaseQuestion {
  /** Question number, 1-indexed, unique within the exercise */
  id: number
  /** Question type identifier */
  type: string
  /** The question text (supports plain text) */
  text: string
  /** Optional explanation shown after submission */
  explanation?: string
  /** Scoring configuration for this question */
  scoring: ScoringConfig
  /** Optional image URL to display with the question */
  image_url?: string
}

export interface OptionItem {
  /** Option key (e.g. 'A', 'B', 'C', 'D', 'E') */
  key: string
  /** Option text */
  text: string
  /** Optional image URL for this option */
  image_url?: string
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice'
  /** Available answer options */
  options: OptionItem[]
  /** Key of the correct option (e.g. 'A') */
  correct_answer: string
}

export interface MatchingPair {
  left: string
  right: string
}

export interface MatchingItem {
  key: string
  text: string
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching'
  /** Items on the left side to be matched */
  left_items: MatchingItem[]
  /** Items on the right side to match with */
  right_items: MatchingItem[]
  /** Correct pairings */
  correct_pairs: MatchingPair[]
}

export interface EssayQuestion extends BaseQuestion {
  type: 'essay'
  /** Always false — essays require manual grading by admin */
  auto_gradable: false
  /** Maximum score an admin can assign */
  max_score: number
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer'
  /** Always false — short answers require manual grading */
  auto_gradable: false
  /** Maximum score an admin can assign */
  max_score: number
}

export interface ListeningQuestion extends BaseQuestion {
  type: 'listening'
  /** URL to the audio file (Google Drive direct link, auto-normalized by server) */
  audio_url: string
  /** Available answer options */
  options: OptionItem[]
  /** Key of the correct option */
  correct_answer: string
}

export type Question =
  | MultipleChoiceQuestion
  | MatchingQuestion
  | EssayQuestion
  | ShortAnswerQuestion
  | ListeningQuestion

export interface QuestionPayload {
  questions: Question[]
}

/** Supported question type identifiers */
export const SUPPORTED_QUESTION_TYPES = [
  'multiple_choice',
  'matching',
  'essay',
  'short_answer',
  'listening',
] as const

export type QuestionType = (typeof SUPPORTED_QUESTION_TYPES)[number]
