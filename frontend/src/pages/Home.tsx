import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
} from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'
import type { Course } from '../types/course'

const allOption = 'ทั้งหมด'
const categoryDotColors = ['bg-purple-500', 'bg-blue-500', 'bg-rose-500', 'bg-orange-500', 'bg-green-500']
const categoryLabels: Record<string, string> = {
  Technology: 'เทคโนโลยี',
  Business: 'ธุรกิจ',
  Design: 'ออกแบบ',
  Marketing: 'การตลาด',
  Data: 'ข้อมูล',
}
const levelLabels: Record<string, string> = {
  Beginner: 'เริ่มต้น',
  Intermediate: 'ระดับกลาง',
  Advanced: 'ระดับสูง',
}

const getCategoryLabel = (category: string) => categoryLabels[category] ?? category
const getLevelLabel = (level: string) => levelLabels[level] ?? level

const formatPrice = (price: number) =>
  price === 0 ? 'ฟรี' : `${new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(price)} บาท`

const getCourseReviewAverage = (course: Course) => course.reviewAverage ?? course.rating
const getCourseReviewCount = (course: Course) => course.reviewCount ?? 0

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

type HeroSlide = {
  id: string
  title: string
  description: string
  image: string
  href: string
  mobileImage?: string
}

const heroFallbackSlides: HeroSlide[] = [
  {
    id: 'default-hero',
    title: 'ระบบคอร์สออนไลน์สำหรับทุกเป้าหมาย',
    description: 'เลือกดูคอร์ส เรียนต่อ และจัดการบทเรียนได้ในที่เดียว',
    image: '/home-hero-course-banner.png',
    mobileImage: '/home-hero-course-banner-mobile.png',
    href: '/student/store',
  },
]

const heroActions = [
  { label: 'ทำไมต้อง MyCourse', to: '/why-mycourse', icon: FileText },
  { label: 'ติดต่อ', to: '/contact', icon: Mail },
]

function HeroBanner({ courses }: { courses: Course[] }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const slides = useMemo(
    () =>
      courses.slice(0, 5).map<HeroSlide>((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        image: course.coverImage,
        href: `/courses/${course.slug}`,
      })),
    [courses],
  )
  const heroSlides = slides.length > 0 ? slides : heroFallbackSlides
  const currentSlide = heroSlides[activeSlide % heroSlides.length]

  useEffect(() => {
    setActiveSlide(0)
  }, [heroSlides.length])

  useEffect(() => {
    if (heroSlides.length <= 1) return

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [heroSlides.length])

  const goToSlide = (index: number) => setActiveSlide((index + heroSlides.length) % heroSlides.length)

  return (
    <section className="relative isolate -mt-px overflow-hidden bg-[#f2f2f2] py-5 sm:py-8 lg:py-10">
      <div className="container-page">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_348px] lg:items-stretch">
          <div className="relative overflow-hidden rounded-2xl bg-black shadow-sm">
            <Link to={currentSlide.href} className="group block">
              <picture>
                {'mobileImage' in currentSlide && currentSlide.mobileImage ? (
                  <source media="(max-width: 639px)" srcSet={currentSlide.mobileImage} />
                ) : null}
                <img
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  className="aspect-[16/9] min-h-[260px] w-full object-cover transition duration-700 group-hover:scale-[1.02] sm:min-h-[360px] lg:min-h-[410px]"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/22 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7 lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">คอร์สแนะนำ</p>
                <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  {currentSlide.title}
                </h1>
                <p className="mt-3 max-w-2xl line-clamp-2 text-sm leading-6 text-white/78 sm:text-base">
                  {currentSlide.description}
                </p>
              </div>
            </Link>

            {heroSlides.length > 1 ? (
              <>
                <button
                  type="button"
                  className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm transition hover:bg-white sm:inline-flex"
                  onClick={() => goToSlide(activeSlide - 1)}
                  aria-label="เลื่อนรูปก่อนหน้า"
                >
                  <ChevronLeft size={21} />
                </button>
                <button
                  type="button"
                  className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-sm transition hover:bg-white sm:inline-flex"
                  onClick={() => goToSlide(activeSlide + 1)}
                  aria-label="เลื่อนรูปถัดไป"
                >
                  <ChevronRight size={21} />
                </button>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      className={[
                        'h-2.5 rounded-full transition',
                        index === activeSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/75',
                      ].join(' ')}
                      onClick={() => goToSlide(index)}
                      aria-label={`ไปที่รูปที่ ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1">
            {heroActions.map((action) => {
              const Icon = action.icon

              return (
                <Link
                  key={action.label}
                  to={action.to}
                  className="group flex min-h-28 flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md sm:min-h-36 lg:min-h-0"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white transition group-hover:scale-105 sm:h-16 sm:w-16">
                    <Icon size={24} />
                  </span>
                  <span className="mt-3 text-xs font-semibold leading-5 text-black sm:text-sm">{action.label}</span>
                </Link>
              )
            })}
          </div>
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
            <span className="truncate">{getCategoryLabel(course.category)}</span>
          </span>
          <span className="shrink-0">{getLevelLabel(course.level)}</span>
        </div>
        <Link to={`/courses/${course.slug}`} className="mt-4 line-clamp-2 text-xl font-semibold leading-7 tracking-tight text-zinc-950 hover:underline">
          {course.title}
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
          {course.description || firstLesson || 'คอร์สสำหรับพัฒนาทักษะและต่อยอดการเรียนรู้'}
        </p>
        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <p className="text-base font-semibold text-zinc-950">{formatPrice(course.price)}</p>
          <Link
            to={`/courses/${course.slug}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-white transition group-hover:translate-x-0.5"
            aria-label={`ดูรายละเอียด ${course.title}`}
          >
            <ArrowRight size={16} />
          </Link>
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
        {(['previous', 'next'] as const).map((direction) => (
          <button
            key={direction}
            type="button"
            className={[
              'pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white/95 text-zinc-700 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur transition hover:border-zinc-300 hover:bg-white',
              direction === 'previous' ? '-translate-x-6' : 'translate-x-6',
            ].join(' ')}
            onClick={() => scrollCourses(direction)}
            aria-label={direction === 'previous' ? 'เลื่อนคอร์สไปทางซ้าย' : 'เลื่อนคอร์สถัดไป'}
          >
            {direction === 'previous' ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-end gap-2 sm:mt-4 lg:hidden">
        {(['previous', 'next'] as const).map((direction) => (
          <button
            key={direction}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
            onClick={() => scrollCourses(direction)}
            aria-label={direction === 'previous' ? 'เลื่อนคอร์สไปทางซ้าย' : 'เลื่อนคอร์สถัดไป'}
          >
            {direction === 'previous' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        ))}
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
  const selectedLabel = selectedCategory === 'all' ? allOption : getCategoryLabel(selectedCategory)

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
            <span>{allOption}</span>
            <span className="text-xs font-medium text-zinc-500">{categories.reduce((total, category) => total + category.count, 0)}</span>
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
                  <span className="truncate">{getCategoryLabel(category.name)}</span>
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
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="skeleton h-7 w-20 rounded-md" />
            <div className="mt-4 space-y-2">
              <div className="skeleton-line h-5 w-11/12" />
              <div className="skeleton-line h-5 w-8/12" />
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-4">
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const { data: courses, error, loading } = useApi(() => api.getCourses(), [])

  const publishedCourses = useMemo(
    () => (courses ?? []).filter((course) => (course.status ?? 'published') === 'published'),
    [courses],
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

  return (
    <div className="bg-white text-black">
      <HeroBanner courses={courseList} />

      <section className="container-page py-12 sm:py-16 lg:py-20">
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
    </div>
  )
}
