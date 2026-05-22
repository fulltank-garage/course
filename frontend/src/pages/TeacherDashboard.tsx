import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  Camera,
  CircleDollarSign,
  Clock3,
  Edit3,
  Eye,
  EyeOff,
  Home,
  ImagePlus,
  LibraryBig,
  LoaderCircle,
  LogOut,
  Mail,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  UserRound,
  UsersRound,
  Video,
  X,
} from 'lucide-react'
import BrandMark from '../components/BrandMark'
import { useApi } from '../hooks/useApi'
import { api, authStorage, type StudentProfile } from '../services/api'
import type { Course, CourseStudent, Lesson } from '../types/course'

const defaultCover =
  'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80'
const directMuxVideoUploadEnabled = import.meta.env.VITE_DIRECT_MUX_VIDEO_UPLOAD === 'true'
const directR2VideoUploadEnabled = import.meta.env.VITE_DIRECT_R2_VIDEO_UPLOAD === 'true'

const createEmptyDraft = () => ({
  title: '',
  description: '',
  price: '0',
  category: 'Technology',
  level: 'Beginner',
  duration: '',
  outcomes: '',
  coverImageUrl: '',
})

type CourseDraft = ReturnType<typeof createEmptyDraft>
type FormMode = 'create' | 'edit'
type TeacherCourseStudent = CourseStudent & {
  courseId: string
  courseTitle: string
  courseSlug: string
  courseCoverImage: string
  courseCategory: string
  coursePrice: number
  courseStatus: Course['status']
}
type LessonDraft = {
  title: string
  duration: string
  summary: string
  preview: boolean
  videoUrl: string
}
type TeacherProfileDraft = Pick<StudentProfile, 'name' | 'headline' | 'bio' | 'phone' | 'avatarUrl'>

const emptyLessonDraft: LessonDraft = {
  title: '',
  duration: '',
  summary: '',
  preview: true,
  videoUrl: '',
}
const maxVideoUploadBytes = 1024 * 1024 * 1024

const formatUploadSpeed = (bytesPerSecond: number) => {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return 'กำลังคำนวณความเร็ว'
  if (bytesPerSecond >= 1024 * 1024) return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`
  if (bytesPerSecond >= 1024) return `${Math.round(bytesPerSecond / 1024)} KB/s`
  return `${Math.round(bytesPerSecond)} B/s`
}

const getMuxPlayerEmbedUrl = (value: string | null | undefined) => {
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.hostname.toLowerCase() !== 'player.mux.com') return null

    const playbackId = url.pathname.split('/').filter(Boolean)[0]
    return playbackId ? `https://player.mux.com/${playbackId}` : null
  } catch {
    return null
  }
}

const formatVideoDuration = (durationSeconds: number) => {
  const totalSeconds = Math.max(0, Math.round(durationSeconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const paddedSeconds = String(seconds).padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`
  }

  return `${String(minutes).padStart(2, '0')}:${paddedSeconds}`
}

const formatThaiDate = (value?: string | null) => {
  if (!value) return '-'

  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

const getCourseStudentCount = (course: Course) => course.enrolledStudents?.length ?? course.students
const getCourseRevenue = (course: Course) => course.price * getCourseStudentCount(course)

const readVideoDuration = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    let settled = false
    let timeoutId: number | undefined

    const cleanup = () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      URL.revokeObjectURL(objectUrl)
      video.removeAttribute('src')
      video.load()
    }

    const settle = (callback: () => void) => {
      if (settled) return
      settled = true
      callback()
      cleanup()
    }

    const resolveIfReady = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        settle(() => resolve(formatVideoDuration(video.duration)))
        return true
      }

      return false
    }

    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      if (resolveIfReady()) return

      try {
        video.currentTime = Number.MAX_SAFE_INTEGER
      } catch {
        settle(() => reject(new Error('Unable to read video duration')))
      }
    }
    video.ondurationchange = resolveIfReady
    video.onseeked = resolveIfReady
    video.onerror = () => {
      settle(() => reject(new Error('Unable to read video duration')))
    }
    timeoutId = window.setTimeout(() => {
      settle(() => reject(new Error('Timed out while reading video duration')))
    }, 12000)
    video.src = objectUrl
  })

const createVideoPoster = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const objectUrl = URL.createObjectURL(file)
    let settled = false
    let timeoutId: number | undefined

    const cleanup = () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      URL.revokeObjectURL(objectUrl)
      video.removeAttribute('src')
      video.load()
    }

    const settle = (callback: () => void) => {
      if (settled) return
      settled = true
      callback()
      cleanup()
    }

    const capture = () => {
      const width = video.videoWidth
      const height = video.videoHeight

      if (!width || !height) {
        settle(() => reject(new Error('Unable to create video poster')))
        return
      }

      const maxPosterWidth = 960
      const scale = Math.min(1, maxPosterWidth / width)
      const posterWidth = Math.max(1, Math.round(width * scale))
      const posterHeight = Math.max(1, Math.round(height * scale))

      canvas.width = posterWidth
      canvas.height = posterHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0, posterWidth, posterHeight)
      settle(() => resolve(canvas.toDataURL('image/jpeg', 0.84)))
    }

    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0
      const targetTime = duration > 2 ? Math.min(Math.max(duration * 0.15, 1), duration - 0.2) : 0

      if (targetTime > 0) {
        video.currentTime = targetTime
      } else {
        capture()
      }
    }
    video.onseeked = capture
    video.onloadeddata = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 2) capture()
    }
    video.onerror = () => settle(() => reject(new Error('Unable to create video poster')))
    timeoutId = window.setTimeout(() => {
      settle(() => reject(new Error('Timed out while creating video poster')))
    }, 12000)
    video.src = objectUrl
  })

const draftFromLesson = (lesson: Lesson): LessonDraft => ({
  title: lesson.title,
  duration: lesson.duration,
  summary: lesson.summary,
  preview: lesson.preview,
  videoUrl: lesson.videoUrl ?? '',
})

const emptyTeacherProfile: TeacherProfileDraft = {
  name: '',
  headline: '',
  bio: '',
  phone: '',
  avatarUrl: '',
}

const draftFromCourse = (course: Course): CourseDraft => {
  return {
    title: course.title,
    description: course.description,
    price: String(course.price),
    category: course.category,
    level: course.level,
    duration: course.duration,
    outcomes: course.outcomes.join('\n'),
    coverImageUrl: course.coverImage.startsWith('/uploads/') ? '' : course.coverImage,
  }
}

const courseStatusMeta = {
  draft: {
    label: 'ฉบับร่าง',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
    actionLabel: 'รอแอดมินตรวจ',
  },
  published: {
    label: 'เผยแพร่แล้ว',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    actionLabel: 'ซ่อน',
  },
  hidden: {
    label: 'ซ่อนอยู่',
    badgeClass: 'border-slate-200 bg-slate-50 text-slate-600',
    actionLabel: 'เผยแพร่',
  },
} satisfies Record<Course['status'], { label: string; badgeClass: string; actionLabel: string }>

const getCourseStatusMeta = (status: Course['status'] | undefined) =>
  courseStatusMeta[status ?? 'published'] ?? courseStatusMeta.published

type TeacherSection = 'home' | 'my-courses' | 'students' | 'messages' | 'reviews' | 'profile'
type StudentCategory = 'all' | 'by-course'

const teacherNavItems: Array<{ key: TeacherSection; to: string; label: string; icon: typeof Home }> = [
  { key: 'home', to: '/teacher', label: 'หน้าหลัก', icon: Home },
  { key: 'my-courses', to: '/teacher?section=my-courses', label: 'คอร์สของฉัน', icon: Video },
  { key: 'students', to: '/teacher?section=students', label: 'นักเรียน', icon: UserRound },
  { key: 'messages', to: '/teacher?section=messages', label: 'ข้อความ', icon: Mail },
  { key: 'reviews', to: '/teacher?section=reviews', label: 'รีวิว', icon: Star },
  { key: 'profile', to: '/teacher?section=profile', label: 'การตั้งค่า', icon: Settings },
]

const studentCategoryOptions: Array<{ value: StudentCategory; label: string }> = [
  { value: 'all', label: 'รายการล่าสุด' },
  { value: 'by-course', label: 'แยกตามคอร์ส' },
]

function TeacherShell({
  activeSection,
  teacherName,
  teacherEmail,
  avatarUrl,
  children,
}: {
  activeSection: TeacherSection
  teacherName: string
  teacherEmail: string
  avatarUrl?: string
  children: React.ReactNode
}) {
  const handleLogout = async () => {
    try {
      await api.logout()
    } catch {
      // Keep local state aligned even if the server session already expired.
    } finally {
      authStorage.clearSession()
      window.location.assign('/')
    }
  }

  return (
    <div className="min-h-screen bg-white text-black lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen bg-black text-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center px-8">
          <Link to="/teacher" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <BrandMark className="h-10 w-10" />
            </span>
            <span className="text-xl font-semibold tracking-tight">MyCourse</span>
          </Link>
        </div>

        <nav className="space-y-2 px-5">
          {teacherNavItems.map((item) => {
            const Icon = item.icon
            const active = item.key === activeSection
            const navClassName = [
              'flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition',
              active ? 'bg-white/12 text-white shadow-inner shadow-white/5' : 'text-white/78 hover:bg-white/8 hover:text-white',
            ].join(' ')

            return (
              <Link
                key={`${item.label}-${item.to}`}
                to={item.to}
                className={navClassName}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto px-7 pb-7">
          <button
            type="button"
            className="mb-8 inline-flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/78 transition hover:bg-white/8 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            ออกจากระบบ
          </button>

          <div className="border-t border-white/10 pt-7">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt={teacherName} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black">
                  <UserRound size={18} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{teacherName}</p>
                <p className="truncate text-xs text-white/55">{teacherEmail || 'ครูผู้สอน'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <div className="mx-auto max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-8 flex items-center justify-between gap-4">
            <Link to="/teacher" className="flex items-center gap-3 lg:hidden">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                <BrandMark className="h-10 w-10" />
              </span>
              <span className="text-lg font-semibold">MyCourse</span>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white text-black transition hover:border-black"
                aria-label="แจ้งเตือน"
              >
                <Bell size={18} />
              </button>
              {avatarUrl ? (
                <img src={avatarUrl} alt={teacherName} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
                  <UserRound size={17} />
                </span>
              )}
            </div>
          </header>
          <nav className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {teacherNavItems.map((item) => {
              const Icon = item.icon
              const active = item.key === activeSection
              const mobileClassName = [
                'inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition',
                active ? 'border-black bg-black text-white' : 'border-zinc-200 bg-white text-black hover:border-black',
              ].join(' ')

              return (
                <Link key={`${item.label}-${item.to}-mobile`} to={item.to} className={mobileClassName}>
                  <Icon size={16} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          {children}
        </div>
      </main>
    </div>
  )
}

function CourseFormModal({
  mode,
  draft,
  coverPreview,
  coverFile,
  formMessage,
  saving,
  coverUploadProgress,
  onClose,
  onSubmit,
  onDraftChange,
  onCoverChange,
}: {
  mode: FormMode
  draft: CourseDraft
  coverPreview: string
  coverFile: File | null
  formMessage: { tone: 'success' | 'error'; text: string } | null
  saving: boolean
  coverUploadProgress: number | null
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onDraftChange: <K extends keyof CourseDraft>(key: K, value: CourseDraft[K]) => void
  onCoverChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/55 p-0 sm:items-center sm:p-5">
      <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[calc(100vh-2.5rem)] sm:rounded-xl sm:border sm:border-zinc-200">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {mode === 'create' ? 'ข้อมูลคอร์สใหม่' : 'ข้อมูลคอร์ส'}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-black">
              {mode === 'create' ? 'สร้างคอร์สใหม่' : 'แก้ไขคอร์ส'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {mode === 'create'
                ? 'กรอกข้อมูลหลักของคอร์สก่อน แล้วค่อยเพิ่มบทเรียนจากหน้าคอร์สของฉัน'
                : 'ปรับข้อมูลคอร์สและรูปปกโดยไม่เปลี่ยนบทเรียนเดิม'}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-black hover:text-black"
            onClick={onClose}
            aria-label="ปิด popup"
          >
            <X size={18} />
          </button>
        </div>

        <form className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7" onSubmit={onSubmit}>
          {formMessage ? (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                formMessage.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {formMessage.text}
            </div>
          ) : null}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="field-label">ชื่อคอร์ส</span>
                <input
                  className="field-input"
                  required
                  placeholder="เช่น React สำหรับทีมโปรดักชัน"
                  value={draft.title}
                  onChange={(event) => onDraftChange('title', event.target.value)}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="field-label">รายละเอียดคอร์ส</span>
                <textarea
                  className="field-input min-h-28 resize-y"
                  required
                  placeholder="อธิบายภาพรวม สิ่งที่ผู้เรียนจะได้ และผลลัพธ์หลังเรียนจบ"
                  value={draft.description}
                  onChange={(event) => onDraftChange('description', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="field-label">ราคา</span>
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  value={draft.price}
                  onChange={(event) => onDraftChange('price', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="field-label">ระยะเวลา</span>
                <input
                  className="field-input"
                  placeholder="6 ชม. 30 นาที"
                  value={draft.duration}
                  onChange={(event) => onDraftChange('duration', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="field-label">หมวดหมู่</span>
                <select
                  className="field-input"
                  value={draft.category}
                  onChange={(event) => onDraftChange('category', event.target.value)}
                >
                  <option>Technology</option>
                  <option>Business</option>
                  <option>Design</option>
                  <option>Marketing</option>
                  <option>Data</option>
                </select>
              </label>

              <label className="block">
                <span className="field-label">ระดับ</span>
                <select
                  className="field-input"
                  value={draft.level}
                  onChange={(event) => onDraftChange('level', event.target.value)}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="field-label">ผลลัพธ์การเรียนรู้</span>
                <textarea
                  className="field-input min-h-28 resize-y"
                  placeholder="ใส่ 1 หัวข้อต่อ 1 บรรทัด"
                  value={draft.outcomes}
                  onChange={(event) => onDraftChange('outcomes', event.target.value)}
                />
              </label>
            </div>

            <aside className="grid gap-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-black">
                  <ImagePlus size={16} />
                  รูปปกคอร์ส
                  </div>
                  <span className="text-xs text-zinc-400">16:9</span>
                </div>
                <img
                  src={coverPreview}
                  alt="Course cover preview"
                  className="mt-3 aspect-video w-full rounded-lg border border-zinc-200 bg-zinc-100 object-cover"
                />
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="field-label">อัปโหลดรูปปก</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="field-input file:mr-3 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                      onChange={onCoverChange}
                      disabled={saving}
                    />
                  </label>
                  <label className="block">
                    <span className="field-label">หรือใส่ URL รูปปก</span>
                    <input
                      className="field-input"
                      placeholder={defaultCover}
                      value={draft.coverImageUrl}
                      onChange={(event) => onDraftChange('coverImageUrl', event.target.value)}
                    />
                  </label>
                  {coverFile ? <p className="truncate text-xs text-zinc-500">{coverFile.name}</p> : null}
                  {coverUploadProgress !== null ? (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <div className="flex items-center justify-between gap-3 text-xs font-medium text-zinc-600">
                        <span>กำลังอัปโหลดรูปปก</span>
                        <span>{coverUploadProgress}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                        <span
                          className="block h-full rounded-full bg-black transition-all"
                          style={{ width: `${coverUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>

          <div className="sticky bottom-0 -mx-5 mt-7 flex items-center justify-end gap-3 border-t border-zinc-200 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-7 sm:px-7">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              ยกเลิก
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
                  กำลังบันทึก...
                </>
              ) : mode === 'create' ? (
                <>
                  <Plus size={16} />
                  สร้างคอร์ส
                </>
              ) : (
                <>
                  <Edit3 size={16} />
                  บันทึกการแก้ไข
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteModal({
  course,
  deleting,
  onCancel,
  onConfirm,
}: {
  course: Course
  deleting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-rose-50 text-rose-700">
            <AlertTriangle size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">ลบคอร์สนี้ใช่ไหม</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              คอร์ส <span className="font-medium text-slate-950">{course.title}</span> จะถูกลบออกจากระบบ
              พร้อมบทเรียนและข้อมูลที่ผูกกับคอร์สนี้
            </p>
            <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              การลบนี้ย้อนกลับไม่ได้
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={deleting}>
            ยกเลิก
          </button>
          <button type="button" className="btn-primary bg-rose-700 hover:bg-rose-800" onClick={onConfirm} disabled={deleting}>
            {deleting ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                กำลังลบ...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                ลบคอร์ส
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function LessonManagerModal({
  course,
  draft,
  editingLessonId,
  saving,
  uploading,
  uploadProgress,
  uploadSpeedText,
  videoPreviewUrl,
  videoPosterUrl,
  message,
  onClose,
  onNew,
  onSelect,
  onDraftChange,
  onVideoChange,
  onSubmit,
  onDelete,
}: {
  course: Course
  draft: LessonDraft
  editingLessonId: string | null
  saving: boolean
  uploading: boolean
  uploadProgress: number | null
  uploadSpeedText: string | null
  videoPreviewUrl: string | null
  videoPosterUrl: string | null
  message: { tone: 'success' | 'error'; text: string } | null
  onClose: () => void
  onNew: () => void
  onSelect: (lesson: Lesson) => void
  onDraftChange: <K extends keyof LessonDraft>(key: K, value: LessonDraft[K]) => void
  onVideoChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onDelete: (lessonId: string) => void
}) {
  const videoPreviewSrc = videoPreviewUrl || draft.videoUrl
  const muxEmbedUrl = videoPreviewUrl ? null : getMuxPlayerEmbedUrl(draft.videoUrl)
  const [videoPreviewError, setVideoPreviewError] = useState(false)
  const uploadStatusText = directMuxVideoUploadEnabled
    ? uploadProgress !== null && uploadProgress >= 92
      ? 'อัปโหลดครบแล้ว กำลังรอ Mux ประมวลผลวิดีโอ...'
      : 'กำลังอัปโหลดวิดีโอไป Mux'
    : directR2VideoUploadEnabled
    ? uploadProgress !== null && uploadProgress >= 99
      ? 'อัปโหลดครบแล้ว กำลังยืนยันไฟล์กับ Cloudflare R2...'
      : uploadProgress !== null && uploadProgress >= 98
        ? 'ส่งไฟล์ครบแล้ว กำลังรวมส่วนวิดีโอ...'
      : 'กำลังอัปโหลดวิดีโอไป Cloudflare R2'
    : uploadProgress !== null && uploadProgress >= 92
      ? 'อัปโหลดไฟล์ครบแล้ว กำลังตรวจวิดีโอ...'
      : 'กำลังอัปโหลดวิดีโอ'

  const controlsBusy = saving || uploading
  const selectedLessonIndex = course.lessons.findIndex((lesson) => lesson.id === editingLessonId)

  useEffect(() => {
    setVideoPreviewError(false)
  }, [videoPreviewSrc])


  const showFirstVideoFrame = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget
    setVideoPreviewError(false)

    if (videoPosterUrl) return

    if (video.duration > 0.2 && video.currentTime < 0.05) {
      video.currentTime = 0.1
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 p-0 backdrop-blur-sm sm:p-5">
      <div className="flex h-full w-full max-w-[1320px] flex-col overflow-hidden bg-white shadow-2xl sm:h-[calc(100vh-2.5rem)] sm:rounded-xl sm:border sm:border-zinc-200">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-black">จัดการบทเรียน</h2>
            <p className="mt-1 truncate text-sm text-zinc-500">
              {course.title} · {editingLessonId ? `บทเรียนที่ ${selectedLessonIndex + 1}` : 'บทเรียนใหม่'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800" onClick={onNew}>
              <Plus size={16} />
              บทเรียนใหม่
            </button>
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-black hover:text-black" onClick={onClose} aria-label="ปิด popup">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="min-h-0 border-b border-zinc-200 bg-zinc-50 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <p className="text-sm font-semibold text-black">บทเรียน</p>
              <p className="text-xs text-zinc-500">{course.lessons.length.toLocaleString('th-TH')} รายการ</p>
            </div>
            <div className="flex max-h-48 gap-2 overflow-x-auto px-5 pb-4 lg:max-h-none lg:flex-col lg:overflow-y-auto lg:pb-5">
              {course.lessons.length ? (
                course.lessons.map((lesson, index) => {
                  const active = editingLessonId === lesson.id

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      className={[
                        'flex min-w-[220px] items-start gap-3 rounded-lg border px-3 py-3 text-left transition lg:min-w-0',
                        active
                          ? 'border-black bg-white text-black shadow-sm'
                          : 'border-transparent bg-transparent text-zinc-600 hover:border-zinc-200 hover:bg-white hover:text-black',
                      ].join(' ')}
                      onClick={() => onSelect(lesson)}
                    >
                      <span className={active ? 'text-sm font-semibold text-black' : 'text-sm font-semibold text-zinc-400'}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-semibold">{lesson.title || 'ไม่มีชื่อบทเรียน'}</span>
                        <span className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
                          {lesson.duration ? <span>{lesson.duration}</span> : null}
                          {lesson.preview ? <span>Preview</span> : null}
                          {lesson.videoUrl ? <span>Video</span> : null}
                        </span>
                      </span>
                    </button>
                  )
                })
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-5 text-sm leading-6 text-zinc-500">
                  ยังไม่มีบทเรียน กด “บทเรียนใหม่” เพื่อเริ่มเพิ่มเนื้อหา
                </div>
              )}
            </div>
          </aside>

          <form className="min-h-0 overflow-y-auto bg-white" onSubmit={onSubmit}>
            <div className="mx-auto max-w-5xl px-5 py-6 sm:px-7 lg:py-8">
              {message ? (
                <div
                  className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                    message.tone === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  }`}
                >
                  {message.text}
                </div>
              ) : null}

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="space-y-5">
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-700">ชื่อบทเรียน</span>
                    <input
                      className="mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-black outline-none transition placeholder:text-zinc-400 focus:border-black"
                      value={draft.title}
                      onChange={(event) => onDraftChange('title', event.target.value)}
                      placeholder="บทเรียนที่ 1: เริ่มต้นคอร์ส"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-zinc-700">สรุปบทเรียน</span>
                    <textarea
                      className="mt-2 min-h-44 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm leading-6 text-black outline-none transition placeholder:text-zinc-400 focus:border-black"
                      value={draft.summary}
                      onChange={(event) => onDraftChange('summary', event.target.value)}
                      placeholder="เขียนสรุปสั้น ๆ ของบทเรียน"
                    />
                  </label>

                  <label className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={draft.preview}
                      onChange={(event) => onDraftChange('preview', event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-zinc-300 accent-black"
                    />
                    <span>
                      <span className="block font-medium text-black">เปิดเป็นวิดีโอตัวอย่างก่อนซื้อ</span>
                      <span className="mt-0.5 block text-xs leading-5 text-zinc-500">
                        ใช้วิดีโอหลักไฟล์เดียวกันเป็น preview โดยไม่เพิ่มชุดข้อมูลวิดีโอแยก
                      </span>
                    </span>
                  </label>
                </div>

                <aside className="space-y-5">
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-700">ความยาววิดีโอ</span>
                    <input
                      className="mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-black outline-none transition placeholder:text-zinc-400 focus:border-black"
                      value={draft.duration}
                      onChange={(event) => onDraftChange('duration', event.target.value)}
                      placeholder="12:30"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-zinc-700">วิดีโอหลัก</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="mt-2 w-full rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-4 text-sm text-zinc-600 outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-zinc-400 focus:border-black"
                      onChange={onVideoChange}
                      disabled={uploading}
                    />
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {directMuxVideoUploadEnabled
                        ? 'อัปโหลดตรงไป Mux และรอประมวลผลวิดีโอให้อัตโนมัติ'
                        : directR2VideoUploadEnabled
                          ? 'อัปโหลดตรงไป Cloudflare R2 แบบ multipart เหมาะกับไฟล์ใหญ่'
                          : 'อัปโหลดเข้า backend local และตรวจรูปแบบวิดีโอก่อนบันทึก'}
                    </p>
                  </label>

                  {uploading ? (
                    <div className="rounded-lg border border-zinc-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3 text-xs font-medium text-zinc-600">
                        <span>{uploadStatusText}</span>
                        <span>{uploadSpeedText ? `${uploadSpeedText} · ${uploadProgress ?? 0}%` : `${uploadProgress ?? 0}%`}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                        <span className="block h-full rounded-full bg-black transition-all" style={{ width: `${uploadProgress ?? 0}%` }} />
                      </div>
                    </div>
                  ) : null}
                </aside>
              </div>

              {videoPreviewUrl || draft.videoUrl ? (
                <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-black">
                  {muxEmbedUrl ? (
                    <iframe
                      className="aspect-video max-h-[52vh] w-full bg-black"
                      src={muxEmbedUrl}
                      title="ตัวอย่างวิดีโอจาก Mux"
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      className="aspect-video max-h-[52vh] w-full bg-black object-contain"
                      controls
                      playsInline
                      preload="metadata"
                      poster={videoPosterUrl ?? undefined}
                      src={videoPreviewSrc}
                      onError={() => setVideoPreviewError(true)}
                      onLoadedMetadata={showFirstVideoFrame}
                      onLoadedData={() => setVideoPreviewError(false)}
                    />
                  )}
                  {videoPreviewError && !muxEmbedUrl ? (
                    <p className="border-t border-rose-400/20 bg-rose-950/40 px-4 py-2 text-xs text-rose-100">
                      แสดงตัวอย่างวิดีโอไม่ได้ อาจเป็นไฟล์ที่ browser ไม่รองรับ หรือเป็นลิงก์ที่ไม่ใช่ไฟล์วิดีโอโดยตรง
                    </p>
                  ) : videoPreviewUrl ? (
                    <p className="border-t border-white/10 px-4 py-2 text-xs text-zinc-300">
                      กำลังแสดงตัวอย่างจากไฟล์ในเครื่อง หลังบันทึกแล้วระบบจะใช้ URL วิดีโอที่อัปโหลด
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-7 flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {editingLessonId ? (
                    <button
                      type="button"
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => onDelete(editingLessonId)}
                      disabled={controlsBusy}
                    >
                      <Trash2 size={16} />
                      ลบบทเรียน
                    </button>
                  ) : null}
                </div>
                <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={controlsBusy}>
                  {saving || uploading ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Video size={16} />
                      {editingLessonId ? 'บันทึกบทเรียน' : 'เพิ่มบทเรียน'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function TeacherDashboard() {
  const [searchParams] = useSearchParams()
  const requestedSection = searchParams.get('section')
  const activeSection: TeacherSection =
    requestedSection === 'profile'
      ? 'profile'
      : requestedSection === 'my-courses'
        ? 'my-courses'
        : requestedSection === 'students'
          ? 'students'
          : requestedSection === 'messages'
            ? 'messages'
            : requestedSection === 'reviews'
              ? 'reviews'
              : 'home'
  const { data, error, loading } = useApi(() => api.getTeacherDashboard(), [])
  const [courses, setCourses] = useState<Course[]>([])
  const [courseSearch, setCourseSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Course['status']>('all')
  const [studentCategory, setStudentCategory] = useState<StudentCategory>('all')
  const [selectedMessageKey, setSelectedMessageKey] = useState<string | null>(null)
  const [teacherProfile, setTeacherProfile] = useState<StudentProfile | null>(null)
  const [profileDraft, setProfileDraft] = useState<TeacherProfileDraft>(emptyTeacherProfile)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [updatingStatusSlug, setUpdatingStatusSlug] = useState<string | null>(null)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [formOpen, setFormOpen] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [lessonCourse, setLessonCourse] = useState<Course | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>(emptyLessonDraft)
  const [lessonMessage, setLessonMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [savingLesson, setSavingLesson] = useState(false)
  const [uploadingLessonVideo, setUploadingLessonVideo] = useState(false)
  const [lessonUploadProgress, setLessonUploadProgress] = useState<number | null>(null)
  const [lessonUploadSpeedText, setLessonUploadSpeedText] = useState<string | null>(null)
  const [lessonVideoPreviewUrl, setLessonVideoPreviewUrl] = useState<string | null>(null)
  const [lessonVideoPosterUrl, setLessonVideoPosterUrl] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>(defaultCover)
  const [coverUploadProgress, setCoverUploadProgress] = useState<number | null>(null)
  const [draft, setDraft] = useState<CourseDraft>(() => createEmptyDraft())

  useEffect(() => {
    queueMicrotask(() => {
      if (data?.courses) setCourses(data.courses)
    })
  }, [data?.courses])

  const currentTeacherProfile = data
    ? teacherProfile ??
      data.profile ?? {
        name: data.user.name,
        headline: '',
        bio: '',
        learningGoal: '',
        phone: '',
        avatarUrl: data.user.avatarUrl ?? '',
        updatedAt: null,
      }
    : null

  useEffect(() => {
    if (!data || !currentTeacherProfile) return

    setProfileDraft({
      name: currentTeacherProfile.name || data.user.name,
      headline: currentTeacherProfile.headline,
      bio: currentTeacherProfile.bio,
      phone: currentTeacherProfile.phone,
      avatarUrl: currentTeacherProfile.avatarUrl || data.user.avatarUrl || '',
    })
  }, [
    currentTeacherProfile?.avatarUrl,
    currentTeacherProfile?.bio,
    currentTeacherProfile?.headline,
    currentTeacherProfile?.name,
    currentTeacherProfile?.phone,
    currentTeacherProfile?.updatedAt,
    data?.user.avatarUrl,
    data?.user.id,
    data?.user.name,
  ])

  const editingCourse = useMemo(
    () => courses.find((course) => course.slug === editingSlug) ?? null,
    [courses, editingSlug],
  )
  const teacherStats = useMemo(() => {
    const published = courses.filter((course) => (course.status ?? 'published') === 'published').length
    const draft = courses.filter((course) => (course.status ?? 'published') === 'draft').length
    const totalStudents = courses.reduce((total, course) => total + getCourseStudentCount(course), 0)
    const totalLessons = courses.reduce((total, course) => total + (course.lessonCount ?? course.lessons.length), 0)
    const totalRevenue = courses.reduce((total, course) => total + getCourseRevenue(course), 0)

    return {
      totalCourses: courses.length,
      published,
      draft,
      totalStudents,
      totalLessons,
      totalRevenue,
    }
  }, [courses])
  const filteredCourses = useMemo(() => {
    const normalizedSearch = courseSearch.trim().toLowerCase()

    return courses.filter((course) => {
      const courseStatus = course.status ?? 'published'
      const matchesStatus = statusFilter === 'all' || courseStatus === statusFilter
      const matchesSearch =
        !normalizedSearch ||
        course.title.toLowerCase().includes(normalizedSearch) ||
        course.category.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [courseSearch, courses, statusFilter])
  const allCourseStudents = useMemo<TeacherCourseStudent[]>(
    () =>
      courses
        .flatMap((course) =>
          (course.enrolledStudents ?? []).map((student) => ({
            ...student,
            courseId: course.id,
            courseTitle: course.title,
            courseSlug: course.slug,
            courseCoverImage: course.coverImage,
            courseCategory: course.category,
            coursePrice: course.price,
            courseStatus: course.status,
          })),
        )
        .sort((left, right) => {
          const leftDate = new Date(left.enrollment.joinedAt).getTime()
          const rightDate = new Date(right.enrollment.joinedAt).getTime()
          return rightDate - leftDate
        }),
    [courses],
  )
  const uniqueTeacherStudents = useMemo(
    () => new Map(allCourseStudents.map((student) => [student.id, student])).size,
    [allCourseStudents],
  )
  const visibleCourseStudents = useMemo(() => {
    if (studentCategory === 'by-course') {
      return [...allCourseStudents].sort(
        (left, right) =>
          left.courseTitle.localeCompare(right.courseTitle, 'th') ||
          new Date(right.enrollment.joinedAt).getTime() - new Date(left.enrollment.joinedAt).getTime(),
      )
    }

    return allCourseStudents
  }, [allCourseStudents, studentCategory])
  const coursesWithStudents = useMemo(
    () => courses.filter((course) => getCourseStudentCount(course) > 0).length,
    [courses],
  )
  const averageStudentsPerCourse = courses.length ? Math.round(allCourseStudents.length / courses.length) : 0
  const topStudentCourse =
    [...courses].sort(
      (left, right) => getCourseStudentCount(right) - getCourseStudentCount(left),
    )[0] ?? null
  const studentCategorySummary = {
    all: {
      count: allCourseStudents.length,
      description: 'รายการผู้เรียนที่ซื้อหรือลงทะเบียนคอร์สของคุณ เรียงตามวันที่ลงทะเบียนล่าสุด',
      emptyTitle: 'ยังไม่มีรายการลงทะเบียน',
      emptyText: 'เมื่อมีคนซื้อหรือลงทะเบียนคอร์ส รายชื่อจะแสดงในหน้านี้',
    },
    'by-course': {
      count: coursesWithStudents,
      description: 'รายการลงทะเบียนแยกตามชื่อคอร์ส เพื่อดูว่าคอร์สไหนมีผู้เรียนอยู่บ้าง',
      emptyTitle: 'ยังไม่มีคอร์สสำหรับแสดงข้อมูล',
      emptyText: 'เมื่อมีผู้เรียนลงทะเบียนคอร์ส รายชื่อจะแสดงแยกตามคอร์สที่นี่',
    },
  } satisfies Record<StudentCategory, { count: number; description: string; emptyTitle: string; emptyText: string }>
  const activeStudentSummary = studentCategorySummary[studentCategory]
  const messageThreads = useMemo(
    () => allCourseStudents.map((student) => ({
      ...student,
      threadKey: `${student.courseId}-${student.id}`,
    })),
    [allCourseStudents],
  )
  const selectedMessageThread =
    messageThreads.find((thread) => thread.threadKey === selectedMessageKey) ?? messageThreads[0] ?? null
  const reviewCourses = useMemo(
    () =>
      [...courses].sort(
        (left, right) =>
          (right.reviewAverage ?? 0) - (left.reviewAverage ?? 0) ||
          (right.reviewCount ?? 0) - (left.reviewCount ?? 0),
      ),
    [courses],
  )
  const coursesWithReviews = reviewCourses.filter((course) => (course.reviewCount ?? 0) > 0)
  const totalCourseReviews = reviewCourses.reduce((total, course) => total + (course.reviewCount ?? 0), 0)
  const averageCourseRating = coursesWithReviews.length
    ? coursesWithReviews.reduce((total, course) => total + (course.reviewAverage ?? 0), 0) / coursesWithReviews.length
    : 0
  const topRatedCourse = coursesWithReviews[0] ?? null
  const resetDraft = () => {
    setDraft(createEmptyDraft())
    setCoverFile(null)
    setCoverPreview(defaultCover)
    setCoverUploadProgress(null)
    setEditingSlug(null)
  }

  const clearLessonVideoPreview = () => {
    setLessonVideoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return null
    })
    setLessonVideoPosterUrl(null)
  }

  const closeFormModal = () => {
    setFormOpen(false)
    resetDraft()
  }

  const openCreateModal = () => {
    resetDraft()
    setFormMode('create')
    setFormOpen(true)
    setMessage(null)
  }

  const openEditModal = (course: Course) => {
    setFormMode('edit')
    setEditingSlug(course.slug)
    setDraft(draftFromCourse(course))
    setCoverFile(null)
    setCoverPreview(course.coverImage)
    setCoverUploadProgress(null)
    setFormOpen(true)
    setMessage(null)
  }

  const openLessonManager = (course: Course) => {
    setLessonCourse(course)
    setEditingLessonId(course.lessons[0]?.id ?? null)
    setLessonDraft(course.lessons[0] ? draftFromLesson(course.lessons[0]) : emptyLessonDraft)
    setLessonMessage(null)
  }

  const closeLessonManager = () => {
    setLessonCourse(null)
    setEditingLessonId(null)
    setLessonDraft(emptyLessonDraft)
    setLessonMessage(null)
    setUploadingLessonVideo(false)
    setLessonUploadProgress(null)
    setLessonUploadSpeedText(null)
    clearLessonVideoPreview()
  }

  const startNewLesson = () => {
    setEditingLessonId(null)
    setLessonDraft(emptyLessonDraft)
    setLessonMessage(null)
    setLessonUploadProgress(null)
    setLessonUploadSpeedText(null)
    clearLessonVideoPreview()
  }

  const selectLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id)
    setLessonDraft(draftFromLesson(lesson))
    setLessonMessage(null)
    setLessonUploadProgress(null)
    setLessonUploadSpeedText(null)
    clearLessonVideoPreview()
  }

  const handleLessonDraftChange = <K extends keyof LessonDraft>(key: K, value: LessonDraft[K]) => {
    setLessonDraft((current) => ({ ...current, [key]: value }))
  }

  const replaceCourse = (course: Course) => {
    setCourses((current) => current.map((item) => (item.id === course.id ? course : item)))
    setLessonCourse(course)
  }

  const handleDraftChange = <K extends keyof CourseDraft>(key: K, value: CourseDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))

    if (key === 'coverImageUrl' && !coverFile) {
      setCoverPreview(String(value) || editingCourse?.coverImage || defaultCover)
    }
  }

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setCoverFile(file)

    if (!file) {
      setCoverPreview(draft.coverImageUrl || editingCourse?.coverImage || defaultCover)
      return
    }

    setCoverPreview(URL.createObjectURL(file))
  }

  const handleLessonVideoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (file.size > maxVideoUploadBytes) {
      setLessonMessage({
        tone: 'error',
        text: 'วิดีโอต้องไม่เกิน 1GB',
      })
      event.target.value = ''
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setLessonVideoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return previewUrl
    })
    setLessonVideoPosterUrl(null)

    createVideoPoster(file)
      .then((posterUrl) => setLessonVideoPosterUrl(posterUrl))
      .catch(() => undefined)

    readVideoDuration(file)
      .then((duration) => {
        setLessonDraft((current) => ({ ...current, duration }))
      })
      .catch(() => {
        // Some browser/codecs may not expose metadata before upload; the teacher can still edit the field manually.
      })

    setUploadingLessonVideo(true)
    setLessonUploadProgress(0)
    setLessonUploadSpeedText(null)
    setLessonMessage(null)

    try {
      let lastProgressSample = { progress: 0, timestamp: performance.now() }
      const uploaded = await api.uploadVideoAsset({
        file,
        onProgress: (progress) => {
          setLessonUploadProgress(progress)

          const now = performance.now()
          const elapsedSeconds = (now - lastProgressSample.timestamp) / 1000
          const progressDelta = progress - lastProgressSample.progress
          const uploadProgressMax = directMuxVideoUploadEnabled ? 90 : directR2VideoUploadEnabled ? 98 : 99

          if (elapsedSeconds >= 0.4 && progressDelta > 0 && progress <= uploadProgressMax) {
            const uploadedByteDelta = (Math.min(progressDelta, uploadProgressMax) / uploadProgressMax) * file.size
            setLessonUploadSpeedText(formatUploadSpeed(uploadedByteDelta / elapsedSeconds))
            lastProgressSample = { progress, timestamp: now }
          }
        },
      })
      setLessonDraft((current) => ({ ...current, videoUrl: uploaded.fileUrl }))
      setLessonVideoPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      setLessonVideoPosterUrl(null)
      setLessonMessage({
        tone: 'success',
        text:
          uploaded.storage === 'mux'
            ? 'อัปโหลดวิดีโอไป Mux สำเร็จ ได้ลิงก์สำหรับเล่นวิดีโอแล้ว'
            : uploaded.storage === 'r2'
              ? 'อัปโหลดวิดีโอไป Cloudflare R2 สำเร็จ'
              : 'อัปโหลดวิดีโอสำเร็จ ระบบตรวจและแปลงเป็นไฟล์ที่ browser เล่นได้แล้ว',
      })
    } catch (currentError) {
      setLessonMessage({
        tone: 'error',
        text: currentError instanceof Error ? currentError.message : 'อัปโหลดวิดีโอไม่สำเร็จ',
      })
    } finally {
      setUploadingLessonVideo(false)
      setLessonUploadProgress(null)
      setLessonUploadSpeedText(null)
      event.target.value = ''
    }
  }

  const saveLesson = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!lessonCourse) return

    setSavingLesson(true)
    setLessonMessage(null)

    try {
      const nextCourse = await api.saveLesson(lessonCourse.slug, editingLessonId, {
        title: lessonDraft.title,
        duration: lessonDraft.duration || '00:00',
        summary: lessonDraft.summary,
        preview: lessonDraft.preview,
        videoUrl: lessonDraft.videoUrl || undefined,
      })
      replaceCourse(nextCourse)

      const nextLesson =
        editingLessonId
          ? nextCourse.lessons.find((lesson) => lesson.id === editingLessonId)
          : nextCourse.lessons[nextCourse.lessons.length - 1]

      setEditingLessonId(nextLesson?.id ?? null)
      if (nextLesson) setLessonDraft(draftFromLesson(nextLesson))
      setLessonMessage({
        tone: 'success',
        text: lessonDraft.videoUrl
          ? 'บันทึกบทเรียนแล้ว ระบบจะถอดสคริปต์ด้วย AI ให้อัตโนมัติ'
          : 'บันทึกบทเรียนเรียบร้อยแล้ว',
      })
    } catch (currentError) {
      setLessonMessage({
        tone: 'error',
        text: currentError instanceof Error ? currentError.message : 'บันทึกบทเรียนไม่สำเร็จ',
      })
    } finally {
      setSavingLesson(false)
    }
  }

  const deleteLesson = async (lessonId: string) => {
    if (!lessonCourse) return

    setSavingLesson(true)
    setLessonMessage(null)

    try {
      const nextCourse = await api.deleteLesson(lessonCourse.slug, lessonId)
      replaceCourse(nextCourse)
      const nextLesson = nextCourse.lessons[0]
      setEditingLessonId(nextLesson?.id ?? null)
      setLessonDraft(nextLesson ? draftFromLesson(nextLesson) : emptyLessonDraft)
      setLessonMessage({ tone: 'success', text: 'ลบบทเรียนเรียบร้อยแล้ว' })
    } catch (currentError) {
      setLessonMessage({
        tone: 'error',
        text: currentError instanceof Error ? currentError.message : 'ลบบทเรียนไม่สำเร็จ',
      })
    } finally {
      setSavingLesson(false)
    }
  }

  const handleProfileAvatarChange = async (file: File | undefined) => {
    if (!file) return

    setUploadingAvatar(true)
    setProfileError(null)

    try {
      const uploaded = await api.uploadAsset({ kind: 'avatar', file })
      setProfileDraft((current) => ({ ...current, avatarUrl: uploaded.fileUrl }))
    } catch (currentError) {
      setProfileError(currentError instanceof Error ? currentError.message : 'อัปโหลดรูปโปรไฟล์ไม่สำเร็จ')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveTeacherProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!currentTeacherProfile) return

    setSavingProfile(true)
    setProfileError(null)

    try {
      const nextProfile = await api.updateTeacherProfile({
        name: profileDraft.name,
        headline: profileDraft.headline,
        bio: profileDraft.bio,
        phone: profileDraft.phone,
        avatarUrl: profileDraft.avatarUrl,
        learningGoal: currentTeacherProfile.learningGoal,
      })
      setTeacherProfile(nextProfile)

      const session = authStorage.getSession()
      if (session) {
        authStorage.setSession({
          ...session,
          user: {
            ...session.user,
            name: nextProfile.name || profileDraft.name,
            avatarUrl: nextProfile.avatarUrl || undefined,
          },
        })
      }
    } catch (currentError) {
      setProfileError(currentError instanceof Error ? currentError.message : 'บันทึกโปรไฟล์ไม่สำเร็จ')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      let coverImage = draft.coverImageUrl.trim() || editingCourse?.coverImage || defaultCover

      if (coverFile) {
        setCoverUploadProgress(0)
        const uploadedCover = await api.uploadAsset({ kind: 'cover', file: coverFile, onProgress: setCoverUploadProgress })
        coverImage = uploadedCover.fileUrl
      }

      const payload = {
        title: draft.title,
        description: draft.description,
        coverImage,
        price: Number(draft.price || 0),
        category: draft.category,
        level: draft.level,
        duration: draft.duration || '0 ชม.',
        outcomes: draft.outcomes
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      }

      const course =
        formMode === 'edit' && editingCourse
          ? await api.updateCourse(editingCourse.slug, payload)
          : await api.createCourse(payload)

      setCourses((current) => {
        if (formMode === 'edit' && editingCourse) {
          return current.map((item) => (item.slug === editingCourse.slug ? course : item))
        }

        return [course, ...current]
      })

      setMessage({
        tone: 'success',
        text:
          formMode === 'edit'
            ? 'บันทึกการแก้ไขคอร์สเรียบร้อยแล้ว'
            : 'สร้างคอร์สเป็นฉบับร่างแล้ว รอแอดมินตรวจสอบก่อนเผยแพร่',
      })
      closeFormModal()
    } catch (currentError) {
      setMessage({
        tone: 'error',
        text: currentError instanceof Error ? currentError.message : 'ไม่สามารถบันทึกคอร์สได้',
      })
    } finally {
      setSaving(false)
      setCoverUploadProgress(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setDeletingSlug(deleteTarget.slug)
    setMessage(null)

    try {
      await api.deleteCourse(deleteTarget.slug)
      setCourses((current) => current.filter((item) => item.slug !== deleteTarget.slug))
      setDeleteTarget(null)
      setMessage({ tone: 'success', text: 'ลบคอร์สเรียบร้อยแล้ว' })
    } catch (currentError) {
      setMessage({
        tone: 'error',
        text: currentError instanceof Error ? currentError.message : 'ไม่สามารถลบคอร์สได้',
      })
    } finally {
      setDeletingSlug(null)
    }
  }

  const toggleCourseStatus = async (course: Course) => {
    const currentStatus = course.status ?? 'published'
    const nextStatus: Course['status'] = currentStatus === 'published' ? 'hidden' : 'published'

    setUpdatingStatusSlug(course.slug)
    setMessage(null)

    try {
      const nextCourse = await api.updateCourseStatus(course.slug, nextStatus)
      setCourses((current) => current.map((item) => (item.slug === course.slug ? nextCourse : item)))
      setMessage({
        tone: 'success',
        text: nextStatus === 'published' ? 'เผยแพร่คอร์สเรียบร้อยแล้ว' : 'ซ่อนคอร์สเรียบร้อยแล้ว',
      })
    } catch (currentError) {
      setMessage({
        tone: 'error',
        text: currentError instanceof Error ? currentError.message : 'เปลี่ยนสถานะคอร์สไม่สำเร็จ',
      })
    } finally {
      setUpdatingStatusSlug(null)
    }
  }

  if (loading) {
    return <div className="card p-6 text-sm text-slate-500">กำลังโหลดพื้นที่ทำงานของคุณครู...</div>
  }

  if (error) {
    return <div className="card p-6 text-sm text-rose-600">{error}</div>
  }

  if (!data || !currentTeacherProfile) return null

  const recentActivityCourses = courses.slice(0, 4)

  if (activeSection === 'profile') {
    return (
      <TeacherShell
        activeSection="profile"
        teacherName={currentTeacherProfile.name || data.user.name}
        teacherEmail={data.user.email}
        avatarUrl={currentTeacherProfile.avatarUrl || data.user.avatarUrl}
      >
        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">โปรไฟล์คุณครู</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            แก้ไขชื่อ รูปโปรไฟล์ และข้อมูลติดต่อที่ใช้แสดงในระบบ
          </p>
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <form className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]" onSubmit={saveTeacherProfile}>
            <div className="border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
              <div className="flex flex-col items-start gap-4">
                {profileDraft.avatarUrl ? (
                  <img src={profileDraft.avatarUrl} alt="รูปโปรไฟล์" className="h-32 w-32 rounded-lg object-cover" />
                ) : (
                  <span className="inline-flex h-32 w-32 items-center justify-center rounded-lg bg-slate-950 text-white">
                    <UserRound size={40} />
                  </span>
                )}

                <div>
                  <p className="text-sm font-semibold text-slate-950">รูปโปรไฟล์</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">รองรับ JPG, PNG, WEBP ไม่เกิน 5MB</p>
                  <label className="btn-secondary mt-3 inline-flex cursor-pointer px-3 py-2">
                    <Camera size={16} />
                    {uploadingAvatar ? 'กำลังอัปโหลด...' : 'อัปโหลดรูป'}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingAvatar}
                      onChange={(event) => handleProfileAvatarChange(event.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <label className="block">
                <span className="field-label">ชื่อที่แสดง</span>
                <input
                  className="field-input"
                  value={profileDraft.name}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="ชื่อคุณครู"
                  required
                />
              </label>

              <label className="block">
                <span className="field-label">ตำแหน่ง / ความเชี่ยวชาญ</span>
                <input
                  className="field-input"
                  value={profileDraft.headline}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, headline: event.target.value }))}
                  placeholder="เช่น Frontend Instructor"
                />
              </label>

              <label className="block">
                <span className="field-label">เกี่ยวกับคุณครู</span>
                <textarea
                  className="field-input min-h-28 resize-y"
                  value={profileDraft.bio}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, bio: event.target.value }))}
                  placeholder="แนะนำประสบการณ์การสอนหรือแนวทางการสอน"
                />
              </label>

              <label className="block">
                <span className="field-label">เบอร์ติดต่อ</span>
                <input
                  className="field-input"
                  value={profileDraft.phone}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="เบอร์ติดต่อ"
                />
              </label>

              {profileError ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{profileError}</p> : null}

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <button type="submit" className="btn-primary" disabled={savingProfile || uploadingAvatar}>
                  {savingProfile ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
                </button>
              </div>
            </div>
          </form>
        </section>
      </TeacherShell>
    )
  }

  return (
    <>
      <TeacherShell
        activeSection={activeSection}
        teacherName={currentTeacherProfile.name || data.user.name}
        teacherEmail={data.user.email}
        avatarUrl={currentTeacherProfile.avatarUrl || data.user.avatarUrl}
      >
        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-7 shadow-sm">
          {activeSection === 'my-courses' ? (
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-base font-medium text-zinc-700">คอร์สของฉัน</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-black">จัดการคอร์สและบทเรียนทั้งหมด</h1>
                <p className="mt-3 text-base leading-7 text-zinc-600">
                  รวมรายการคอร์ส ตัวกรองหมวดหมู่ สถานะ และปุ่มสร้างคอร์สไว้ในหน้านี้ เพื่อให้จัดการคอร์สได้จากที่เดียว
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                onClick={openCreateModal}
              >
                <Plus size={17} />
                สร้างคอร์สใหม่
              </button>
            </div>
          ) : activeSection === 'students' ? (
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-base font-medium text-zinc-700">ผู้เรียน</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-black">ผู้เรียนที่ลงทะเบียนคอร์สของคุณ</h1>
                <p className="mt-3 text-base leading-7 text-zinc-600">
                  ดูรายชื่อคนที่ซื้อหรือลงทะเบียนคอร์ส โดยไม่เก็บข้อมูลติดตามการเรียนละเอียดให้หนักระบบ
                </p>
              </div>
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
                <UsersRound size={24} />
              </span>
            </div>
          ) : activeSection === 'messages' ? (
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-base font-medium text-zinc-700">ข้อความ</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-black">ข้อความจากนักเรียนในคอร์สของคุณ</h1>
                <p className="mt-3 text-base leading-7 text-zinc-600">
                  รวมรายชื่อนักเรียนที่อยู่ในคอร์สของคุณครูไว้สำหรับติดตามการสนทนา โดยยังไม่เพิ่มระบบส่งข้อความใหม่
                </p>
              </div>
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-white">
                <Mail size={24} />
              </span>
            </div>
          ) : activeSection === 'reviews' ? (
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                  <p className="text-base font-medium text-zinc-700">รีวิว</p>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight text-black">ภาพรวมรีวิวจากคอร์สของคุณ</h1>
                  <p className="mt-3 text-base leading-7 text-zinc-600">
                    ดูคะแนนและจำนวนรีวิวของแต่ละคอร์สจากรีวิวบทเรียนที่นักเรียนส่งเข้ามาจริง
                  </p>
              </div>
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-white">
                <Star size={24} />
              </span>
            </div>
          ) : (
            <>
              <p className="text-base font-medium text-zinc-700">สวัสดีตอนเช้า</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-black">
                ครู{currentTeacherProfile.name || data.user.name}
              </h1>
              <p className="mt-3 text-base text-zinc-600">ยินดีต้อนรับสู่แผงควบคุมของคุณ</p>
            </>
          )}
        </section>

        {message ? (
          <section
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              message.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {message.text}
          </section>
        ) : null}

        <section className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {(activeSection === 'students'
            ? [
                {
                  label: 'ผู้เรียนไม่ซ้ำ',
                  value: uniqueTeacherStudents.toLocaleString('th-TH'),
                  icon: UsersRound,
                  note: 'คน',
                  trend: false,
                },
                {
                  label: 'คอร์สที่มีผู้เรียน',
                  value: coursesWithStudents,
                  icon: LibraryBig,
                  note: 'คอร์ส',
                  trend: false,
                },
                {
                  label: 'รายการลงทะเบียน',
                  value: allCourseStudents.length.toLocaleString('th-TH'),
                  icon: UserRound,
                  note: 'ทั้งหมด',
                  trend: false,
                },
                {
                  label: 'เฉลี่ยต่อคอร์ส',
                  value: averageStudentsPerCourse.toLocaleString('th-TH'),
                  icon: Video,
                  note: 'ลงทะเบียน/คอร์ส',
                  trend: false,
                },
              ]
            : activeSection === 'messages'
              ? [
                  {
                    label: 'ผู้ติดต่อทั้งหมด',
                    value: uniqueTeacherStudents.toLocaleString('th-TH'),
                    icon: UsersRound,
                    note: 'นักเรียน',
                    trend: false,
                  },
                  {
                    label: 'ห้องสนทนา',
                    value: messageThreads.length,
                    icon: Mail,
                    note: 'จากคอร์สที่ลงเรียน',
                    trend: false,
                  },
                  {
                    label: 'คอร์สที่เกี่ยวข้อง',
                    value: coursesWithStudents,
                    icon: LibraryBig,
                    note: 'คอร์ส',
                    trend: false,
                  },
                  {
                    label: 'ข้อความค้างตอบ',
                    value: '0',
                    icon: Star,
                    note: 'ยังไม่เปิดส่งข้อความ',
                    trend: false,
                  },
                ]
            : activeSection === 'reviews'
              ? [
                    {
                      label: 'คะแนนเฉลี่ย',
                      value: averageCourseRating.toFixed(1),
                      icon: Star,
                      note: 'จากคอร์สที่มีรีวิว',
                      trend: false,
                    },
                    {
                      label: 'รีวิวทั้งหมด',
                      value: totalCourseReviews.toLocaleString('th-TH'),
                      icon: UsersRound,
                      note: 'จากรีวิวนักเรียน',
                      trend: false,
                    },
                    {
                      label: 'คอร์สมีคะแนน',
                      value: coursesWithReviews.length,
                      icon: LibraryBig,
                      note: 'คอร์ส',
                      trend: false,
                    },
                    {
                      label: 'คะแนนสูงสุด',
                      value: topRatedCourse ? (topRatedCourse.reviewAverage ?? 0).toFixed(1) : '0.0',
                      icon: Star,
                      note: topRatedCourse ? topRatedCourse.title : 'ยังไม่มีข้อมูล',
                      trend: false,
                  },
                ]
            : [
                {
                  label: 'คอร์สทั้งหมด',
                  value: teacherStats.totalCourses,
                  icon: LibraryBig,
                  note: 'คอร์ส',
                  trend: false,
                },
                {
                  label: 'นักเรียนทั้งหมด',
                  value: teacherStats.totalStudents.toLocaleString('th-TH'),
                  icon: UsersRound,
                  note: 'เพิ่มขึ้นจากเดือนที่แล้ว',
                  trend: true,
                },
                {
                  label: 'บทเรียนรวม',
                  value: teacherStats.totalLessons,
                  icon: Video,
                  note: 'บทเรียน',
                  trend: false,
                },
                {
                  label: 'รายได้รวม',
                  value: `${teacherStats.totalRevenue.toLocaleString('th-TH')} บาท`,
                  icon: CircleDollarSign,
                  note: 'จากเดือนที่แล้ว',
                  trend: true,
                },
              ]).map((item) => {
            const Icon = item.icon

            return (
            <div
              key={item.label}
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <span
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-black"
              >
                <Icon size={22} />
              </span>
              <p className="mt-5 text-sm font-medium text-zinc-600">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-black">{item.value}</p>
              <p className={item.trend ? 'mt-3 text-xs font-medium text-emerald-700' : 'mt-3 text-xs font-medium text-zinc-500'}>
                {item.trend ? `↑ ${item.note}` : item.note}
              </p>
            </div>
          )})}
        </section>

        {activeSection === 'students' ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-200 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-black">รายการผู้เรียน</h2>
                    <p className="mt-1 text-sm text-zinc-500">{activeStudentSummary.description}</p>
                  </div>
                  <Link
                    to="/teacher?section=my-courses"
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-black transition hover:border-black"
                  >
                    ไปที่คอร์สของฉัน
                  </Link>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {studentCategoryOptions.map((item) => {
                    const count = studentCategorySummary[item.value].count
                    const active = studentCategory === item.value

                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={[
                          'inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition',
                          active
                            ? 'border-black bg-black text-white'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-black hover:text-black',
                        ].join(' ')}
                        onClick={() => setStudentCategory(item.value)}
                      >
                        {item.label}
                        <span className={active ? 'text-white/65' : 'text-zinc-400'}>
                          {count.toLocaleString('th-TH')}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="divide-y divide-zinc-200">
                {visibleCourseStudents.length > 0 ? (
                  visibleCourseStudents.map((student) => {
                    const courseStatus = getCourseStatusMeta(student.courseStatus)

                    return (
                    <article
                      key={`${student.courseId}-${student.id}`}
                      className="grid gap-4 p-5 transition hover:bg-zinc-50/70 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-4">
                        {student.avatarUrl ? (
                          <img src={student.avatarUrl} alt={student.name} className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                            {student.name.trim().slice(0, 1).toUpperCase() || <UserRound size={18} />}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="line-clamp-1 text-base font-semibold text-black">{student.name}</h3>
                            <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
                              ลงทะเบียนแล้ว
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{student.email}</p>
                          <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                            คอร์ส: {student.courseTitle} · สมัครเมื่อ {formatThaiDate(student.enrollment.joinedAt)}
                          </p>
                        </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-zinc-600">
                          <span className="rounded-full bg-zinc-100 px-3 py-1">{student.courseCategory}</span>
                          <span className={`rounded-full border px-3 py-1 ${courseStatus.badgeClass}`}>{courseStatus.label}</span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-xs text-zinc-500">วันที่ลงทะเบียน</p>
                        <p className="mt-1 text-sm font-semibold text-black">{formatThaiDate(student.enrollment.joinedAt)}</p>
                        <p className="mt-3 text-xs text-zinc-500">มูลค่าคอร์ส</p>
                        <p className="mt-1 text-sm font-semibold text-black">{student.coursePrice.toLocaleString('th-TH')} บาท</p>
                      </div>
                    </article>
                    )
                  })
                ) : (
                  <div className="p-10 text-center">
                    <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-black">
                      <UsersRound size={28} />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-black">{activeStudentSummary.emptyTitle}</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">{activeStudentSummary.emptyText}</p>
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-5">
              <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-black">ภาพรวมผู้เรียน</h2>
                <div className="mt-5 rounded-lg bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">คอร์สที่มีผู้เรียนมากที่สุด</p>
                  <p className="mt-2 line-clamp-2 text-xl font-semibold text-black">
                    {topStudentCourse ? topStudentCourse.title : 'ยังไม่มีข้อมูล'}
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    {topStudentCourse
                      ? `${getCourseStudentCount(topStudentCourse).toLocaleString('th-TH')} ผู้เรียน`
                      : 'สร้างคอร์สเพื่อเริ่มรับผู้เรียน'}
                  </p>
                </div>
                <div className="mt-5 space-y-3">
                  {courses
                    .filter((course) => getCourseStudentCount(course) > 0)
                    .sort((left, right) => getCourseStudentCount(right) - getCourseStudentCount(left))
                    .slice(0, 3)
                    .map((course) => {
                    const studentCount = getCourseStudentCount(course)
                    const totalEnrollmentCount = courses.reduce((total, item) => total + getCourseStudentCount(item), 0)
                    const width = totalEnrollmentCount
                      ? Math.round((studentCount / totalEnrollmentCount) * 100)
                      : 0

                    return (
                      <div key={course.id}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <p className="line-clamp-1 font-medium text-black">{course.title}</p>
                          <span className="text-zinc-500">{studentCount.toLocaleString('th-TH')}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-zinc-200">
                          <div className="h-1.5 rounded-full bg-black" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-black">หมายเหตุ</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-500">
                  หน้านี้แสดงเฉพาะข้อมูลการลงทะเบียนที่จำเป็น เช่น ผู้เรียน คอร์ส วันที่ลงทะเบียน และมูลค่าคอร์ส โดยไม่ใช้ข้อมูลติดตามการเรียนแบบละเอียด
                </p>
              </section>
            </aside>
          </section>
        ) : null}

        {activeSection === 'messages' ? (
          <section className="grid min-h-[620px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm xl:grid-cols-[390px_minmax(0,1fr)]">
            <aside className="border-b border-zinc-200 xl:border-b-0 xl:border-r">
              <div className="border-b border-zinc-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-black">กล่องข้อความ</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {messageThreads.length.toLocaleString('th-TH')} ห้องสนทนาจากคอร์สของคุณ
                    </p>
                  </div>
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
                    <Mail size={20} />
                  </span>
                </div>
              </div>

              <div className="max-h-[560px] overflow-y-auto">
                {messageThreads.length > 0 ? (
                  messageThreads.map((thread) => {
                    const active = selectedMessageThread?.threadKey === thread.threadKey

                    return (
                      <button
                        key={thread.threadKey}
                        type="button"
                        className={[
                          'flex w-full items-start gap-3 border-b border-zinc-100 p-4 text-left transition',
                          active ? 'bg-zinc-100' : 'bg-white hover:bg-zinc-50',
                        ].join(' ')}
                        onClick={() => setSelectedMessageKey(thread.threadKey)}
                      >
                        {thread.avatarUrl ? (
                          <img src={thread.avatarUrl} alt={thread.name} className="h-11 w-11 rounded-full object-cover" />
                        ) : (
                          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                            {thread.name.trim().slice(0, 1).toUpperCase() || <UserRound size={17} />}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-3">
                            <span className="line-clamp-1 text-sm font-semibold text-black">{thread.name}</span>
                            <span className="shrink-0 text-xs text-zinc-400">
                              {formatThaiDate(thread.enrollment.joinedAt)}
                            </span>
                          </span>
                          <span className="mt-1 block line-clamp-1 text-xs text-zinc-500">{thread.courseTitle}</span>
                          <span className="mt-2 inline-flex rounded-full border border-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
                            ลงทะเบียนแล้ว
                          </span>
                        </span>
                      </button>
                    )
                  })
                ) : (
                  <div className="p-8 text-center">
                    <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-black">
                      <Mail size={24} />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-black">ยังไม่มีนักเรียนให้ติดต่อ</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">เมื่อนักเรียนสมัครคอร์ส รายชื่อจะแสดงในกล่องข้อความนี้</p>
                  </div>
                )}
              </div>
            </aside>

            <section className="flex min-h-[560px] flex-col">
              {selectedMessageThread ? (
                <>
                  <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      {selectedMessageThread.avatarUrl ? (
                        <img
                          src={selectedMessageThread.avatarUrl}
                          alt={selectedMessageThread.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                          {selectedMessageThread.name.trim().slice(0, 1).toUpperCase() || <UserRound size={18} />}
                        </span>
                      )}
                      <div className="min-w-0">
                        <h2 className="line-clamp-1 text-lg font-semibold text-black">{selectedMessageThread.name}</h2>
                        <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{selectedMessageThread.email}</p>
                      </div>
                    </div>
                    <Link
                      to="/teacher?section=students"
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-black transition hover:border-black"
                    >
                      ดูข้อมูลนักเรียน
                    </Link>
                  </div>

                  <div className="flex-1 p-5">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                      <p className="text-sm font-semibold text-black">คอร์สที่เกี่ยวข้อง</p>
                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <img
                          src={selectedMessageThread.courseCoverImage}
                          alt={selectedMessageThread.courseTitle}
                          className="aspect-video w-full rounded-lg bg-black object-cover sm:w-44"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-lg font-semibold text-black">{selectedMessageThread.courseTitle}</h3>
                          <p className="mt-1 text-sm text-zinc-500">{selectedMessageThread.courseCategory}</p>
                          <p className="mt-3 text-xs font-medium text-zinc-600">
                            ลงทะเบียนเมื่อ {formatThaiDate(selectedMessageThread.enrollment.joinedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center">
                      <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-black">
                        <Mail size={24} />
                      </span>
                      <h3 className="mt-4 text-lg font-semibold text-black">ยังไม่มีระบบส่งข้อความในคอร์สนี้</h3>
                      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
                        หน้านี้เตรียมพื้นที่สนทนาจากข้อมูลนักเรียนจริง โดยยังไม่เพิ่ม backend messaging หรือข้อมูลแชตจำลอง
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-200 p-5">
                    <label className="sr-only" htmlFor="teacher-message-disabled">ข้อความ</label>
                    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                      <input
                        id="teacher-message-disabled"
                        disabled
                        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-500 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed"
                        placeholder="ยังไม่สามารถส่งข้อความได้ในระบบปัจจุบัน"
                      />
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-zinc-500">
                        <Mail size={17} />
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8 text-center">
                  <div>
                    <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-black">
                      <Mail size={28} />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-black">เลือกนักเรียนเพื่อดูรายละเอียด</h3>
                    <p className="mt-2 text-sm text-zinc-500">รายชื่อจะแสดงเมื่อมีนักเรียนอยู่ในคอร์สของคุณครู</p>
                  </div>
                </div>
              )}
            </section>
          </section>
        ) : null}

        {activeSection === 'reviews' ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-zinc-200 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-black">รีวิวตามคอร์ส</h2>
                  <p className="mt-1 text-sm text-zinc-500">แสดงคะแนนและจำนวนรีวิวจากรีวิวบทเรียนที่ถูกบันทึกในระบบ</p>
                </div>
                <Link
                  to="/teacher?section=my-courses"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-black transition hover:border-black"
                >
                  ไปที่คอร์สของฉัน
                </Link>
              </div>

              <div className="divide-y divide-zinc-200">
                {reviewCourses.length > 0 ? (
                  reviewCourses.map((course) => {
                    const statusMeta = getCourseStatusMeta(course.status)

                    return (
                      <article key={course.id} className="grid gap-4 p-5 transition hover:bg-zinc-50/70 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                        <div className="flex min-w-0 items-center gap-4">
                          <img src={course.coverImage} alt={course.title} className="h-16 w-28 rounded-lg bg-black object-cover" />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="line-clamp-1 text-base font-semibold text-black">{course.title}</h3>
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusMeta.badgeClass}`}>
                                {statusMeta.label}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-1 text-sm text-zinc-500">{course.category}</p>
                            <p className="mt-1 text-xs text-zinc-500">
                              อัปเดตล่าสุด {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString('th-TH') : '-'}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-zinc-500">คะแนน</span>
                            <span className="text-sm font-semibold text-black">{(course.reviewAverage ?? 0).toFixed(1)}/5</span>
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-black">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <Star
                                key={rating}
                                size={15}
                                fill={rating <= Math.round(course.reviewAverage ?? 0) ? 'currentColor' : 'none'}
                                className={rating <= Math.round(course.reviewAverage ?? 0) ? 'text-black' : 'text-zinc-300'}
                              />
                            ))}
                          </div>
                          <p className="mt-3 text-xs text-zinc-500">{(course.reviewCount ?? 0).toLocaleString('th-TH')} รีวิว</p>
                        </div>
                      </article>
                    )
                  })
                ) : (
                  <div className="p-10 text-center">
                    <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-black">
                      <Star size={28} />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-black">ยังไม่มีข้อมูลรีวิว</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">เมื่อมีข้อมูลคะแนนคอร์ส รีวิวจะแสดงในหน้านี้</p>
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-5">
              <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-black">คอร์สคะแนนสูงสุด</h2>
                <div className="mt-5 rounded-lg bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">อันดับ 1</p>
                  <p className="mt-2 line-clamp-2 text-xl font-semibold text-black">
                    {topRatedCourse ? topRatedCourse.title : 'ยังไม่มีข้อมูล'}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-black">
                    <Star size={16} fill={topRatedCourse ? 'currentColor' : 'none'} />
                    {topRatedCourse ? (topRatedCourse.reviewAverage ?? 0).toFixed(1) : '0.0'}
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">
                    {topRatedCourse ? `${(topRatedCourse.reviewCount ?? 0).toLocaleString('th-TH')} รีวิว` : 'คะแนนจะแสดงเมื่อมีข้อมูลรีวิว'}
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold tracking-tight text-black">ภาพรวมคะแนน</h2>
                <div className="mt-5 space-y-3">
                  {reviewCourses.slice(0, 4).map((course) => (
                    <div key={course.id}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <p className="line-clamp-1 font-medium text-black">{course.title}</p>
                        <span className="text-zinc-500">{(course.reviewAverage ?? 0).toFixed(1)}</span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-zinc-200">
                        <div
                          className="h-1.5 rounded-full bg-black"
                          style={{ width: `${Math.min(100, Math.max(0, Math.round(((course.reviewAverage ?? 0) / 5) * 100)))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {reviewCourses.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-zinc-200 p-5 text-center text-sm text-zinc-500">
                      ยังไม่มีคอร์สสำหรับแสดงคะแนน
                    </p>
                  ) : null}
                </div>
              </section>
            </aside>
          </section>
        ) : null}

        {activeSection === 'my-courses' ? (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-black">คอร์สของฉัน</h2>
              <p className="mt-1 text-sm text-zinc-500">จัดการคอร์ส บทเรียน และสถานะเผยแพร่จากรายการเดียว</p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                {[
                  { value: 'all', label: 'ทั้งหมด' },
                  { value: 'published', label: 'เผยแพร่แล้ว' },
                  { value: 'draft', label: 'ร่าง' },
                  { value: 'hidden', label: 'ซ่อนอยู่' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={[
                      'h-8 rounded-md px-3 text-sm font-medium transition',
                      statusFilter === item.value ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-black',
                    ].join(' ')}
                    onClick={() => setStatusFilter(item.value as 'all' | Course['status'])}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="relative block min-w-0 sm:w-72">
                  <span className="sr-only">ค้นหาคอร์ส</span>
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    value={courseSearch}
                    onChange={(event) => setCourseSearch(event.target.value)}
                    className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-black outline-none transition placeholder:text-zinc-400 focus:border-black"
                    placeholder="ค้นหาคอร์ส"
                  />
                </label>
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  onClick={openCreateModal}
                >
                  <Plus size={16} />
                  สร้างคอร์ส
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500">
                <tr>
                  <th className="table-cell">คอร์ส</th>
                  <th className="table-cell">บทเรียน</th>
                  <th className="table-cell">ผู้เรียน</th>
                  <th className="table-cell">รายได้</th>
                  <th className="table-cell">จัดการ</th>
                  <th className="table-cell"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="transition hover:bg-zinc-50/70">
                    <td className="px-5 py-3 text-left text-sm">
                      <div className="flex items-center gap-4">
                        <img src={course.coverImage} alt={course.title} className="h-12 w-20 rounded-md bg-black object-cover" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="line-clamp-1 font-semibold text-black">{course.title}</p>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${getCourseStatusMeta(course.status).badgeClass}`}
                            >
                              {getCourseStatusMeta(course.status).label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            อัปเดตล่าสุด {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString('th-TH') : '-'} · {course.category}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <p className="font-semibold text-black">{(course.lessonCount ?? course.lessons.length).toLocaleString('th-TH')}</p>
                      <p className="mt-1 text-xs text-zinc-500">บทเรียน</p>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <p className="font-semibold text-black">{getCourseStudentCount(course).toLocaleString('th-TH')}</p>
                      <p className="mt-1 text-xs text-zinc-500">ผู้เรียน</p>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <p className="font-semibold text-black">{getCourseRevenue(course).toLocaleString('th-TH')} บาท</p>
                      <p className="mt-1 text-xs text-zinc-500">{course.price.toLocaleString('th-TH')} บาท/คอร์ส</p>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-black transition hover:border-black" onClick={() => openLessonManager(course)}>
                          <Video size={15} />
                          บทเรียน
                        </button>
                        <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-black transition hover:border-black" onClick={() => openEditModal(course)}>
                          <Edit3 size={15} />
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => toggleCourseStatus(course)}
                          disabled={updatingStatusSlug === course.slug || (course.status ?? 'published') === 'draft'}
                        >
                          {updatingStatusSlug === course.slug ? (
                            <LoaderCircle size={15} className="animate-spin" />
                          ) : (course.status ?? 'published') === 'draft' ? (
                            <Clock3 size={15} />
                          ) : (course.status ?? 'published') === 'published' ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                          {getCourseStatusMeta(course.status).actionLabel}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => setDeleteTarget(course)}
                        aria-label="ลบคอร์ส"
                        title="ลบคอร์ส"
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCourses.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-950">ไม่พบคอร์สที่ตรงกับตัวกรอง</h3>
                <p className="mt-2 text-sm text-slate-500">ลองเปลี่ยนคำค้นหาหรือสถานะคอร์ส</p>
              </div>
            ) : null}
          </div>
        </section>
        ) : null}

        {activeSection === 'home' ? (
        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-black">รายได้</h2>
                <p className="mt-5 text-3xl font-semibold tracking-tight text-black">
                  {teacherStats.totalRevenue.toLocaleString('th-TH')} บาท
                </p>
                <p className="mt-2 text-sm text-zinc-500">รายได้รวมจากคอร์สทั้งหมด</p>
              </div>
              <button
                type="button"
                className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-black transition hover:border-black"
              >
                เดือนนี้
              </button>
            </div>

            <div className="mt-8 h-44">
              <svg className="h-full w-full" viewBox="0 0 720 180" role="img" aria-label="กราฟรายได้">
                {[35, 70, 105, 140].map((y) => (
                  <line key={y} x1="0" y1={y} x2="720" y2={y} stroke="#e4e4e7" strokeWidth="1" />
                ))}
                <polyline
                  points="0,120 80,118 160,72 240,95 320,123 400,83 480,65 560,91 640,69 720,61"
                  fill="none"
                  stroke="#09090b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {[0, 80, 160, 240, 320, 400, 480, 560, 640, 720].map((x, index) => {
                  const y = [120, 118, 72, 95, 123, 83, 65, 91, 69, 61][index]

                  return <circle key={x} cx={x} cy={y} r="5" fill="#fff" stroke="#09090b" strokeWidth="2" />
                })}
              </svg>
            </div>

            <Link to="/teacher" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-black">
              ดูรายงานทั้งหมด
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight text-black">กิจกรรมล่าสุด</h2>
              <button
                type="button"
                className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-black transition hover:border-black"
              >
                ดูทั้งหมด
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {recentActivityCourses.length > 0 ? (
                recentActivityCourses.map((course, index) => {
                  const statusMeta = getCourseStatusMeta(course.status)
                  const activityText =
                    (course.status ?? 'published') === 'draft'
                      ? 'บันทึกเป็นฉบับร่าง'
                      : (course.status ?? 'published') === 'hidden'
                        ? 'ซ่อนคอร์สจากหน้าร้านแล้ว'
                        : 'มีนักเรียนสมัครเรียนในคอร์ส'
                  const ActivityIcon = index % 2 === 0 ? UsersRound : Star

                  return (
                    <div key={course.id} className="flex items-start gap-4">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-black">
                        <ActivityIcon size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-black">{activityText}</p>
                          <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600">
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-zinc-500">{course.title}</p>
                      </div>
                      <p className="shrink-0 text-xs text-zinc-500">
                        {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString('th-TH') : 'ล่าสุด'}
                      </p>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">
                  ยังไม่มีกิจกรรมล่าสุด
                </div>
              )}
            </div>
          </div>
        </section>
        ) : null}
      </TeacherShell>

      {formOpen ? (
        <CourseFormModal
          mode={formMode}
          draft={draft}
          coverPreview={coverPreview}
          coverFile={coverFile}
          formMessage={message}
          saving={saving}
          coverUploadProgress={coverUploadProgress}
          onClose={closeFormModal}
          onSubmit={handleSubmit}
          onDraftChange={handleDraftChange}
          onCoverChange={handleCoverChange}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteModal
          course={deleteTarget}
          deleting={deletingSlug === deleteTarget.slug}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      ) : null}

      {lessonCourse ? (
        <LessonManagerModal
          course={lessonCourse}
          draft={lessonDraft}
          editingLessonId={editingLessonId}
          saving={savingLesson}
          uploading={uploadingLessonVideo}
          uploadProgress={lessonUploadProgress}
          uploadSpeedText={lessonUploadSpeedText}
          videoPreviewUrl={lessonVideoPreviewUrl}
          videoPosterUrl={lessonVideoPosterUrl}
          message={lessonMessage}
          onClose={closeLessonManager}
          onNew={startNewLesson}
          onSelect={selectLesson}
          onDraftChange={handleLessonDraftChange}
          onVideoChange={handleLessonVideoChange}
          onSubmit={saveLesson}
          onDelete={deleteLesson}
        />
      ) : null}
    </>
  )
}
