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

function HeroShowcase({ courses }: { courses: Course[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const heroCourse = courses[0]
  const carouselCourses = courses.slice(1)

  const scrollCarousel = (direction: 'previous' | 'next') => {
    const container = scrollRef.current
    if (!container) return

    const firstCard = container.querySelector<HTMLElement>('[data-home-course-tile]')
    const cardWidth = firstCard?.offsetWidth ?? container.clientWidth
    const left = direction === 'previous' ? -(cardWidth + 16) : cardWidth + 16

    container.scrollBy({ left, behavior: 'smooth' })
  }

  if (!heroCourse) {
    return (
      <section className="container-page pt-10 sm:pt-14 lg:pt-16">
        <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 px-6 py-14 text-center text-sm leading-7 text-zinc-600 sm:px-10">
          ยังไม่มีคอร์สที่เผยแพร่ในระบบ
        </div>
      </section>
    )
  }

  return (
    <section className="container-page pt-10 sm:pt-14 lg:pt-16">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <h1 className="text-balance text-[clamp(2.65rem,7vw,6.4rem)] font-semibold leading-[0.98] tracking-[-0.015em] text-black">
            เรียนให้คม
            <span className="block text-zinc-400">ในพื้นที่ที่เรียบง่าย</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-zinc-600 sm:text-lg lg:mx-0">
            เลือกคอร์สคุณภาพ เรียนต่อได้ทุกอุปกรณ์ พร้อมสรุปบทเรียนด้วย AI ในประสบการณ์ที่นิ่ง สะอาด และโฟกัสกับการเรียนจริง
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              to={`/courses/${heroCourse.slug}`}
              className="inline-flex h-12 items-center justify-center rounded-full bg-black px-7 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-zinc-800"
            >
              ดูคอร์สแนะนำ
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-7 text-sm font-semibold text-black transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>

        <Link
          to={`/courses/${heroCourse.slug}`}
          className="group relative block overflow-hidden rounded-[34px] border border-zinc-200 bg-zinc-100 shadow-[0_28px_90px_rgba(15,23,42,0.12)]"
        >
          <div className="aspect-[1.12] sm:aspect-[1.6] lg:aspect-[1.08] xl:aspect-[1.18]">
            <img
              src={heroCourse.coverImage}
              alt={heroCourse.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/76 via-black/22 to-transparent p-5 sm:p-7">
            <div className="max-w-lg text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{heroCourse.category}</p>
              <h2 className="mt-2 line-clamp-2 text-2xl font-semibold tracking-tight sm:text-3xl">{heroCourse.title}</h2>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/86">
                <span className="rounded-full bg-white/16 px-3 py-1.5 backdrop-blur">{formatPrice(heroCourse.price)}</span>
                <span className="rounded-full bg-white/16 px-3 py-1.5 backdrop-blur">{getLessonCount(heroCourse)} บทเรียน</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/16 px-3 py-1.5 backdrop-blur">
                  <Star size={13} className="fill-amber-300 text-amber-300" />
                  {getCourseReviewAverage(heroCourse).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {carouselCourses.length > 0 ? (
        <div className="mt-8">
          <div
            ref={scrollRef}
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scroll-smooth sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {carouselCourses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.slug}`}
                data-home-course-tile
                className="group grid w-[76vw] shrink-0 snap-center grid-cols-[104px_minmax(0,1fr)] overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-zinc-300 sm:w-[360px]"
              >
                <img src={course.coverImage} alt={course.title} className="h-full min-h-28 w-full object-cover" />
                <div className="min-w-0 p-4">
                  <p className="text-xs font-semibold text-zinc-500">{course.category}</p>
                  <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-black group-hover:underline">{course.title}</h3>
                  <p className="mt-3 text-sm font-semibold text-black">{formatPrice(course.price)}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 hidden justify-end gap-2 sm:flex">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-black transition hover:bg-zinc-50"
              onClick={() => scrollCarousel('previous')}
              aria-label="คอร์สก่อนหน้า"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-black transition hover:bg-zinc-50"
              onClick={() => scrollCarousel('next')}
              aria-label="คอร์สถัดไป"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
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
      className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_24px_62px_rgba(15,23,42,0.1)]"
    >
      <div className="relative aspect-[1.55] overflow-hidden bg-zinc-100">
        <img
          src={course.coverImage}
          alt={course.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-zinc-500">
          <span>{course.category}</span>
          <span>{course.level}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-6 tracking-tight text-black">{course.title}</h3>
        <p className="mt-2 line-clamp-1 text-sm text-zinc-500">โดย {course.instructor.name}</p>
        <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-semibold text-zinc-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-2 text-black">
            <Star size={13} className="fill-amber-400 text-amber-400" />
            {reviewAverage.toFixed(1)}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-2 text-center">{formatNumber(reviewCount)} รีวิว</span>
          <span className="rounded-full bg-zinc-100 px-3 py-2 text-center">{formatNumber(course.students)} ผู้เรียน</span>
          <span className="rounded-full bg-zinc-100 px-3 py-2 text-center">{getLessonCount(course)} บทเรียน</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <span className="text-lg font-semibold text-black">{formatPrice(course.price)}</span>
          <span className="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-xs font-semibold text-white transition group-hover:bg-zinc-800">
            ดูรายละเอียด
          </span>
        </div>
      </div>
    </Link>
  )
}

function LoadingBlock() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-80 animate-pulse rounded-[28px] border border-zinc-200 bg-zinc-100" />
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
      className="flex h-16 min-w-[172px] items-center justify-center rounded-[22px] border border-zinc-200 bg-white px-6 text-center text-base font-semibold tracking-[0.01em] text-black shadow-[0_14px_38px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-zinc-300"
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
        <span className="whitespace-nowrap">{sponsor.name}</span>
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
    <div className="bg-white text-black">
      <HeroShowcase courses={featuredCourses} />

      <section className="container-page py-10 sm:py-14">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [BookOpen, 'คอร์สจากระบบ', `${formatNumber(courseTotal)} คอร์สที่เผยแพร่`],
            [Brain, 'AI Learning', 'สรุปบทเรียนและช่วยถามตอบ'],
            [ShieldCheck, 'Certificate', 'รองรับใบรับรองเมื่อเรียนครบ'],
            [MonitorSmartphone, 'Responsive', 'เรียนได้ทั้งมือถือและเดสก์ท็อป'],
          ].map(([Icon, title, description]) => {
            const FeatureIcon = Icon as typeof BookOpen

            return (
              <article key={title as string} className="flex items-center gap-4 rounded-[24px] border border-zinc-200 bg-zinc-50/70 p-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-sm ring-1 ring-zinc-200">
                  <FeatureIcon size={20} />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-black">{title as string}</h2>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{description as string}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="container-page pb-16 sm:pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[clamp(2.2rem,5vw,4.6rem)] font-semibold leading-none tracking-[-0.015em] text-black">คอร์สแนะนำ</h2>
          <p className="mt-4 text-base leading-8 text-zinc-500">
            คอร์สที่โดดเด่นจากคะแนน รีวิว และความนิยม จัดวางให้ดูง่ายทั้งบนจอเล็กและจอใหญ่
          </p>
        </div>

        <div className="mt-10">
          {loading ? <LoadingBlock /> : null}
          {error ? (
            <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
          ) : null}
          {!loading && !error && featuredCourses.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {featuredCourses.map((course) => (
                <CompactCourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : null}
          {!loading && !error && featuredCourses.length === 0 ? (
            <div className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-6 text-sm leading-7 text-zinc-600">
              ยังไม่มีคอร์สเผยแพร่สำหรับแสดงในหน้าแรก
            </div>
          ) : null}
        </div>
      </section>

      {sponsors.length > 0 ? (
        <section className="w-full pb-16 sm:pb-20">
          <div className="overflow-hidden border-y border-zinc-200 bg-zinc-50 py-10 sm:py-12">
            <div className="container-page">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-5xl">ผู้สนับสนุนที่ร่วมผลักดันการเรียนรู้</h2>
                <p className="mt-4 text-sm leading-7 text-zinc-500 sm:text-base">
                  โลโก้องค์กรที่ร่วมสนับสนุนการเติบโตของแพลตฟอร์มและประสบการณ์การเรียนรู้ของผู้ใช้
                </p>
              </div>

              <div className="relative mt-9 space-y-4">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-zinc-50 via-zinc-50/85 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-zinc-50 via-zinc-50/85 to-transparent" />
                <SponsorMarqueeRow items={sponsorRowA} />
                <SponsorMarqueeRow items={sponsorRowB.length > 0 ? sponsorRowB : sponsorRowA} reverse />
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
