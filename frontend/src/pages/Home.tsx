import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'
import type { Course } from '../types/course'
import type { Sponsor } from '../types/sponsor'

const formatPrice = (price: number) =>
  price === 0
    ? 'ฟรี'
    : `${new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(price)} บาท`

const getCourseReviewAverage = (course: Course) => course.reviewAverage ?? course.rating
const getCourseReviewCount = (course: Course) => course.reviewCount ?? 0

const categoryDotColors = ['bg-purple-500', 'bg-blue-500', 'bg-rose-500', 'bg-orange-500', 'bg-green-500']

const getCategoryDotColor = (category: string) => {
  const total = [...category].reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return categoryDotColors[total % categoryDotColors.length]
}

const getWebsiteHost = (websiteUrl?: string) => {
  if (!websiteUrl) return null

  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, '')
  } catch {
    return websiteUrl
  }
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
    <section className="relative isolate -mt-px overflow-hidden bg-white">
      <div className="w-full px-0">
        <div className="relative min-h-[calc(100svh-72px)] overflow-hidden bg-[#eef4ff] sm:min-h-[calc(100svh-80px)]">
          <picture>
            <source media="(max-width: 639px)" srcSet="/home-hero-course-banner-mobile.png" />
            <img
              src="/home-hero-course-banner.png"
              alt="ระบบคอร์สออนไลน์ เรียนรู้ได้ทุกที่ ทุกเวลา"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </picture>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/70 to-transparent" />
        </div>
      </div>
    </section>
  )
}

const whyMyCourseItems = [
  'รวมคอร์สที่เลือกเรียนได้จริงไว้ในที่เดียว',
  'ผู้เรียนซื้อคอร์สแล้วกลับมาเรียนต่อได้จากแดชบอร์ด',
  'ครูจัดการคอร์ส บทเรียน นักเรียน และข้อความได้ง่ายขึ้น',
]

function WhyMyCourseSection() {
  return (
    <section className="container-page py-12 sm:py-16 lg:py-20">
      <div className="grid gap-8 border-t border-zinc-200 pt-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">WHY MYCOURSE</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">ทำไมต้อง MyCourse</h2>
          <p className="mt-4 max-w-xl text-base leading-8 text-zinc-600">
            แพลตฟอร์มเรียนออนไลน์ที่ออกแบบให้ผู้เรียนค้นหา ซื้อ และกลับมาเรียนต่อได้ลื่นไหล ส่วนคุณครูก็จัดการคอร์สได้ในที่เดียว
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {whyMyCourseItems.map((item) => (
            <div key={item} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                <Check size={18} />
              </span>
              <p className="mt-5 text-sm font-semibold leading-6 text-zinc-950">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CourseRailCard({ course }: { course: Course }) {
  const firstLesson = course.lessons[0]?.title

  return (
    <article
      data-course-rail-card
      className="group flex w-[82vw] shrink-0 snap-start flex-col overflow-hidden rounded-[18px] border border-zinc-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.14)] sm:w-[340px] md:w-[360px] lg:w-[calc((100%_-_72px)/4)]"
    >
      <Link to={`/courses/${course.slug}`} className="aspect-[1.18] overflow-hidden bg-zinc-100">
        <img
          src={course.coverImage}
          alt={course.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-zinc-500">
          <span className="flex min-w-0 items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${getCategoryDotColor(course.category)}`} />
            <span className="truncate">{course.category}</span>
          </span>
          <span className="shrink-0">{course.level}</span>
        </div>
        <Link to={`/courses/${course.slug}`} className="mt-4 line-clamp-2 text-xl font-semibold leading-7 tracking-tight text-zinc-950 hover:underline">
          {course.title}
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
          {course.description || firstLesson || 'คอร์สสำหรับพัฒนาทักษะและต่อยอดการเรียนรู้'}
        </p>
        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <p className="text-base font-semibold text-zinc-950">{formatPrice(course.price)}</p>
          <div className="flex items-center gap-2">
            <Link
              to={`/courses/${course.slug}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-white transition group-hover:translate-x-0.5"
              aria-label={`ดูรายละเอียด ${course.title}`}
            >
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

function CourseRail({ courses }: { courses: Course[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const scrollCourses = (direction: 'previous' | 'next') => {
    const container = scrollRef.current
    if (!container) return

    const firstCard = container.querySelector<HTMLElement>('[data-course-rail-card]')
    const distance = firstCard ? firstCard.offsetWidth + 24 : container.clientWidth * 0.85
    container.scrollBy({ left: direction === 'previous' ? -distance : distance, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="-mx-4 -my-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 py-8 scroll-smooth sm:-mx-6 sm:gap-6 sm:px-6 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {courses.map((course) => (
          <CourseRailCard key={course.id} course={course} />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between lg:flex">
        <button
          type="button"
          className="pointer-events-auto inline-flex h-12 w-12 -translate-x-6 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-700 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur transition hover:border-zinc-300 hover:bg-white"
          onClick={() => scrollCourses('previous')}
          aria-label="เลื่อนคอร์สไปทางซ้าย"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className="pointer-events-auto inline-flex h-12 w-12 translate-x-6 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-700 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur transition hover:border-zinc-300 hover:bg-white"
          onClick={() => scrollCourses('next')}
          aria-label="เลื่อนคอร์สถัดไป"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="mt-3 flex justify-end gap-2 sm:mt-4 lg:hidden">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
          onClick={() => scrollCourses('previous')}
          aria-label="เลื่อนคอร์สไปทางซ้าย"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
          onClick={() => scrollCourses('next')}
          aria-label="เลื่อนคอร์สถัดไป"
        >
          <ChevronRight size={20} />
        </button>
      </div>
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
    <div className="relative w-full sm:w-[340px]">
      <button
        type="button"
        className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 text-left text-sm font-semibold text-zinc-950 shadow-sm transition hover:border-zinc-300"
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
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-full overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_rgba(15,23,42,0.16)] ring-1 ring-zinc-200">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 bg-zinc-100 px-5 py-3 text-left text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
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
            <span className="text-xs font-medium text-zinc-500">
              {categories.reduce((total, category) => total + category.count, 0)}
            </span>
          </button>

          <div className="py-2">
            {categories.map((category) => (
              <button
                key={category.name}
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                onClick={() => {
                  onSelectCategory(category.name)
                  setOpen(false)
                }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${getCategoryDotColor(category.name)}`} />
                  <span className="truncate">{category.name}</span>
                </span>
                <span className="text-xs text-zinc-400">{category.count}</span>
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
    <div className="flex gap-5 overflow-hidden sm:gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex h-[420px] w-[82vw] shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70 sm:w-[340px] md:w-[360px] lg:w-[calc((100%_-_72px)/4)]"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950/5">
            <div className="skeleton h-full w-full" />
            <div className="absolute left-3 top-3 flex gap-2">
              <div className="skeleton h-7 w-20 rounded-md bg-white/80" />
              <div className="skeleton h-7 w-24 rounded-md bg-white/70" />
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
              <div className="skeleton h-4 w-28 rounded-full bg-white/70" />
              <div className="skeleton h-7 w-20 rounded-md bg-white/80" />
            </div>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="skeleton h-7 w-20 rounded-md" />
            <div className="mt-4 space-y-2">
              <div className="skeleton-line h-5 w-11/12" />
              <div className="skeleton-line h-5 w-8/12" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="skeleton-line h-4 w-full" />
              <div className="skeleton-line h-4 w-10/12" />
              <div className="skeleton-line h-4 w-7/12" />
            </div>
            <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="skeleton mx-auto h-4 w-12 rounded-full" />
              <div className="skeleton mx-auto h-4 w-10 rounded-full" />
              <div className="skeleton mx-auto h-4 w-12 rounded-full" />
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-4">
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-10 w-28 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SponsorPill({ sponsor }: { sponsor: Sponsor }) {
  const [imageError, setImageError] = useState(false)
  const Wrapper = sponsor.websiteUrl ? 'a' : 'div'
  const websiteHost = getWebsiteHost(sponsor.websiteUrl)

  return (
    <Wrapper
      {...(sponsor.websiteUrl
        ? {
            href: sponsor.websiteUrl,
            target: '_blank',
            rel: 'noreferrer',
            title: `${sponsor.name}${websiteHost ? ` - ${websiteHost}` : ''}`,
            'aria-label': `เปิดเว็บไซต์ ${sponsor.name}`,
          }
        : { title: sponsor.name, 'aria-label': sponsor.name })}
      className="group flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-zinc-200 bg-white text-zinc-950 shadow-[0_14px_34px_rgba(15,23,42,0.10)] ring-1 ring-white/80 transition duration-300 hover:-translate-y-1 hover:border-zinc-950 hover:shadow-[0_22px_54px_rgba(15,23,42,0.16)] sm:h-24 sm:w-24"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-zinc-950 p-2.5 text-white shadow-inner transition group-hover:scale-95 sm:h-16 sm:w-16 sm:rounded-[22px]">
        {sponsor.logoUrl && !imageError ? (
          <img
            src={sponsor.logoUrl}
            alt=""
            className="max-h-full w-auto max-w-full object-contain brightness-0 invert"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <Building2 size={24} strokeWidth={1.8} />
        )}
      </span>
    </Wrapper>
  )
}

function SponsorMarqueeRow({ items, reverse = false }: { items: Sponsor[]; reverse?: boolean }) {
  const repeatedItems = [...items, ...items]

  return (
    <div className="sponsor-marquee-row overflow-hidden py-2">
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
  const sponsorSplitIndex = Math.max(1, Math.ceil(sponsors.length / 2))
  const sponsorRowA = sponsors.slice(0, sponsorSplitIndex)
  const sponsorRowB = sponsors.slice(sponsorSplitIndex)

  return (
    <div className="bg-white text-black">
      <HeroBanner />

      <WhyMyCourseSection />

      <section className="container-page pb-12 sm:pb-16 lg:pb-20">
        <div className="flex flex-col gap-6 border-t border-zinc-200 pt-8 sm:pt-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">รายการคอร์ส</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
              รวมคอร์สทั้งหมดที่เปิดให้เรียน เลือกหมวดหมู่ที่สนใจ แล้วเลื่อนดูคอร์สที่เหมาะกับเป้าหมายของคุณ
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            {courseCategories.length > 0 ? (
              <CategoryDropdown
                categories={courseCategories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            ) : null}
          </div>
        </div>

        <div className="mt-8 sm:mt-10">
          {loading ? <LoadingBlock /> : null}
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
          ) : null}
          {!loading && !error && filteredCourseList.length > 0 ? <CourseRail courses={filteredCourseList} /> : null}
          {!loading && !error && filteredCourseList.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm leading-7 text-zinc-600">
              ยังไม่มีคอร์สเผยแพร่สำหรับแสดงในหน้าแรก
            </div>
          ) : null}
        </div>
      </section>

      {sponsors.length > 0 ? (
        <section className="container-page pb-12 sm:pb-16 lg:pb-20">
          <div className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-[linear-gradient(135deg,#ffffff,#f5f5f7)] p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)] ring-1 ring-white/80 sm:p-6 lg:p-7">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-zinc-200/70 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-1/4 h-44 w-44 rounded-full bg-zinc-950/10 blur-3xl" />
            <div className="relative">
              <div className="max-w-4xl">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-zinc-500 sm:text-sm">SPONSORS</p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-black sm:text-4xl lg:text-5xl">
                    ผู้สนับสนุนที่ร่วมผลักดันการเรียนรู้
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
                    โลโก้ผู้สนับสนุนแบบไอคอนล้วนในสไตล์ขาวดำ วางเมาส์เพื่อหยุดเลื่อนและกดเข้าเว็บไซต์ได้ทันที
                  </p>
                </div>
              </div>

              <div className="relative mt-6 space-y-2 sm:mt-7">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white via-white/70 to-transparent sm:w-24" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white via-white/70 to-transparent sm:w-24" />
                <SponsorMarqueeRow items={sponsorRowA} />
                {sponsorRowB.length > 0 ? <SponsorMarqueeRow items={sponsorRowB} reverse /> : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
