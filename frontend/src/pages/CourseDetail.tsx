import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  CreditCard,
  LoaderCircle,
  Lock,
  PlayCircle,
  Star,
  UserRound,
  X,
} from 'lucide-react'
import { api, authStorage } from '../services/api'
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
const getLearningPath = (course: Course) =>
  course.viewerState?.enrollment?.lastLessonId
    ? `/learn/${course.slug}?lesson=${course.viewerState.enrollment.lastLessonId}`
    : `/learn/${course.slug}`

function PreviewModal({
  course,
  lesson,
  onClose,
  onPurchase,
  purchaseLabel,
  purchasing,
  isEnrolled,
}: {
  course: Course
  lesson: Lesson
  onClose: () => void
  onPurchase: () => void
  purchaseLabel: string
  purchasing: boolean
  isEnrolled: boolean
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-zinc-200 bg-[#ffffff] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-500">พรีวิวคอร์ส</p>
            <h2 className="mt-1 truncate text-lg font-semibold text-black">{lesson.title}</h2>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-[#ffffff] text-zinc-600 transition hover:border-black hover:text-black"
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

        <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-black">{course.title}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {isEnrolled
                ? 'คุณซื้อคอร์สนี้แล้ว พรีวิวนี้เป็นส่วนหนึ่งของคอร์สในหน้าห้องเรียนของคุณ'
                : 'ดูตัวอย่างได้ก่อนตัดสินใจซื้อ สิทธิ์เรียนเต็มจะขึ้นตามบัญชีนักเรียนของคุณ'}
            </p>
          </div>
          {!isEnrolled ? (
            <button
              type="button"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              onClick={onPurchase}
              disabled={purchasing}
            >
              {purchasing ? 'กำลังดำเนินการ...' : purchaseLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function CourseDetail() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [suggestedCourses, setSuggestedCourses] = useState<Course[]>([])
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [purchasing, setPurchasing] = useState(false)

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
  const learningPath = getLearningPath(course)
  const session = authStorage.getSession()
  const isStudent = session?.user.role === 'student'
  const isStaffAccount = Boolean(session && !isStudent)
  const purchaseLabel = !session
    ? 'เข้าสู่ระบบเพื่อซื้อคอร์ส'
    : isStaffAccount
    ? 'กลับแดชบอร์ด'
    : course.price === 0
      ? 'สมัครเรียนฟรี'
      : 'ซื้อคอร์สนี้'
  const viewerStateLabel = isEnrolled
    ? 'คุณได้ซื้อคอร์สแล้ว'
    : !session
    ? 'โหมดพรีวิวสำหรับผู้ใช้ทั่วไป'
    : isStaffAccount
    ? 'บัญชีนี้ใช้จัดการระบบ'
    : 'พร้อมซื้อด้วยบัญชีนักเรียน'
  const viewerStateDescription = isEnrolled
    ? 'คอร์สนี้อยู่ในหน้าคอร์สของฉันแล้ว ใช้หน้านี้สำหรับดูรายละเอียดและพรีวิว'
    : !session
    ? 'ดูรายละเอียดและวิดีโอตัวอย่างได้ก่อน แต่ต้องเข้าสู่ระบบด้วยบัญชีนักเรียนก่อนซื้อคอร์ส'
    : isStaffAccount
    ? 'บัญชีครูหรือผู้ดูแลไม่สามารถซื้อคอร์สได้ ให้ใช้บัญชีนักเรียนสำหรับการซื้อ'
    : 'คุณเข้าสู่ระบบเป็นนักเรียนแล้ว สามารถซื้อคอร์สนี้และเข้าเรียนได้ทันที'
  const returnPath = isStudent ? (isEnrolled ? '/student?section=my-courses' : '/student/store') : '/courses'
  const returnLabel = isStudent
    ? isEnrolled
      ? 'กลับไปคอร์สของฉัน'
      : 'กลับไปคอร์สทั้งหมดของนักเรียน'
    : 'กลับไปคอร์สทั้งหมด'

  const handlePurchase = async () => {
    if (isEnrolled) {
      navigate(learningPath)
      return
    }

    if (!session) {
      navigate('/login')
      return
    }

    if (session.user.role !== 'student') {
      navigate(session.dashboardPath)
      return
    }

    setPurchasing(true)
    setPurchaseError(null)

    try {
      const result = await api.enrollCourse(course.slug)
      navigate(
        result.enrollment.lastLessonId
          ? `/learn/${course.slug}?lesson=${result.enrollment.lastLessonId}`
          : `/learn/${course.slug}`,
        { replace: true },
      )
    } catch (currentError) {
      setPurchaseError(currentError instanceof Error ? currentError.message : 'ซื้อคอร์สไม่สำเร็จ')
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <section className="bg-[#ffffff] text-black">
      <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link to={returnPath} className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-black">
          <ArrowLeft size={16} />
          {returnLabel}
        </Link>

        <section className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-[#ffffff]">
              <img src={course.coverImage} alt={course.title} className="aspect-[16/8] w-full object-cover" />
            </div>

            <div className="mt-8">
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-zinc-600">
                <span className="rounded-full bg-zinc-100 px-3 py-1">{course.category}</span>
                <span className="rounded-full border border-zinc-200 px-3 py-1">{course.level}</span>
                <span className={isEnrolled ? 'rounded-full bg-emerald-50 px-3 py-1 text-emerald-700' : 'rounded-full bg-black px-3 py-1 text-white'}>
                  {isEnrolled ? 'คุณได้ซื้อคอร์สแล้ว' : 'พรีวิวคอร์ส'}
                </span>
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

              <div className="mt-5 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-[#ffffff]">
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
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-[#ffffff] px-3 text-sm font-semibold text-black transition hover:border-black"
                          onClick={() => setPreviewLesson(lesson)}
                        >
                          <PlayCircle size={15} />
                          ดูตัวอย่าง
                        </button>
                      ) : isEnrolled ? (
                        <span className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 text-sm font-semibold text-emerald-700">
                          <CheckCircle2 size={14} />
                          เรียนได้ในห้องเรียน
                        </span>
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
                    <Link key={item.id} to={`/courses/${item.slug}`} className="group rounded-lg border border-zinc-200 bg-[#ffffff] p-3 transition hover:border-black">
                      <img src={item.coverImage} alt={item.title} className="aspect-video w-full rounded-md object-cover" />
                      <p className="mt-3 line-clamp-2 text-sm font-semibold text-black group-hover:underline">{item.title}</p>
                      <p className="mt-2 text-sm font-semibold text-black">{formatPrice(item.price)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="h-fit rounded-lg border border-zinc-200 bg-[#ffffff] p-5 lg:sticky lg:top-24">
            {isEnrolled && isStudent ? (
              <>
                <p className="text-sm font-semibold text-zinc-500">สถานะคอร์ส</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-black">ซื้อแล้ว</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">คอร์สนี้อยู่ในหน้าคอร์สของฉันแล้ว หน้านี้ใช้ดูรายละเอียดและพรีวิวแบบย่อ</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-semibold tracking-tight text-black">{formatPrice(course.price)}</p>
                <p className="mt-2 text-sm text-zinc-500">รายละเอียดคอร์สและพรีวิวใช้ธีมเดียวกัน สิทธิ์ซื้อและเข้าเรียนขึ้นกับบัญชีที่ใช้อยู่</p>
              </>
            )}

            <div className={['mt-5 rounded-lg border p-4 text-sm leading-6', isEnrolled ? 'border-zinc-200 bg-zinc-50 text-zinc-700' : 'border-zinc-200 bg-zinc-50 text-zinc-700'].join(' ')}>
              <p className="font-semibold text-black">{viewerStateLabel}</p>
              <p className="mt-1">{viewerStateDescription}</p>
            </div>

            <div className="mt-6 grid gap-3">
              {primaryPreviewLesson ? (
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-[#ffffff] text-sm font-semibold text-black transition hover:border-black"
                  onClick={() => setPreviewLesson(primaryPreviewLesson)}
                >
                  <PlayCircle size={17} />
                  ดูวิดีโอตัวอย่าง
                </button>
              ) : null}

              {!isEnrolled && isStudent ? (
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-black text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                  onClick={handlePurchase}
                  disabled={purchasing}
                >
                  {purchasing ? <LoaderCircle size={17} className="animate-spin" /> : <CreditCard size={17} />}
                  {purchasing ? 'กำลังดำเนินการ...' : purchaseLabel}
                </button>
              ) : isStaffAccount ? (
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-black text-sm font-semibold text-white transition hover:bg-zinc-800"
                  onClick={handlePurchase}
                >
                  {purchaseLabel}
                  <ArrowRight size={17} />
                </button>
              ) : null}

              {!isEnrolled && !session ? (
                <div className="rounded-lg border border-zinc-200 bg-[#ffffff] p-4 text-sm leading-6 text-zinc-700">
                  <p className="font-semibold">ต้องเข้าสู่ระบบก่อนซื้อคอร์ส</p>
                  <p className="mt-1">ใช้บัญชีนักเรียนเพื่อบันทึกคอร์สไว้ในหน้าเรียนของคุณ หลังเข้าสู่ระบบแล้วค่อยกดซื้อคอร์สได้ทันที</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to="/login" className="inline-flex h-9 items-center justify-center rounded-md bg-black px-3 text-sm font-semibold text-white transition hover:bg-zinc-800">
                      เข้าสู่ระบบ
                    </Link>
                    <Link to="/register" className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-[#ffffff] px-3 text-sm font-semibold text-black transition hover:border-black">
                      สมัครสมาชิก
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            {purchaseError ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{purchaseError}</p> : null}

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

      {previewLesson ? (
        <PreviewModal
          course={course}
          lesson={previewLesson}
          onClose={() => setPreviewLesson(null)}
          onPurchase={handlePurchase}
          purchaseLabel={purchaseLabel}
          purchasing={purchasing}
          isEnrolled={isEnrolled}
        />
      ) : null}
    </section>
  )
}
