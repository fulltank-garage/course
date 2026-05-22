import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  GraduationCap,
  Library,
  LogOut,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { api, authStorage } from '../services/api'
import type { User, UserRole } from '../types/user'

interface SidebarItem {
  to: string
  label: string
  icon: LucideIcon
}

const itemsByRole: Record<Extract<UserRole, 'student' | 'teacher' | 'admin'>, SidebarItem[]> = {
  student: [
    { to: '/student', label: 'คอร์สของฉัน', icon: BookOpenCheck },
    { to: '/student?section=profile', label: 'โปรไฟล์', icon: UserRound },
  ],
  teacher: [
    { to: '/teacher', label: 'จัดการคอร์ส', icon: Library },
    { to: '/teacher?section=profile', label: 'โปรไฟล์', icon: UserRound },
  ],
  admin: [
    { to: '/admin', label: 'ภาพรวม', icon: BarChart3 },
    { to: '/admin?section=applications', label: 'คำขอคุณครู', icon: GraduationCap },
    { to: '/admin?section=users', label: 'ผู้ใช้', icon: Users },
    { to: '/admin?section=courses', label: 'คอร์ส', icon: Library },
    { to: '/admin?section=sponsors', label: 'ผู้สนับสนุน', icon: Building2 },
  ],
}

const roleLabels = {
  student: 'ผู้เรียน',
  teacher: 'Teacher Studio',
  admin: 'Admin Console',
}

export default function Sidebar({
  role,
  user,
}: {
  role: Extract<UserRole, 'student' | 'teacher' | 'admin'>
  user?: User | null
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = `${location.pathname}${location.search}`

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch {
      // Keep the client session cleared even if the server session is already gone.
    } finally {
      authStorage.clearSession()
      navigate('/')
    }
  }

  return (
    <aside className="sticky top-5 h-fit rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60">
      <Link to={`/${role}`} className="flex items-center gap-3 rounded-md px-2 py-2.5">
        <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-950 text-white">
          <img src="/my-course-logo.png" alt="My Course" className="h-full w-full object-cover" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">MyCourse</p>
          <p className="truncate text-xs text-slate-500">{roleLabels[role]}</p>
        </div>
      </Link>

      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-9 w-9 rounded-md object-cover" />
          ) : (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-950 ring-1 ring-slate-200">
              <ShieldCheck size={16} />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{user?.name ?? roleLabels[role]}</p>
            <p className="truncate text-xs text-slate-500">{user?.email ?? roleLabels[role]}</p>
          </div>
        </div>
      </div>

      <nav className="mt-3 grid gap-1">
        {itemsByRole[role].map((item) => {
          const Icon = item.icon
          const active = currentPath === item.to || (item.to === `/${role}` && location.pathname === item.to && !location.search)

          return (
            <Link
              key={`${item.to}-${item.label}`}
              to={item.to}
              className={[
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition',
                active ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
              ].join(' ')}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {role === 'admin' ? (
        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          ออกจากระบบ
        </button>
      ) : null}
    </aside>
  )
}
