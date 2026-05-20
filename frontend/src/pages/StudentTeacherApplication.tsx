import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, GraduationCap, Menu, Send, UserRound } from 'lucide-react'
import LearnProSidebar from '../components/LearnProSidebar'
import { api, authStorage } from '../services/api'

const inputClass =
  'mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-black outline-none transition placeholder:text-zinc-400 focus:border-black focus:bg-zinc-50/50'

const textareaClass =
  'mt-2 min-h-[132px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-black outline-none transition placeholder:text-zinc-400 focus:border-black focus:bg-zinc-50/50'

export default function StudentTeacherApplication() {
  const session = authStorage.getSession()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      await api.createTeacherApplication({
        displayName: String(formData.get('displayName') ?? '').trim(),
        phone: String(formData.get('phone') ?? '').trim(),
        expertise: String(formData.get('expertise') ?? '').trim(),
        courseTopic: String(formData.get('courseTopic') ?? '').trim(),
        experience: String(formData.get('experience') ?? '').trim(),
        portfolioUrl: String(formData.get('portfolioUrl') ?? '').trim(),
        message: String(formData.get('message') ?? '').trim(),
      })

      form.reset()
      setSuccess(true)
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'ส่งคำขอไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

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
        <div className="mx-auto max-w-[1120px] px-4 py-4 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center gap-4">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white lg:hidden"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="เปิดเมนู"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-black">สมัครเป็นครู</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-500">ส่งข้อมูลให้ทีมงานตรวจสอบก่อนเปิดสิทธิ์ผู้สอน</p>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <form className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_18px_52px_rgba(15,23,42,0.06)] sm:p-7" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-black">ชื่อที่ต้องการใช้เป็นผู้สอน *</span>
                  <input
                    name="displayName"
                    className={inputClass}
                    defaultValue={session?.user.name ?? ''}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-black">เบอร์โทรศัพท์</span>
                  <input name="phone" className={inputClass} type="tel" autoComplete="tel" />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-black">ความเชี่ยวชาญ *</span>
                  <input name="expertise" className={inputClass} required />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-black">หัวข้อคอร์สที่ต้องการสอน *</span>
                  <input name="courseTopic" className={inputClass} required />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-semibold text-black">ประสบการณ์การสอนหรือประสบการณ์ในสายงาน *</span>
                  <textarea name="experience" className={textareaClass} required />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-semibold text-black">ลิงก์ผลงานหรือโปรไฟล์</span>
                  <input name="portfolioUrl" className={inputClass} type="url" />
                </label>

                <label className="block md:col-span-2">
                  <span className="text-sm font-semibold text-black">ข้อความเพิ่มเติม</span>
                  <textarea name="message" className={textareaClass} />
                </label>
              </div>

              {error ? (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-700">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-700">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
                  ส่งคำขอสมัครเป็นครูเรียบร้อยแล้ว
                </div>
              ) : null}

              <div className="mt-7 flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Link to="/student" className="text-sm font-semibold text-zinc-500 transition hover:text-black">
                  กลับหน้าหลักนักเรียน
                </Link>
                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-6 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,0,0,0.16)] transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
                  disabled={submitting}
                >
                  <Send size={16} />
                  {submitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอสมัครเป็นครู'}
                </button>
              </div>
            </form>

            <aside className="h-fit rounded-[24px] border border-zinc-200 bg-zinc-50 p-5">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
                <GraduationCap size={20} />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-black">ข้อมูลที่ใช้พิจารณา</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
                <p>ทีมงานใช้ข้อมูลนี้เพื่อตรวจสอบความพร้อมก่อนเปิดสิทธิ์การสร้างคอร์ส</p>
                <p>บัญชีของคุณยังเป็นนักเรียนจนกว่าทีมงานจะอนุมัติและปรับสิทธิ์ในระบบ</p>
              </div>
              <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
                <div className="flex items-center gap-3">
                  {session?.user.avatarUrl ? (
                    <img src={session.user.avatarUrl} alt={session.user.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                      <UserRound size={17} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-black">{session?.user.name}</p>
                    <p className="truncate text-xs text-zinc-500">{session?.user.email}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
