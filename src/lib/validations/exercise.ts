import { z } from 'zod'
import { SUPPORTED_QUESTION_TYPES } from '@/types/questions'

// Scoring config schema
const scoringConfigSchema = z.object({
  correct: z.number({ message: 'Skor benar wajib diisi' }),
  incorrect: z.number({ message: 'Skor salah wajib diisi' }),
  unanswered: z.number({ message: 'Skor tidak dijawab wajib diisi' }),
})

// Option item schema
const optionItemSchema = z.object({
  key: z.string().min(1, 'Key opsi wajib diisi'),
  text: z.string().min(1, 'Teks opsi wajib diisi'),
  image_url: z.string().url().optional(),
})

// Matching item schema
const matchingItemSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
})

const matchingPairSchema = z.object({
  left: z.string().min(1),
  right: z.string().min(1),
})

// Base question fields
const baseQuestionFields = {
  id: z.number().int().positive('ID soal harus bilangan positif'),
  text: z.string().min(1, 'Teks soal wajib diisi'),
  explanation: z.string().optional(),
  scoring: scoringConfigSchema,
  image_url: z.string().url().optional(),
}

// Multiple choice question
const multipleChoiceSchema = z.object({
  ...baseQuestionFields,
  type: z.literal('multiple_choice'),
  options: z.array(optionItemSchema).min(2, 'Minimal 2 opsi jawaban'),
  correct_answer: z.string().min(1, 'Jawaban benar wajib diisi'),
}).refine(
  (q) => q.options.some((o) => o.key === q.correct_answer),
  { message: 'Jawaban benar harus sesuai dengan salah satu key opsi' }
)

// Matching question
const matchingSchema = z.object({
  ...baseQuestionFields,
  type: z.literal('matching'),
  left_items: z.array(matchingItemSchema).min(2),
  right_items: z.array(matchingItemSchema).min(2),
  correct_pairs: z.array(matchingPairSchema).min(1),
})

// Essay question
const essaySchema = z.object({
  ...baseQuestionFields,
  type: z.literal('essay'),
  auto_gradable: z.literal(false),
  max_score: z.number().positive('Skor maksimum harus positif'),
})

// Short answer question
const shortAnswerSchema = z.object({
  ...baseQuestionFields,
  type: z.literal('short_answer'),
  auto_gradable: z.literal(false),
  max_score: z.number().positive('Skor maksimum harus positif'),
})

// Listening question
const listeningSchema = z.object({
  ...baseQuestionFields,
  type: z.literal('listening'),
  audio_url: z.string().min(1, 'URL audio wajib diisi'),
  options: z.array(optionItemSchema).min(2, 'Minimal 2 opsi jawaban'),
  correct_answer: z.string().min(1, 'Jawaban benar wajib diisi'),
}).refine(
  (q) => q.options.some((o) => o.key === q.correct_answer),
  { message: 'Jawaban benar harus sesuai dengan salah satu key opsi' }
)

// Union discriminated by 'type'
const questionSchema = z.discriminatedUnion('type', [
  multipleChoiceSchema,
  matchingSchema,
  essaySchema,
  shortAnswerSchema,
  listeningSchema,
])

/**
 * Validates the entire questions JSON payload.
 * If any question has an unsupported type, the ENTIRE upload is rejected
 * with a specific error message indicating which question and field.
 */
export const questionsPayloadSchema = z.object({
  questions: z.array(questionSchema).min(1, 'Minimal 1 soal diperlukan'),
}).superRefine((data, ctx) => {
  // Check for duplicate question IDs
  const ids = data.questions.map((q) => q.id)
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
  if (duplicates.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Ditemukan ID soal duplikat: ${[...new Set(duplicates)].join(', ')}`,
      path: ['questions'],
    })
  }

  // Validate question IDs are sequential starting from 1
  const sortedIds = [...ids].sort((a, b) => a - b)
  for (let i = 0; i < sortedIds.length; i++) {
    if (sortedIds[i] !== i + 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `ID soal harus berurutan mulai dari 1. Ditemukan gap di ID ${i + 1}`,
        path: ['questions'],
      })
      break
    }
  }
})

/**
 * Pre-validation: checks if any question has an unsupported type BEFORE
 * running the full Zod validation. This provides a clearer error message.
 */
export function preValidateQuestionTypes(data: unknown): string | null {
  if (!data || typeof data !== 'object') return 'Data harus berupa objek'
  const payload = data as { questions?: unknown[] }
  if (!Array.isArray(payload.questions)) return 'Field "questions" harus berupa array'

  for (let i = 0; i < payload.questions.length; i++) {
    const q = payload.questions[i] as { type?: string; id?: number }
    if (!q.type) {
      return `Soal #${q.id || i + 1}: field "type" wajib diisi`
    }
    if (!(SUPPORTED_QUESTION_TYPES as readonly string[]).includes(q.type)) {
      return `Soal #${q.id || i + 1}: tipe "${q.type}" tidak dikenali. Tipe yang didukung: ${SUPPORTED_QUESTION_TYPES.join(', ')}. Seluruh upload ditolak.`
    }
  }
  return null
}

// Exercise metadata schema (for creating/updating exercises)
export const exerciseSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi').max(200),
  subtitle: z.string().max(500).optional().nullable(),
  type: z.enum(['exercise', 'tryout'], { message: 'Tipe wajib dipilih' }),
  time_limit_minutes: z.number().int().positive('Batas waktu harus positif'),
  program_ids: z.array(z.string().uuid()).min(1, 'Minimal pilih 1 program'),
})

export type ExerciseInput = z.infer<typeof exerciseSchema>
