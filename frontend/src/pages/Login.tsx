import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import BrandMark from '../components/BrandMark'
import { api, authStorage } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    setError(null)
    setLoading(true)

    try {
      const session = await api.login({
        email: String(formData.get('email')),
        password: String(formData.get('password')),
      })
      authStorage.setSession(session)
      navigate(session.dashboardPath)
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-[#ffffff] text-black">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[1600px] flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-[500px] rounded-2xl border border-zinc-200 bg-[#ffffff] px-6 py-10 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:px-12 sm:py-12">
          <div className="text-center">
            <Link to="/" className="mx-auto mb-8 inline-flex flex-col items-center justify-center gap-3">
              <span className="inline-flex h-20 w-20 items-center justify-center text-black">
                <BrandMark className="h-20 w-20" />
              </span>
              <span className="text-2xl font-semibold tracking-tight text-black">ยินดีต้อนรับสู่ MyCourse</span>
            </Link>
            <h1 className="sr-only">เข้าสู่ระบบ</h1>
          </div>

          <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-black">อีเมล</span>
              <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-zinc-200 bg-[#ffffff] px-3 transition focus-within:border-zinc-300 focus-within:bg-zinc-50/60">
                <Mail size={18} className="shrink-0 text-zinc-500" />
                <input
                  name="email"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-black caret-black outline-none selection:bg-zinc-100 selection:text-black placeholder:text-zinc-400"
                  type="text"
                  autoComplete="username"
                  required
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-black">รหัสผ่าน</span>
              <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-zinc-200 bg-[#ffffff] px-3 transition focus-within:border-zinc-300 focus-within:bg-zinc-50/60">
                <LockKeyhole size={18} className="shrink-0 text-zinc-500" />
                <input
                  name="password"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-black caret-black outline-none selection:bg-zinc-100 selection:text-black placeholder:text-zinc-400"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-black"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-black px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,0,0,0.16)] transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
              disabled={loading}
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-zinc-500">
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" className="font-semibold text-black underline underline-offset-4 hover:text-zinc-600">
              สมัครสมาชิก
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-400">© 2024 MyCourse. สงวนลิขสิทธิ์</p>
      </div>
    </section>
  )
}
