import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import BrandMark from '../components/BrandMark'
import { api, authStorage } from '../services/api'

const fieldShellClass =
  'mt-2 flex h-12 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 transition focus-within:border-zinc-400 focus-within:bg-zinc-50/60'

const inputClass =
  'h-full min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-zinc-400'

export default function Register() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password'))
    const confirmPassword = String(formData.get('confirmPassword'))

    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const session = await api.register({
        name: String(formData.get('name')).trim(),
        email: String(formData.get('email')).trim(),
        password,
        role: 'student',
      })

      authStorage.setSession(session)
      navigate(session.dashboardPath)
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'สมัครสมาชิกไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white text-black">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[1600px] flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-[520px] rounded-[26px] border border-zinc-200 bg-white px-6 py-9 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:px-10">
          <div className="text-center">
            <Link to="/" className="mx-auto inline-flex flex-col items-center gap-3">
              <span className="inline-flex h-16 w-16 items-center justify-center text-black">
                <BrandMark className="h-16 w-16" />
              </span>
              <span className="text-xl font-semibold tracking-tight">ยินดีต้อนรับสู่ MyCourse</span>
            </Link>
            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-black">สมัครสมาชิก</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              สร้างบัญชีผู้เรียนเพื่อเข้าเรียนและติดตามความคืบหน้าของคุณ
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-black">ชื่อผู้ใช้</span>
              <span className={fieldShellClass}>
                <UserRound size={17} className="shrink-0 text-zinc-400" />
                <input
                  name="name"
                  className={inputClass}
                  autoComplete="name"
                  placeholder="กรอกชื่อของคุณ"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-black">อีเมล</span>
              <span className={fieldShellClass}>
                <Mail size={17} className="shrink-0 text-zinc-400" />
                <input
                  name="email"
                  className={inputClass}
                  type="email"
                  autoComplete="email"
                  placeholder="example@mail.com"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-black">รหัสผ่าน</span>
              <span className={fieldShellClass}>
                <LockKeyhole size={17} className="shrink-0 text-zinc-400" />
                <input
                  name="password"
                  className={inputClass}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-black"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-black">ยืนยันรหัสผ่าน</span>
              <span className={fieldShellClass}>
                <LockKeyhole size={17} className="shrink-0 text-zinc-400" />
                <input
                  name="confirmPassword"
                  className={inputClass}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-black"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs leading-5 text-zinc-500">
              รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
            </p>

            {error ? (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-700">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-black px-4 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,0,0,0.16)] transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
              disabled={loading}
            >
              {loading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-zinc-500">
            มีบัญชีอยู่แล้ว?{' '}
            <Link to="/login" className="font-semibold text-black underline underline-offset-4 hover:text-zinc-600">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
