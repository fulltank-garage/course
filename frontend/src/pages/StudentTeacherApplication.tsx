import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Link2,
  LoaderCircle,
  Menu,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from 'lucide-react'
import LearnProSidebar from '../components/LearnProSidebar'
import { api, authStorage, type TeacherApplicationResponse } from '../services/api'

const fieldBase =
  'mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-black outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-black focus:ring-4 focus:ring-zinc-100'

const inputClass = `${fieldBase} h-12`
const textareaClass = `${fieldBase} min-h-[124px] resize-y py-3 leading-6`

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

const reviewSteps = ['กรอกข้อมูลสั้น ๆ', 'แอดมินตรวจความพร้อม', 'เปิดสิทธิ์สร้างคอร์ส']

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

      <main className="student-page-main min-w-0 bg-[#f7f7f5]">
        <div className="mx-auto max-w-[1180px] px-4 py-4 sm:px-6 lg:px-8">
          <header className="mb-5 flex items-center gap-4 lg:hidden">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-black shadow-sm"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="เปิดเมนู"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-black">สมัครเป็นคุณครู</p>
              <p className="truncate text-xs text-zinc-500">{session?.user.email}</p>
            </div>
          </header>

          <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="grid lg:grid-cols-[0.86fr_1.14fr]">
              <aside className="relative overflow-hidden bg-zinc-950 p-6 text-white sm:p-8 lg:p-10">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <div className="relative flex h-full min-h-[420px] flex-col justify-between">
                  <div>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
                      <GraduationCap size={22} />
                    </span>
                    <h1 className="mt-7 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                      เปิดคลาสของคุณบน MyCourse
                    </h1>
                    <p className="mt-4 max-w-md text-sm leading-7 text-white/65">
                      สมัครเป็นคุณครูด้วยฟอร์มสั้น ๆ แอดมินจะตรวจความพร้อม แล้วเปิดสิทธิ์ให้คุณสร้างคอร์ส จัดการบทเรียน และดูแลนักเรียนได้ในที่เดียว
                    </p>
                  </div>

                  <div className="mt-10 space-y-3">
                    {reviewSteps.map((step, index) => (
                      <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-black">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-white/85">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>

              <form className="p-5 sm:p-7 lg:p-9" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Teacher Application</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-black">ข้อมูลสำหรับเริ่มสอน</h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                      กรอกเฉพาะข้อมูลที่จำเป็น เพื่อให้แอดมินเห็นตัวตน ความเชี่ยวชาญ และคอร์สแรกที่คุณอยากเปิดสอน
                    </p>
                  </div>

                  {currentStatus ? (
                    <div className={`flex shrink-0 items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${currentStatus.className}`}>
                      <StatusIcon size={18} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold">{currentStatus.label}</p>
                        <p className="mt-1 max-w-[260px] text-xs leading-5 opacity-80">{currentStatus.description}</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {application?.reviewNote ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-700">
                    <span className="font-semibold">หมายเหตุจากแอดมิน: </span>
                    {application.reviewNote}
                  </div>
                ) : null}

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="flex items-center gap-2 text-sm font-semibold text-black">
                      <UserRound size={15} />
                      ชื่อผู้สอน *
                    </span>
                    <input
                      name="displayName"
                      className={inputClass}
                      defaultValue={application?.displayName ?? session?.user.name ?? ''}
                      placeholder="ชื่อที่จะแสดงบนหน้าคอร์ส"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="flex items-center gap-2 text-sm font-semibold text-black">
                      <Phone size={15} />
                      เบอร์โทร
                    </span>
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
                    <span className="flex items-center gap-2 text-sm font-semibold text-black">
                      <Sparkles size={15} />
                      ความเชี่ยวชาญ *
                    </span>
                    <input
                      name="expertise"
                      className={inputClass}
                      defaultValue={application?.expertise ?? ''}
                      placeholder="เช่น Frontend, English, Design"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="flex items-center gap-2 text-sm font-semibold text-black">
                      <FileText size={15} />
                      คอร์สแรกที่อยากสอน *
                    </span>
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
                      placeholder="เล่าประสบการณ์สอน ผลงาน หรือความเชี่ยวชาญที่เกี่ยวข้องแบบสั้น ๆ"
                      required
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-black">
                      <Link2 size={15} />
                      ลิงก์ผลงานหรือโปรไฟล์
                    </span>
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
                      placeholder="มีอะไรอยากให้ทีมตรวจสอบเพิ่มเติม เขียนไว้ตรงนี้ได้"
                    />
                  </label>
                </div>

                {error ? (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
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
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(0,0,0,0.16)] transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
                    disabled={submitting || loadingApplication || application?.status === 'approved'}
                  >
                    {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                    {submitting ? 'กำลังส่งคำขอ...' : application ? 'อัปเดตคำขอ' : 'ส่งคำขอให้แอดมินตรวจ'}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: 'ข้อมูลปลอดภัย', text: 'ใช้ตรวจสอบสิทธิ์คุณครูภายในระบบเท่านั้น' },
              { icon: Clock3, title: 'ขั้นตอนไม่ซับซ้อน', text: 'กรอกครั้งเดียว แล้วรอสถานะจากแอดมิน' },
              { icon: CheckCircle2, title: 'พร้อมเริ่มสร้างคอร์ส', text: 'เมื่ออนุมัติแล้วจะเข้าหน้า Teacher Studio ได้ทันที' },
            ].map((item) => {
              const Icon = item.icon

              return (
                <article key={item.title} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <Icon size={19} className="text-black" />
                  <h3 className="mt-4 text-sm font-semibold text-black">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">{item.text}</p>
                </article>
              )
            })}
          </section>
        </div>
      </main>
    </div>
  )
}
