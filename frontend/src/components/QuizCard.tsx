import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Circle, XCircle } from 'lucide-react'
import type { QuizQuestion } from '../types/quiz'

interface QuizScorePayload {
  score: number
  totalQuestions: number
  answers: Array<{
    questionId: string
    selectedOptionId: string
    isCorrect: boolean
  }>
}

interface QuizCardProps {
  questions: QuizQuestion[]
  onSubmitScore?: (payload: QuizScorePayload) => Promise<void>
  storageKey?: string
}

const getStoredQuizState = (storageKey: string | undefined, questionSignature: string) => {
  if (!storageKey) return { answers: {}, scoreStatus: 'idle' as const }

  try {
    const raw = window.localStorage.getItem(storageKey)
    const parsed = raw ? JSON.parse(raw) : null

    if (!parsed || parsed.questionSignature !== questionSignature || typeof parsed.answers !== 'object') {
      return { answers: {}, scoreStatus: 'idle' as const }
    }

    return {
      answers: parsed.answers as Record<string, string>,
      scoreStatus: parsed.scoreStatus === 'saved' ? ('saved' as const) : ('idle' as const),
    }
  } catch {
    return { answers: {}, scoreStatus: 'idle' as const }
  }
}

export default function QuizCard({ questions, onSubmitScore, storageKey }: QuizCardProps) {
  const questionSignature = useMemo(() => questions.map((question) => question.id).join('|'), [questions])
  const initialState = useMemo(() => getStoredQuizState(storageKey, questionSignature), [storageKey, questionSignature])
  const [answers, setAnswers] = useState<Record<string, string>>(initialState.answers)
  const [scoreStatus, setScoreStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    const nextState = getStoredQuizState(storageKey, questionSignature)
    setAnswers(nextState.answers)
    setScoreStatus(nextState.scoreStatus)
  }, [questionSignature, storageKey])

  useEffect(() => {
    if (!storageKey) return

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        questionSignature,
        answers,
        scoreStatus: scoreStatus === 'saved' ? 'saved' : 'idle',
        updatedAt: new Date().toISOString(),
      }),
    )
  }, [answers, questionSignature, scoreStatus, storageKey])

  const correctCount = questions.filter((question) => {
    const selectedId = answers[question.id]
    const selected = question.options.find((option) => option.id === selectedId)

    return selected?.isCorrect
  }).length
  const answeredCount = questions.filter((question) => answers[question.id]).length
  const scorePercent = questions.length ? Math.round((correctCount / questions.length) * 100) : 0
  const understanding =
    scorePercent >= 80 ? 'เข้าใจดี' : scorePercent >= 60 ? 'พอเข้าใจ' : questions.length ? 'ทบทวนเพิ่ม' : '-'
  const canSaveScore = Boolean(onSubmitScore && questions.length > 0 && answeredCount === questions.length)

  const submitScore = async () => {
    if (!onSubmitScore || !canSaveScore) return

    setScoreStatus('saving')

    try {
      await onSubmitScore({
        score: correctCount,
        totalQuestions: questions.length,
        answers: questions.map((question) => {
          const selectedOptionId = answers[question.id] ?? ''
          const selectedOption = question.options.find((option) => option.id === selectedOptionId)

          return {
            questionId: question.id,
            selectedOptionId,
            isCorrect: Boolean(selectedOption?.isCorrect),
          }
        }),
      })
      setScoreStatus('saved')
    } catch {
      setScoreStatus('error')
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">แบบทดสอบ</h2>
            <p className="mt-1 text-sm text-slate-500">
              ตอบแล้ว {answeredCount}/{questions.length} ข้อ
            </p>
          </div>

          <div className="min-w-[148px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">ความเข้าใจ</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{scorePercent}%</p>
              </div>
              <span className="pb-1 text-xs font-semibold text-slate-500">{understanding}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-slate-950 transition-all" style={{ width: `${scorePercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {questions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
            ยังไม่มีแบบทดสอบสำหรับบทนี้ กดปุ่มสร้างแบบทดสอบเพื่อให้ระบบออกข้อสอบ 10 ข้อ
          </div>
        ) : null}

        {questions.map((question, index) => {
          const selectedId = answers[question.id]
          const selectedOption = question.options.find((option) => option.id === selectedId)

          return (
            <section key={question.id} className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-950">
                {index + 1}. {question.question}
              </p>
              <div className="mt-3 space-y-2">
                {question.options.map((option) => {
                  const selected = selectedId === option.id
                  const showResult = Boolean(selectedId)
                  const isWrongSelected = selected && !option.isCorrect
                  const isCorrectOption = showResult && option.isCorrect

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`flex w-full items-start gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${
                        isCorrectOption
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : isWrongSelected
                            ? 'border-rose-300 bg-rose-50 text-rose-800'
                            : selected
                              ? 'border-slate-950 bg-slate-50 text-slate-950'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                      onClick={() => {
                        setScoreStatus('idle')
                        setAnswers((current) => ({ ...current, [question.id]: option.id }))
                      }}
                    >
                      {isCorrectOption ? (
                        <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                      ) : isWrongSelected ? (
                        <XCircle size={17} className="mt-0.5 shrink-0" />
                      ) : (
                        <Circle size={17} className="mt-0.5 shrink-0" />
                      )}
                      <span>{option.text}</span>
                    </button>
                  )
                })}
              </div>

              {selectedOption && (
                <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-slate-950">เฉลย: </span>
                  {question.explanation}
                </div>
              )}
            </section>
          )
        })}

        {questions.length > 0 && onSubmitScore ? (
          <div className="flex justify-end border-t border-slate-200 pt-4">
            <button
              type="button"
              className="inline-flex h-10 min-w-28 items-center justify-center rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canSaveScore || scoreStatus === 'saving' || scoreStatus === 'saved'}
              onClick={submitScore}
            >
              {scoreStatus === 'saving' ? 'กำลังบันทึก...' : scoreStatus === 'saved' ? 'บันทึกแล้ว' : 'บันทึกคะแนน'}
            </button>
          </div>
        ) : null}

        {scoreStatus === 'error' ? (
          <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
            บันทึกคะแนนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
          </p>
        ) : null}
      </div>
    </div>
  )
}
