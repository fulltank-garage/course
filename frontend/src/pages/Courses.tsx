import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlayCircle, Search, Star, UsersRound } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'
import type { Course } from '../types/course'

const allCategory = 'ทั้งหมด'
const categoryOptions = [allCategory, 'Technology', 'Business', 'Design', 'Marketing', 'Data']

const formatPrice = (price: number) =>
  price === 0
    ? 'ฟรี'
    : new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        maximumFractionDigits: 0,
      }).format(price)

const getLessonCount = (course: Course) => Math.max(course.lessonCount ?? 0, course.lessons.length)
const hasPreviewVideo = (course: Course) => course.lessons.some((lesson) => lesson.preview && lesson.videoUrl)
function PublicCourseCard({ course }: { course: Course }) {
  const isEnrolled = Boolean(course.viewerState?.isEnrolled)

  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg">
      <Link to={`/courses/${course.slug}`} className="relative block aspect-[1.33] overflow-hidden bg-zinc-100">
        <img src={course.coverImage} alt={course.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
        {isEnrolled ? (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
            คุณได้ซื้อคอร์สแล้ว
          </span>
        ) : (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm">
            {course.category}
          </span>
        )}
        {hasPreviewVideo(course) ? (
          <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-black shadow-sm">
            <PlayCircle size={16} />
            <span className="sr-only">ดูตัวอย่างได้</span>
          </span>
        ) : null}
      </Link>

      <div className="p-4">
        <Link to={`/courses/${course.slug}`} className="line-clamp-2 min-h-11 text-sm font-semibold leading-6 text-black hover:underline">
          {course.title}
        </Link>

        <div className="mt-3 flex items-center gap-1 text-xs text-zinc-500">
          <UsersRound size={14} />
          <span>{course.students.toLocaleString('th-TH')} คนสนใจ</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1 text-amber-500">
            <Star size={14} className="fill-amber-400" />
            {course.rating.toFixed(1)}
          </span>
          <span>({getLessonCount(course)} บทเรียน)</span>
          <span>•</span>
          <span>{course.level}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">{formatPrice(course.price)}</p>
          <p className="truncate text-xs text-zinc-500">โดย {course.instructor.name}</p>
        </div>

        <div className="mt-4">
          <Link
            to={`/courses/${course.slug}`}
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-200 px-3 text-sm font-semibold text-black transition hover:border-black"
          >
            ดูรายละเอียด
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(allCategory)
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const { data: courses, error, loading } = useApi(() => api.getCourses(), [])

  const publishedCourses = useMemo(
    () => (courses ?? []).filter((course) => (course.status ?? 'published') === 'published'),
    [courses],
  )

  const filteredCourses = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase()

    return publishedCourses.filter((course) => {
      const matchesCategory = selectedCategory === allCategory || course.category === selectedCategory
      const matchesSearch =
        !normalizedSearch ||
        course.title.toLowerCase().includes(normalizedSearch) ||
        course.description.toLowerCase().includes(normalizedSearch) ||
        course.instructor.name.toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [deferredSearchTerm, publishedCourses, selectedCategory])

  return (
    <section className="bg-white text-black">
      <div className="container-page py-10 sm:py-14">
        <header className="border-b border-zinc-200 pb-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">ค้นหาคอร์สที่เหมาะกับคุณ</h1>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              เลือกดูคอร์ส อ่านรายละเอียด และดูวิดีโอตัวอย่างก่อนตัดสินใจสมัครเรียน
            </p>
          </div>

          <div className="mt-7 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <label className="relative block">
              <span className="sr-only">ค้นหาคอร์ส</span>
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-12 w-full rounded-lg border border-zinc-200 bg-white pl-11 pr-4 text-sm text-black outline-none transition placeholder:text-zinc-400 focus:border-black"
                placeholder="ค้นหาชื่อคอร์สหรือชื่อผู้สอน"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {categoryOptions.map((category) => {
                const active = selectedCategory === category

                return (
                  <button
                    key={category}
                    type="button"
                    className={[
                      'h-10 shrink-0 rounded-lg border px-4 text-sm font-semibold transition',
                      active
                        ? 'border-black bg-black text-white'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-black hover:text-black',
                    ].join(' ')}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        <div className="mt-8 flex items-center justify-between gap-4 text-sm text-zinc-500">
          <p>{loading ? 'กำลังโหลดคอร์ส...' : `พบ ${filteredCourses.length.toLocaleString('th-TH')} คอร์ส`}</p>
          <p>{publishedCourses.length.toLocaleString('th-TH')} คอร์สที่เปิดให้ดู</p>
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100" />
            ))}
          </div>
        ) : null}

        {!loading && !error && filteredCourses.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredCourses.map((course) => (
              <PublicCourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : null}

        {!loading && !error && filteredCourses.length === 0 ? (
          <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-10 text-center">
            <Search size={28} className="mx-auto text-zinc-400" />
            <h2 className="mt-4 text-lg font-semibold text-black">ไม่พบคอร์สที่ตรงกับการค้นหา</h2>
            <p className="mt-2 text-sm text-zinc-500">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
