import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  LibraryBig,
  LogIn,
  LogOut,
  Mail,
  Sparkles,
  Trophy,
  UserRound,
  Video,
  X,
} from 'lucide-react'
import BrandMark from './BrandMark'
import { api, authStorage } from '../services/api'

type SidebarKey =
  | 'home'
  | 'all-courses'
  | 'my-courses'
  | 'ai-packages'
  | 'certificates'
  | 'messages'
  | 'teacher-application'
  | 'settings'

interface LearnProSidebarProps {
  active: SidebarKey
  profileName?: string
  profileAvatarUrl?: string
  profileLabel?: string
  className?: string
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function LearnProSidebar({
  active,
  profileName,
  profileAvatarUrl,
  profileLabel,
  className = '',
  mobileOpen = false,
  onMobileClose,
}: LearnProSidebarProps) {
  const navigate = useNavigate()
  const lockedScrollYRef = useRef(0)
  const session = authStorage.getSession()
  const role = session?.user.role
  const dashboardPath =
    role === 'student' ? '/student/store' : role === 'teacher' ? '/teacher' : role === 'admin' ? '/admin' : '/'
  const settingsPath =
    role === 'student' ? '/student?section=settings' : role === 'teacher' ? '/teacher?section=profile' : '/login'
  const studentPath = role === 'student' ? '/student/messages' : '/login'
  const myCoursesPath = role === 'student' ? '/student?section=my-courses' : role === 'teacher' ? '/teacher' : '/login'
  const coursesPath = role === 'student' ? '/student/store' : '/'
  const aiPackagesPath = role === 'student' ? '/student/ai-packages' : '/login'
  const certificatesPath = role === 'student' ? '/student/certificates' : studentPath
  const displayName = profileName ?? session?.user.name ?? 'ผู้เยี่ยมชม'
  const avatarUrl = profileAvatarUrl ?? session?.user.avatarUrl

  useEffect(() => {
    if (!mobileOpen) return

    lockedScrollYRef.current = window.scrollY
    const previousOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousTouchAction = document.body.style.touchAction
    const previousPosition = document.body.style.position
    const previousTop = document.body.style.top
    const previousWidth = document.body.style.width

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${lockedScrollYRef.current}px`
    document.body.style.width = '100%'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousOverflow
      document.body.style.touchAction = previousTouchAction
      document.body.style.position = previousPosition
      document.body.style.top = previousTop
      document.body.style.width = previousWidth
      window.scrollTo(0, lockedScrollYRef.current)
    }
  }, [mobileOpen])

  const navItems = [
    { key: 'all-courses', to: coursesPath, label: 'ค้นหาคอร์ส', icon: LibraryBig },
    { key: 'my-courses', to: myCoursesPath, label: 'คอร์สของฉัน', icon: Video },
    { key: 'ai-packages', to: aiPackagesPath, label: 'แพ็กเกจ AI', icon: Sparkles },
    { key: 'certificates', to: certificatesPath, label: 'ใบประกาศนียบัตร', icon: Trophy },
    { key: 'messages', to: studentPath, label: 'ข้อความ', icon: Mail },
  ] as const

  const handleLogout = async () => {
    if (!session) {
      navigate('/login')
      return
    }

    try {
      await api.logout()
    } catch {
      // Keep local state aligned even if the server session has already expired.
    } finally {
      authStorage.clearSession()
      onMobileClose?.()
      navigate('/login')
    }
  }

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, isActive: boolean) => {
    if (isActive) {
      event.preventDefault()
    }

    onMobileClose?.()
  }

  return (
    <>
      <div
        className={[
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ease-out lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={onMobileClose}
      />
      <aside
        className={[
          'mobile-landscape-scroll fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] flex-col bg-black text-white transition-transform duration-300 ease-out lg:z-40 lg:w-[280px] lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className,
        ].join(' ')}
      >
        <div className="landscape-compact-y flex h-20 shrink-0 items-center justify-between px-8">
          <Link to={dashboardPath} className="flex items-center gap-3" onClick={onMobileClose}>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <BrandMark className="h-10 w-10" />
            </span>
            <span className="text-xl font-semibold tracking-tight">My Course</span>
          </Link>
          <button type="button" className="rounded-md p-2 text-white/70 lg:hidden" onClick={onMobileClose} aria-label="ปิดเมนู">
            <X size={20} />
          </button>
        </div>

        <nav className="student-sidebar-nav shrink-0 space-y-2 px-5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = active === item.key

            return (
              <Link
                key={item.key}
                to={item.to}
                onClick={(event) => handleNavClick(event, isActive)}
                className={[
                  'flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition duration-200 ease-out',
                  isActive ? 'bg-white/12 text-white shadow-inner shadow-white/5' : 'text-white/78 hover:bg-white/8 hover:text-white',
                ].join(' ')}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {role === 'student' ? (
          <div className="mt-auto shrink-0 px-7">
            <Link
              to="/student/teacher-application"
              onClick={(event) => handleNavClick(event, active === 'teacher-application')}
              className={[
                'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition',
                active === 'teacher-application'
                  ? 'border-white/15 bg-white/12 text-white shadow-inner shadow-white/5'
                  : 'border-white/10 bg-white/[0.04] text-white/72 hover:border-white/20 hover:bg-white/[0.08] hover:text-white',
              ].join(' ')}
            >
              <GraduationCap size={18} />
              <span className="min-w-0">
                <span className="block">สมัครเป็นครู</span>
                <span className="mt-0.5 block truncate text-xs font-normal text-white/45">ส่งข้อมูลเพื่อเปิดสิทธิ์สอน</span>
              </span>
            </Link>
          </div>
        ) : null}

        <div className="shrink-0 px-7 pb-7 pt-4">
          <div className="border-t border-white/10 pt-5">
            <Link
              to={settingsPath}
              onClick={onMobileClose}
              className={[
                'flex items-center gap-3 rounded-lg transition hover:bg-white/8',
                active === 'settings' ? 'bg-white/12' : '',
              ].join(' ')}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black">
                  <UserRound size={18} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-xs text-white/55">{profileLabel ?? session?.user.email ?? 'เลือกคอร์สที่สนใจ'}</p>
              </div>
            </Link>
            <button
                type="button"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-200"
                onClick={handleLogout}
                aria-label={session ? 'ออกจากระบบ' : 'เข้าสู่ระบบ'}
              >
                {session ? <LogOut size={17} /> : <LogIn size={17} />}
                <span>{session ? 'ออกจากระบบ' : 'เข้าสู่ระบบ'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
