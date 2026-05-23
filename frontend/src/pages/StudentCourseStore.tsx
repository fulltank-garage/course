import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  CreditCard,
  LoaderCircle,
  MoreVertical,
  Search,
  ShoppingBag,
  ShoppingCart,
  Star,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import LearnProSidebar from '../components/LearnProSidebar'
import { useApi } from '../hooks/useApi'
import { api, authStorage, cartStorage } from '../services/api'
import type { Course } from '../types/course'

const allOption = 'ทั้งหมด'
const categoryOptions = [allOption, 'Technology', 'Business', 'Design', 'Marketing', 'Data']
const levelOptions = [allOption, 'Beginner', 'Intermediate', 'Advanced']
const categoryLabels: Record<string, string> = {
  Technology: 'เทคโนโลยี',
  Business: 'ธุรกิจ',
  Design: 'ออกแบบ',
  Marketing: 'การตลาด',
  Data: 'ข้อมูล',
}
const levelLabels: Record<string, string> = {
  Beginner: 'เริ่มต้น',
  Intermediate: 'ระดับกลาง',
  Advanced: 'ระดับสูง',
}
const getCategoryLabel = (category: string) => categoryLabels[category] ?? category
const getLevelLabel = (level: string) => levelLabels[level] ?? level
const sortOptionLabels: Record<SortOption, string> = {
  popular: 'ยอดนิยม',
  rating: 'คะแนนสูง',
  'price-low': 'ราคาต่ำสุด',
  'price-high': 'ราคาสูงสุด',
}

type SortOption = 'popular' | 'rating' | 'price-low' | 'price-high'
type CheckoutModalState =
  | { mode: 'single'; course: Course }
  | { mode: 'all' }
  | null
type CheckoutStep = 'cart' | 'payment' | 'confirm'

const getCourseReviewAverage = (course: Course) => course.reviewAverage ?? course.rating
const getCourseReviewCount = (course: Course) => course.reviewCount ?? 0

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'popular', label: 'ล่าสุด' },
  { value: 'rating', label: 'คะแนนสูง' },
  { value: 'price-low', label: 'ราคาต่ำสุด' },
  { value: 'price-high', label: 'ราคาสูงสุด' },
]

const sortCourses = (items: Course[], sortBy: SortOption) => {
  const nextItems = [...items]

  if (sortBy === 'rating') {
    return nextItems.sort((a, b) => {
      const averageDifference = getCourseReviewAverage(b) - getCourseReviewAverage(a)
      if (averageDifference !== 0) return averageDifference

      return getCourseReviewCount(b) - getCourseReviewCount(a)
    })
  }
  if (sortBy === 'price-low') return nextItems.sort((a, b) => a.price - b.price)
  if (sortBy === 'price-high') return nextItems.sort((a, b) => b.price - a.price)

  return nextItems.sort((a, b) => {
    if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1
    return b.students - a.students
  })
}

const formatPrice = (price: number) =>
  price === 0
    ? 'ฟรี'
    : new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        maximumFractionDigits: 0,
      }).format(price)

const cartMetricClass = 'rounded-2xl border border-zinc-200 bg-white px-4 py-4 text-center'
const minimalSecondaryButtonClass =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-black transition hover:border-black disabled:cursor-not-allowed disabled:text-zinc-400'
const minimalPrimaryButtonClass =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300'
const minimalTertiaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-zinc-500 transition hover:text-black disabled:cursor-not-allowed disabled:text-zinc-300'
const coursePathFor = (course: Course) => `/courses/${course.slug}`

function FilterCheckbox({
  label,
  count,
  checked,
  onClick,
}: {
  label: string
  count: number
  checked: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className="flex w-full items-center gap-3 text-left text-sm text-zinc-700" onClick={onClick}>
      <span
        className={[
          'inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]',
          checked ? 'border-black bg-black text-white' : 'border-zinc-300 bg-white text-transparent',
        ].join(' ')}
      >
        ✓
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-xs text-zinc-500">{count}</span>
    </button>
  )
}

function CourseGridCard({
  course,
  inCart,
  onAddToCart,
}: {
  course: Course
  inCart: boolean
  onAddToCart: (slug: string) => void
}) {
  const isEnrolled = Boolean(course.viewerState?.isEnrolled)
  const canBuy = course.status === 'published' && !isEnrolled
  const reviewAverage = getCourseReviewAverage(course)
  const reviewCount = getCourseReviewCount(course)

  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg">
      <Link to={coursePathFor(course)} className="relative block aspect-[1.33] overflow-hidden bg-zinc-100">
        <img src={course.coverImage} alt={course.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
        {isEnrolled ? (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
            คุณได้ซื้อคอร์สแล้ว
          </span>
        ) : null}
        <button
          type="button"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-white/15"
          aria-label="ตัวเลือกคอร์ส"
        >
          <MoreVertical size={18} />
        </button>
      </Link>

      <div className="p-4">
        <Link to={coursePathFor(course)} className="line-clamp-2 min-h-11 text-sm font-semibold leading-6 text-black hover:underline">
          {course.title}
        </Link>

        <div className="mt-3 flex items-center gap-1 text-xs text-zinc-500">
          <UsersRound size={14} />
          <span>{course.students.toLocaleString('th-TH')} คนเรียน</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1 text-amber-500">
            <Star size={14} className="fill-amber-400" />
            {reviewAverage.toFixed(1)}
          </span>
          <span>{reviewCount.toLocaleString('th-TH')} รีวิว</span>
          <span>({Math.max(course.lessons.length, course.lessonCount ?? 0)})</span>
          <span>•</span>
          <span>{getLevelLabel(course.level)}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">{formatPrice(course.price)}</p>
          <BarChart3 size={17} className="text-zinc-500" />
        </div>

        <div className="mt-4">
          {!canBuy && !isEnrolled ? (
            <button
              type="button"
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-100 px-3 text-sm font-semibold text-zinc-500"
              disabled
            >
              ยังไม่เปิดขาย
            </button>
          ) : null}

          <div className={!canBuy && !isEnrolled ? 'mt-2 grid grid-cols-[1fr_auto] gap-2' : 'grid grid-cols-[1fr_auto] gap-2'}>
            <Link
              to={coursePathFor(course)}
              className={[
                'inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 px-3 text-sm font-semibold text-black transition hover:border-black',
                isEnrolled ? 'col-span-full' : '',
              ].join(' ')}
            >
              ดูรายละเอียด
            </Link>
            {!isEnrolled ? (
              <button
                type="button"
                className={[
                  'inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold transition',
                  !canBuy
                    ? 'cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400'
                    : inCart
                      ? 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:border-black hover:text-black'
                      : 'border-zinc-200 bg-white text-black hover:border-black',
                ].join(' ')}
                disabled={!canBuy}
                onClick={() => onAddToCart(course.slug)}
                aria-label={inCart ? 'อยู่ในตะกร้าแล้ว' : 'เพิ่มลงตะกร้า'}
                title={inCart ? 'อยู่ในตะกร้าแล้ว' : 'เพิ่มลงตะกร้า'}
              >
                {inCart ? <Check size={17} /> : <ShoppingCart size={17} />}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function StudentCourseStore() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const session = authStorage.getSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(allOption)
  const [selectedLevel, setSelectedLevel] = useState(allOption)
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [showPurchasedOnly, setShowPurchasedOnly] = useState(false)
  const [cartItems, setCartItems] = useState(() => cartStorage.getItems())
  const [cartOpen, setCartOpen] = useState(() => searchParams.get('cart') === '1')
  const [cartError, setCartError] = useState<string | null>(null)
  const [cartMessage, setCartMessage] = useState<string | null>(null)
  const [checkoutSlug, setCheckoutSlug] = useState<string | null>(null)
  const [checkoutAll, setCheckoutAll] = useState(false)
  const [checkoutModal, setCheckoutModal] = useState<CheckoutModalState>(null)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const { data: courses, error: courseError, loading } = useApi(() => api.getCourses(), [])

  useEffect(() => cartStorage.subscribe(() => setCartItems(cartStorage.getItems())), [])

  useEffect(() => {
    if (searchParams.get('cart') === '1') setCartOpen(true)
  }, [searchParams])

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const category of categoryOptions) map.set(category, category === allOption ? courses?.length ?? 0 : 0)
    for (const course of courses ?? []) map.set(course.category, (map.get(course.category) ?? 0) + 1)
    return map
  }, [courses])

  const levelCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const level of levelOptions) map.set(level, level === allOption ? courses?.length ?? 0 : 0)
    for (const course of courses ?? []) map.set(course.level, (map.get(course.level) ?? 0) + 1)
    return map
  }, [courses])

  const filteredCourses = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase()
    const filtered = (courses ?? []).filter((course) => {
      const matchesCategory = selectedCategory === allOption || course.category === selectedCategory
      const matchesLevel = selectedLevel === allOption || course.level === selectedLevel
      const matchesPurchased = !showPurchasedOnly || Boolean(course.viewerState?.isEnrolled)
      const matchesSearch =
        !normalizedSearch ||
        course.title.toLowerCase().includes(normalizedSearch) ||
        course.description.toLowerCase().includes(normalizedSearch) ||
        course.instructor.name.toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesLevel && matchesPurchased && matchesSearch
    })

    return sortCourses(filtered, sortBy)
  }, [courses, deferredSearchTerm, selectedCategory, selectedLevel, showPurchasedOnly, sortBy])

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCategory(allOption)
    setSelectedLevel(allOption)
    setShowPurchasedOnly(false)
    setSortBy('popular')
  }

  const handleAddToCart = (slug: string) => {
    setCartItems(cartStorage.addItem(slug))
    setCartOpen(true)
    setCartError(null)
    setCartMessage(null)
  }

  const closeCart = () => {
    setCartOpen(false)
    setCheckoutStep('cart')

    if (searchParams.get('cart') === '1') {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('cart')
      setSearchParams(nextParams, { replace: true })
    }
  }

  const openCheckoutModal = (nextCheckoutModal: CheckoutModalState) => {
    setCheckoutModal(nextCheckoutModal)
  }

  const closeCheckoutModal = () => setCheckoutModal(null)

  const removeCourse = (slug: string) => {
    setCartError(null)
    setCartMessage(null)
    setCheckoutStep('cart')
    setCartItems(cartStorage.removeItem(slug))
  }

  const clearCart = () => {
    setCartError(null)
    setCartMessage(null)
    setCheckoutStep('cart')
    setCartItems(cartStorage.clearItems())
  }

  const ensureStudentSession = () => {
    if (!session) {
      navigate('/login')
      return false
    }

    if (session.user.role !== 'student') {
      navigate(session.dashboardPath)
      return false
    }

    return true
  }

  const checkoutCourse = async (course: Course) => {
    if (!ensureStudentSession()) return

    setCheckoutSlug(course.slug)
    setCartError(null)
    setCartMessage(null)

    try {
      const result = await api.enrollCourse(course.slug)
      cartStorage.removeItem(course.slug)
      setCartItems(cartStorage.getItems())
      closeCheckoutModal()
      setCartMessage(`ซื้อคอร์ส "${course.title}" สำเร็จแล้ว กำลังพาไปหน้าเรียน...`)

      window.setTimeout(() => {
        navigate(
          result.enrollment.lastLessonId
            ? `/learn/${course.slug}?lesson=${result.enrollment.lastLessonId}`
            : `/learn/${course.slug}`,
          { replace: true },
        )
      }, 650)
    } catch (currentError) {
      setCartError(currentError instanceof Error ? currentError.message : 'ไม่สามารถซื้อคอร์สได้')
    } finally {
      setCheckoutSlug(null)
    }
  }

  const checkoutAllCourses = async () => {
    if (!ensureStudentSession() || cartCourses.length === 0) return

    setCheckoutAll(true)
    setCartError(null)
    setCartMessage(null)
    setCheckoutStep('confirm')

    try {
      let firstEnrollmentPath = session?.dashboardPath ?? '/student'

      for (const course of cartCourses) {
        const result = await api.enrollCourse(course.slug)
        cartStorage.removeItem(course.slug)

        if (firstEnrollmentPath === (session?.dashboardPath ?? '/student')) {
          firstEnrollmentPath = result.enrollment.lastLessonId
            ? `/learn/${course.slug}?lesson=${result.enrollment.lastLessonId}`
            : `/learn/${course.slug}`
        }
      }

      cartStorage.clearItems()
      setCartItems([])
      closeCheckoutModal()
      setCartMessage(`ซื้อคอร์สสำเร็จแล้ว ${cartCourses.length} คอร์ส กำลังพาไปหน้าเรียน...`)

      window.setTimeout(() => {
        navigate(firstEnrollmentPath, { replace: true })
      }, 650)
    } catch (currentError) {
      setCartError(currentError instanceof Error ? currentError.message : 'ไม่สามารถซื้อคอร์สทั้งหมดได้')
    } finally {
      setCheckoutAll(false)
    }
  }

  const totalCourses = courses?.length ?? 0
  const purchasedCourses = (courses ?? []).filter((course) => course.viewerState?.isEnrolled).length
  const cartCourses = (courses ?? []).filter((course) => cartItems.includes(course.slug))
  const totalCartPrice = cartCourses.reduce((sum, course) => sum + course.price, 0)
  const freeCartCourses = cartCourses.filter((course) => course.price === 0).length
  const paidCartCourses = cartCourses.length - freeCartCourses
  const modalCourses = checkoutModal?.mode === 'single' ? [checkoutModal.course] : cartCourses
  const modalTotal = modalCourses.reduce((sum, course) => sum + course.price, 0)
  const modalActionLoading =
    checkoutModal?.mode === 'single'
      ? checkoutSlug === checkoutModal.course.slug
      : checkoutAll
  const cartStepItems = ['ตะกร้าสินค้า', 'ชำระเงิน', 'ยืนยันการชำระเงิน']
  const cartTotalLabel = formatPrice(totalCartPrice)
  const activeCheckoutStepIndex = checkoutStep === 'cart' ? 0 : checkoutStep === 'payment' ? 1 : 2

  return (
    <section className="min-h-screen bg-white text-black lg:pl-[280px]">
      <LearnProSidebar active="all-courses" />

      <main className="min-w-0">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-black">คอร์สทั้งหมด</h1>
              <p className="mt-3 text-base text-zinc-600">เลือกดูและสมัครเรียนคอร์สทั้งหมดที่เปิดอยู่ในระบบ</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block sm:w-80">
                <span className="sr-only">ค้นหาคอร์ส</span>
                <Search size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-12 w-full rounded-lg border border-zinc-200 bg-white px-4 pr-11 text-sm text-black outline-none transition placeholder:text-zinc-400 focus:border-black"
                  placeholder="ค้นหาคอร์ส..."
                />
              </label>

              <label className="relative block sm:w-52">
                <span className="sr-only">เรียงตาม</span>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  className="h-12 w-full appearance-none rounded-lg border border-zinc-200 bg-white px-4 pr-10 text-sm font-semibold text-black outline-none transition focus:border-black"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      เรียงตาม: {sortOptionLabels[option.value]}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black" />
              </label>

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-lg bg-black text-white transition hover:bg-zinc-800"
                aria-label="ตะกร้าสินค้า"
                title="ตะกร้าสินค้า"
              >
                <ShoppingCart size={18} />
                {cartItems.length > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-semibold text-black shadow-sm">
                    {cartItems.length}
                  </span>
                ) : null}
              </button>
            </div>
          </header>

          <div className="grid gap-8 pt-8 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-black">ตัวกรอง</h2>
                <button type="button" className="text-sm text-zinc-500 transition hover:text-black" onClick={resetFilters}>
                  ล้างทั้งหมด
                </button>
              </div>

              <div className="mt-7 border-b border-zinc-200 pb-6">
                <h3 className="mb-4 text-sm font-semibold text-black">หมวดหมู่</h3>
                <div className="space-y-3">
                  {categoryOptions.slice(1).map((category) => (
                    <FilterCheckbox
                      key={category}
                      label={getCategoryLabel(category)}
                      count={categoryCounts.get(category) ?? 0}
                      checked={selectedCategory === category}
                      onClick={() => setSelectedCategory(selectedCategory === category ? allOption : category)}
                    />
                  ))}
                </div>
              </div>

              <div className="border-b border-zinc-200 py-6">
                <h3 className="mb-4 text-sm font-semibold text-black">ระดับคอร์ส</h3>
                <div className="space-y-3">
                  {levelOptions.slice(1).map((level) => (
                    <FilterCheckbox
                      key={level}
                      label={getLevelLabel(level)}
                      count={levelCounts.get(level) ?? 0}
                      checked={selectedLevel === level}
                      onClick={() => setSelectedLevel(selectedLevel === level ? allOption : level)}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <h3 className="mb-4 text-sm font-semibold text-black">ราคา</h3>
                <div className="space-y-3 text-sm text-zinc-700">
                  <button type="button" className="flex items-center gap-3" onClick={() => setSortBy('popular')}>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-black">
                      <span className="h-2 w-2 rounded-full bg-black" />
                    </span>
                    ทั้งหมด
                  </button>
                  <button type="button" className="flex items-center gap-3" onClick={() => setSortBy('price-low')}>
                    <span className="h-4 w-4 rounded-full border border-zinc-300" />
                    ราคาต่ำก่อน
                  </button>
                  <button type="button" className="flex items-center gap-3" onClick={() => setSortBy('price-high')}>
                    <span className="h-4 w-4 rounded-full border border-zinc-300" />
                    ราคาสูงก่อน
                  </button>
                </div>
              </div>
            </aside>

            <section className="min-w-0">
              <div className="mb-7 flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex w-fit rounded-lg border border-zinc-200 bg-white p-1">
                  <button
                    type="button"
                    className={[
                      'h-9 rounded-md px-4 text-sm font-semibold transition',
                      !showPurchasedOnly ? 'bg-black text-white' : 'text-zinc-500 hover:text-black',
                    ].join(' ')}
                    onClick={() => setShowPurchasedOnly(false)}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    type="button"
                    className={[
                      'h-9 rounded-md px-4 text-sm font-semibold transition',
                      showPurchasedOnly ? 'bg-black text-white' : 'text-zinc-500 hover:text-black',
                    ].join(' ')}
                    onClick={() => setShowPurchasedOnly(true)}
                  >
                    คอร์สที่ซื้อแล้ว ({purchasedCourses})
                  </button>
                </div>
                {showPurchasedOnly ? (
                  <button type="button" className="text-sm font-medium text-zinc-500 transition hover:text-black" onClick={() => setShowPurchasedOnly(false)}>
                    ดูคอร์สทั้งหมด
                  </button>
                ) : null}
              </div>

              <div className="mb-5 flex items-center justify-between gap-4 text-sm text-zinc-500">
                <span>{loading ? 'กำลังโหลดคอร์ส...' : `พบ ${filteredCourses.length} คอร์ส`}</span>
                <span>ทั้งหมด {totalCourses} คอร์ส</span>
              </div>

              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="h-80 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100" />
                  ))}
                </div>
              ) : null}

              {courseError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{courseError}</div> : null}

              {!loading && !courseError && filteredCourses.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
                  <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-black">
                    <Search size={20} />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold text-black">ไม่พบคอร์สที่ตรงกับการค้นหา</h2>
                  <p className="mt-2 text-sm text-zinc-500">ลองเปลี่ยนคำค้นหา หมวดหมู่ ระดับ หรือการเรียงลำดับ</p>
                  <button type="button" className="mt-5 h-11 rounded-lg bg-black px-5 text-sm font-semibold text-white" onClick={resetFilters}>
                    ล้างตัวกรอง
                  </button>
                </div>
              ) : null}

              {!loading && !courseError && filteredCourses.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {filteredCourses.map((course) => (
                    <CourseGridCard
                      key={course.id}
                      course={course}
                      inCart={cartItems.includes(course.slug)}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </main>

      <div
        className={[
          'fixed inset-0 z-[95] overflow-y-auto bg-white transition-opacity duration-200',
          cartOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        aria-hidden={!cartOpen}
      >
        <div className="mx-auto min-h-screen w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 text-xs font-semibold text-zinc-500">
            {cartStepItems.map((item, index) => (
              <div key={item} className="flex min-w-0 items-center gap-3">
                <span
                  className={[
                    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs',
                    index <= activeCheckoutStepIndex ? 'border-black bg-black text-white' : 'border-zinc-300 bg-white text-black',
                  ].join(' ')}
                >
                  {index + 1}
                </span>
                <span className={index <= activeCheckoutStepIndex ? 'truncate text-black' : 'truncate'}>{item}</span>
                {index < cartStepItems.length - 1 ? <span className="hidden h-px w-20 bg-zinc-300 sm:block" /> : null}
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-black">รถเข็น / รายการสั่งซื้อ</h2>
              <p className="mt-1 text-sm text-zinc-500">{cartCourses.length} รายการในตะกร้า</p>
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-black transition hover:border-black"
              onClick={closeCart}
              aria-label="ปิดตะกร้า"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                <h3 className="text-lg font-semibold text-black">คอร์สที่คุณเลือก</h3>
                {cartCourses.length > 0 ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-zinc-500 transition hover:text-black"
                    onClick={clearCart}
                  >
                    ล้างตะกร้า
                  </button>
                ) : null}
              </div>

              <div className="mt-5">
                {loading ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-500">กำลังโหลดตะกร้า...</div>
                ) : courseError || cartError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{cartError ?? courseError}</div>
                ) : cartMessage ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-700">{cartMessage}</div>
                ) : cartCourses.length === 0 ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 text-center">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-sm">
                      <ShoppingBag size={24} />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold text-black">ตะกร้ายังว่าง</h3>
                    <button
                      type="button"
                      className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                      onClick={closeCart}
                    >
                      เลือกคอร์สเพิ่ม
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200">
                    {cartCourses.map((course) => (
                      <article key={course.id} className="grid gap-4 py-5 sm:grid-cols-[136px_minmax(0,1fr)_auto]">
                        <img src={course.coverImage} alt={course.title} className="h-24 w-full rounded-lg bg-zinc-100 object-cover sm:w-[136px]" />
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-base font-semibold text-black">{course.title}</h3>
                          <p className="mt-1 text-sm text-zinc-500">โดย {course.instructor.name}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                            <span className="inline-flex items-center gap-1">
                              <UsersRound size={14} />
                              {course.students.toLocaleString('th-TH')} คนเรียน
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Star size={14} className="fill-amber-400 text-amber-400" />
                              {getCourseReviewAverage(course).toFixed(1)}
                            </span>
                            <span>{getLevelLabel(course.level)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                          <p className="text-lg font-semibold text-black">{formatPrice(course.price)}</p>
                          <button
                            type="button"
                            className="mt-0 inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-rose-700 sm:mt-4"
                            onClick={() => removeCourse(course.slug)}
                            aria-label={`ลบ ${course.title}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
              <h3 className="text-lg font-semibold text-black">สรุปการชำระเงิน</h3>
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-500">ราคาคอร์ส</span>
                  <span className="font-medium text-black">{cartTotalLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-500">คอร์สฟรี</span>
                  <span className="font-medium text-black">{freeCartCourses.toLocaleString('th-TH')}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-500">คอร์สเสียเงิน</span>
                  <span className="font-medium text-black">{paidCartCourses.toLocaleString('th-TH')}</span>
                </div>
              </div>

              <div className="mt-6 border-t border-zinc-200 pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-black">ยอดรวมทั้งหมด</p>
                    <p className="mt-1 text-xs text-zinc-500">จากรายการจริงในตะกร้า</p>
                  </div>
                  <p className="text-3xl font-semibold tracking-tight text-black">{cartTotalLabel}</p>
                </div>
              </div>

              {checkoutStep === 'payment' ? (
                <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-semibold text-black">ช่องทางชำระเงิน</p>
                  <div className="mt-4 grid gap-3">
                    <label className="flex items-center gap-3 rounded-xl border border-black bg-white px-4 py-3 text-sm font-semibold text-black">
                      <input type="radio" checked readOnly className="h-4 w-4 accent-black" />
                      ชำระผ่านระบบของแพลตฟอร์ม
                    </label>
                    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500">
                      ระบบจะยืนยันรายการและเพิ่มคอร์สเข้าบัญชีนักเรียนหลังชำระเงินสำเร็จ
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 rounded-2xl bg-zinc-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-sm">
                    <CreditCard size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-black">พร้อมดำเนินการชำระเงิน</p>
                    <p className="mt-1 text-xs text-zinc-500">ระบบจะลงทะเบียนคอร์สให้หลังยืนยันสำเร็จ</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                onClick={checkoutStep === 'cart' ? () => setCheckoutStep('payment') : checkoutAllCourses}
                disabled={cartCourses.length === 0 || checkoutAll || Boolean(checkoutSlug)}
              >
                {checkoutAll ? <LoaderCircle size={16} className="animate-spin" /> : <CreditCard size={16} />}
                ดำเนินการชำระเงิน
              </button>

              {checkoutStep !== 'cart' ? (
                <button
                  type="button"
                  className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-semibold text-black transition hover:border-black"
                  onClick={() => setCheckoutStep('cart')}
                  disabled={checkoutAll}
                >
                  กลับไปตรวจรายการ
                </button>
              ) : null}

              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
                <Check size={14} />
                ใช้ขั้นตอนซื้อคอร์สเดิมของระบบ
              </p>
            </aside>
          </div>
        </div>
      </div>

      <div
        className={[
          'hidden fixed inset-0 z-[80] bg-black/35 transition-opacity duration-200',
          'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={closeCart}
      />
      <aside
        className={[
          'hidden fixed inset-y-0 right-0 z-[90] w-full max-w-[440px] flex-col border-l border-zinc-200 bg-white text-black shadow-2xl transition-transform duration-300 ease-out',
          'translate-x-full',
        ].join(' ')}
        aria-label="ตะกร้าสินค้า"
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-black text-white">
              <ShoppingBag size={20} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-black">ตะกร้าสินค้า</h2>
              <p className="mt-1 text-sm text-zinc-500">{cartCourses.length} รายการในตะกร้า</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 text-black transition hover:border-black"
            onClick={closeCart}
            aria-label="ปิดตะกร้า"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-500">กำลังโหลดตะกร้า...</div>
          ) : courseError || cartError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              {cartError ?? courseError}
            </div>
          ) : cartMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-700">
              {cartMessage}
            </div>
          ) : cartCourses.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-black">
                <ShoppingBag size={26} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-black">ตะกร้ายังว่าง</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
                เลือกคอร์สที่สนใจ แล้วกดไอคอนตะกร้าเพื่อเพิ่มรายการก่อนลงทะเบียน
              </p>
              <button
                type="button"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                onClick={closeCart}
              >
                เลือกคอร์สเพิ่ม
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartCourses.map((course) => (
                <article key={course.id} className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-black/50">
                  <div className="flex gap-3">
                    <img src={course.coverImage} alt={course.title} className="h-20 w-24 rounded-lg bg-zinc-100 object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-black">{course.title}</h3>
                          <p className="mt-1 text-xs text-zinc-500">{course.instructor.name}</p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-rose-700"
                          onClick={() => removeCourse(course.slug)}
                          aria-label={`ลบ ${course.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-base font-semibold text-black">{course.price === 0 ? 'ฟรี' : formatPrice(course.price)}</p>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-black transition hover:border-black"
                          onClick={() => openCheckoutModal({ mode: 'single', course })}
                          disabled={checkoutSlug === course.slug || checkoutAll}
                        >
                          <CreditCard size={13} />
                          ซื้อ
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <footer className="border-t border-zinc-200 bg-white p-5">
          <div className="grid grid-cols-3 gap-3">
            <div className={cartMetricClass}>
              <p className="text-xs text-zinc-500">{'\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14'}</p>
              <p className="mt-2 text-2xl font-semibold text-black">{cartCourses.length}</p>
            </div>
            <div className={cartMetricClass}>
              <p className="text-xs text-zinc-500">{'\u0e1f\u0e23\u0e35'}</p>
              <p className="mt-2 text-2xl font-semibold text-black">{freeCartCourses}</p>
            </div>
            <div className={cartMetricClass}>
              <p className="text-xs text-zinc-500">{'\u0e40\u0e2a\u0e35\u0e22\u0e40\u0e07\u0e34\u0e19'}</p>
              <p className="mt-2 text-2xl font-semibold text-black">{paidCartCourses}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-zinc-500">{'\u0e22\u0e2d\u0e14\u0e23\u0e27\u0e21'}</span>
              <span className="text-3xl font-semibold tracking-tight text-black">{formatPrice(totalCartPrice)}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {cartCourses.length > 0 ? (
              <button
                type="button"
                className={minimalPrimaryButtonClass}
                onClick={() => openCheckoutModal({ mode: 'all' })}
                disabled={checkoutAll || Boolean(checkoutSlug)}
              >
                <CreditCard size={16} />
                {'\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19'}
              </button>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className={minimalTertiaryButtonClass}
                onClick={closeCart}
              >
                {'\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e04\u0e2d\u0e23\u0e4c\u0e2a\u0e40\u0e1e\u0e34\u0e48\u0e21'}
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                className={minimalTertiaryButtonClass}
                onClick={clearCart}
                disabled={cartCourses.length === 0}
              >
                {'\u0e25\u0e49\u0e32\u0e07\u0e15\u0e30\u0e01\u0e23\u0e49\u0e32'}
              </button>
            </div>
          </div>
        </footer>
      </aside>

      <div
        className={[
          'fixed inset-0 z-[120] bg-black/30 px-4 transition-opacity duration-200',
          checkoutModal ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={closeCheckoutModal}
      >
        <div className="flex min-h-full items-center justify-center py-8">
          <section
            className={[
              'w-full max-w-[560px] rounded-[32px] border border-zinc-200 bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)] transition duration-200 sm:p-6',
              checkoutModal ? 'translate-y-0 scale-100' : 'translate-y-3 scale-[0.98]',
            ].join(' ')}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="ชำระเงิน"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">Invoice</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-black">ชำระเงินคอร์ส</h2>
                <p className="mt-2 text-sm text-zinc-500">ตรวจสอบบิลและกรอกข้อมูลการชำระเงินให้ครบก่อนยืนยัน</p>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-black hover:text-black"
                onClick={closeCheckoutModal}
                aria-label="ปิดหน้าชำระเงิน"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className={cartMetricClass}>
                  <p className="text-[11px] text-zinc-500">{'\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14'}</p>
                  <p className="mt-1 text-xl font-semibold text-black">{modalCourses.length}</p>
                </div>
                <div className={cartMetricClass}>
                  <p className="text-[11px] text-zinc-500">{'\u0e1f\u0e23\u0e35'}</p>
                  <p className="mt-1 text-xl font-semibold text-black">{modalCourses.filter((course) => course.price === 0).length}</p>
                </div>
                <div className={cartMetricClass}>
                  <p className="text-[11px] text-zinc-500">{'\u0e40\u0e2a\u0e35\u0e22\u0e40\u0e07\u0e34\u0e19'}</p>
                  <p className="mt-1 text-xl font-semibold text-black">{modalCourses.filter((course) => course.price > 0).length}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-zinc-500">{'\u0e22\u0e2d\u0e14\u0e0a\u0e33\u0e23\u0e30'}</span>
                  <span className="text-3xl font-semibold tracking-tight text-black">{formatPrice(modalTotal)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                <p className="text-sm font-medium text-black">
                  {checkoutModal?.mode === 'single'
                    ? checkoutModal.course.title
                    : `${modalCourses.length} คอร์สในรายการชำระเงิน`}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {checkoutModal?.mode === 'single'
                    ? 'ชำระเฉพาะคอร์สที่เลือก'
                    : 'ยืนยันการซื้อคอร์สทั้งหมดในตะกร้าพร้อมกัน'}
                </p>
              </div>

              <button
                type="button"
                className={minimalPrimaryButtonClass}
                onClick={() => {
                  if (!checkoutModal) return
                  if (checkoutModal.mode === 'single') {
                    checkoutCourse(checkoutModal.course)
                    return
                  }
                  checkoutAllCourses()
                }}
                disabled={modalActionLoading}
              >
                {modalActionLoading ? <LoaderCircle size={16} className="animate-spin" /> : <CreditCard size={16} />}
                {modalActionLoading
                  ? '\u0e01\u0e33\u0e25\u0e31\u0e07\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23...'
                  : '\u0e22\u0e37\u0e19\u0e22\u0e31\u0e19\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19'}
              </button>
              <button
                type="button"
                className={minimalSecondaryButtonClass}
                onClick={closeCheckoutModal}
                disabled={modalActionLoading}
              >
                {'\u0e22\u0e01\u0e40\u0e25\u0e34\u0e01'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
