import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  MonitorSmartphone,
  ShieldCheck,
  Star,
} from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'
import type { Course } from '../types/course'
import type { Sponsor } from '../types/sponsor'

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
const getCourseReviewAverage = (course: Course) => course.reviewAverage ?? course.rating
const getCourseReviewCount = (course: Course) => course.reviewCount ?? 0

const getFeaturedCourses = (courses: Course[]) =>
  [...courses]
    .sort((left, right) => {
      const popularScore = Number(Boolean(right.isPopular)) - Number(Boolean(left.isPopular))
      if (popularScore !== 0) return popularScore
      const averageDifference = getCourseReviewAverage(right) - getCourseReviewAverage(left)
      if (averageDifference !== 0) return averageDifference
      const reviewCountDifference = getCourseReviewCount(right) - getCourseReviewCount(left)
      if (reviewCountDifference !== 0) return reviewCountDifference
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
  const reviewAverage = getCourseReviewAverage(course)
  const reviewCount = getCourseReviewCount(course)

  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group mx-auto grid h-full w-full max-w-[360px] grid-rows-[auto_1fr] overflow-hidden rounded-[18px] border border-zinc-200 bg-[#ffffff] transition hover:-translate-y-0.5 hover:border-black hover:shadow-[0_16px_42px_rgba(15,23,42,0.08)]"
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
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {reviewAverage.toFixed(1)}
          </span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1">{formatNumber(reviewCount)} รีวิว</span>
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

function SponsorPill({ sponsor }: { sponsor: Sponsor }) {
  const [imageError, setImageError] = useState(false)
  const Wrapper = sponsor.websiteUrl ? 'a' : 'div'

  return (
    <Wrapper
      {...(sponsor.websiteUrl
        ? {
            href: sponsor.websiteUrl,
            target: '_blank',
            rel: 'noreferrer',
          }
        : {})}
      className="flex h-[4.5rem] min-w-[176px] items-center justify-center rounded-[20px] border border-white/12 bg-white/[0.06] px-6 text-center text-lg font-semibold tracking-[0.02em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.09]"
    >
      {sponsor.logoUrl && !imageError ? (
        <img
          src={sponsor.logoUrl}
          alt={sponsor.name}
          className="h-8 w-auto max-w-[132px] object-contain"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="whitespace-nowrap text-white/90">{sponsor.name}</span>
      )}
    </Wrapper>
  )
}

function SponsorMarqueeRow({
  items,
  reverse = false,
}: {
  items: Sponsor[]
  reverse?: boolean
}) {
  const repeatedItems = [...items, ...items]

  return (
    <div className="overflow-hidden">
      <div className={reverse ? 'sponsor-marquee-track sponsor-marquee-track-reverse' : 'sponsor-marquee-track'}>
        {repeatedItems.map((item, index) => (
          <SponsorPill key={`${item.id}-${index}`} sponsor={item} />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const { data, error, loading } = useApi(async () => {
    const [courses, sponsors] = await Promise.all([api.getCourses(), api.getSponsors()])
    return { courses, sponsors }
  }, [])

  const publishedCourses = useMemo(
    () => (data?.courses ?? []).filter((course) => (course.status ?? 'published') === 'published'),
    [data?.courses],
  )
  const featuredCourses = useMemo(() => getFeaturedCourses(publishedCourses), [publishedCourses])
  const sponsors = useMemo(
    () => [...(data?.sponsors ?? [])].sort((left, right) => left.displayOrder - right.displayOrder),
    [data?.sponsors],
  )
  const sponsorRowA = sponsors.slice(0, Math.max(1, Math.ceil(sponsors.length / 2)))
  const sponsorRowB = sponsors.slice(Math.max(1, Math.ceil(sponsors.length / 2)))
  const courseTotal = publishedCourses.length

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
            <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">คอร์สแนะนำ</h2>
          </div>
        </div>

        <div className="mt-8">
          {loading ? <LoadingBlock /> : null}
          {error ? (
            <div className="rounded-[20px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
          ) : null}
          {!loading && !error && featuredCourses.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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

      {sponsors.length > 0 ? (
        <section className="w-full pb-14">
          <div className="w-full overflow-hidden border-y border-zinc-200 bg-black py-7 text-white sm:py-8">
            <div className="container-page">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">Sponsors</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                      ผู้สนับสนุนที่ร่วมผลักดันการเรียนรู้
                    </h2>
                  </div>
                  <p className="max-w-2xl text-sm leading-7 text-white/60">
                    โลโก้องค์กรที่ร่วมสนับสนุนการเติบโตของแพลตฟอร์มและประสบการณ์การเรียนรู้ของผู้ใช้
                  </p>
                </div>

                <div className="relative space-y-4">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black via-black/80 to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black via-black/80 to-transparent" />
                  <SponsorMarqueeRow items={sponsorRowA} />
                  <SponsorMarqueeRow items={sponsorRowB.length > 0 ? sponsorRowB : sponsorRowA} reverse />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
