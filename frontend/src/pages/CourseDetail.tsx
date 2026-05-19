import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  CreditCard,
  Lock,
  PlayCircle,
  Star,
  UserRound,
  X,
} from 'lucide-react'
import { api } from '../services/api'
import type { Course, Lesson } from '../types/course'
import { resolveVideoSource } from '../utils/video'

const MuxPlayer = lazy(() => import('@mux/mux-player-react'))

const formatPrice = (price: number) =>
  price === 0
    ? 'ฟรี'
    : new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        maximumFractionDigits: 0,
      }).format(price)

const getLessonCount = (course: Course) => course.lessonCount ?? course.lessons.length

function PreviewModal({
  course,
  lesson,
  onClose,
}: {
  course: Course
  lesson: Lesson
  onClose: () => void
}) {
  const videoSource = resolveVideoSource(lesson.videoUrl)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Preview</p>
            <h2 className="mt-1 truncate text-lg font-semibold text-black">{lesson.title}</h2>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-black hover:text-black"
            onClick={onClose}
            aria-label="ปิดวิดีโอตัวอย่าง"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-black">
          {videoSource?.kind === 'youtube' ? (
            <iframe
              className="aspect-video max-h-[72vh] w-full bg-black"
              src={videoSource.embedUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : videoSource?.kind === 'mux' ? (
            <Suspense
              fallback={
                <div className="flex aspect-video max-h-[72vh] w-full items-center justify-center bg-black text-sm text-zinc-300">
                  กำลังโหลดวิดีโอตัวอย่าง...
                </div>
              }
            >
              <MuxPlayer
                className="aspect-video max-h-[72vh] w-full bg-black"
                playbackId={videoSource.playbackId}
                streamType="on-demand"
                poster={course.coverImage}
              />
            </Suspense>
          ) : videoSource?.kind === 'direct' ? (
            <video
              className="aspect-video max-h-[72vh] w-full bg-black object-contain"
              controls
              playsInline
              preload="metadata"
              poster={course.coverImage}
              src={videoSource.src}
            />
          ) : (
            <div className="flex aspect-video max-h-[72vh] w-full items-center justify-center bg-black text-center text-white">
              <div>
                <PlayCircle size={46} className="mx-auto text-zinc-300" />
                <p className="mt-3 text-sm text-zinc-300">บทเรียนนี้ยังไม่มีวิดีโอตัวอย่าง</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">{course.title}</p>
          <Link
            to={`/checkout/${course.slug}`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            สมัครเรียนคอร์สนี้
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CourseDetail() {
  const { slug = '' } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [suggestedCourses, setSuggestedCourses] = useState<Course[]>([])
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    setLoading(true)
    setError(null)

    api
      .getCourse(slug)
      .then((result) => {
        if (active) setCourse(result)
      })
      .catch((currentError: Error) => {
        if (active) setError(currentError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    api
      .getCourses()
      .then((result) => {
        if (active) setSuggestedCourses(result)
      })
      .catch(() => {
        if (active) setSuggestedCourses([])
      })

    return () => {
      active = false
    }
  }, [slug])

  const recommendedCourses = useMemo(() => {
    if (!course) return []

    return suggestedCourses
      .filter((item) => item.slug !== course.slug && (item.status ?? 'published') === 'published')
      .sort((left, right) => {
        const leftCategoryMatch = left.category === course.category ? 1 : 0
        const rightCategoryMatch = right.category === course.category ? 1 : 0
        if (leftCategoryMatch !== rightCategoryMatch) return rightCategoryMatch - leftCategoryMatch
        return right.rating - left.rating
      })
      .slice(0, 3)
  }, [course, suggestedCourses])

  if (loading) {
    return (
      <section className="container-page py-12">
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-sm text-zinc-500">กำลังโหลดรายละเอียดคอร์ส...</div>
      </section>
    )
  }

  if (error || !course) {
    return (
      <section className="container-page py-12">
        <div className="mx-auto max-w-xl rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-semibold text-black">ไม่พบคอร์ส</h1>
          <p className="mt-2 text-sm text-zinc-500">{error ?? 'คอร์สนี้อาจถูกลบหรือ URL ไม่ถูกต้อง'}</p>
          <Link to="/courses" className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-black px-5 text-sm font-semibold text-white">
            กลับไปดูคอร์สทั้งหมด
          </Link>
        </div>
      </section>
    )
  }

  const publicPreviewLessons = course.lessons.filter((lesson) => lesson.preview)
  const primaryPreviewLesson = publicPreviewLessons.find((lesson) => lesson.videoUrl) ?? null
  const isEnrolled = Boolean(course.viewerState?.isEnrolled)
  const checkoutPath = `/checkout/${course.slug}`
  const learningPath = `/learn/${course.slug}`

  return (
    <section className="bg-white text-black">
      <main className="container-page py-8 sm:py-12">
        <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-black">
          <ArrowLeft size={16} />
          กลับไปคอร์สทั้งหมด
        </Link>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <img src={course.coverImage} alt={course.title} className="aspect-[16/8] w-full object-cover" />
            </div>

            <div className="mt-8">
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-zinc-600">
                <span className="rounded-full bg-zinc-100 px-3 py-1">{course.category}</span>
                <span className="rounded-full border border-zinc-200 px-3 py-1">{course.level}</span>
                {primaryPreviewLesson ? <span className="rounded-full bg-black px-3 py-1 text-white">มีวิดีโอตัวอย่าง</span> : null}
              </div>

              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-black sm:text-5xl">{course.title}</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-600">{course.description}</p>

              <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-zinc-600">
                <span className="inline-flex items-center gap-1">
                  <Star size={17} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-black">{course.rating.toFixed(1)}</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <BookOpen size={17} />
                  {getLessonCount(course)} บทเรียน
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 size={17} />
                  {course.duration}
                </span>
              </div>

              <div className="mt-7 flex items-center gap-3">
                {course.instructor.avatarUrl ? (
                  <img src={course.instructor.avatarUrl} alt={course.instructor.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-black">
                    <UserRound size={18} />
                  </span>
                )}
                <div>
                  <p className="text-sm text-zinc-500">
                    สอนโดย <span className="font-semibold text-black">{course.instructor.name}</span>
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">{course.instructor.title}</p>
                </div>
              </div>
            </div>

            <section className="mt-10 border-t border-zinc-200 pt-8">
              <h2 className="text-2xl font-semibold text-black">สิ่งที่จะได้เรียน</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(course.outcomes.length ? course.outcomes : ['เข้าใจพื้นฐานของคอร์สนี้', 'ฝึกจากบทเรียนที่จัดเป็นลำดับ']).map((item) => (
                  <div key={item} className="flex gap-3 text-sm leading-7 text-zinc-700">
                    <CheckCircle2 size={17} className="mt-1 shrink-0 text-black" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10 border-t border-zinc-200 pt-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-black">บทเรียนในคอร์ส</h2>
                  <p className="mt-2 text-sm text-zinc-500">ดูรายชื่อบทเรียนได้ก่อนสมัคร เฉพาะบท preview เท่านั้นที่เปิดวิดีโอได้</p>
                </div>
                {primaryPreviewLesson ? (
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
                    onClick={() => setPreviewLesson(primaryPreviewLesson)}
                  >
                    <PlayCircle size={16} />
                    ดูตัวอย่าง
                  </button>
                ) : null}
              </div>

              <div className="mt-5 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
                {course.lessons.map((lesson, index) => {
                  const canPreview = lesson.preview && Boolean(lesson.videoUrl)

                  return (
                    <div key={lesson.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-black">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-semibold text-black">{lesson.title}</p>
                          <p className="mt-1 text-xs text-zinc-500">{lesson.duration || 'ไม่ระบุเวลา'}</p>
                        </div>
                      </div>

                      {canPreview ? (
                        <button
                          type="button"
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-black transition hover:border-black"
                          onClick={() => setPreviewLesson(lesson)}
                        >
                          <PlayCircle size={15} />
                          ดูตัวอย่าง
                        </button>
                      ) : lesson.preview ? (
                        <span className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-100 px-3 text-sm font-semibold text-zinc-500">
                          Preview
                        </span>
                      ) : (
                        <span className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-3 text-sm font-semibold text-zinc-500">
                          <Lock size={14} />
                          ปลดล็อกหลังสมัคร
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {recommendedCourses.length > 0 ? (
              <section className="mt-10 border-t border-zinc-200 pt-8">
                <h2 className="text-2xl font-semibold text-black">คอร์สที่เกี่ยวข้อง</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {recommendedCourses.map((item) => (
                    <Link key={item.id} to={`/courses/${item.slug}`} className="group rounded-lg border border-zinc-200 bg-white p-3 transition hover:border-black">
                      <img src={item.coverImage} alt={item.title} className="aspect-video w-full rounded-md object-cover" />
                      <p className="mt-3 line-clamp-2 text-sm font-semibold text-black group-hover:underline">{item.title}</p>
                      <p className="mt-2 text-sm font-semibold text-black">{formatPrice(item.price)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-6 lg:sticky lg:top-24">
            <p className="text-3xl font-semibold tracking-tight text-black">{formatPrice(course.price)}</p>
            <p className="mt-2 text-sm text-zinc-500">ดูรายละเอียดและวิดีโอตัวอย่างได้ก่อนสมัคร</p>

            <div className="mt-6 grid gap-3">
              {primaryPreviewLesson ? (
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-semibold text-black transition hover:border-black"
                  onClick={() => setPreviewLesson(primaryPreviewLesson)}
                >
                  <PlayCircle size={17} />
                  ดูวิดีโอตัวอย่าง
                </button>
              ) : null}

              {isEnrolled ? (
                <Link
                  to={learningPath}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  ไปหน้าห้องเรียน
                  <ArrowRight size={17} />
                </Link>
              ) : (
                <Link
                  to={checkoutPath}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  <CreditCard size={17} />
                  {course.price === 0 ? 'สมัครเรียนฟรี' : 'ซื้อคอร์สนี้'}
                </Link>
              )}
            </div>

            <div className="mt-6 space-y-4 border-t border-zinc-200 pt-6 text-sm text-zinc-700">
              <div className="flex items-center justify-between gap-4">
                <span>หมวดหมู่</span>
                <span className="font-semibold text-black">{course.category}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>ระดับ</span>
                <span className="font-semibold text-black">{course.level}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>จำนวนบทเรียน</span>
                <span className="font-semibold text-black">{getLessonCount(course)} บทเรียน</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>ระยะเวลา</span>
                <span className="font-semibold text-black">{course.duration}</span>
              </div>
            </div>
          </aside>
        </section>
      </main>

      {previewLesson ? <PreviewModal course={course} lesson={previewLesson} onClose={() => setPreviewLesson(null)} /> : null}
    </section>
  )
}
