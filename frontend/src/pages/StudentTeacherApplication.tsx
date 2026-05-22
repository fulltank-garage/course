import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Menu,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from 'lucide-react'
import LearnProSidebar from '../components/LearnProSidebar'
import { api, authStorage, type TeacherApplicationResponse } from '../services/api'

const inputClass =
  'mt-2 h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 text-sm text-black outline-none transition placeholder:text-zinc-400 focus:border-black focus:bg-zinc-50/50'

const textareaClass =
  'mt-2 min-h-[132px] w-full resize-y rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-black outline-none transition placeholder:text-zinc-400 focus:border-black focus:bg-zinc-50/50'

const statusMeta = {
  pending: {
    label: 'รอแอดมินตรวจสอบ',
    description: 'ทีมแอดมินกำลังตรวจข้อมูลและความพร้อมของบัญชีคุณครู',
    icon: Clock3,
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  approved: {
    label: 'อนุมัติแล้ว',
    description: 'บัญชีนี้พร้อมใช้งานในบทบาทคุณครูแล้ว กรุณาเข้าสู่ระบบใหม่เพื่ออัปเดตสิทธิ์',
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  rejected: {
    label: 'ต้องปรับข้อมูล',
    description: 'คำขอรอบก่อนยังไม่ผ่าน สามารถแก้ไขข้อมูลและส่งใหม่ได้',
    icon: XCircle,
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
} satisfies Record<TeacherApplicationResponse['status'], { label: string; description: string; icon: typeof Clock3; className: string }>

export default function StudentTeacherApplication() {
  const session = authStorage.getSession()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [application, setApplication] = useState<TeacherApplicationResponse | null>(null)
  const [loadingApplication, setLoadingApplication] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let active = true

    api
      .getStudentTeacherApplication()
      .then((currentApplication) => {
        if (active) setApplication(currentApplication)
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoadingApplication(false)
      })

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const nextApplication = await api.createTeacherApplication({
        displayName: String(formData.get('displayName') ?? '').trim(),
        phone: String(formData.get('phone') ?? '').trim(),
        expertise: String(formData.get('expertise') ?? '').trim(),
        courseTopic: String(formData.get('courseTopic') ?? '').trim(),
        experience: String(formData.get('experience') ?? '').trim(),
        portfolioUrl: String(formData.get('portfolioUrl') ?? '').trim(),
        message: String(formData.get('message') ?? '').trim(),
      })

      setApplication(nextApplication)
      setSuccess(true)
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'ส่งคำขอไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  const currentStatus = application ? statusMeta[application.status] : null
  const StatusIcon = currentStatus?.icon ?? Clock3

  return (
    <div className="student-page-shell">
      <LearnProSidebar
        active="teacher-application"
        profileName={session?.user.name}
        profileAvatarUrl={session?.user.avatarUrl}
        profileLabel={session?.user.email}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="student-page-main min-w-0">
        <div className="mx-auto max-w-[1180px] px-4 py-4 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center gap-4">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white lg:hidden"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="เปิดเมนู"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Teacher Application</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-black">สมัครเป็นคุณครู</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                ส่งข้อมูลให้แอดมินตรวจสอบก่อนเปิดสิทธิ์สร้างคอร์ส เพื่อรักษาคุณภาพคอร์สและประสบการณ์ของผู้เรียน
              </p>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <form className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7" onSubmit={handleSubmit}>
              {currentStatus ? (
                <div className={`mb-6 flex items-start gap-3 rounded-lg border p-4 ${currentStatus.className}`}>
                  <StatusIcon size={20} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">{currentStatus.label}</p>
                    <p className="mt-1 text-sm leading-6 opacity-80">{currentStatus.description}</p>
                    {application?.reviewNote ? <p className="mt-2 text-sm font-medium">{application.reviewNote}</p> : null}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-black">ชื่อผู้สอน *</span>
                  <input
                    name="displayName"
                    className={inputClass}
                    defaultValue={application?.displayName ?? session?.user.name ?? ''}
                    placeholder="ชื่อที่จะแสดงบนหน้าคอร์ส"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-black">เบอร์โทร</span>
                  <input
                    name="phone"
                    className={inputClass}
                    type="tel"
                    autoComplete="tel"
                    defaultValue={application?.phone ?? ''}
                    placeholder="สำหรับให้แอดมินติดต่อกลับ"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-black">ความเชี่ยวชาญ *</span>
                  <input
                    name="expertise"
                    className={inputClass}
                    defaultValue={application?.expertise ?? ''}
                    placeholder="เช่น Frontend, English, Design"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-black">หัวข้อคอร์สที่อยากสอน *</span>
                  <input
                    name="courseTopic"
                    className={inputClass}
                    defaultValue={application?.courseTopic ?? ''}
                    placeholder="เช่น React สำหรับผู้เริ่มต้น"
                    required
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-semibold text-black">ประสบการณ์ *</span>
                  <textarea
                    name="experience"
                    className={textareaClass}
                    defaultValue={application?.experience ?? ''}
                    placeholder="เล่าประสบการณ์สอน ผลงาน หรือความเชี่ยวชาญที่เกี่ยวข้อง"
                    required
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-semibold text-black">ลิงก์ผลงานหรือโปรไฟล์</span>
                  <input
                    name="portfolioUrl"
                    className={inputClass}
                    type="url"
                    defaultValue={application?.portfolioUrl ?? ''}
                    placeholder="https://..."
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-semibold text-black">ข้อความถึงแอดมิน</span>
                  <textarea
                    name="message"
                    className={textareaClass}
                    defaultValue={application?.message ?? ''}
                    placeholder="สิ่งที่อยากให้ทีมตรวจสอบเพิ่มเติม"
                  />
                </label>
              </div>

              {error ? (
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-700">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-700">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                  ส่งคำขอเรียบร้อยแล้ว แอดมินจะตรวจสอบก่อนเปิดสิทธิ์คุณครู
                </div>
              ) : null}

              <div className="mt-7 flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Link to="/student" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-black">
                  <ArrowLeft size={15} />
                  กลับหน้าหลักนักเรียน
                </Link>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-black px-6 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,0,0,0.14)] transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
                  disabled={submitting || loadingApplication || application?.status === 'approved'}
                >
                  {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                  {submitting ? 'กำลังส่งคำขอ...' : application ? 'อัปเดตคำขอ' : 'ส่งคำขอให้แอดมินตรวจ'}
                </button>
              </div>
            </form>

            <aside className="h-fit space-y-4">
              <section className="rounded-lg border border-zinc-200 bg-black p-5 text-white shadow-sm">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white text-black">
                  <ShieldCheck size={20} />
                </span>
                <h2 className="mt-5 text-xl font-semibold tracking-tight">ตรวจสอบก่อนเปิดสิทธิ์</h2>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  บัญชียังเป็นนักเรียนจนกว่าแอดมินจะอนุมัติ หลังอนุมัติแล้วระบบจะปรับสิทธิ์เป็นคุณครูเพื่อให้สร้างคอร์สได้
                </p>
              </section>

              <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  {session?.user.avatarUrl ? (
                    <img src={session.user.avatarUrl} alt={session.user.name} className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
                      <UserRound size={18} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-black">{session?.user.name}</p>
                    <p className="truncate text-xs text-zinc-500">{session?.user.email}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  {['ส่งข้อมูล', 'แอดมินตรวจสอบ', 'เปิดสิทธิ์คุณครู'].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Sparkles size={18} className="text-black" />
                  <h2 className="font-semibold text-black">สิ่งที่ช่วยให้ผ่านเร็วขึ้น</h2>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  ใส่หัวข้อคอร์สให้ชัด แนบผลงานถ้ามี และเล่าประสบการณ์ให้แอดมินเห็นภาพคุณภาพการสอน
                </p>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
