import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
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

const getCourseReviewAverage = (course: Course) => course.reviewAverage ?? course.rating
const getCourseReviewCount = (course: Course) => course.reviewCount ?? 0

const categoryDotColors = ['bg-purple-500', 'bg-blue-500', 'bg-rose-500', 'bg-orange-500', 'bg-green-500']

const getCategoryDotColor = (category: string) => {
  const total = [...category].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return categoryDotColors[total % categoryDotColors.length]
}

const getCourseList = (courses: Course[]) =>
  [...courses].sort((left, right) => {
    const popularScore = Number(Boolean(right.isPopular)) - Number(Boolean(left.isPopular))
    if (popularScore !== 0) return popularScore
    const averageDifference = getCourseReviewAverage(right) - getCourseReviewAverage(left)
    if (averageDifference !== 0) return averageDifference
    const reviewCountDifference = getCourseReviewCount(right) - getCourseReviewCount(left)
    if (reviewCountDifference !== 0) return reviewCountDifference
    return right.students - left.students
  })

type CategoryOption = {
  name: string
  count: number
}

function HeroBanner() {
  return (
    <section className="w-full border-b border-zinc-100 bg-white">
      <img
        src="/home-hero-course-banner.png"
        alt="ระบบคอร์สออนไลน์ เรียนรู้ได้ทุกที่ ทุกเวลา"
        className="h-[54vh] min-h-[360px] w-full object-cover object-center sm:h-[68vh] lg:h-[calc(100vh-88px)]"
      />
    </section>
  )
}

function CourseRailCard({ course }: { course: Course }) {
  const firstLesson = course.lessons[0]?.title

  return (
    <Link
      to={`/courses/${course.slug}`}
      data-course-rail-card
      className="group flex w-[82vw] shrink-0 snap-start flex-col rounded-[10px] bg-white p-3 shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_64px_rgba(15,23,42,0.12)] sm:w-[360px] lg:w-[calc((100%_-_72px)/4)]"
    >
      <div className="aspect-[1.14] overflow-hidden rounded-[6px] bg-zinc-100 ring-1 ring-zinc-200/80">
        <img
          src={course.coverImage}
          alt={course.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col px-1 py-5">
        <h3 className="line-clamp-2 text-2xl font-semibold leading-8 tracking-tight text-zinc-900">{course.title}</h3>
        <p className="mt-2 text-base font-medium text-zinc-800">{formatPrice(course.price)}</p>
        <p className="mt-4 line-clamp-3 text-sm leading-7 text-zinc-500">
          {course.description || firstLesson || 'คอร์สสำหรับพัฒนาทักษะและต่อยอดการเรียนรู้'}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-zinc-800">
          <span className={`h-2.5 w-2.5 rounded-full ${getCategoryDotColor(course.category)}`} />
          <span className="truncate">{course.category}</span>
        </div>
      </div>
    </Link>
  )
}

function CourseRail({ courses }: { courses: Course[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const scrollCourses = (direction: 'previous' | 'next') => {
    const container = scrollRef.current
    if (!container) return

    const firstCard = container.querySelector<HTMLElement>('[data-course-rail-card]')
    const distance = firstCard ? firstCard.offsetWidth + 24 : container.clientWidth * 0.8
    container.scrollBy({ left: direction === 'previous' ? -distance : distance, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="absolute left-0 top-[30%] z-10 hidden h-16 w-16 -translate-x-[72%] items-center justify-center text-zinc-300 transition hover:text-zinc-600 lg:inline-flex"
        onClick={() => scrollCourses('previous')}
        aria-label="เลื่อนคอร์สไปทางซ้าย"
      >
        <ChevronLeft size={42} strokeWidth={1.8} />
      </button>
      <div
        ref={scrollRef}
        className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 scroll-smooth sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {courses.map((course) => (
          <CourseRailCard key={course.id} course={course} />
        ))}
      </div>
      <button
        type="button"
        className="absolute right-0 top-[30%] z-10 hidden h-16 w-16 translate-x-[72%] items-center justify-center text-zinc-300 transition hover:text-zinc-600 lg:inline-flex"
        onClick={() => scrollCourses('next')}
        aria-label="เลื่อนคอร์สถัดไป"
      >
        <ChevronRight size={42} strokeWidth={1.8} />
      </button>
    </div>
  )
}

function CategoryDropdown({
  categories,
  selectedCategory,
  onSelectCategory,
}: {
  categories: CategoryOption[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedLabel = selectedCategory === 'all' ? 'ทั้งหมด' : selectedCategory

  return (
    <div className="relative w-full sm:w-[360px]">
      <button
        type="button"
        className="flex h-12 w-full items-center justify-between gap-3 rounded-[10px] border border-zinc-200 bg-white px-4 text-left text-base font-semibold text-zinc-900 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition hover:border-zinc-300"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-3">
          {selectedCategory === 'all' ? (
            <span className="flex shrink-0 gap-1.5">
              {categoryDotColors.map((color) => (
                <span key={color} className={`h-2.5 w-2.5 rounded-full ${color}`} />
              ))}
            </span>
          ) : (
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${getCategoryDotColor(selectedCategory)}`} />
          )}
          <span className="truncate">{selectedLabel}</span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-zinc-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-full overflow-hidden rounded-[10px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] ring-1 ring-zinc-200">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 bg-zinc-100 px-5 py-3 text-left text-lg font-semibold text-zinc-900 transition hover:bg-zinc-200"
            onClick={() => {
              onSelectCategory('all')
              setOpen(false)
            }}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="truncate">ทั้งหมด</span>
              <span className="flex shrink-0 gap-2">
                {categoryDotColors.map((color) => (
                  <span key={color} className={`h-2.5 w-2.5 rounded-full ${color}`} />
                ))}
              </span>
            </span>
            <span className="text-sm font-medium text-zinc-500">
              {categories.reduce((total, category) => total + category.count, 0)}
            </span>
          </button>

          <div className="py-2">
            {categories.map((category) => (
              <button
                key={category.name}
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left text-base font-medium text-zinc-800 transition hover:bg-zinc-50"
                onClick={() => {
                  onSelectCategory(category.name)
                  setOpen(false)
                }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${getCategoryDotColor(category.name)}`} />
                  <span className="truncate">{category.name}</span>
                </span>
                <span className="text-sm text-zinc-400">{category.count}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LoadingBlock() {
  return (
    <div className="flex gap-6 overflow-hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-[430px] w-[82vw] shrink-0 animate-pulse rounded-[10px] bg-zinc-100 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:w-[360px] lg:w-[calc((100%_-_72px)/4)]"
        />
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
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { data, error, loading } = useApi(async () => {
    const [courses, sponsors] = await Promise.all([api.getCourses(), api.getSponsors()])
    return { courses, sponsors }
  }, [])

  const publishedCourses = useMemo(
    () => (data?.courses ?? []).filter((course) => (course.status ?? 'published') === 'published'),
    [data?.courses],
  )
  const courseList = useMemo(() => getCourseList(publishedCourses), [publishedCourses])
  const courseCategories = useMemo(
    () =>
      [...new Map(courseList.map((course) => [course.category, 0])).keys()]
        .map((category) => ({
          name: category,
          count: courseList.filter((course) => course.category === category).length,
        }))
        .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'th')),
    [courseList],
  )
  const filteredCourseList = useMemo(
    () => (selectedCategory === 'all' ? courseList : courseList.filter((course) => course.category === selectedCategory)),
    [courseList, selectedCategory],
  )
  const sponsors = useMemo(
    () => [...(data?.sponsors ?? [])].sort((left, right) => left.displayOrder - right.displayOrder),
    [data?.sponsors],
  )
  const sponsorRowA = sponsors.slice(0, Math.max(1, Math.ceil(sponsors.length / 2)))
  const sponsorRowB = sponsors.slice(Math.max(1, Math.ceil(sponsors.length / 2)))

  return (
    <div className="bg-white text-black">
      <HeroBanner />

      <section className="container-page py-14 sm:py-18 lg:py-20">
        <div className="flex flex-col gap-4 border-t border-zinc-200 pt-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">รายการคอร์ส</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
              รวมคอร์สทั้งหมดที่เปิดให้เรียน เลื่อนดูรายการเพิ่มเติมและเลือกคอร์สที่เหมาะกับเป้าหมายของคุณ
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            เข้าสู่ระบบเพื่อเรียน
          </Link>
        </div>

        {courseCategories.length > 0 ? (
          <div className="mt-8">
            <CategoryDropdown
              categories={courseCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
        ) : null}

        <div className="mt-7">
          {loading ? <LoadingBlock /> : null}
          {error ? (
            <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
          ) : null}
          {!loading && !error && filteredCourseList.length > 0 ? <CourseRail courses={filteredCourseList} /> : null}
          {!loading && !error && filteredCourseList.length === 0 ? (
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
