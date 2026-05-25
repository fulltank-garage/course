import { Suspense, lazy, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Lock,
  Pencil,
  PlayCircle,
  ShoppingCart,
  Sparkles,
  Target,
  UserRound,
  X,
} from 'lucide-react'
import { api, authStorage, cartStorage } from '../services/api'
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
      <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-500">พรีวิวคอร์ส</p>
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

        <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-black">{course.title}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {isEnrolled
                ? 'คุณซื้อคอร์สนี้แล้ว พรีวิวนี้เป็นส่วนหนึ่งของคอร์สในหน้าห้องเรียนของคุณ'
                : 'ดูตัวอย่างได้ก่อนตัดสินใจ สิทธิ์เรียนเต็มจะขึ้นตามบัญชีนักเรียนของคุณ'}
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

function CourseInfoBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ClipboardList
  title: string
  children: ReactNode
}) {
  return (
    <article className="grid grid-cols-[56px_minmax(0,1fr)] gap-4">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#173f86] text-white shadow-[0_12px_30px_rgba(23,63,134,0.18)]">
        <Icon size={22} strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">{title}</h2>
        <div className="mt-4 text-base leading-8 text-zinc-600">{children}</div>
      </div>
    </article>
  )
}

export default function CourseDetail() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const purchasing = false
  const [cartItems, setCartItems] = useState(() => cartStorage.getItems())
  const [cartMessage, setCartMessage] = useState<string | null>(null)

  useEffect(() => cartStorage.subscribe(() => setCartItems(cartStorage.getItems())), [])

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

    return () => {
      active = false
    }
  }, [slug])

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
          <Link to="/" className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-black px-5 text-sm font-semibold text-white">
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
  const isInCart = cartItems.includes(course.slug)
  const purchaseLabel = !session
    ? 'เข้าสู่ระบบเพื่อซื้อคอร์ส'
    : isStaffAccount
    ? 'กลับแดชบอร์ด'
    : isInCart
    ? 'อยู่ในตะกร้าแล้ว'
    : 'เพิ่มลงตะกร้า'
  const viewerStateLabel = isEnrolled
    ? 'คุณได้ซื้อคอร์สแล้ว'
    : !session
    ? ''
    : isStaffAccount
    ? 'บัญชีนี้ใช้จัดการระบบ'
    : 'พร้อมเพิ่มลงตะกร้าด้วยบัญชีนักเรียน'
  const viewerStateDescription = isEnrolled
    ? 'คอร์สนี้อยู่ในหน้าคอร์สของฉันแล้ว ใช้หน้านี้สำหรับดูรายละเอียดและพรีวิว'
    : !session
    ? ''
    : isStaffAccount
    ? 'บัญชีครูหรือผู้ดูแลไม่สามารถซื้อคอร์สได้ ให้ใช้บัญชีนักเรียนสำหรับการซื้อ'
    : 'คุณเข้าสู่ระบบเป็นนักเรียนแล้ว สามารถเพิ่มคอร์สนี้ลงตะกร้าเพื่อไปชำระเงินต่อได้'
  const returnPath = isStudent ? (isEnrolled ? '/student?section=my-courses' : '/student/store') : '/'
  const returnLabel = isStudent ? (isEnrolled ? 'กลับไปคอร์สของฉัน' : 'กลับไปคอร์สทั้งหมดของนักเรียน') : 'กลับไปคอร์สทั้งหมด'
  const courseCode = course.id.slice(0, 6).toUpperCase()
  const coursePrice = formatPrice(course.price)
  const lessonTitles = course.lessons.map((lesson) => lesson.title)
  const learningObjectives = course.outcomes.length ? course.outcomes : [course.description]
  const courseTargetAudience = course.targetAudience ?? []
  const targetAudience = courseTargetAudience.length
    ? courseTargetAudience
    : [`ผู้เรียนระดับ ${course.level}`, `ผู้ที่สนใจหมวด ${course.category}`]
  const aiSupport =
    course.aiSupport?.trim() ||
    'ช่วยสรุปบทเรียน ถามตอบเนื้อหา และทบทวนความเข้าใจระหว่างเรียน'

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

    setPurchaseError(null)
    setCartMessage('เพิ่มลงตะกร้าแล้ว')
    cartStorage.addItem(course.slug)
    setPreviewLesson(null)
    window.setTimeout(() => setCartMessage(null), 1800)
  }

  return (
    <section className="bg-[#ffffff] text-black">
      <main>
        <section className="relative overflow-hidden border-b border-[#e4d9cb] bg-[#f3eee7] text-zinc-950">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.88),transparent_34%),radial-gradient(circle_at_82%_14%,rgba(226,209,186,0.52),transparent_36%),linear-gradient(135deg,rgba(250,247,242,0.9),rgba(234,225,214,0.82))]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-[0.18] blur-3xl saturate-75"
            style={{ backgroundImage: `url(${course.coverImage})` }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-[#f8f3ec]/58 backdrop-blur-[2px]" aria-hidden="true" />

          <div className="relative mx-auto grid min-h-[520px] w-full max-w-[1600px] items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:px-20">
            <div>
              <Link
                to={returnPath}
                className="mb-12 inline-flex h-11 items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 text-sm font-semibold text-zinc-800 shadow-[0_16px_40px_rgba(88,69,47,0.12),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur transition hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-zinc-950 hover:shadow-[0_20px_50px_rgba(88,69,47,0.18)]"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950 text-white shadow-sm">
                  <ArrowLeft size={15} />
                </span>
                {returnLabel}
              </Link>
              <h1 className="max-w-3xl text-5xl font-medium tracking-tight text-zinc-950 sm:text-6xl">
                {course.title}
              </h1>
              <div className="mt-8 flex flex-wrap items-center gap-4 text-zinc-950">
                <p className="text-2xl font-semibold">{courseCode}</p>
                <span className="h-6 w-px bg-zinc-300" />
                <p className="rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-xl font-semibold shadow-sm backdrop-blur">{coursePrice}</p>
              </div>
              <div className="mt-12 flex items-center gap-4 text-lg font-semibold text-zinc-850">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                <span>{course.category}</span>
              </div>
            </div>

            <div className="justify-self-center lg:justify-self-end">
              <img
                src={course.coverImage}
                alt={course.title}
                className="aspect-[1.15] w-full max-w-[470px] rounded-[18px] object-cover shadow-[0_30px_90px_rgba(101,78,52,0.18)] ring-8 ring-white/80"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1600px] gap-12 bg-[#ffffff] px-6 py-14 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.55fr)] lg:px-16">
          <div className="space-y-11">
            <CourseInfoBlock icon={ClipboardList} title="เป้าหมายการเรียนรู้">
              <p>{course.description}</p>
              {learningObjectives.length > 0 ? (
                <ul className="mt-4 list-disc space-y-1 pl-5">
                  {learningObjectives.slice(0, 4).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </CourseInfoBlock>

            <CourseInfoBlock icon={UserRound} title="วิทยากร">
              <p className="font-medium text-zinc-700">{course.instructor.name}</p>
              <p className="mt-1 text-sm text-zinc-500">{course.instructor.title}</p>
            </CourseInfoBlock>

            <CourseInfoBlock icon={Pencil} title="ประเด็นการเรียนรู้">
              <ol className="list-decimal space-y-1 pl-6">
                {lessonTitles.slice(0, 9).map((title, index) => (
                  <li key={`${title}-${index}`}>
                    บทที่ {index + 1} {title}
                  </li>
                ))}
              </ol>
            </CourseInfoBlock>
          </div>

          <div className="space-y-11">
            <CourseInfoBlock icon={Target} title="กลุ่มเป้าหมาย">
              <ol className="list-decimal space-y-1 pl-6">
                {targetAudience.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </CourseInfoBlock>

            <CourseInfoBlock icon={Sparkles} title="มี AI ช่วย">
              <p>{aiSupport}</p>
            </CourseInfoBlock>

            <CourseInfoBlock icon={Clock3} title="จำนวนชั่วโมงการเรียนรู้">
              <p>{course.duration}</p>
            </CourseInfoBlock>
          </div>
        </section>

        <section className="border-y border-zinc-100 bg-zinc-50">
          <div className="mx-auto w-full max-w-[1600px] px-6 py-12 sm:px-10 lg:px-16">
            <div className="max-w-3xl">
              <p className="text-xl font-semibold text-cyan-600">
                {course.students.toLocaleString('th-TH')} คน ลงทะเบียนเรียนรอบนี้แล้ว
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <p className="inline-flex rounded-full border border-zinc-200 bg-white px-4 py-2 text-base font-semibold text-zinc-950 shadow-sm">
                  ค่าคอร์ส {coursePrice}
                </p>
                {viewerStateLabel ? <p className="text-base font-semibold text-zinc-950">{viewerStateLabel}</p> : null}
              </div>
              <p className="mt-4 text-base leading-7 text-zinc-600">
                {session ? viewerStateDescription : 'โปรดเข้าสู่ระบบเพื่อลงทะเบียนรายวิชา'}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {primaryPreviewLesson && session ? (
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 transition hover:border-zinc-950"
                    onClick={() => setPreviewLesson(primaryPreviewLesson)}
                  >
                    <PlayCircle size={17} />
                    ดูตัวอย่าง
                  </button>
                ) : null}
                {isEnrolled && isStudent ? (
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#173f86] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#12336c]"
                    onClick={() => navigate(learningPath)}
                  >
                    เข้าเรียน
                    <ArrowRight size={17} />
                  </button>
                ) : !isEnrolled && isStudent ? (
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#173f86] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#12336c] disabled:cursor-not-allowed disabled:bg-zinc-300"
                    onClick={handlePurchase}
                    disabled={purchasing}
                  >
                    <ShoppingCart size={17} />
                    {purchaseLabel}
                  </button>
                ) : isStaffAccount ? (
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#173f86] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#12336c]"
                    onClick={handlePurchase}
                  >
                    {purchaseLabel}
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#173f86] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#12336c]"
                    onClick={handlePurchase}
                  >
                    เข้าสู่ระบบเพื่อซื้อคอร์ส
                  </button>
                )}
              </div>
              {cartMessage ? <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{cartMessage}</p> : null}
              {purchaseError ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{purchaseError}</p> : null}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1600px] px-6 py-14 sm:px-10 lg:px-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight text-zinc-950">ประมวลผลรายวิชา</h2>
              <p className="mt-3 text-base text-zinc-500">บทเรียนทั้งหมดในคอร์สนี้</p>
            </div>
            <p className="text-sm font-semibold text-zinc-500">{getLessonCount(course)} บทเรียน</p>
          </div>

          <div className="mt-8 divide-y divide-zinc-200 rounded-[18px] border border-zinc-200 bg-white">
            {course.lessons.map((lesson, index) => {
              const canPreview = Boolean(session || isEnrolled) && lesson.id === primaryPreviewLesson?.id

              return (
                <div key={lesson.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-950">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-base font-semibold text-zinc-950">{lesson.title}</h3>
                      <p className="mt-1 text-sm text-zinc-500">{lesson.duration || 'ไม่ระบุเวลา'}</p>
                      {lesson.summary ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-500">{lesson.summary}</p> : null}
                    </div>
                  </div>

                  {canPreview ? (
                    <button
                      type="button"
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-950 transition hover:border-zinc-950"
                      onClick={() => setPreviewLesson(lesson)}
                    >
                      <PlayCircle size={16} />
                      ดูตัวอย่าง
                    </button>
                  ) : isEnrolled ? (
                    <span className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-emerald-50 px-4 text-sm font-semibold text-emerald-700">
                      <CheckCircle2 size={15} />
                      เรียนได้
                    </span>
                  ) : (
                    <span className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-zinc-100 px-4 text-sm font-semibold text-zinc-500">
                      <Lock size={15} />
                      หลังลงทะเบียน
                    </span>
                  )}
                </div>
              )
            })}
          </div>
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

