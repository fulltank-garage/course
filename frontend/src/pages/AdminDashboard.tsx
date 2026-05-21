import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Building2,
  Eye,
  GraduationCap,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { api } from '../services/api'
import type { Course } from '../types/course'
import type { Sponsor } from '../types/sponsor'
import type { User } from '../types/user'

type AdminSection = 'overview' | 'users' | 'courses' | 'sponsors'

type SponsorDraft = {
  name: string
  logoUrl: string
  websiteUrl: string
  displayOrder: number
  isActive: boolean
}

const fallbackCourseCover =
  'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80'

const courseStatusLabel: Record<Course['status'], string> = {
  draft: 'ฉบับร่าง',
  published: 'เผยแพร่',
  hidden: 'ซ่อน',
}

const adminSections: AdminSection[] = ['overview', 'users', 'courses', 'sponsors']

const createSponsorDraft = (displayOrder = 1): SponsorDraft => ({
  name: '',
  logoUrl: '',
  websiteUrl: '',
  displayOrder,
  isActive: true,
})

const toSponsorDraft = (sponsor: Sponsor): SponsorDraft => ({
  name: sponsor.name,
  logoUrl: sponsor.logoUrl ?? '',
  websiteUrl: sponsor.websiteUrl ?? '',
  displayOrder: sponsor.displayOrder,
  isActive: sponsor.isActive,
})

const normalizeSponsors = (items: Sponsor[]) =>
  [...items].sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) return left.displayOrder - right.displayOrder
    return left.name.localeCompare(right.name)
  })

export default function AdminDashboard() {
  const [searchParams] = useSearchParams()
  const sectionParam = searchParams.get('section') as AdminSection | null
  const activeSection = sectionParam && adminSections.includes(sectionParam) ? sectionParam : 'overview'
  const { data, error, loading } = useApi(() => api.getAdminDashboard(), [])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null)
  const [sponsorDraft, setSponsorDraft] = useState<SponsorDraft>(createSponsorDraft())
  const [popularUpdatingSlug, setPopularUpdatingSlug] = useState<string | null>(null)
  const [statusUpdatingSlug, setStatusUpdatingSlug] = useState<string | null>(null)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [savingSponsor, setSavingSponsor] = useState(false)
  const [movingSponsorId, setMovingSponsorId] = useState<string | null>(null)
  const [deletingSponsorId, setDeletingSponsorId] = useState<string | null>(null)
  const [courseActionError, setCourseActionError] = useState<string | null>(null)
  const [userActionError, setUserActionError] = useState<string | null>(null)
  const [sponsorError, setSponsorError] = useState<string | null>(null)
  const [sponsorSuccess, setSponsorSuccess] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | User['role']>('all')
  const [courseSearch, setCourseSearch] = useState('')
  const [courseStatusFilter, setCourseStatusFilter] = useState<'all' | Course['status']>('all')

  useEffect(() => {
    if (data?.courses) setCourses(data.courses)
  }, [data?.courses])

  useEffect(() => {
    if (data?.users) setUsers(data.users)
  }, [data?.users])

  useEffect(() => {
    if (!data?.sponsors) return

    const nextSponsors = normalizeSponsors(data.sponsors)
    setSponsors(nextSponsors)

    if (!editingSponsorId) {
      setSponsorDraft(createSponsorDraft(nextSponsors.length + 1))
    }
  }, [data?.sponsors, editingSponsorId])

  const orderedSponsors = useMemo(() => normalizeSponsors(sponsors), [sponsors])
  const activeSponsors = useMemo(() => orderedSponsors.filter((sponsor) => sponsor.isActive), [orderedSponsors])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = userSearch.trim().toLowerCase()

    return users.filter((user) => {
      const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter
      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch)

      return matchesRole && matchesSearch
    })
  }, [userRoleFilter, userSearch, users])

  const filteredCourses = useMemo(() => {
    const normalizedSearch = courseSearch.trim().toLowerCase()

    return courses.filter((course) => {
      const matchesStatus = courseStatusFilter === 'all' || course.status === courseStatusFilter
      const matchesSearch =
        !normalizedSearch ||
        course.title.toLowerCase().includes(normalizedSearch) ||
        course.category.toLowerCase().includes(normalizedSearch) ||
        course.instructor.name.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [courseSearch, courseStatusFilter, courses])

  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">กำลังโหลดแดชบอร์ด...</div>
  }

  if (error) {
    return <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
  }

  if (!data) return null

  const stats = [
    { label: 'ผู้ใช้', value: users.length, icon: Users },
    { label: 'คอร์ส', value: data.stats.totalCourses, icon: BookOpen },
    { label: 'ครู', value: users.filter((user) => user.role === 'teacher').length, icon: ShieldCheck },
    { label: 'นักเรียน', value: users.filter((user) => user.role === 'student').length, icon: GraduationCap },
    { label: 'สปอนเซอร์', value: data.stats.totalSponsors, icon: Building2 },
    { label: 'ออนไลน์', value: users.filter((user) => user.isOnline).length, icon: Activity },
  ]

  const onlineUsers = users.filter((user) => user.isOnline)
  const offlineUsers = users.filter((user) => !user.isOnline)
  const publishedCourses = courses.filter((course) => course.status === 'published')
  const draftCourses = courses.filter((course) => course.status === 'draft')
  const popularCourses = courses.filter((course) => course.isPopular)

  const resetSponsorEditor = (displayOrder = orderedSponsors.length + 1) => {
    setEditingSponsorId(null)
    setSponsorDraft(createSponsorDraft(displayOrder))
    setSponsorError(null)
    setSponsorSuccess(null)
  }

  const deleteUser = async () => {
    if (!deleteUserTarget) return

    setDeletingUserId(deleteUserTarget.id)
    setUserActionError(null)

    try {
      await api.deleteUser(deleteUserTarget.id)
      setUsers((current) => current.filter((user) => user.id !== deleteUserTarget.id))
      if (deleteUserTarget.role === 'teacher') {
        setCourses((current) => current.filter((course) => course.instructor.id !== deleteUserTarget.id))
        setSelectedCourse((current) => (current?.instructor.id === deleteUserTarget.id ? null : current))
      }
      setSelectedUser((current) => (current?.id === deleteUserTarget.id ? null : current))
      setDeleteUserTarget(null)
    } catch (currentError) {
      setUserActionError(currentError instanceof Error ? currentError.message : 'ไม่สามารถลบผู้ใช้งานได้')
    } finally {
      setDeletingUserId(null)
    }
  }

  const updateCourseStatus = async (course: Course, status: Course['status']) => {
    setStatusUpdatingSlug(course.slug)
    setCourseActionError(null)

    try {
      const nextCourse = await api.updateCourseStatus(course.slug, status)
      setCourses((current) => current.map((item) => (item.slug === nextCourse.slug ? nextCourse : item)))
      setSelectedCourse((current) => (current?.slug === nextCourse.slug ? nextCourse : current))
    } catch (currentError) {
      setCourseActionError(currentError instanceof Error ? currentError.message : 'ไม่สามารถเปลี่ยนสถานะคอร์สได้')
    } finally {
      setStatusUpdatingSlug(null)
    }
  }

  const togglePopular = async (course: Course) => {
    setPopularUpdatingSlug(course.slug)
    setCourseActionError(null)

    try {
      const nextCourse = await api.updateCoursePopularity(course.slug, !course.isPopular)
      setCourses((current) => current.map((item) => (item.slug === nextCourse.slug ? nextCourse : item)))
      setSelectedCourse((current) => (current?.slug === nextCourse.slug ? nextCourse : current))
    } catch (currentError) {
      setCourseActionError(currentError instanceof Error ? currentError.message : 'ไม่สามารถอัปเดตคอร์สยอดนิยมได้')
    } finally {
      setPopularUpdatingSlug(null)
    }
  }

  const deleteCourse = async () => {
    if (!deleteTarget) return

    setDeletingSlug(deleteTarget.slug)
    setCourseActionError(null)

    try {
      await api.deleteCourse(deleteTarget.slug)
      setCourses((current) => current.filter((course) => course.slug !== deleteTarget.slug))
      setSelectedCourse((current) => (current?.slug === deleteTarget.slug ? null : current))
      setDeleteTarget(null)
    } catch (currentError) {
      setCourseActionError(currentError instanceof Error ? currentError.message : 'ไม่สามารถลบคอร์สได้')
    } finally {
      setDeletingSlug(null)
    }
  }

  const saveSponsor = async () => {
    const name = sponsorDraft.name.trim()

    if (!name) {
      setSponsorError('กรุณากรอกชื่อผู้สนับสนุน')
      return
    }

    setSavingSponsor(true)
    setSponsorError(null)
    setSponsorSuccess(null)

    try {
      const savedSponsor = await api.saveSponsor(
        {
          name,
          logoUrl: sponsorDraft.logoUrl.trim() || undefined,
          websiteUrl: sponsorDraft.websiteUrl.trim() || undefined,
          displayOrder: sponsorDraft.displayOrder,
          isActive: sponsorDraft.isActive,
        },
        editingSponsorId ?? undefined,
      )

      setSponsors((current) => {
        const exists = current.some((item) => item.id === savedSponsor.id)
        return normalizeSponsors(
          exists ? current.map((item) => (item.id === savedSponsor.id ? savedSponsor : item)) : [...current, savedSponsor],
        )
      })
      setEditingSponsorId(savedSponsor.id)
      setSponsorDraft(toSponsorDraft(savedSponsor))
      setSponsorSuccess('บันทึกแล้ว')
    } catch (currentError) {
      setSponsorError(currentError instanceof Error ? currentError.message : 'ไม่สามารถบันทึกผู้สนับสนุนได้')
    } finally {
      setSavingSponsor(false)
    }
  }

  const moveSponsor = async (sponsorId: string, direction: 'up' | 'down') => {
    const sortedSponsors = normalizeSponsors(sponsors)
    const currentIndex = sortedSponsors.findIndex((item) => item.id === sponsorId)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortedSponsors.length) return

    const currentSponsor = sortedSponsors[currentIndex]
    const targetSponsor = sortedSponsors[targetIndex]
    setMovingSponsorId(sponsorId)
    setSponsorError(null)
    setSponsorSuccess(null)

    try {
      const [updatedCurrent, updatedTarget] = await Promise.all([
        api.saveSponsor({ ...toSponsorDraft(currentSponsor), displayOrder: targetSponsor.displayOrder }, currentSponsor.id),
        api.saveSponsor({ ...toSponsorDraft(targetSponsor), displayOrder: currentSponsor.displayOrder }, targetSponsor.id),
      ])

      setSponsors((current) =>
        normalizeSponsors(
          current.map((item) => {
            if (item.id === updatedCurrent.id) return updatedCurrent
            if (item.id === updatedTarget.id) return updatedTarget
            return item
          }),
        ),
      )
    } catch (currentError) {
      setSponsorError(currentError instanceof Error ? currentError.message : 'ไม่สามารถจัดลำดับได้')
    } finally {
      setMovingSponsorId(null)
    }
  }

  const removeSponsor = async (sponsorId: string) => {
    setDeletingSponsorId(sponsorId)
    setSponsorError(null)
    setSponsorSuccess(null)

    try {
      await api.deleteSponsor(sponsorId)
      setSponsors((current) => current.filter((item) => item.id !== sponsorId))
      if (editingSponsorId === sponsorId) resetSponsorEditor(Math.max(1, orderedSponsors.length))
      setSponsorSuccess('ลบแล้ว')
    } catch (currentError) {
      setSponsorError(currentError instanceof Error ? currentError.message : 'ไม่สามารถลบผู้สนับสนุนได้')
    } finally {
      setDeletingSponsorId(null)
    }
  }

  const formatDate = (value?: string | null) =>
    value
      ? new Intl.DateTimeFormat('th-TH', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(value))
      : '-'

  if (activeSection === 'users') {
    return (
      <>
        <div className="space-y-5">
          <AdminHeader title="ผู้ใช้" description="ตรวจสอบบัญชี บทบาท และสถานะการใช้งานล่าสุด" />

          <Panel>
            <PanelToolbar title="รายชื่อผู้ใช้" description={`${filteredUsers.length.toLocaleString('th-TH')} รายการ`}>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,220px)_130px]">
                <SearchField value={userSearch} onChange={setUserSearch} placeholder="ค้นหา" />
                <select className="minimal-input" value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value as 'all' | User['role'])}>
                  <option value="all">ทุกบทบาท</option>
                  <option value="student">student</option>
                  <option value="teacher">teacher</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </PanelToolbar>

            {userActionError ? <InlineNotice tone="danger">{userActionError}</InlineNotice> : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse">
                <thead className="border-y border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="table-cell">ผู้ใช้</th>
                    <th className="table-cell">บทบาท</th>
                    <th className="table-cell">สถานะ</th>
                    <th className="table-cell">Session</th>
                    <th className="table-cell text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/70">
                      <td className="table-cell">
                        <p className="font-medium text-slate-950">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="table-cell capitalize text-slate-600">{user.role}</td>
                      <td className="table-cell">
                        <StatusBadge tone={user.isOnline ? 'success' : 'muted'}>{user.isOnline ? 'online' : 'offline'}</StatusBadge>
                      </td>
                      <td className="table-cell text-slate-600">{user.activeSessions ?? 0}</td>
                      <td className="table-cell text-right">
                        <div className="flex justify-end gap-2">
                          <IconButton label="ตรวจสอบ" onClick={() => setSelectedUser(user)}>
                            <Eye size={15} />
                          </IconButton>
                          <IconButton
                            label="ลบผู้ใช้งาน"
                            tone="danger"
                            onClick={() => setDeleteUserTarget(user)}
                            disabled={deletingUserId === user.id}
                          >
                            {deletingUserId === user.id ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 ? <EmptyState title="ไม่พบผู้ใช้" description="ลองเปลี่ยนคำค้นหาหรือตัวกรอง" /> : null}
            </div>
          </Panel>
        </div>

        {selectedUser ? <UserInspectionModal user={selectedUser} formatDate={formatDate} onClose={() => setSelectedUser(null)} /> : null}
        {deleteUserTarget ? (
          <DeleteUserModal
            user={deleteUserTarget}
            deleting={deletingUserId === deleteUserTarget.id}
            onCancel={() => setDeleteUserTarget(null)}
            onConfirm={deleteUser}
          />
        ) : null}
      </>
    )
  }

  if (activeSection === 'courses') {
    return (
      <>
        <div className="space-y-5">
          <AdminHeader title="คอร์ส" description="อนุมัติ ซ่อน ตั้งคอร์สแนะนำ และตรวจสอบรายละเอียดคอร์ส" />

          <Panel>
            <PanelToolbar title="รายการคอร์ส" description={`${filteredCourses.length.toLocaleString('th-TH')} รายการ`}>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,220px)_140px]">
                <SearchField value={courseSearch} onChange={setCourseSearch} placeholder="ค้นหาคอร์ส" />
                <select
                  className="minimal-input"
                  value={courseStatusFilter}
                  onChange={(event) => setCourseStatusFilter(event.target.value as 'all' | Course['status'])}
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="published">เผยแพร่</option>
                  <option value="draft">ฉบับร่าง</option>
                  <option value="hidden">ซ่อน</option>
                </select>
              </div>
            </PanelToolbar>

            {courseActionError ? <InlineNotice tone="danger">{courseActionError}</InlineNotice> : null}

            <div className="divide-y divide-slate-100">
              {filteredCourses.map((course) => (
                <div key={course.id} className="grid gap-4 p-4 md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-center">
                  <CourseCoverImage course={course} className="aspect-video w-full rounded-md object-cover md:w-24" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{course.title}</p>
                      <StatusBadge tone={course.status === 'published' ? 'success' : course.status === 'hidden' ? 'muted' : 'warning'}>
                        {courseStatusLabel[course.status]}
                      </StatusBadge>
                      {course.isPopular ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          แนะนำ
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {course.category} · {course.lessonCount ?? course.lessons.length} บทเรียน · {course.students.toLocaleString('th-TH')} ผู้เรียน
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <button
                      type="button"
                      className="minimal-action"
                      onClick={() => updateCourseStatus(course, course.status === 'published' ? 'hidden' : 'published')}
                      disabled={statusUpdatingSlug === course.slug}
                    >
                      {statusUpdatingSlug === course.slug ? <LoaderCircle size={15} className="animate-spin" /> : <Eye size={15} />}
                      {course.status === 'published' ? 'ซ่อน' : 'เผยแพร่'}
                    </button>
                    <button type="button" className="minimal-action" onClick={() => togglePopular(course)} disabled={popularUpdatingSlug === course.slug}>
                      {popularUpdatingSlug === course.slug ? <LoaderCircle size={15} className="animate-spin" /> : <Star size={15} />}
                      {course.isPopular ? 'ถอดแนะนำ' : 'แนะนำ'}
                    </button>
                    <IconButton label="ดูรายละเอียด" onClick={() => setSelectedCourse(course)}>
                      <Eye size={15} />
                    </IconButton>
                    <IconButton label="ลบ" tone="danger" onClick={() => setDeleteTarget(course)}>
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </div>
              ))}
              {filteredCourses.length === 0 ? <EmptyState title="ไม่พบคอร์ส" description="ลองเปลี่ยนคำค้นหาหรือตัวกรอง" /> : null}
            </div>
          </Panel>
        </div>

        {selectedCourse ? <CourseInspectionModal course={selectedCourse} onClose={() => setSelectedCourse(null)} /> : null}
        {deleteTarget ? (
          <DeleteCourseModal
            course={deleteTarget}
            deleting={deletingSlug === deleteTarget.slug}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={deleteCourse}
          />
        ) : null}
      </>
    )
  }

  if (activeSection === 'sponsors') {
    return (
      <div className="space-y-5">
        <AdminHeader title="ผู้สนับสนุน" description="" />

        <SponsorPreview sponsors={activeSponsors} />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Panel>
            <PanelToolbar title="รายการ" description={`${orderedSponsors.length.toLocaleString('th-TH')} โลโก้`}>
              <button type="button" className="minimal-action" onClick={() => resetSponsorEditor(orderedSponsors.length + 1)}>
                <Plus size={15} />
                เพิ่ม
              </button>
            </PanelToolbar>

            {sponsorError ? <InlineNotice tone="danger">{sponsorError}</InlineNotice> : null}
            {sponsorSuccess ? <InlineNotice tone="success">{sponsorSuccess}</InlineNotice> : null}

            <div className="divide-y divide-slate-100">
              {orderedSponsors.map((sponsor, index) => (
                <div key={sponsor.id} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <SponsorLogo sponsor={sponsor} compact />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-950">{sponsor.name}</p>
                        <StatusBadge tone={sponsor.isActive ? 'success' : 'muted'}>{sponsor.isActive ? 'แสดง' : 'ซ่อน'}</StatusBadge>
                        <span className="text-xs text-slate-400">#{sponsor.displayOrder}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">{sponsor.websiteUrl || 'ไม่มีเว็บไซต์'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <IconButton label="เลื่อนขึ้น" onClick={() => moveSponsor(sponsor.id, 'up')} disabled={index === 0 || movingSponsorId === sponsor.id}>
                      {movingSponsorId === sponsor.id ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowUp size={15} />}
                    </IconButton>
                    <IconButton
                      label="เลื่อนลง"
                      onClick={() => moveSponsor(sponsor.id, 'down')}
                      disabled={index === orderedSponsors.length - 1 || movingSponsorId === sponsor.id}
                    >
                      {movingSponsorId === sponsor.id ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowDown size={15} />}
                    </IconButton>
                    <IconButton
                      label="แก้ไข"
                      onClick={() => {
                        setEditingSponsorId(sponsor.id)
                        setSponsorDraft(toSponsorDraft(sponsor))
                        setSponsorError(null)
                        setSponsorSuccess(null)
                      }}
                    >
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton label="ลบ" tone="danger" onClick={() => removeSponsor(sponsor.id)} disabled={deletingSponsorId === sponsor.id}>
                      {deletingSponsorId === sponsor.id ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </IconButton>
                  </div>
                </div>
              ))}
              {orderedSponsors.length === 0 ? <EmptyState title="ยังไม่มีผู้สนับสนุน" description="เพิ่มโลโก้แรกเพื่อให้แสดงบนหน้าแรก" /> : null}
            </div>
          </Panel>

          <SponsorForm
            draft={sponsorDraft}
            editing={Boolean(editingSponsorId)}
            saving={savingSponsor}
            onChange={setSponsorDraft}
            onReset={() => resetSponsorEditor(orderedSponsors.length + 1)}
            onSubmit={saveSponsor}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <AdminHeader title="ภาพรวม" description="พื้นที่ดูสถานะหลักของระบบแบบสั้นและชัดเจน" />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <Icon size={17} className="text-slate-400" />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
            </div>
          )
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoPanel title="ผู้ใช้">
          <InfoTile label="ออนไลน์" value={`${onlineUsers.length} คน`} tone="success" />
          <InfoTile label="ออฟไลน์" value={`${offlineUsers.length} คน`} />
        </InfoPanel>
        <InfoPanel title="คอร์ส">
          <InfoTile label="เผยแพร่" value={`${publishedCourses.length} คอร์ส`} tone="success" />
          <InfoTile label="ฉบับร่าง" value={`${draftCourses.length} คอร์ส`} />
          <InfoTile label="แนะนำ" value={`${popularCourses.length} คอร์ส`} />
        </InfoPanel>
        <InfoPanel title="ผู้สนับสนุน">
          <InfoTile label="แสดงบนหน้าแรก" value={`${activeSponsors.length} รายการ`} tone="success" />
          <InfoTile label="ซ่อนอยู่" value={`${orderedSponsors.length - activeSponsors.length} รายการ`} />
        </InfoPanel>
      </section>
    </div>
  )
}

function AdminHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Admin</p>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  )
}

function Panel({ children }: { children: ReactNode }) {
  return <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">{children}</section>
}

function PanelToolbar({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  )
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input className="minimal-input pl-9" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  )
}

function SponsorPreview({ sponsors }: { sponsors: Sponsor[] }) {
  const previewItems = sponsors.length > 0 ? sponsors : []

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-black p-4 text-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Sponsors</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">ผู้สนับสนุนที่ร่วมผลักดันการเรียนรู้</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-white/55">ตัวอย่างแถบโลโก้บนหน้าแรก ใช้เฉพาะรายการที่เปิดแสดงผล</p>
      </div>
      <div className="mt-4 overflow-hidden">
        {previewItems.length > 0 ? (
          <div className="sponsor-marquee-track">
            {[...previewItems, ...previewItems].map((sponsor, index) => (
              <SponsorLogo key={`${sponsor.id}-${index}`} sponsor={sponsor} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-white/10 bg-white/[0.06] px-4 py-5 text-sm text-white/55">
            ยังไม่มีโลโก้ที่เปิดแสดงผล
          </div>
        )}
      </div>
    </section>
  )
}

function SponsorForm({
  draft,
  editing,
  saving,
  onChange,
  onReset,
  onSubmit,
}: {
  draft: SponsorDraft
  editing: boolean
  saving: boolean
  onChange: (draft: SponsorDraft) => void
  onReset: () => void
  onSubmit: () => void
}) {
  return (
    <form
      className="h-fit rounded-lg border border-slate-200 bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Form</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">{editing ? 'แก้ไขผู้สนับสนุน' : 'เพิ่มผู้สนับสนุน'}</h2>
        </div>
        {editing ? (
          <button type="button" className="minimal-icon-button" onClick={onReset} aria-label="เพิ่มรายการใหม่">
            <Plus size={16} />
          </button>
        ) : null}
      </div>

      <div className="mt-5 space-y-3">
        <MinimalField label="ชื่อบริษัท">
          <input className="minimal-input" value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} placeholder="เช่น AWS" />
        </MinimalField>

        <MinimalField label="โลโก้ URL">
          <input
            className="minimal-input"
            value={draft.logoUrl}
            onChange={(event) => onChange({ ...draft, logoUrl: event.target.value })}
            placeholder="เว้นว่างเพื่อใช้ตัวอักษร"
          />
        </MinimalField>

        <MinimalField label="เว็บไซต์">
          <input
            className="minimal-input"
            value={draft.websiteUrl}
            onChange={(event) => onChange({ ...draft, websiteUrl: event.target.value })}
            placeholder="https://example.com"
          />
        </MinimalField>

        <div className="grid gap-3 sm:grid-cols-[108px_minmax(0,1fr)]">
          <MinimalField label="ลำดับ">
            <input
              type="number"
              min={1}
              className="minimal-input"
              value={draft.displayOrder}
              onChange={(event) => onChange({ ...draft, displayOrder: Math.max(1, Number(event.target.value) || 1) })}
            />
          </MinimalField>

          <button
            type="button"
            className={[
              'mt-6 flex h-11 items-center justify-between rounded-md border px-3 text-left text-sm transition',
              draft.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500',
            ].join(' ')}
            onClick={() => onChange({ ...draft, isActive: !draft.isActive })}
          >
            <span className="font-medium">{draft.isActive ? 'แสดงบนหน้าแรก' : 'ซ่อนจากหน้าแรก'}</span>
            <span className={`h-2.5 w-2.5 rounded-full ${draft.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Preview</p>
        <div className="mt-3 rounded-lg bg-black p-3">
          <SponsorLogo
            sponsor={{
              id: 'preview',
              name: draft.name || 'Sponsor',
              logoUrl: draft.logoUrl || undefined,
              websiteUrl: draft.websiteUrl || undefined,
              isActive: draft.isActive,
              displayOrder: draft.displayOrder,
              createdAt: '',
              updatedAt: '',
            }}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="minimal-action" onClick={onReset} disabled={saving}>
          ล้าง
        </button>
        <button type="submit" className="btn-primary px-3 py-2" disabled={saving}>
          {saving ? <LoaderCircle size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
          {saving ? 'บันทึก...' : 'บันทึก'}
        </button>
      </div>
    </form>
  )
}

function MinimalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

function SponsorLogo({ sponsor, compact = false }: { sponsor: Sponsor; compact?: boolean }) {
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className={[
        'flex items-center justify-center rounded-md border border-white/10 bg-white/[0.07] text-center font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
        compact ? 'h-11 w-32 px-3 text-sm' : 'h-14 min-w-[158px] px-5 text-base',
      ].join(' ')}
    >
      {sponsor.logoUrl && !imageError ? (
        <img src={sponsor.logoUrl} alt={sponsor.name} className="h-7 w-auto max-w-full object-contain" loading="lazy" onError={() => setImageError(true)} />
      ) : (
        <span className="truncate">{sponsor.name}</span>
      )}
    </div>
  )
}

function InlineNotice({ tone, children }: { tone: 'success' | 'danger'; children: ReactNode }) {
  return (
    <div className={`border-b px-4 py-3 text-sm ${tone === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-rose-100 bg-rose-50 text-rose-700'}`}>
      {children}
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  )
}

function StatusBadge({ tone, children }: { tone: 'success' | 'warning' | 'muted'; children: ReactNode }) {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'warning'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-slate-100 text-slate-500'

  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${toneClass}`}>{children}</span>
}

function IconButton({
  label,
  tone = 'default',
  disabled = false,
  onClick,
  children,
}: {
  label: string
  tone?: 'default' | 'danger'
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={[
        'minimal-icon-button',
        tone === 'danger' ? 'text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700' : '',
      ].join(' ')}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function InfoTile({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'success' | 'danger'
}) {
  const valueClass =
    tone === 'success' ? 'text-emerald-700' : tone === 'danger' ? 'text-rose-700' : 'text-slate-950'

  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}

function ModalShell({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string
  eyebrow: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2>
          </div>
          <button type="button" className="minimal-icon-button" onClick={onClose} aria-label="ปิด popup">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

function UserInspectionModal({
  user,
  formatDate,
  onClose,
}: {
  user: User
  formatDate: (value?: string | null) => string
  onClose: () => void
}) {
  return (
    <ModalShell title={user.name} eyebrow="User" onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        <InfoTile label="อีเมล" value={user.email} />
        <InfoTile label="บทบาท" value={user.role} />
        <InfoTile label="สถานะ" value={user.isOnline ? 'กำลังใช้งาน' : 'ไม่ได้ใช้งาน'} tone={user.isOnline ? 'success' : 'danger'} />
        <InfoTile label="Session" value={`${user.activeSessions ?? 0}`} />
        <InfoTile label="ใช้งานล่าสุด" value={formatDate(user.lastSeenAt)} />
      </div>
    </ModalShell>
  )
}

function CourseInspectionModal({ course, onClose }: { course: Course; onClose: () => void }) {
  return (
    <ModalShell title={course.title} eyebrow="Course" onClose={onClose}>
      <div className="grid gap-5 md:grid-cols-[240px_minmax(0,1fr)]">
        <CourseCoverImage course={course} className="aspect-video w-full rounded-md object-cover" />
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile label="ผู้สอน" value={course.instructor.name} />
          <InfoTile label="สถานะ" value={courseStatusLabel[course.status]} />
          <InfoTile label="หน้าแรก" value={course.isPopular ? 'แสดงเป็นคอร์สแนะนำ' : 'ไม่แสดง'} />
          <InfoTile label="บทเรียน" value={`${course.lessonCount ?? course.lessons.length}`} />
          <InfoTile label="ผู้เรียน" value={course.students.toLocaleString('th-TH')} />
          <InfoTile label="หมวดหมู่" value={course.category} />
        </div>
      </div>
    </ModalShell>
  )
}

function DeleteUserModal({
  user,
  deleting,
  onCancel,
  onConfirm,
}: {
  user: User
  deleting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <ModalShell title="ลบผู้ใช้งานนี้ใช่ไหม" eyebrow="Confirm" onClose={onCancel}>
      <div className="flex items-start gap-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-700">
          <AlertTriangle size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-6 text-slate-600">
            ผู้ใช้งาน <span className="font-semibold text-slate-950">{user.name}</span> ({user.email}) จะถูกลบออกจากระบบ
            {user.role === 'teacher' ? ' รวมถึงคอร์สและบทเรียนที่ผูกกับครูคนนี้' : ''}
          </p>
          <p className="mt-2 text-sm text-rose-700">การลบนี้ไม่สามารถย้อนกลับได้</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="minimal-action" onClick={onCancel} disabled={deleting}>
              ยกเลิก
            </button>
            <button type="button" className="btn-primary bg-rose-700 px-3 py-2 hover:bg-rose-800" onClick={onConfirm} disabled={deleting}>
              {deleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {deleting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}

function CourseCoverImage({ course, className }: { course: Course; className: string }) {
  const [src, setSrc] = useState(course.coverImage || fallbackCourseCover)

  useEffect(() => {
    setSrc(course.coverImage || fallbackCourseCover)
  }, [course.coverImage])

  return (
    <img
      src={src}
      alt={course.title}
      className={className}
      loading="lazy"
      onError={() => {
        if (src !== fallbackCourseCover) setSrc(fallbackCourseCover)
      }}
    />
  )
}

function DeleteCourseModal({
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
    <ModalShell title="ลบคอร์สนี้ใช่ไหม" eyebrow="Confirm" onClose={onCancel}>
      <div className="flex items-start gap-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-700">
          <AlertTriangle size={19} />
        </span>
        <div>
          <p className="text-sm leading-6 text-slate-600">
            คอร์ส <span className="font-semibold text-slate-950">{course.title}</span> จะถูกลบออกจากระบบ รวมถึงบทเรียนที่ผูกกับคอร์สนี้
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="minimal-action" onClick={onCancel} disabled={deleting}>
              ยกเลิก
            </button>
            <button type="button" className="btn-primary bg-rose-700 px-3 py-2 hover:bg-rose-800" onClick={onConfirm} disabled={deleting}>
              {deleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {deleting ? 'กำลังลบ...' : 'ยืนยัน'}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}
