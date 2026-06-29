import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { QuestionPayload } from '@/types/database'

export const metadata: Metadata = {
  title: 'Detail Penilaian Siswa',
}

export default async function GradingDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: attempt } = await supabase
    .from('attempts')
    .select(`
      *,
      students (full_name, university, major, email, programs(name)),
      exercises (title, questions_json)
    `)
    .eq('id', id)
    .single()

  if (!attempt) {
    notFound()
  }

  const student = attempt.students as any
  const exercise = attempt.exercises as any
  const answers = attempt.answers_json as Record<string, string>
  const questionsJson = exercise.questions_json as QuestionPayload

  // Evaluate answers for detailed view
  let totalCorrect = 0
  let totalIncorrect = 0
  let totalUnanswered = 0

  const detailedResults = questionsJson.questions.map(q => {
    const studentAnswer = answers[q.id.toString()]
    
    // Evaluate if correct
    let isCorrect = false
    if ('correct_answer' in q) {
      isCorrect = studentAnswer === q.correct_answer
    }

    const isUnanswered = !studentAnswer

    if (isCorrect) totalCorrect++
    else if (isUnanswered) totalUnanswered++
    else totalIncorrect++

    return {
      ...q,
      studentAnswer,
      isCorrect,
      isUnanswered
    }
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/geheime-verwaltung/grading"
          className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Detail Evaluasi</h1>
          <p className="text-neutral-600">{exercise.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-[--radius-lg] shadow-sm border border-neutral-200 p-6">
            <h3 className="font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">Informasi Siswa</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-neutral-500">Nama Lengkap</p>
                <p className="font-bold text-neutral-800">{student.full_name}</p>
              </div>
              <div>
                <p className="text-neutral-500">Program</p>
                <p className="font-bold text-neutral-800">{student.programs?.name}</p>
              </div>
              <div>
                <p className="text-neutral-500">Universitas Tujuan</p>
                <p className="font-medium text-neutral-800">{student.university}</p>
              </div>
              <div>
                <p className="text-neutral-500">Jurusan Pilihan</p>
                <p className="font-medium text-neutral-800">{student.major}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-[--radius-lg] shadow-sm border border-neutral-200 p-6">
            <h3 className="font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">Rincian Jawaban</h3>
            <div className="space-y-4">
              {detailedResults.map((res, idx) => (
                <div key={res.id} className="p-4 border border-neutral-100 rounded-[--radius-md] bg-neutral-50">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <p className="font-semibold text-sm text-primary-900">
                      Soal {idx + 1}
                    </p>
                    {res.isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-success-700 bg-success/10 px-2 py-0.5 rounded">
                        <CheckCircle size={14} /> Benar
                      </span>
                    ) : res.isUnanswered ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded">
                        <HelpCircle size={14} /> Kosong
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-danger-700 bg-danger/10 px-2 py-0.5 rounded">
                        <XCircle size={14} /> Salah
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <p><span className="text-neutral-500">Kunci Jawaban:</span> <strong>{'correct_answer' in res ? (res as any).correct_answer : '-'}</strong></p>
                    <p><span className="text-neutral-500">Jawaban Siswa:</span> <strong className={res.isCorrect ? 'text-success-700' : 'text-danger-700'}>{res.studentAnswer || '-'}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-primary-900 text-white rounded-[--radius-lg] shadow-sm p-6 text-center">
            <p className="text-primary-200 font-semibold mb-2">Skor Akhir</p>
            <div className="text-5xl font-extrabold text-accent-300">
              {attempt.score}
            </div>
            <p className="text-sm text-primary-200 mt-4">
              Dikumpulkan pada:<br />
              {attempt.submitted_at ? formatDate(attempt.submitted_at) : '-'}
            </p>
          </div>

          <div className="bg-card rounded-[--radius-lg] shadow-sm border border-neutral-200 p-6">
            <h3 className="font-bold text-primary-900 mb-4 border-b border-neutral-100 pb-2">Statistik Pengerjaan</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-success-700 font-medium">
                  <CheckCircle size={18} /> Benar
                </div>
                <span className="font-bold text-lg">{totalCorrect}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-danger-700 font-medium">
                  <XCircle size={18} /> Salah
                </div>
                <span className="font-bold text-lg">{totalIncorrect}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-neutral-500 font-medium">
                  <HelpCircle size={18} /> Kosong
                </div>
                <span className="font-bold text-lg">{totalUnanswered}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
