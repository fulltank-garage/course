import { useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'
import type { Course } from '../types/course'

const formatPrice = (price: number) =>
  price === 0
    ? 'ฟรี'
    : new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        maximumFractionDigits: 0,
      }).format(price)

const formatNumber = (value: number) => value.toLocaleString('th-TH')
const getLessonCount = (course: Course) => Math.max(course.lessonCount ?? 0, course.lessons.length)

const getFeaturedCourses = (courses: Course[]) =>
  [...courses]
    .sort((left, right) => {
      const popularScore = Number(Boolean(right.isPopular)) - Number(Boolean(left.isPopular))
      if (popularScore !== 0) return popularScore
      if (right.rating !== left.rating) return right.rating - left.rating
      return right.students - left.students
    })
    .slice(0, 6)

function HeroCarousel({ courses }: { courses: Course[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const hasMultipleCourses = courses.length > 1

  const scrollCarousel = (direction: 'previous' | 'next') => {
    const container = scrollRef.current
    if (!container) return

    const firstCard = container.querySelector<HTMLElement>('[data-hero-course-card]')
    const cardWidth = firstCard?.offsetWidth ?? container.clientWidth
    const gap = 20
    const left = direction === 'previous' ? -(cardWidth + gap) : cardWidth + gap

    container.scrollBy({ left, behavior: 'smooth' })
  }

  if (!courses.length) {
    return (
      <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-8 text-center text-sm leading-7 text-zinc-600">
        ยังไม่มีคอร์สที่เผยแพร่ในระบบ
      </div>
    )
  }

  return (
    <section className="relative w-full overflow-hidden">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-2 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/courses/${course.slug}`}
            aria-label={course.title}
            data-hero-course-card
            className="group block w-[78vw] shrink-0 snap-center overflow-hidden rounded-[20px] border border-zinc-200 bg-zinc-100 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-zinc-300 sm:w-[520px] md:w-[600px] lg:w-[680px] xl:w-[760px]"
          >
            <div className="aspect-[16/5] overflow-hidden">
              <img
                src={course.coverImage}
                alt={course.title}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
              />
            </div>
          </Link>
        ))}
      </div>

      {hasMultipleCourses ? (
        <>
          <button
            type="button"
            className="absolute left-6 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#ffffff] text-black shadow-[0_10px_30px_rgba(15,23,42,0.14)] ring-1 ring-zinc-200 transition hover:bg-zinc-50 lg:left-10"
            onClick={() => scrollCarousel('previous')}
            aria-label="คอร์สก่อนหน้า"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="absolute right-6 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#ffffff] text-black shadow-[0_10px_30px_rgba(15,23,42,0.14)] ring-1 ring-zinc-200 transition hover:bg-zinc-50 lg:right-10"
            onClick={() => scrollCarousel('next')}
            aria-label="คอร์สถัดไป"
          >
            <ChevronRight size={18} />
          </button>
        </>
      ) : null}
    </section>
  )
}

function CompactCourseCard({ course }: { course: Course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-[18px] border border-zinc-200 bg-[#ffffff] transition hover:-translate-y-0.5 hover:border-black hover:shadow-[0_16px_42px_rgba(15,23,42,0.08)]"
    >
      <div className="relative aspect-[1.62] overflow-hidden bg-zinc-100">
        <img
          src={course.coverImage}
          alt={course.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-col p-3.5">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-zinc-500">
          <span>{course.category}</span>
        </div>
        <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold leading-5 text-black">{course.title}</h3>
        <p className="mt-1.5 line-clamp-1 text-xs text-zinc-500">{course.instructor.name}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-zinc-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-black">
            <Star size={12} className="fill-black text-black" />
            {course.rating.toFixed(1)}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1">{formatNumber(course.students)} ผู้เรียน</span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1">{getLessonCount(course)} บทเรียน</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-sm font-semibold text-black">{formatPrice(course.price)}</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500">
            ดูรายละเอียด
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  )
}

function LoadingBlock() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-72 animate-pulse rounded-[22px] border border-zinc-200 bg-zinc-100" />
      ))}
    </div>
  )
}

export default function Home() {
  const { data, error, loading } = useApi(() => api.getCourses(), [])

  const publishedCourses = useMemo(
    () => (data ?? []).filter((course) => (course.status ?? 'published') === 'published'),
    [data],
  )
  const featuredCourses = useMemo(() => getFeaturedCourses(publishedCourses), [publishedCourses])
  const courseTotal = publishedCourses.length
  const categories = Array.from(new Set(publishedCourses.map((course) => course.category)))
  const topCategories = categories.slice(0, 5)

  return (
    <div className="bg-[#ffffff] text-black">
      <section className="w-full pb-10 pt-8 sm:pb-12 sm:pt-10">
        <HeroCarousel courses={featuredCourses} />
      </section>

      <section className="border-y border-zinc-200 bg-zinc-50/70">
        <div className="container-page grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [BookOpen, 'คอร์สจากระบบ', `${formatNumber(courseTotal)} คอร์สที่เผยแพร่`],
            [Brain, 'AI Learning', 'สรุปบทเรียนและช่วยถามตอบ'],
            [ShieldCheck, 'Certificate', 'รองรับใบรับรองเมื่อเรียนครบ'],
            [MonitorSmartphone, 'Responsive', 'เรียนได้ทั้งมือถือและเดสก์ท็อป'],
          ].map(([Icon, title, description]) => {
            const FeatureIcon = Icon as typeof BookOpen

            return (
              <article key={title as string} className="flex items-center gap-4 rounded-[18px] bg-[#ffffff] px-4 py-4 ring-1 ring-zinc-200/80">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-black">
                  <FeatureIcon size={20} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-black">{title as string}</h2>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{description as string}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="container-page py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">คอร์สแนะนำจากข้อมูลจริง</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
              เรียงจากคอร์สยอดนิยม คะแนน และจำนวนผู้เรียนในระบบ เพื่อให้หน้า Home เปลี่ยนตามข้อมูลล่าสุดของโปรเจกต์
            </p>
          </div>
        </div>

        <div className="mt-8">
          {loading ? <LoadingBlock /> : null}
          {error ? (
            <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
          ) : null}
          {!loading && !error && featuredCourses.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCourses.map((course) => (
                <CompactCourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : null}
          {!loading && !error && featuredCourses.length === 0 ? (
            <div className="rounded-[20px] border border-zinc-200 bg-zinc-50 p-6 text-sm leading-7 text-zinc-600">
              ยังไม่มีคอร์สเผยแพร่สำหรับแสดงในหน้าแรก
            </div>
          ) : null}
        </div>
      </section>

      {topCategories.length > 0 ? (
        <section className="container-page pb-14">
          <div className="rounded-[28px] border border-zinc-200 bg-black p-6 text-white sm:p-8">
            <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <Sparkles size={24} />
                <h2 className="mt-5 text-3xl font-semibold tracking-tight">เลือกเส้นทางเรียนจากหมวดที่มีอยู่</h2>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  หมวดเหล่านี้สร้างจากคอร์สที่เผยแพร่จริงในฐานข้อมูล
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {topCategories.map((category) => {
                  const count = publishedCourses.filter((course) => course.category === category).length

                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-white/10 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      <span>{category}</span>
                      <span className="text-white/65">{formatNumber(count)} คอร์ส</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
