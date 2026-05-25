import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpenCheck,
  ChevronRight,
  Inbox,
  Mail,
  Menu,
  MessageCircle,
  Search,
  Send,
  UserRound,
} from 'lucide-react'
import LearnProSidebar from '../components/LearnProSidebar'
import { useApi } from '../hooks/useApi'
import { api, studentDashboardStorage, type StudentCourse } from '../services/api'

const learningPathFor = (item: StudentCourse) =>
  item.enrollment.lastLessonId
    ? `/learn/${item.course.slug}?lesson=${item.enrollment.lastLessonId}`
    : `/learn/${item.course.slug}`

const formatDate = (value?: string | null) => {
  if (!value) return 'ยังไม่มีประวัติล่าสุด'

  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function InstructorAvatar({ name, image }: { name: string; image?: string }) {
  if (image) {
    return <img src={image} alt={name} className="h-11 w-11 rounded-full object-cover" />
  }

  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
      {name.trim().slice(0, 1).toUpperCase() || <UserRound size={17} />}
    </span>
  )
}

function MessageThread({
  item,
  active,
  onSelect,
}: {
  item: StudentCourse
  active: boolean
  onSelect: () => void
}) {
  const progress = Math.min(item.enrollment.progress, 100)

  return (
    <button
      type="button"
      className={[
        'flex w-full gap-3 border-b border-zinc-200 p-4 text-left transition last:border-b-0',
        active ? 'bg-zinc-50' : 'bg-white hover:bg-zinc-50',
      ].join(' ')}
      onClick={onSelect}
    >
      <InstructorAvatar name={item.course.instructor.name} image={item.course.instructor.avatarUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-black">{item.course.instructor.name}</p>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{item.course.title}</p>
          </div>
          <span className="shrink-0 text-xs text-zinc-400">{formatDate(item.enrollment.lastAccessedAt)}</span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">
          ยังไม่มีข้อความใหม่จากผู้สอนในคอร์สนี้
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-zinc-200">
            <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-semibold text-zinc-600">{progress}%</span>
        </div>
      </div>
    </button>
  )
}

export default function StudentMessages() {
  const { data, error, loading } = useApi(() => api.getStudentDashboard(), [], studentDashboardStorage.get())
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const profileName = data?.profile.name || data?.user.name || 'ผู้เรียน'
  const filteredCourses = useMemo(() => {
    const courses = data?.courses ?? []
    const searchText = query.trim().toLowerCase()
    if (!searchText) return courses

    return courses.filter((item) => {
      const title = item.course.title.toLowerCase()
      const instructor = item.course.instructor.name.toLowerCase()
      return title.includes(searchText) || instructor.includes(searchText)
    })
  }, [data?.courses, query])

  const selectedThread =
    filteredCourses.find((item) => item.course.id === selectedCourseId) ?? filteredCourses[0] ?? null

  if (loading && !data) {
    return (
      <div className="student-page-shell">
        <LearnProSidebar active="messages" mobileOpen={false} onMobileClose={() => undefined} />
        <main className="student-page-main min-w-0">
          <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
            <header className="mb-6 flex items-center gap-4">
              <div className="skeleton h-11 w-11 rounded-lg lg:hidden" />
              <div className="hidden flex-1 md:block xl:max-w-[520px]">
                <div className="skeleton h-12 rounded-xl" />
              </div>
              <div className="ml-auto skeleton h-11 w-40 rounded-full" />
            </header>

            <section className="relative mb-7 overflow-hidden rounded-xl border border-zinc-200 bg-white p-7 shadow-sm">
              <div className="max-w-2xl">
                <div className="skeleton-line h-4 w-36" />
                <div className="mt-3 skeleton-line h-10 w-10/12" />
                <div className="mt-3 skeleton-line h-10 w-7/12" />
                <div className="mt-4 space-y-2">
                  <div className="skeleton-line h-5 w-full" />
                  <div className="skeleton-line h-5 w-9/12" />
                </div>
              </div>
              <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 lg:block">
                <div className="skeleton h-20 w-20 rounded-2xl" />
              </div>
            </section>

            <div className="grid min-h-[620px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm xl:grid-cols-[420px_minmax(0,1fr)]">
              <section className="border-b border-zinc-200 xl:border-b-0 xl:border-r">
                <div className="border-b border-zinc-200 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2">
                      <div className="skeleton-line h-6 w-36" />
                      <div className="skeleton-line h-4 w-52" />
                    </div>
                    <div className="skeleton h-11 w-11 rounded-full" />
                  </div>
                </div>
                <div>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex gap-3 border-b border-zinc-200 p-4">
                      <div className="skeleton h-11 w-11 rounded-full" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="skeleton-line h-4 w-32" />
                            <div className="skeleton-line h-3 w-44" />
                          </div>
                          <div className="skeleton-line h-3 w-16" />
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="skeleton-line h-4 w-11/12" />
                          <div className="skeleton-line h-4 w-8/12" />
                        </div>
                        <div className="mt-3 skeleton h-1.5 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="flex min-h-[520px] flex-col">
                <div className="flex items-center justify-between gap-4 border-b border-zinc-200 p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="skeleton h-11 w-11 rounded-full" />
                    <div className="min-w-0 space-y-2">
                      <div className="skeleton-line h-5 w-40" />
                      <div className="skeleton-line h-4 w-64" />
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="skeleton h-10 w-28 rounded-md" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-center bg-zinc-50 p-6">
                  <div className="mx-auto max-w-lg rounded-xl border border-zinc-200 bg-white p-7 text-center shadow-sm">
                    <div className="skeleton mx-auto h-14 w-14 rounded-full" />
                    <div className="mx-auto mt-5 skeleton-line h-6 w-56" />
                    <div className="mx-auto mt-3 space-y-2">
                      <div className="skeleton-line h-4 w-full" />
                      <div className="skeleton-line h-4 w-10/12" />
                    </div>
                    <div className="skeleton mx-auto mt-6 h-11 w-32 rounded-md" />
                  </div>
                </div>
                <div className="border-t border-zinc-200 bg-white p-4">
                  <div className="skeleton h-[60px] rounded-xl" />
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error && !data) {
    return <div className="min-h-screen bg-white p-6 text-sm text-rose-600">{error}</div>
  }

  if (!data) return null

  return (
    <div className="student-page-shell">
      <LearnProSidebar
        active="messages"
        profileName={profileName}
        profileAvatarUrl={data.profile.avatarUrl || data.user.avatarUrl}
        profileLabel={data.profile.headline || 'บัญชีผู้เรียน'}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="student-page-main min-w-0">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center gap-4">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white lg:hidden"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="เปิดเมนู"
            >
              <Menu size={20} />
            </button>
            <label className="relative hidden flex-1 md:block xl:max-w-[520px]">
              <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-12 pr-4 text-sm outline-none transition placeholder:text-zinc-500 focus:border-black focus:bg-white"
                placeholder="ค้นหาผู้สอนหรือคอร์ส..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="ml-auto flex items-center gap-3 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-3">
              {data.profile.avatarUrl || data.user.avatarUrl ? (
                <img
                  src={data.profile.avatarUrl || data.user.avatarUrl}
                  alt={profileName}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
                  <UserRound size={16} />
                </span>
              )}
              <span className="hidden text-sm font-semibold sm:inline">{profileName}</span>
            </div>
          </header>

          <section className="relative mb-7 overflow-hidden rounded-xl border border-zinc-200 bg-white p-7 shadow-sm">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-zinc-500">ข้อความของฉัน</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black sm:text-4xl">
                ติดตามข้อความจากผู้สอนและคอร์สที่กำลังเรียน
              </h1>
              <p className="mt-3 text-base leading-7 text-zinc-600">
                รวมพื้นที่ติดต่อจากคอร์สที่ลงเรียนไว้ในหน้าเดียว โดยยังใช้ข้อมูลคอร์สและผู้สอนจากระบบเดิม
              </p>
            </div>
            <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 lg:block">
              <Mail className="text-black" size={76} strokeWidth={1.4} />
            </div>
          </section>

          <div className="grid min-h-[620px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm xl:grid-cols-[420px_minmax(0,1fr)]">
            <section className="border-b border-zinc-200 xl:border-b-0 xl:border-r">
              <div className="border-b border-zinc-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-black">กล่องข้อความ</h2>
                    <p className="mt-1 text-sm text-zinc-500">{filteredCourses.length} รายการจากคอร์สของคุณ</p>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
                    <Inbox size={20} />
                  </span>
                </div>
                <label className="relative mt-4 block md:hidden">
                  <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    className="h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-3 text-sm outline-none transition placeholder:text-zinc-500 focus:border-black focus:bg-white"
                    placeholder="ค้นหาข้อความ..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
              </div>

              <div className="max-h-[520px] overflow-y-auto">
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((item) => (
                    <MessageThread
                      key={item.course.id}
                      item={item}
                      active={selectedThread?.course.id === item.course.id}
                      onSelect={() => setSelectedCourseId(item.course.id)}
                    />
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-black">
                      <Inbox size={28} />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-black">ไม่พบข้อความ</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">ลองค้นหาด้วยชื่อคอร์สหรือชื่อผู้สอนอีกครั้ง</p>
                  </div>
                )}
              </div>
            </section>

            <section className="flex min-h-[520px] flex-col">
              {selectedThread ? (
                <>
                  <div className="flex items-center justify-between gap-4 border-b border-zinc-200 p-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <InstructorAvatar
                        name={selectedThread.course.instructor.name}
                        image={selectedThread.course.instructor.avatarUrl}
                      />
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-black">
                          {selectedThread.course.instructor.name}
                        </h2>
                        <p className="truncate text-sm text-zinc-500">{selectedThread.course.title}</p>
                      </div>
                    </div>
                    <Link
                      to={learningPathFor(selectedThread)}
                      className="hidden h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-black transition hover:border-black sm:inline-flex"
                    >
                      ไปที่บทเรียน
                      <ChevronRight size={16} />
                    </Link>
                  </div>

                  <div className="flex flex-1 flex-col justify-center bg-zinc-50 p-6">
                    <div className="mx-auto max-w-lg rounded-xl border border-zinc-200 bg-white p-7 text-center shadow-sm">
                      <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
                        <MessageCircle size={24} />
                      </span>
                      <h3 className="mt-5 text-xl font-semibold text-black">ยังไม่มีข้อความในคอร์สนี้</h3>
                      <p className="mt-2 text-sm leading-7 text-zinc-500">
                        ถ้ามีประกาศหรือการตอบกลับจากผู้สอน ข้อความจะแสดงในพื้นที่นี้โดยอิงจากคอร์สที่คุณลงเรียน
                      </p>
                      <Link
                        to={learningPathFor(selectedThread)}
                        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                      >
                        <BookOpenCheck size={17} />
                        เรียนต่อ
                      </Link>
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 bg-white p-4">
                    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                      <input
                        className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-zinc-500 outline-none"
                        placeholder="ยังไม่สามารถส่งข้อความได้ในระบบปัจจุบัน"
                        disabled
                      />
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-200 text-zinc-500"
                        disabled
                        aria-label="ส่งข้อความ"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center bg-zinc-50 p-8 text-center">
                  <div>
                    <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-sm">
                      <Inbox size={28} />
                    </span>
                    <h2 className="mt-5 text-xl font-semibold text-black">ยังไม่มีคอร์สสำหรับข้อความ</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-zinc-500">
                      เมื่อซื้อคอร์สแล้ว รายการผู้สอนและคอร์สจะแสดงที่กล่องข้อความนี้
                    </p>
                    <Link
                      to="/student/store"
                      className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                    >
                      ค้นหาคอร์ส
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
