import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Home, LayoutDashboard, Library, LogOut, Mail, Menu, ShoppingCart, UserCog, UserRound, X } from 'lucide-react'
import BrandMark from './BrandMark'
import { api, authStorage, cartStorage, type AuthSession } from '../services/api'

const publicNavItems = [
  { to: '/', label: 'หน้าหลัก' },
  { to: '/contact', label: 'ติดต่อ' },
]

const navItemClass = (isActive: boolean) =>
  [
    'rounded-md px-3 py-2 text-sm font-semibold transition',
    isActive
      ? 'text-slate-950 underline decoration-slate-950 decoration-2 underline-offset-[10px] dark:text-white dark:decoration-white'
      : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white',
  ].join(' ')

const logoutButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-md bg-rose-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

const themeStorageKey = 'mycourse_theme'

const getMobileNavIcon = (to: string) => {
  if (to === '/') return Home
  if (to === '/contact') return Mail
  if (to.includes('profile')) return UserRound
  if (to.includes('users')) return UserCog
  if (to.includes('courses')) return Library
  if (to.includes('student')) return BookOpen
  return LayoutDashboard
}

function LoginAvatarIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 128 128" aria-hidden="true" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="64" cy="64" r="59" fill="black" />
      <circle cx="64" cy="46" r="24" fill="white" />
      <path d="M29 110c3.5-27.5 17.2-45 35-45s31.5 17.5 35 45c-9.8 6.1-21.6 9.5-35 9.5S38.8 116.1 29 110Z" fill="white" />
    </svg>
  )
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
  const [cartItems, setCartItems] = useState(() => cartStorage.getItems())
  const [cartPulse, setCartPulse] = useState(false)
  const currentPath = `${location.pathname}${location.search}`
  const isNavItemActive = (to: string) => {
    if (to === '/') return location.pathname === '/' && !location.hash
    return currentPath === to
  }

  useEffect(() => authStorage.subscribe(() => setSession(authStorage.getSession())), [])

  useEffect(
    () =>
      cartStorage.subscribe(() => {
        setCartItems(cartStorage.getItems())
        setCartPulse(true)
        window.setTimeout(() => setCartPulse(false), 450)
      }),
    [],
  )

  useEffect(() => {
    queueMicrotask(() => {
      setOpen(false)
    })
  }, [location.pathname])

  useEffect(() => {
    document.documentElement.classList.remove('dark')
    localStorage.removeItem(themeStorageKey)
  }, [])

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

  const isStudentSession = session?.user.role === 'student'
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  if (session && isStudentSession) {
    return (
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-[rgba(255,255,255,0.95)] text-black backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-end gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to="/student/store?cart=1"
            className={[
              'relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white text-[0px] text-black transition hover:border-black',
              cartPulse ? 'scale-110 border-black shadow-sm' : '',
            ].join(' ')}
            aria-label="ตะกร้าสินค้า"
            title="ตะกร้าสินค้า"
          >
            <ShoppingCart size={18} />
            {cartItems.length > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[11px] font-semibold text-white">
                {cartItems.length}
              </span>
            ) : null}
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

          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-black px-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{loggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}</span>
          </button>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
      <div className="container-page flex h-20 items-center justify-between">
        <Link to={session ? dashboardPath : '/'} className="flex items-center gap-2 text-slate-950">
          <span className="inline-flex h-10 w-10 items-center justify-center text-black">
            <BrandMark className="h-10 w-10" />
          </span>
          <span className="text-xl font-semibold tracking-tight">MyCourse</span>
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
          ) : isAuthPage ? null : (
            <Link
              to="/login"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:bg-zinc-800 hover:shadow-[0_18px_38px_rgba(0,0,0,0.24)]"
            >
              <LoginAvatarIcon className="h-5 w-5 shrink-0" />
              เข้าสู่ระบบ
            </Link>
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
          <div className="container-page py-4">
            {session ? (
              <div className="grid gap-2 pt-2">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {navItems.map((item) => {
                    const Icon = getMobileNavIcon(item.to)

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={[
                          'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition',
                          isNavItemActive(item.to)
                            ? 'border-black bg-black text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)]'
                            : 'border-slate-200 bg-white text-slate-950 hover:border-black hover:bg-slate-50',
                        ].join(' ')}
                        aria-label={item.label}
                        title={item.label}
                      >
                        <Icon size={18} strokeWidth={2.2} />
                      </Link>
                    )
                  })}
                </div>
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
            ) : isAuthPage ? null : (
              <div className="flex items-center gap-2">
                {navItems.map((item) => {
                  const Icon = getMobileNavIcon(item.to)

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={[
                        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition',
                        isNavItemActive(item.to)
                          ? 'border-black bg-black text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)]'
                          : 'border-slate-200 bg-white text-slate-950 hover:border-black hover:bg-slate-50',
                      ].join(' ')}
                      aria-label={item.label}
                      title={item.label}
                    >
                      <Icon size={18} strokeWidth={2.2} />
                    </Link>
                  )
                })}
                <Link
                  to="/login"
                  className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-black px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:bg-zinc-800"
                >
                  <LoginAvatarIcon className="h-5 w-5 shrink-0" />
                  เข้าสู่ระบบ
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
