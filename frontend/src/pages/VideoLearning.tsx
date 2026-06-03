import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Lock,
  Maximize2,
  Menu,
  MessageSquare,
  PlayCircle,
  Send,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import AIChatBox from '../components/AIChatBox'
import LearnProSidebar from '../components/LearnProSidebar'
import QuizCard from '../components/QuizCard'
import VideoPlayer from '../components/VideoPlayer'
import { useApi } from '../hooks/useApi'
import { api, authStorage } from '../services/api'
import type { LessonReview, StudentEnrollment } from '../types/course'
import type { QuizQuestion } from '../types/quiz'

type AITab = 'summary' | 'assistant' | 'quiz'
const maxQuizGenerations = 5

const tabs: Array<{ id: AITab; label: string; icon: typeof FileText }> = [
  { id: 'summary', label: 'สรุป', icon: FileText },
  { id: 'assistant', label: 'AI \u0e1c\u0e39\u0e49\u0e0a\u0e48\u0e27\u0e22', icon: Sparkles },
  { id: 'quiz', label: 'แบบทดสอบ', icon: HelpCircle },
]

const getCurrentLearnerId = () => authStorage.getSession()?.user.id ?? 'guest'

const lessonAiCacheKey = (lessonId: string, type: 'summary' | 'quiz') => {
  const ownerId = getCurrentLearnerId()
  return type === 'summary'
    ? `mycourse:lesson-ai:${type}:timeline-v2:${ownerId}:${lessonId}`
    : `mycourse:lesson-ai:${type}:v2:${ownerId}:${lessonId}`
}

interface QuizCachePayload {
  questions: QuizQuestion[] | null
  history: string[]
  generations: number
}

const emptyQuizCache: QuizCachePayload = {
  questions: null,
  history: [],
  generations: 0,
}

const shuffleQuizOptions = (options: QuizQuestion['options']) => {
  const shuffled = [...options]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const currentOption = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = currentOption
  }

  return shuffled
}

const shuffleQuizQuestions = (questions: QuizQuestion[]) =>
  questions.map((question) => ({
    ...question,
    options: shuffleQuizOptions(question.options),
  }))

const getCachedQuizPayload = (lessonId: string): QuizCachePayload => {
  try {
    const raw = window.localStorage.getItem(lessonAiCacheKey(lessonId, 'quiz'))
    const parsed = raw ? JSON.parse(raw) : null

    if (Array.isArray(parsed)) {
      return {
        questions: shuffleQuizQuestions(parsed),
        history: parsed.map((question) => String(question.question ?? '')).filter(Boolean),
        generations: parsed.length > 0 ? 1 : 0,
      }
    }

    if (parsed && typeof parsed === 'object') {
      const questions: QuizQuestion[] | null = Array.isArray(parsed.questions) ? shuffleQuizQuestions(parsed.questions) : null
      const history = Array.isArray(parsed.history)
        ? parsed.history.map((question: unknown) => String(question ?? '')).filter(Boolean)
        : questions?.map((question) => String(question.question ?? '')).filter(Boolean) ?? []
      const generations = Math.min(maxQuizGenerations, Math.max(0, Number(parsed.generations ?? 0) || 0))

      return { questions, history, generations }
    }

    return emptyQuizCache
  } catch {
    return emptyQuizCache
  }
}

function InlineAiText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={`${part}-${index}`} className="font-semibold text-black">
              {part.slice(2, -2)}
            </strong>
          )
        }

        return <span key={`${part}-${index}`}>{part}</span>
      })}
    </>
  )
}

function AiResponsePanel({ text }: { text: string }) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^[-]{3,}$/.test(line))

  return (
    <div className="space-y-3 text-sm leading-7 text-zinc-700">
      {lines.map((line, index) => {
        const heading = line.match(/^(#{1,4})\s+(.+)$/)
        const bullet = line.match(/^[-*]\s+(.+)$/)

        if (heading) {
          return (
            <h4 key={`${line}-${index}`} className="pt-1 text-sm font-semibold leading-7 text-black">
              <InlineAiText text={heading[2]} />
            </h4>
          )
        }

        if (bullet) {
          return (
            <div key={`${line}-${index}`} className="flex gap-3">
              <CheckCircle2 size={15} className="mt-1 shrink-0 text-black" />
              <p>
                <InlineAiText text={bullet[1]} />
              </p>
            </div>
          )
        }

        return (
          <p key={`${line}-${index}`}>
            <InlineAiText text={line} />
          </p>
        )
      })}
    </div>
  )
}

function AiEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white/70 px-5 py-8 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-black">
        <Sparkles size={18} />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-black">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  )
}

export default function VideoLearning() {
  const { slug = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<AITab>('summary')
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiQuiz, setAiQuiz] = useState<QuizQuestion[] | null>(null)
  const [quizGenerationCount, setQuizGenerationCount] = useState(0)
  const [aiLoading, setAiLoading] = useState<'transcript' | 'summary' | 'quiz' | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [enrollment, setEnrollment] = useState<StudentEnrollment | null>(null)
  const [progressLoading, setProgressLoading] = useState(false)
  const [progressMessage, setProgressMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [lessonReviews, setLessonReviews] = useState<LessonReview[]>([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileAiOpen, setMobileAiOpen] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewMessage, setReviewMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const mobileAiPanelRef = useRef<HTMLElement | null>(null)
  const { data: course, error, loading } = useApi(() => api.getCourse(slug), [slug])
  const session = authStorage.getSession()
  const sessionUser = session?.user
  const dashboardPath =
    sessionUser?.role === 'student'
      ? '/student'
      : sessionUser?.role === 'teacher'
        ? '/teacher'
        : sessionUser?.role === 'admin'
          ? '/admin'
          : '/'

  const lessonId = searchParams.get('lesson')
  const lesson = useMemo(() => {
    if (!course) return undefined
    return course.lessons.find((item) => item.id === lessonId) ?? course.lessons[0]
  }, [course, lessonId])

  const lessonIndex = useMemo(() => {
    if (!course || !lesson) return -1
    return course.lessons.findIndex((item) => item.id === lesson.id)
  }, [course, lesson])

  const lessonCompleted = enrollment ? enrollment.completedLessons > lessonIndex : false

  const previousLesson = lessonIndex > 0 ? course?.lessons[lessonIndex - 1] : undefined
  const nextLesson = course && lessonIndex >= 0 ? course.lessons[lessonIndex + 1] : undefined
  const isEnrolledStudent = course?.viewerState?.role === 'student' && course.viewerState.isEnrolled
  const lessonStatus = lessonCompleted ? 'เรียนแล้ว' : isEnrolledStudent ? 'กำลังเรียน' : 'ตัวอย่าง'
  const backPath = isEnrolledStudent ? dashboardPath : `/courses/${course?.slug ?? slug}`

  useEffect(() => {
    setEnrollment(course?.viewerState?.enrollment ?? null)
  }, [course?.viewerState?.enrollment])

  useEffect(() => {
    if (!course || !lesson || !isEnrolledStudent) return
    if (enrollment?.lastLessonId === lesson.id) return

    let cancelled = false

    api
      .rememberCurrentLesson(course.slug, lesson.id)
      .then((nextEnrollment) => {
        if (!cancelled) setEnrollment(nextEnrollment)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [course?.slug, enrollment?.lastLessonId, isEnrolledStudent, lesson?.id])

  useEffect(() => {
    setReviewRating(0)
    setReviewText('')
    setReviewMessage(null)

    if (!lesson) {
      setLessonReviews([])
      return
    }

    let cancelled = false
    setReviewsLoading(true)

    api
      .getLessonReviews(lesson.id)
      .then((reviews) => {
        if (!cancelled) setLessonReviews(reviews)
      })
      .catch((currentError) => {
        if (cancelled) return

        setLessonReviews([])
        setReviewMessage({
          tone: 'error',
          text: currentError instanceof Error ? currentError.message : 'โหลดรีวิวไม่สำเร็จ',
        })
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [lesson])

  useEffect(() => {
    if (!lesson) return

    const cachedSummary = window.localStorage.getItem(lessonAiCacheKey(lesson.id, 'summary'))
    const cachedQuiz = getCachedQuizPayload(lesson.id)
    setAiError(null)
    setAiSummary(cachedSummary ?? null)
    setAiQuiz(cachedQuiz.questions)
    setQuizGenerationCount(cachedQuiz.generations)
  }, [lesson?.id, sessionUser?.id])

  const openLesson = (nextLessonId: string) => {
    setAiSummary(null)
    setAiQuiz(null)
    setQuizGenerationCount(0)
    setAiError(null)
    setProgressMessage(null)
    setSearchParams({ lesson: nextLessonId })
  }

  const openMobileAi = () => {
    setActiveTab('assistant')
    setMobileAiOpen(true)
    requestAnimationFrame(() => {
      const panel = mobileAiPanelRef.current
      if (!panel) return

      const panelRect = panel.getBoundingClientRect()
      const bottomOverflow = panelRect.bottom - window.innerHeight + 12
      if (bottomOverflow > 0) {
        window.scrollBy({ top: bottomOverflow, behavior: 'smooth' })
      }
    })
  }

  useEffect(() => {
    if (!mobileAiOpen) return

    const timeout = window.setTimeout(() => {
      const panel = mobileAiPanelRef.current
      if (!panel) return

      const panelRect = panel.getBoundingClientRect()
      const bottomOverflow = panelRect.bottom - window.innerHeight + 12

      if (bottomOverflow > 0) {
        window.scrollBy({ top: bottomOverflow, behavior: 'smooth' })
      }
    }, 120)

    return () => window.clearTimeout(timeout)
  }, [activeTab, aiLoading, aiQuiz?.length, mobileAiOpen])

  const generateSummary = async () => {
    if (!lesson) return
    setAiError(null)
    setAiLoading('summary')

    try {
      const result = await api.summarizeLesson(lesson.id)
      setAiSummary(result.summary)
      window.localStorage.setItem(lessonAiCacheKey(lesson.id, 'summary'), result.summary)
    } catch (currentError) {
      setAiError(currentError instanceof Error ? currentError.message : 'สร้างสรุปไม่สำเร็จ')
    } finally {
      setAiLoading(null)
    }
  }

  const generateQuiz = async () => {
    if (!lesson) return
    setAiError(null)

    const cachedQuiz = getCachedQuizPayload(lesson.id)
    if (cachedQuiz.generations >= maxQuizGenerations) {
      setQuizGenerationCount(maxQuizGenerations)
      setAiError('เปลี่ยนแบบทดสอบได้สูงสุด 5 ครั้งต่อบทเรียนครับ')
      return
    }

    setAiLoading('quiz')

    try {
      const result = await api.generateLessonQuiz(lesson.id, cachedQuiz.history)
      const nextPayload = {
        questions: result.questions,
        history: [
          ...cachedQuiz.history,
          ...result.questions.map((question) => String(question.question ?? '')).filter(Boolean),
        ].slice(-(maxQuizGenerations * 10)),
        generations: cachedQuiz.generations + 1,
      }

      const shuffledQuestions = shuffleQuizQuestions(result.questions)
      setAiQuiz(shuffledQuestions)
      setQuizGenerationCount(nextPayload.generations)
      window.localStorage.setItem(lessonAiCacheKey(lesson.id, 'quiz'), JSON.stringify({ ...nextPayload, questions: shuffledQuestions }))
    } catch (currentError) {
      setAiError(currentError instanceof Error ? currentError.message : 'สร้างแบบทดสอบไม่สำเร็จ')
    } finally {
      setAiLoading(null)
    }
  }

  const saveQuizScore = async (payload: Parameters<typeof api.saveLessonQuizAttempt>[1]) => {
    if (!lesson) return

    await api.saveLessonQuizAttempt(lesson.id, payload)
  }

  const completeLesson = async () => {
    if (!course || !lesson) return

    setProgressLoading(true)
    setProgressMessage(null)

    try {
      const nextEnrollment = await api.completeLesson(course.slug, lesson.id)
      setEnrollment(nextEnrollment)
      setProgressMessage({ tone: 'success', text: 'บันทึกความคืบหน้าเรียบร้อยแล้ว' })
    } catch (currentError) {
      setProgressMessage({
        tone: 'error',
        text: currentError instanceof Error ? currentError.message : 'บันทึกความคืบหน้าไม่สำเร็จ',
      })
    } finally {
      setProgressLoading(false)
    }
  }

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!lesson) return

    const nextText = reviewText.trim()
    if (!nextText || reviewRating === 0) return

    setReviewSubmitting(true)
    setReviewMessage(null)

    try {
      const nextReviews = await api.saveLessonReview(lesson.id, {
        rating: reviewRating,
        text: nextText,
      })

      setLessonReviews(nextReviews)
      setReviewRating(0)
      setReviewText('')
      setReviewMessage({ tone: 'success', text: 'บันทึกรีวิวและอัปเดตรายการเรียบร้อยแล้ว' })
    } catch (currentError) {
      setReviewMessage({
        tone: 'error',
        text: currentError instanceof Error ? currentError.message : 'ส่งรีวิวไม่สำเร็จ',
      })
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="student-page-shell">
        <LearnProSidebar active="my-courses" mobileOpen={false} onMobileClose={() => undefined} />
        <main className="student-page-main min-w-0">
          <div className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="skeleton h-11 w-11 rounded-lg" />
                <div className="skeleton h-11 w-11 rounded-lg" />
                <div className="min-w-0 space-y-2">
                  <div className="skeleton-line h-5 w-48" />
                  <div className="skeleton-line h-4 w-32" />
                </div>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <div className="skeleton h-11 w-11 rounded-full" />
                <div className="skeleton h-4 w-4 rounded-full" />
              </div>
            </div>
          </div>

          <div className="mx-auto grid max-w-[1780px] gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_520px]">
            <div className="min-w-0">
              <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="skeleton-line h-4 w-28" />
                    <div className="mt-3 skeleton-line h-9 w-8/12" />
                    <div className="mt-3 skeleton-line h-5 w-11/12" />
                  </div>
                  <div className="flex gap-2">
                    <div className="skeleton h-11 w-36 rounded-xl" />
                    <div className="skeleton h-11 w-11 rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-sm">
                <div className="skeleton aspect-video max-h-[68vh] w-full bg-zinc-900" />
              </div>
              <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[0, 1].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl bg-[#faf9f7] p-3">
                      <div className="skeleton h-9 w-9 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="skeleton-line h-3 w-24" />
                        <div className="skeleton-line h-4 w-36" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="hidden space-y-6 xl:block">
              <section className="min-h-[520px] rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-3 rounded-xl bg-[#faf9f7] px-3 py-3">
                  <div className="skeleton h-10 w-10 rounded-xl bg-white" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-line h-5 w-28" />
                    <div className="skeleton-line h-3 w-48" />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="skeleton h-10 rounded-lg bg-white" />
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-zinc-200/70 bg-[#faf9f7] p-5">
                  <div className="skeleton h-11 rounded-xl bg-black/10" />
                  <div className="mt-5 space-y-3">
                    <div className="skeleton-line h-4 w-full" />
                    <div className="skeleton-line h-4 w-10/12" />
                    <div className="skeleton-line h-4 w-8/12" />
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </main>
      </section>
    )
  }

  if (error || !course || !lesson) {
    return (
      <section className="min-h-screen bg-white p-6 text-black">
        <div className="mx-auto max-w-xl rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-black">ไม่พบบทเรียน</h1>
          <p className="mt-2 text-sm text-zinc-500">{error ?? 'บทเรียนนี้ยังไม่มีข้อมูลในระบบ'}</p>
          <Link to={dashboardPath} className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-black px-5 text-sm font-semibold text-white">
            กลับหน้าหลัก
          </Link>
        </div>
      </section>
    )
  }

  const learnerAvatar = sessionUser?.avatarUrl
  const quizGenerationsRemaining = Math.max(0, maxQuizGenerations - quizGenerationCount)
  const aiTutorContent = (
    <>
      <div className="mobile-ai-tabs grid shrink-0 grid-cols-3 rounded-xl border border-zinc-200 bg-zinc-50 p-1 text-sm">
        {tabs.map((tab) => {
          const TabIcon = tab.icon

          return (
            <button
              key={tab.id}
              type="button"
              className={[
                'mobile-ai-tab-button flex h-11 items-center justify-center gap-1.5 rounded-lg px-2 font-semibold transition sm:h-10',
                activeTab === tab.id ? 'bg-white text-black shadow-[0_8px_20px_rgba(15,23,42,0.08)] ring-1 ring-zinc-200/80' : 'text-zinc-500 hover:bg-white/70 hover:text-black',
              ].join(' ')}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
            >
              <TabIcon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden overscroll-contain pr-1 xl:pr-0">
        {activeTab === 'summary' ? (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <button
              type="button"
              className="mobile-ai-action-button inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={generateSummary}
              disabled={aiLoading === 'summary'}
            >
              <FileText size={15} />
              {aiLoading === 'summary' ? 'กำลังสรุป...' : 'สร้างสรุปบทเรียน'}
            </button>
            {aiError ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{aiError}</p> : null}
            <div className="ai-scroll-panel min-h-0 flex-1 overflow-y-auto rounded-2xl border border-zinc-200/70 bg-[#faf9f7] p-4 pb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:p-5 xl:pb-5">
              {aiSummary ? (
                <AiResponsePanel text={aiSummary} />
              ) : (
                <AiEmptyState title="ยังไม่มีสรุปของคุณ" description="กดสร้างสรุปบทเรียนเพื่อให้ AI สรุปเนื้อหาชุดใหม่สำหรับบัญชีนี้" />
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'assistant' ? (
          <AIChatBox
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            embedded
            className="h-full min-h-0 rounded-2xl border border-zinc-200/70 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          />
        ) : null}

        {activeTab === 'quiz' ? (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <button
              type="button"
              className="mobile-ai-action-button inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={generateQuiz}
              disabled={aiLoading === 'quiz' || quizGenerationsRemaining <= 0}
            >
              <HelpCircle size={16} />
              {aiLoading === 'quiz'
                ? 'กำลังสร้างแบบทดสอบ...'
                : quizGenerationCount > 0
                  ? `สร้างชุดใหม่ ${quizGenerationCount}/${maxQuizGenerations}`
                  : 'สร้างแบบทดสอบ'}
            </button>
            {aiError ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{aiError}</p> : null}
            <div className="ai-scroll-panel min-h-0 flex-1 overflow-y-auto rounded-2xl border border-zinc-200/70 bg-white p-4 pb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] xl:pb-4">
              {aiQuiz ? (
                <QuizCard questions={aiQuiz} onSubmitScore={saveQuizScore} />
              ) : (
                <AiEmptyState title="ยังไม่มีแบบทดสอบของคุณ" description="กดสร้างแบบทดสอบเพื่อเริ่มชุดคำถามใหม่สำหรับบัญชีนี้ คะแนนและประวัติจะไม่ปนกับผู้ใช้อื่น" />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
  const lessonListContent = (
    <>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-black">เนื้อหาคอร์ส</h2>
        <p className="text-sm text-zinc-500">{course.lessons.length} บทเรียน</p>
      </div>

      <div className="mt-5 space-y-2">
        {course.lessons.map((item, index) => {
          const active = item.id === lesson.id
          const completed = enrollment ? enrollment.completedLessons > index : false
          const locked = !isEnrolledStudent && !item.preview

          return (
            <button
              key={item.id}
              type="button"
              className={[
                'grid w-full grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition',
                active ? 'border-black bg-[#faf9f7] text-black shadow-sm' : 'border-transparent bg-white text-zinc-700 hover:border-zinc-200 hover:bg-zinc-50',
              ].join(' ')}
              onClick={() => openLesson(item.id)}
            >
              <span className={active ? 'text-xs font-semibold text-black' : 'text-xs text-zinc-500'}>{String(index + 1).padStart(2, '0')}</span>
              <span className="min-w-0 truncate font-medium">{item.title}</span>
              <span className="flex items-center gap-3 text-xs text-zinc-500">
                <span>{item.duration}</span>
                {active ? (
                  <PlayCircle size={16} className="text-black" />
                ) : completed ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : locked ? (
                  <Lock size={15} className="text-zinc-400" />
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )

  return (
    <section className="student-page-shell">
      <LearnProSidebar active="my-courses" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />

      <main className="student-page-main min-w-0">
        <div className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-black lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="เปิดเมนู"
              >
                <Menu size={20} />
              </button>
              <Link
                to={backPath}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-black transition hover:border-black"
                aria-label={isEnrolledStudent ? 'กลับหน้าหลักนักเรียน' : 'กลับไปหน้าคอร์ส'}
              >
                <ArrowLeft size={18} />
              </Link>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-black">{course.title}</p>
                <p className="truncate text-sm text-zinc-500">โดย {course.instructor.name}</p>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              {learnerAvatar ? (
                <img src={learnerAvatar} alt={sessionUser?.name ?? 'ผู้เรียน'} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-black">
                  <GraduationCap size={18} />
                </span>
              )}
              <ChevronDown size={16} className="text-zinc-600" />
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-[1780px] gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_520px]">
          <div className="min-w-0">
            <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-500">บทเรียนที่ {lessonIndex + 1}</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-black sm:text-3xl">{lesson.title}</h1>
                  <p className="mt-2 line-clamp-2 max-w-4xl text-sm leading-6 text-zinc-600 sm:text-base">{lesson.summary}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {course.viewerState?.role === 'student' && course.viewerState.isEnrolled ? (
                    <button
                      type="button"
                      className={[
                        'inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-sm transition',
                        lessonCompleted
                          ? 'border-emerald-100 bg-emerald-50 text-emerald-700 shadow-emerald-100/60'
                          : 'border-zinc-200 bg-white text-black hover:border-black hover:bg-zinc-50',
                      ].join(' ')}
                      onClick={completeLesson}
                      disabled={progressLoading || lessonCompleted}
                    >
                      <CheckCircle2 size={17} />
                      {progressLoading ? 'กำลังบันทึก...' : lessonCompleted ? 'เรียนจบแล้ว' : 'บันทึกว่าเรียนจบ'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-black transition hover:border-black"
                    aria-label="ขยายวิดีโอ"
                  >
                    <Maximize2 size={17} />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-sm">
              <VideoPlayer
                lesson={lesson}
                courseTitle={course.title}
                poster={lesson.posterUrl ?? course.coverImage}
                compact
              />
            </div>

            {mobileAiOpen ? (
              <section
                ref={mobileAiPanelRef}
                className="mobile-ai-inline-panel mt-3 flex flex-col rounded-2xl border border-zinc-200 bg-white p-3 shadow-[0_18px_44px_rgba(15,23,42,0.10)] xl:hidden"
                aria-label="AI Tutor"
              >
                <div className="mobile-ai-shell-header mb-3 flex shrink-0 items-center justify-between gap-3 rounded-xl bg-[#faf9f7] px-3 py-3">
                  <div className="min-w-0">
                    <p className="mobile-ai-shell-kicker text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Mobile AI</p>
                    <h2 className="mobile-ai-shell-title text-base font-semibold text-black">ผู้ช่วย AI ใต้คลิปวิดีโอ</h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-black transition hover:border-black"
                      onClick={() => setMobileAiOpen(false)}
                      aria-label="ปิด AI Tutor"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <div className="flex h-full min-h-0 flex-col">{aiTutorContent}</div>
                </div>
              </section>
            ) : null}

            <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-[#faf9f7] p-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <CheckCircle2 size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">สถานะการเรียน</p>
                    <p className="truncate text-sm font-semibold text-black">{lessonStatus}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-[#faf9f7] p-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                    <ClipboardList size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">บทเรียนที่กำลังเรียน</p>
                    <p className="truncate text-sm font-semibold text-black">
                      บทที่ {lessonIndex + 1} จาก {course.lessons.length}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-6 grid gap-3 border-t border-zinc-200 pt-6 lg:grid-cols-2">
              <button
                type="button"
                className="group flex min-h-20 items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left shadow-sm shadow-zinc-200/50 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60 sm:px-5"
                disabled={!previousLesson}
                onClick={() => previousLesson && openLesson(previousLesson.id)}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition group-hover:border-zinc-300 group-hover:text-black">
                    <ArrowLeft size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-black">บทก่อนหน้า</span>
                    <span className="mt-1 block truncate text-sm text-zinc-500">{previousLesson?.title ?? '-'}</span>
                  </span>
                </span>
              </button>

              <button
                type="button"
                className="group flex min-h-20 items-center justify-between rounded-2xl border border-zinc-900 bg-zinc-950 px-4 py-3 text-left text-white shadow-sm shadow-zinc-300/60 transition hover:bg-black disabled:cursor-default disabled:border-emerald-100 disabled:bg-emerald-50 disabled:text-emerald-800 disabled:shadow-emerald-100/70 sm:px-5"
                disabled={!nextLesson}
                onClick={() => nextLesson && openLesson(nextLesson.id)}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{nextLesson ? 'บทถัดไป' : 'เรียนครบแล้ว'}</span>
                  <span className={`mt-1 block truncate text-sm ${nextLesson ? 'text-white/65' : 'text-emerald-700/70'}`}>
                    {nextLesson?.title ?? '-'}
                  </span>
                </span>
                <span
                  className={[
                    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition',
                    nextLesson ? 'border-white/15 bg-white/10 text-white group-hover:bg-white/15' : 'border-emerald-200 bg-white text-emerald-700',
                  ].join(' ')}
                >
                  {nextLesson ? <ArrowRight size={17} /> : <CheckCircle2 size={17} />}
                </span>
              </button>
            </div>

            <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm xl:hidden">
              {lessonListContent}
            </section>

            {progressMessage ? (
              <p
                className={`mt-4 rounded-lg p-3 text-sm ${
                  progressMessage.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {progressMessage.text}
              </p>
            ) : null}

            <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-black">
                  <MessageSquare size={18} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-black">ความคิดเห็นบทเรียน</h2>
                  <p className="mt-1 text-sm text-zinc-500">ให้คะแนนและบันทึกความเห็นของคุณหลังเรียนบทนี้</p>
                </div>
              </div>

              <form className="mt-5 space-y-4" onSubmit={submitReview}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-zinc-700">ให้ดาว</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const active = rating <= reviewRating

                      return (
                        <button
                          key={rating}
                          type="button"
                          aria-label={`${rating} ดาว`}
                          aria-pressed={active}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition ${
                            active ? 'bg-amber-50 text-amber-500' : 'text-zinc-300 hover:bg-amber-50 hover:text-amber-500'
                          }`}
                          onClick={() => setReviewRating(rating)}
                        >
                          <Star size={19} fill={active ? 'currentColor' : 'none'} />
                        </button>
                      )
                    })}
                  </div>
                  {reviewRating > 0 ? <span className="text-sm font-semibold text-black">{reviewRating}/5</span> : null}
                </div>

                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  className="min-h-[112px] w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-black outline-none transition placeholder:text-zinc-400 focus:border-black"
                  placeholder="เขียนความคิดเห็นหรือสิ่งที่อยากจดจำจากบทเรียนนี้"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    disabled={!reviewText.trim() || reviewRating === 0 || reviewSubmitting}
                  >
                    <Send size={16} />
                    {reviewSubmitting ? 'กำลังบันทึก...' : 'ส่งความคิดเห็น'}
                  </button>
                </div>
              </form>

              {reviewMessage ? (
                <p
                  className={`mt-4 rounded-lg p-3 text-sm ${
                    reviewMessage.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {reviewMessage.text}
                </p>
              ) : null}

              <div className="mt-5 space-y-3">
                {reviewsLoading ? (
                  <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                    กำลังโหลดความคิดเห็น...
                  </div>
                ) : lessonReviews.length > 0 ? (
                  lessonReviews.map((review) => (
                    <article key={review.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-black">{review.studentName}</p>
                          <div className="mt-1 flex items-center gap-1 text-amber-500">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <Star
                                key={rating}
                                size={15}
                                fill={rating <= review.rating ? 'currentColor' : 'none'}
                                className={rating <= review.rating ? 'text-amber-500' : 'text-zinc-300'}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-zinc-400">
                          {new Intl.DateTimeFormat('th-TH', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(review.updatedAt || review.createdAt))}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-700">{review.text}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                    ยังไม่มีความคิดเห็นสำหรับบทนี้
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="hidden min-h-[520px] flex-col rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.06)] xl:sticky xl:top-4 xl:flex xl:h-[calc(100vh-2rem)] xl:max-h-[740px]">
              <div className="flex shrink-0 items-center gap-3 rounded-xl bg-[#faf9f7] px-3 py-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black ring-1 ring-zinc-200/80">
                  <Sparkles size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="min-w-0 text-lg font-semibold text-black">AI Tutor</h2>
                  <p className="mt-0.5 text-xs text-zinc-500">สรุป ถามตอบ และทบทวนบทนี้</p>
                </div>
              </div>

              <div className="mt-3 grid shrink-0 grid-cols-3 rounded-xl border border-zinc-200 bg-zinc-50 p-1 text-sm">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={[
                      'h-10 rounded-lg px-2 font-semibold transition',
                      activeTab === tab.id ? 'bg-white text-black shadow-[0_8px_20px_rgba(15,23,42,0.08)] ring-1 ring-zinc-200/80' : 'text-zinc-500 hover:bg-white/70 hover:text-black',
                    ].join(' ')}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 min-h-0 flex-1 overflow-hidden">
                {activeTab === 'summary' ? (
                  <div className="flex h-full min-h-0 flex-col gap-4">
                    <button
                      type="button"
                      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={generateSummary}
                      disabled={aiLoading === 'summary'}
                    >
                      <FileText size={15} />
                      {aiLoading === 'summary' ? 'กำลังสรุป...' : 'สร้างสรุปบทเรียน'}
                    </button>
                    {aiError ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{aiError}</p> : null}
                    <div className="ai-scroll-panel min-h-0 flex-1 overflow-y-auto rounded-2xl border border-zinc-200/70 bg-[#faf9f7] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      {aiSummary ? (
                        <AiResponsePanel text={aiSummary} />
                      ) : (
                        <AiEmptyState title="ยังไม่มีสรุปของคุณ" description="กดสร้างสรุปบทเรียนเพื่อให้ AI สรุปเนื้อหาชุดใหม่สำหรับบัญชีนี้" />
                      )}
                    </div>
                  </div>
                ) : null}

                {activeTab === 'assistant' ? (
                  <AIChatBox
                    lessonId={lesson.id}
                    lessonTitle={lesson.title}
                    embedded
                    className="h-full min-h-0 rounded-2xl border border-zinc-200/70 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                  />
                ) : null}

                {activeTab === 'quiz' ? (
                  <div className="flex h-full min-h-0 flex-col gap-4">
                    <button
                      type="button"
                      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={generateQuiz}
                      disabled={aiLoading === 'quiz' || quizGenerationsRemaining <= 0}
                    >
                      <HelpCircle size={16} />
                      {aiLoading === 'quiz'
                        ? 'กำลังสร้างแบบทดสอบ...'
                        : quizGenerationCount > 0
                          ? `สร้างชุดใหม่ ${quizGenerationCount}/${maxQuizGenerations}`
                          : 'สร้างแบบทดสอบ'}
                    </button>
                    {aiError ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{aiError}</p> : null}
                    <div className="ai-scroll-panel min-h-0 flex-1 overflow-y-auto rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      {aiQuiz ? (
                        <QuizCard questions={aiQuiz} onSubmitScore={saveQuizScore} />
                      ) : (
                        <AiEmptyState title="ยังไม่มีแบบทดสอบของคุณ" description="กดสร้างแบบทดสอบเพื่อเริ่มชุดคำถามใหม่สำหรับบัญชีนี้ คะแนนและประวัติจะไม่ปนกับผู้ใช้อื่น" />
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm xl:block">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-black">เนื้อหาคอร์ส</h2>
                <p className="text-sm text-zinc-500">{course.lessons.length} บทเรียน</p>
              </div>

              <div className="mt-5 space-y-2">
                {course.lessons.map((item, index) => {
                  const active = item.id === lesson.id
                  const completed = enrollment ? enrollment.completedLessons > index : false
                  const locked = !isEnrolledStudent && !item.preview

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={[
                        'grid w-full grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition',
                        active ? 'border-black bg-[#faf9f7] text-black shadow-sm' : 'border-transparent bg-white text-zinc-700 hover:border-zinc-200 hover:bg-zinc-50',
                      ].join(' ')}
                      onClick={() => openLesson(item.id)}
                    >
                      <span className={active ? 'text-xs font-semibold text-black' : 'text-xs text-zinc-500'}>{String(index + 1).padStart(2, '0')}</span>
                      <span className="min-w-0 truncate font-medium">{item.title}</span>
                      <span className="flex items-center gap-3 text-xs text-zinc-500">
                        <span>{item.duration}</span>
                        {active ? (
                          <PlayCircle size={16} className="text-black" />
                        ) : completed ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : locked ? (
                          <Lock size={15} className="text-zinc-400" />
                        ) : null}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          </aside>
        </div>
      </main>
      <button
        type="button"
        className={[
          'fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-[0_18px_42px_rgba(0,0,0,0.28)] transition hover:bg-zinc-800 xl:hidden',
          mobileAiOpen ? 'hidden' : 'inline-flex',
        ].join(' ')}
        onClick={openMobileAi}
        aria-label="เปิด AI Tutor"
      >
        <Sparkles size={22} />
      </button>
    </section>
  )
}
