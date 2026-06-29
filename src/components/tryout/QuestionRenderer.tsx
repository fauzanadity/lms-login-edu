'use client'

import { BaseQuestion, QuestionType } from '@/types/questions'
import Image from 'next/image'

interface QuestionRendererProps {
  question: BaseQuestion
  questionNumber: number
  answer: any
  onChange: (answer: any) => void
  disabled?: boolean
}

export default function QuestionRenderer({ 
  question, 
  questionNumber, 
  answer, 
  onChange,
  disabled = false
}: QuestionRendererProps) {
  
  const renderQuestionTextAndImage = () => (
    <div className="mb-6">
      <div className="flex gap-4 items-start">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-800 font-bold flex items-center justify-center">
          {questionNumber}
        </div>
        <div className="flex-grow">
          <p className="text-neutral-800 text-lg leading-relaxed whitespace-pre-wrap font-medium">
            {question.text}
          </p>
          {question.image_url && (
            <div className="mt-4 max-w-2xl">
              {/* Using standard img tag because next/image requires configured domains */}
              <img 
                src={question.image_url} 
                alt={`Gambar soal ${questionNumber}`}
                className="rounded-[--radius-md] border border-neutral-200 max-h-[400px] object-contain bg-neutral-50"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderMultipleChoice = () => {
    const q = question as any // Cast to any to access type-specific fields for now
    
    return (
      <div className="space-y-3 ml-12">
        {q.options?.map((opt: any) => {
          const isSelected = answer === opt.key
          
          return (
            <label 
              key={opt.key}
              className={`flex items-start gap-4 p-4 rounded-[--radius-md] border-2 cursor-pointer transition-all ${
                disabled ? 'opacity-70 cursor-not-allowed' : ''
              } ${
                isSelected 
                  ? 'border-primary-500 bg-primary-50 shadow-sm' 
                  : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 bg-white'
              }`}
            >
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={opt.key}
                  checked={isSelected}
                  onChange={() => !disabled && onChange(opt.key)}
                  disabled={disabled}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-neutral-300"
                />
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold ${isSelected ? 'text-primary-700' : 'text-neutral-600'}`}>
                    {opt.key}.
                  </span>
                  <span className={`text-base ${isSelected ? 'text-primary-900' : 'text-neutral-700'}`}>
                    {opt.text}
                  </span>
                </div>
                {opt.image_url && (
                  <img 
                    src={opt.image_url} 
                    alt={`Opsi ${opt.key}`}
                    className="mt-2 rounded-md border border-neutral-200 max-h-[200px] object-contain"
                  />
                )}
              </div>
            </label>
          )
        })}
      </div>
    )
  }

  const renderEssay = () => {
    return (
      <div className="ml-12">
        <textarea
          value={answer || ''}
          onChange={(e) => !disabled && onChange(e.target.value)}
          disabled={disabled}
          placeholder="Tuliskan jawaban Anda di sini..."
          className="w-full h-40 p-4 rounded-[--radius-md] border border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none resize-y transition-shadow"
        />
      </div>
    )
  }

  const renderShortAnswer = () => {
    return (
      <div className="ml-12">
        <input
          type="text"
          value={answer || ''}
          onChange={(e) => !disabled && onChange(e.target.value)}
          disabled={disabled}
          placeholder="Jawaban singkat..."
          className="w-full max-w-md p-3 rounded-[--radius-md] border border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-shadow"
        />
      </div>
    )
  }

  // Render logic based on type
  return (
    <div className="bg-card rounded-[--radius-lg] p-6 shadow-card border border-neutral-100">
      {renderQuestionTextAndImage()}
      
      {question.type === 'multiple_choice' && renderMultipleChoice()}
      {question.type === 'listening' && renderMultipleChoice()} {/* Using same renderer for now */}
      {question.type === 'essay' && renderEssay()}
      {question.type === 'short_answer' && renderShortAnswer()}
      
      {/* TODO: Add matching renderer when needed */}
      {question.type === 'matching' && (
        <div className="ml-12 p-4 bg-orange-50 text-warning rounded-[--radius-md]">
          Tipe soal menjodohkan belum didukung di antarmuka ini.
        </div>
      )}
    </div>
  )
}
