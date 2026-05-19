import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, LogOut, Menu, Moon, Sun, UserRound, X } from 'lucide-react'
import { api, authStorage, type AuthSession } from '../services/api'

const publicNavItems = [
  { to: '/', label: 'หน้าหลัก' },
  { to: '/contact', label: 'ติดต่อ' },
]

const courseNavItem = { to: '/courses', label: 'คอร์ส' }

const navItemClass = (isActive: boolean) =>
  [
    'rounded-md px-3 py-2 text-sm font-semibold transition',
    isActive
      ? 'text-slate-950 underline decoration-slate-950 decoration-2 underline-offset-[10px] dark:text-white dark:decoration-white'
      : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white',
  ].join(' ')

const logoutButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-md bg-rose-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

type ThemeMode = 'light' | 'dark'
const themeStorageKey = 'mycourse_theme'

const getInitialTheme = (): ThemeMode => {
  const savedTheme = localStorage.getItem(themeStorageKey)

  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'

  return 'light'
}

function UserAvatar({ session, className = 'h-8 w-8' }: { session: AuthSession; className?: string }) {
  if (session.user.avatarUrl) {
    return (
      <img
        src={session.user.avatarUrl}
        alt={session.user.name}
        className={`${className} rounded-md object-cover ring-1 ring-slate-200`}
      />
    )
  }

  return (
    <span className={`${className} inline-flex items-center justify-center rounded-md bg-slate-950 text-white dark:bg-white dark:text-slate-950`}>
      <UserRound size={16} />
    </span>
  )
}

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<AuthSession | null>(() => authStorage.getSession())
  const [loggingOut, setLoggingOut] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme())
  const currentPath = `${location.pathname}${location.search}`
  const isNavItemActive = (to: string) => {
    if (to === '/') return location.pathname === '/' && !location.hash
    return currentPath === to
  }

  useEffect(() => authStorage.subscribe(() => setSession(authStorage.getSession())), [])

  useEffect(() => {
    queueMicrotask(() => {
      setOpen(false)
    })
  }, [location.pathname])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(themeStorageKey, theme)
  }, [theme])

  const dashboardPath = useMemo(() => {
    if (!session) return '/login'
    if (session.user.role === 'teacher') return '/teacher'
    if (session.user.role === 'admin') return '/admin'
    return '/student'
  }, [session])

  const navItems = useMemo(() => {
    if (!session) return publicNavItems

    if (session.user.role === 'student') {
      return [
        { to: '/student', label: 'คอร์สของฉัน' },
        { to: '/student?section=profile', label: 'โปรไฟล์' },
      ]
    }

    if (session.user.role === 'teacher') {
      return [
        { to: '/teacher', label: 'จัดการคอร์ส' },
        { to: '/teacher?section=profile', label: 'โปรไฟล์' },
      ]
    }

    return [
      courseNavItem,
      { to: '/admin', label: 'แดชบอร์ดระบบ' },
      { to: '/admin?section=users', label: 'จัดการผู้ใช้' },
      { to: '/admin?section=courses', label: 'จัดการคอร์ส' },
    ]
  }, [session])

  const handleLogout = async () => {
    setLoggingOut(true)

    try {
      await api.logout()
    } catch {
      // Keep the local UI in sync even if the server session has already expired.
    } finally {
      authStorage.clearSession()
      setLoggingOut(false)
      navigate('/')
    }
  }

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  const ThemeIcon = theme === 'dark' ? Sun : Moon
  const isStudentSession = session?.user.role === 'student'

  if (session && isStudentSession) {
    return (
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-[rgba(255,255,255,0.95)] text-black backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to="/student/store"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            คอร์สทั้งหมดของนักเรียน
          </Link>

          <Link
            to={dashboardPath}
            className="inline-flex h-10 min-w-0 items-center gap-2 rounded-lg border border-zinc-200 bg-[#ffffff] px-2.5 text-sm font-semibold text-black transition hover:border-black"
            aria-label="ไปยังแดชบอร์ด"
          >
            <UserAvatar session={session} />
            <span className="max-w-36 truncate">{session.user.name}</span>
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
      <div className="container-page flex h-20 items-center justify-between">
        <Link to={session ? dashboardPath : '/'} className="flex items-center gap-2 text-slate-950">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] bg-black text-white">
            <BookOpen size={22} className="fill-white" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">LearnPro</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className={navItemClass(isNavItemActive(item.to))}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <button
              type="button"
              className="group inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-800 shadow-sm shadow-slate-200/60 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:shadow-black/30 dark:hover:bg-white dark:hover:text-slate-950"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
              title={theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
            >
              <ThemeIcon size={17} className="transition group-hover:scale-110" />
            </button>
          ) : null}
          {session ? (
            <>
              <Link
                to={dashboardPath}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-800 shadow-sm shadow-slate-200/60 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950"
                aria-label="ไปยังแดชบอร์ด"
              >
                <UserAvatar session={session} />
                <span className="max-w-36 truncate">{session.user.name}</span>
              </Link>
              <button type="button" className={logoutButtonClass} onClick={handleLogout} disabled={loggingOut}>
                <LogOut size={16} />
                {loggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 text-sm font-semibold text-black transition hover:text-zinc-600">
                เข้าสู่ระบบ
              </Link>
              <Link
                to="/register"
                className="inline-flex h-11 items-center justify-center rounded-[8px] bg-black px-5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(0,0,0,0.16)] transition hover:bg-zinc-800"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="btn-ghost md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="เปิดเมนู"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-page space-y-2 py-4">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100 dark:border-white/15 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-white dark:hover:text-slate-950"
              onClick={toggleTheme}
            >
              <ThemeIcon size={17} />
              {theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
            </button>
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className={navItemClass(isNavItemActive(item.to))}>
                {item.label}
              </Link>
            ))}
            {session ? (
              <div className="grid gap-2 pt-2">
                <Link
                  to={dashboardPath}
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3 text-slate-900 transition hover:bg-slate-100"
                  aria-label="ไปยังแดชบอร์ด"
                >
                  <UserAvatar session={session} className="h-10 w-10" />
                  <span className="min-w-0 truncate text-sm font-semibold">{session.user.name}</span>
                </Link>
                <button type="button" className={logoutButtonClass} onClick={handleLogout} disabled={loggingOut}>
                  <LogOut size={16} />
                  {loggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
                </button>
              </div>
            ) : (
              <div className="grid gap-2 pt-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center rounded-md border border-zinc-200 bg-white p-3 text-sm font-semibold text-black transition hover:border-black"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center rounded-md bg-black p-3 text-sm font-bold text-white transition hover:bg-zinc-800"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
