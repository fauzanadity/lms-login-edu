import type { QuestionPayload } from './questions'

export interface Program {
  id: string
  name: string
  token: string
  token_valid_from: string
  token_valid_until: string
  title: string | null
  subtitle: string | null
  description: string | null
  drive_access_notice: string | null
  drive_access_form_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  full_name: string
  university: string
  major: string
  birth_date: string
  email: string
  program_id: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  full_name: string
  email: string
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  title: string
  subtitle: string | null
  drive_url: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface MaterialProgram {
  material_id: string
  program_id: string
}

export interface Exercise {
  id: string
  title: string
  subtitle: string | null
  type: 'exercise' | 'tryout'
  question_count: number
  questions_json: QuestionPayload
  time_limit_minutes: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ExerciseProgram {
  exercise_id: string
  program_id: string
}

export interface Attempt {
  id: string
  student_id: string
  exercise_id: string
  exercise_type: 'exercise' | 'tryout'
  answers_json: Record<string, unknown>
  score: number | null
  is_graded: boolean
  started_at: string
  last_autosaved_at: string | null
  submitted_at: string | null
  created_at: string
}

export interface Broadcast {
  id: string
  title: string
  message: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface BroadcastProgram {
  broadcast_id: string
  program_id: string
}

// Re-export question types
export type { QuestionPayload, Question, ScoringConfig } from './questions'
