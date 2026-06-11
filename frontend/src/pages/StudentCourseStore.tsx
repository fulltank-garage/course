import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import generatePromptPayPayload from 'promptpay-qr'
import QRCode from 'qrcode'
import {
  ArrowRight,
  Check,
  CreditCard,
  ImagePlus,
  Landmark,
  LoaderCircle,
  Menu,
  MoreVertical,
  Search,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Trash2,
  UploadCloud,
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
type SortOption = 'popular' | 'rating' | 'price-low' | 'price-high'
type CheckoutModalState =
  | { mode: 'single'; course: Course }
  | { mode: 'all' }
  | null
type CheckoutStep = 'cart' | 'payment' | 'confirm'

const getCourseReviewAverage = (course: Course) => course.reviewAverage ?? course.rating
const getCourseReviewCount = (course: Course) => course.reviewCount ?? 0

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
    : `${new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(price)} บาท`
const formatCartTotal = (price: number) =>
  `${new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(price)} บาท`

const normalizePromptPayId = (value?: string) => (value ?? '').replace(/[^0-9]/g, '')
function PromptPayQr({
  promptPayId,
  amount,
  fallbackUrl,
  instructorName,
}: {
  promptPayId?: string
  amount: number
  fallbackUrl?: string
  instructorName: string
}) {
  const [qrUrl, setQrUrl] = useState(fallbackUrl ?? '')

  useEffect(() => {
    const normalizedId = normalizePromptPayId(promptPayId)
    let active = true

    if (!normalizedId || amount <= 0) {
      return () => {
        active = false
      }
    }

    QRCode.toDataURL(generatePromptPayPayload(normalizedId, { amount }), {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 640,
    })
      .then((dataUrl) => {
        if (active) setQrUrl(dataUrl)
      })
      .catch(() => {
        if (active) setQrUrl(fallbackUrl ?? '')
      })

    return () => {
      active = false
    }
  }, [amount, fallbackUrl, promptPayId])

  if (!qrUrl) {
    return (
      <div className="flex aspect-square w-full max-w-[240px] items-center justify-center px-4 text-center text-sm text-zinc-400">
        ยังไม่มี QR รับเงินของคุณครู
      </div>
    )
  }

  return (
    <img
      src={qrUrl}
      alt={`QR รับเงินของ ${instructorName}`}
      className="aspect-square w-full max-w-[240px] object-contain"
    />
  )
}

const minimalSecondaryButtonClass =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-black transition hover:border-black disabled:cursor-not-allowed disabled:text-zinc-400'
const minimalPrimaryButtonClass =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300'
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
          {!isEnrolled ? (
            <button
              type="button"
              className={[
                'inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition',
                !canBuy
                  ? 'cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400'
                  : inCart
                    ? 'border-zinc-200 bg-zinc-100 text-zinc-600 hover:border-black hover:text-black'
                    : 'border-zinc-200 bg-white text-black hover:border-black',
              ].join(' ')}
              disabled={!canBuy}
              onClick={() => onAddToCart(course.slug)}
              aria-label={inCart ? '\u0e2d\u0e22\u0e39\u0e48\u0e43\u0e19\u0e15\u0e30\u0e01\u0e23\u0e49\u0e32\u0e41\u0e25\u0e49\u0e27' : '\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e25\u0e07\u0e15\u0e30\u0e01\u0e23\u0e49\u0e32'}
              title={inCart ? '\u0e2d\u0e22\u0e39\u0e48\u0e43\u0e19\u0e15\u0e30\u0e01\u0e23\u0e49\u0e32\u0e41\u0e25\u0e49\u0e27' : '\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e25\u0e07\u0e15\u0e30\u0e01\u0e23\u0e49\u0e32'}
            >
              {inCart ? <Check size={17} /> : <ShoppingCart size={17} />}
            </button>
          ) : null}
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

          <div className={!canBuy && !isEnrolled ? 'mt-2' : ''}>
            <Link
              to={coursePathFor(course)}
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-200 px-3 text-sm font-semibold text-black transition hover:border-black"
            >
              ดูรายละเอียด
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

function CourseGridCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="relative aspect-[1.33] overflow-hidden bg-zinc-100">
        <div className="skeleton h-full w-full" />
        <div className="absolute right-3 top-3 skeleton h-8 w-8 rounded-full bg-white/40" />
      </div>
      <div className="p-4">
        <div className="space-y-2">
          <div className="skeleton-line h-5 w-11/12" />
          <div className="skeleton-line h-5 w-7/12" />
        </div>
        <div className="mt-3 skeleton-line h-4 w-32" />
        <div className="mt-2 flex gap-2">
          <div className="skeleton-line h-4 w-14" />
          <div className="skeleton-line h-4 w-20" />
          <div className="skeleton-line h-4 w-16" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="skeleton-line h-5 w-20" />
          <div className="skeleton h-5 w-5 rounded-md" />
        </div>
        <div className="mt-4">
          <div className="skeleton h-10 rounded-md" />
        </div>
      </div>
    </article>
  )
}

export default function StudentCourseStore() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const session = authStorage.getSession()
  const [selectedCategory, setSelectedCategory] = useState(allOption)
  const [selectedLevel, setSelectedLevel] = useState(allOption)
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [showPurchasedOnly, setShowPurchasedOnly] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [cartItems, setCartItems] = useState(() => cartStorage.getItems())
  const [cartOpen, setCartOpen] = useState(() => searchParams.get('cart') === '1')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [cartMessage, setCartMessage] = useState<string | null>(null)
  const [checkoutSlug, setCheckoutSlug] = useState<string | null>(null)
  const [checkoutAll, setCheckoutAll] = useState(false)
  const [checkoutModal, setCheckoutModal] = useState<CheckoutModalState>(null)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart')
  const [paymentSlipFile, setPaymentSlipFile] = useState<File | null>(null)
  const [paymentSlipPreview, setPaymentSlipPreview] = useState<string | null>(null)
  const [paymentSlipError, setPaymentSlipError] = useState<string | null>(null)
  const { data: courses, error: courseError, loading } = useApi(() => api.getCourses(), [])

  useEffect(() => cartStorage.subscribe(() => setCartItems(cartStorage.getItems())), [])

  useEffect(() => {
    if (searchParams.get('cart') === '1') setCartOpen(true)
  }, [searchParams])

  useEffect(() => {
    const shouldLockPageScroll = cartOpen || Boolean(checkoutModal) || mobileSidebarOpen || mobileFiltersOpen
    const previousBodyOverflow = document.body.style.overflow

    if (shouldLockPageScroll) document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
    }
  }, [cartOpen, checkoutModal, mobileFiltersOpen, mobileSidebarOpen])

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
    const filtered = (courses ?? []).filter((course) => {
      const matchesCategory = selectedCategory === allOption || course.category === selectedCategory
      const matchesLevel = selectedLevel === allOption || course.level === selectedLevel
      const matchesPurchased = !showPurchasedOnly || Boolean(course.viewerState?.isEnrolled)

      return matchesCategory && matchesLevel && matchesPurchased
    })

    return sortCourses(filtered, sortBy)
  }, [courses, selectedCategory, selectedLevel, showPurchasedOnly, sortBy])

  const resetFilters = () => {
    setSelectedCategory(allOption)
    setSelectedLevel(allOption)
    setShowPurchasedOnly(false)
    setSortBy('popular')
  }

  const handleAddToCart = (slug: string) => {
    const nextItems = cartStorage.addItem(slug)
    setCartItems(nextItems)
    setCartError(null)
    setCartMessage('เพิ่มคอร์สลงตะกร้าแล้ว')

    window.setTimeout(() => {
      setCartMessage(null)
    }, 1600)
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

  useEffect(() => {
    if (!paymentSlipFile) {
      setPaymentSlipPreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(paymentSlipFile)
    setPaymentSlipPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [paymentSlipFile])

  const openCheckoutModal = (nextCheckoutModal: CheckoutModalState) => {
    if (!ensureStudentSession()) return

    setCartOpen(false)
    setCartMessage(null)
    setCartError(null)
    setPaymentSlipFile(null)
    setPaymentSlipError(null)
    setCheckoutStep('payment')
    setCheckoutModal(nextCheckoutModal)

    if (searchParams.get('cart') === '1') {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('cart')
      setSearchParams(nextParams, { replace: true })
    }
  }

  const closeCheckoutModal = () => {
    setCheckoutModal(null)
    setCheckoutStep('cart')
    setPaymentSlipFile(null)
    setPaymentSlipError(null)
  }

  const handlePaymentSlipChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null
    setPaymentSlipFile(nextFile)
    setPaymentSlipError(null)
  }

  const submitPaymentSlip = () => {
    if (!checkoutModal) return

    if (!paymentSlipFile) {
      setPaymentSlipError('กรุณาแนบรูปภาพสลิปโอนเงินก่อนส่งหลักฐาน')
      return
    }

    if (checkoutModal.mode === 'single') {
      checkoutCourse(checkoutModal.course)
      return
    }

    checkoutAllCourses()
  }

  const removeCourse = (slug: string) => {
    setCartError(null)
    setCartMessage(null)
    setCartItems(cartStorage.removeItem(slug))
  }

  const clearCart = () => {
    setCartError(null)
    setCartMessage(null)
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
    setCheckoutStep('confirm')

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
      setCheckoutStep('payment')
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
      setCheckoutStep('payment')
    } finally {
      setCheckoutAll(false)
    }
  }

  const purchasedCourses = (courses ?? []).filter((course) => course.viewerState?.isEnrolled).length
  const cartCourses = (courses ?? []).filter((course) => cartItems.includes(course.slug))
  const activeFilterCount = [selectedCategory !== allOption, selectedLevel !== allOption, showPurchasedOnly].filter(Boolean).length
  const activeFilterLabels = [
    selectedCategory !== allOption ? getCategoryLabel(selectedCategory) : null,
    selectedLevel !== allOption ? getLevelLabel(selectedLevel) : null,
    showPurchasedOnly ? 'ซื้อแล้ว' : null,
  ].filter(Boolean)
  const totalCartPrice = cartCourses.reduce((sum, course) => sum + course.price, 0)
  const freeCartCourses = cartCourses.filter((course) => course.price === 0).length
  const paidCartCourses = cartCourses.length - freeCartCourses
  const modalActionLoading =
    checkoutModal?.mode === 'single'
      ? checkoutSlug === checkoutModal.course.slug
      : checkoutAll
  const checkoutSteps: Array<{ id: CheckoutStep; label: string; helper: string }> = [
    { id: 'cart', label: 'ตะกร้าสินค้า', helper: 'ตรวจรายการ' },
    { id: 'payment', label: 'ชำระเงิน', helper: 'ยืนยันข้อมูล' },
    { id: 'confirm', label: 'ยืนยันสำเร็จ', helper: 'เปิดสิทธิ์เรียน' },
  ]
  const activeCheckoutStepIndex = checkoutSteps.findIndex((step) => step.id === checkoutStep)
  const cartTotalLabel = formatCartTotal(totalCartPrice)
  const paymentCourses =
    checkoutModal?.mode === 'single'
      ? [checkoutModal.course]
      : cartCourses
  const paymentTotalPrice = paymentCourses.reduce((sum, course) => sum + course.price, 0)
  const paymentTotalLabel = formatCartTotal(paymentTotalPrice)
  const paymentGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        instructor: Course['instructor']
        courses: Course[]
        totalPrice: number
      }
    >()

    for (const course of paymentCourses) {
      const key = course.instructor.id
      const existing = groups.get(key)

      if (existing) {
        existing.courses.push(course)
        existing.totalPrice += course.price
        continue
      }

      groups.set(key, {
        instructor: course.instructor,
        courses: [course],
        totalPrice: course.price,
      })
    }

    return Array.from(groups.values())
  }, [paymentCourses])

  return (
    <section className="student-page-shell">
      <LearnProSidebar active="all-courses" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />

      <main className="student-page-main min-w-0">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-5 border-b border-zinc-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="เปิดเมนู"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">คอร์สทั้งหมด</h1>
              <p className="mt-3 text-base text-zinc-600">เลือกดูและสมัครเรียนคอร์สทั้งหมดที่เปิดอยู่ในระบบ</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((current) => !current)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:hidden"
                aria-expanded={mobileFiltersOpen}
              >
                <SlidersHorizontal size={17} />
                ตัวกรอง
                {activeFilterCount > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-semibold text-black">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative hidden h-12 w-12 items-center justify-center rounded-lg bg-black text-white transition hover:bg-zinc-800 sm:inline-flex"
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

          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm lg:hidden">
            <div className="grid grid-cols-[minmax(0,1fr)_48px] gap-2">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-black"
                onClick={resetFilters}
              >
                ล้างตัวกรอง
              </button>
              <button
                type="button"
                className="relative inline-flex h-11 w-12 items-center justify-center rounded-lg bg-black text-white"
                onClick={() => setCartOpen(true)}
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
            <div className="mt-3 border-t border-zinc-100 pt-3 text-xs leading-5 text-zinc-500">
              {activeFilterLabels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activeFilterLabels.map((label) => (
                    <span key={label} className="rounded-full bg-zinc-100 px-3 py-1 font-semibold text-black">
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <span>แสดงทุกหมวดหมู่และทุกระดับ</span>
              )}
            </div>
          </div>

          <div
            className={[
              'fixed inset-0 z-[80] bg-black/35 transition-opacity lg:hidden',
              mobileFiltersOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
            ].join(' ')}
            onClick={() => setMobileFiltersOpen(false)}
          />

          <div className="grid gap-8 pt-8 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside
              className={[
                'responsive-filter-panel fixed inset-y-0 right-0 z-[90] max-h-[100svh] w-[min(88vw,360px)] overflow-y-auto border-l border-zinc-200 bg-white p-5 shadow-2xl transition-transform duration-300 lg:sticky lg:top-6 lg:z-auto lg:block lg:h-fit lg:max-h-none lg:w-auto lg:translate-x-0 lg:overflow-visible lg:rounded-xl lg:border lg:p-6 lg:shadow-sm',
                mobileFiltersOpen ? 'translate-x-0' : 'translate-x-full',
              ].join(' ')}
            >
              <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-5 py-4 lg:static lg:mx-0 lg:mt-0 lg:border-0 lg:p-0">
                <h2 className="text-lg font-semibold text-black">ตัวกรอง</h2>
                <div className="flex items-center gap-2">
                  <button type="button" className="text-sm text-zinc-500 transition hover:text-black" onClick={resetFilters}>
                    ล้างทั้งหมด
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-black lg:hidden"
                    onClick={() => setMobileFiltersOpen(false)}
                    aria-label="ปิดตัวกรอง"
                  >
                    <X size={17} />
                  </button>
                </div>
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
                <div className="space-y-3 text-sm text-zinc-700">
                  {([
                    ['popular', 'ทั้งหมด'],
                    ['price-low', 'ราคาต่ำก่อน'],
                    ['price-high', 'ราคาสูงก่อน'],
                  ] as Array<[SortOption, string]>).map(([value, label]) => (
                    <label key={value} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="radio"
                        name="course-price-sort"
                        value={value}
                        checked={sortBy === value}
                        onChange={() => setSortBy(value)}
                        className="h-4 w-4 accent-black"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </aside>

            <section className="min-w-0">
              <div className="mb-6 border-b border-zinc-200 pb-5 sm:flex sm:items-center sm:justify-between">
                <div className="grid w-full grid-cols-2 overflow-hidden rounded-lg border border-zinc-200 bg-white p-1 sm:inline-flex sm:w-fit">
                  <button
                    type="button"
                    className={[
                      'min-h-10 min-w-0 rounded-md px-2 text-center text-sm font-semibold leading-5 transition sm:h-9 sm:min-h-0 sm:px-4',
                      !showPurchasedOnly ? 'bg-black text-white' : 'text-zinc-500 hover:text-black',
                    ].join(' ')}
                    onClick={() => setShowPurchasedOnly(false)}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    type="button"
                    className={[
                      'min-h-10 min-w-0 rounded-md px-2 text-center text-sm font-semibold leading-5 transition sm:h-9 sm:min-h-0 sm:px-4',
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

              {loading ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <CourseGridCardSkeleton key={index} />
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
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
          'hidden fixed inset-0 z-[95] overflow-y-auto bg-[#f6f3ee] text-black transition-opacity duration-200',
          cartOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        aria-hidden={!cartOpen}
      >
        <div className="mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
          <div className="sticky top-0 z-10 -mx-4 border-b border-zinc-200/80 bg-[#f6f3ee]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Checkout</p>
                <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-black sm:text-2xl">ตะกร้าสินค้า</h2>
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-black shadow-sm transition hover:border-black"
                onClick={closeCart}
                aria-label="ปิดตะกร้า"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
              {checkoutSteps.map((step, index) => {
                const isActive = index === activeCheckoutStepIndex
                const isCompleted = index < activeCheckoutStepIndex

                return (
                  <div key={step.id} className="contents">
                    <div
                      className={[
                        'flex items-center gap-3 rounded-2xl px-3 py-2 transition',
                        isActive ? 'bg-zinc-100 text-black' : isCompleted ? 'text-black' : 'text-zinc-400',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-base font-semibold transition',
                          isActive || isCompleted ? 'border-black bg-black text-white' : 'border-zinc-300 bg-white text-zinc-500',
                        ].join(' ')}
                      >
                        {isCompleted ? <Check size={18} /> : index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-semibold leading-5 sm:text-lg">{step.label}</span>
                        <span className="mt-1 block text-sm leading-5 text-zinc-500">{step.helper}</span>
                      </span>
                    </div>
                    {index < checkoutSteps.length - 1 ? (
                      <div className="hidden h-px w-16 bg-zinc-300 md:block lg:w-24" />
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-5 grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_460px]">
            <section className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-black">คอร์สที่คุณเลือก</h3>
                  <p className="mt-1 text-sm text-zinc-500">จัดการรายการในตะกร้าได้จากหน้านี้</p>
                </div>
                {cartCourses.length > 0 ? (
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                    onClick={clearCart}
                  >
                    ล้างทั้งหมด
                  </button>
                ) : null}
              </div>

              <div className="mt-5">
                {loading ? (
                  <div className="divide-y divide-zinc-200">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <article key={index} className="grid gap-4 py-5 sm:grid-cols-[136px_minmax(0,1fr)_auto]">
                        <div className="skeleton h-24 w-full rounded-lg sm:w-[136px]" />
                        <div className="min-w-0 space-y-3">
                          <div className="skeleton-line h-5 w-10/12" />
                          <div className="skeleton-line h-4 w-36" />
                          <div className="flex gap-4">
                            <div className="skeleton-line h-4 w-24" />
                            <div className="skeleton-line h-4 w-20" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                          <div className="skeleton-line h-5 w-20" />
                          <div className="skeleton h-9 w-24 rounded-md" />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : courseError || cartError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{cartError ?? courseError}</div>
                ) : cartMessage ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium text-emerald-700">{cartMessage}</div>
                ) : cartCourses.length === 0 ? (
                  <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50 px-5 text-center">
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-sm">
                      <ShoppingBag size={26} />
                    </span>
                    <h3 className="mt-5 text-xl font-semibold text-black">ตะกร้ายังว่าง</h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">เลือกคอร์สที่สนใจแล้วกดเพิ่มลงตะกร้า เพื่อกลับมาตรวจสอบรายการและชำระเงินที่นี่</p>
                    <button
                      type="button"
                      className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
                      onClick={closeCart}
                    >
                      เลือกคอร์สเพิ่ม
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartCourses.map((course) => (
                      <article key={course.id} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-300 sm:grid-cols-[150px_minmax(0,1fr)] xl:grid-cols-[160px_minmax(0,1fr)_auto]">
                        <img src={course.coverImage} alt={course.title} className="aspect-video h-auto w-full rounded-xl bg-zinc-100 object-cover sm:h-full sm:min-h-28" />
                        <div className="min-w-0 py-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">{getCategoryLabel(course.category)}</span>
                            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">{getLevelLabel(course.level)}</span>
                          </div>
                          <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-6 text-black">{course.title}</h3>
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
                            <span>{Math.max(course.lessons.length, course.lessonCount ?? 0)} บทเรียน</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-3 sm:col-span-2 xl:col-span-1 xl:block xl:border-t-0 xl:pt-0 xl:text-right">
                          <div>
                            <p className="text-xs text-zinc-500">ราคา</p>
                            <p className="mt-1 text-lg font-semibold text-black">{formatPrice(course.price)}</p>
                          </div>
                          <button
                            type="button"
                            className="mt-0 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-zinc-200 px-3 text-sm font-semibold text-zinc-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 xl:mt-5"
                            onClick={() => removeCourse(course.slug)}
                            aria-label={`ลบ ${course.title}`}
                          >
                            <Trash2 size={16} />
                            <span className="xl:hidden">ลบ</span>
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className="h-fit rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-black">สรุปการชำระเงิน</h3>
                  <p className="mt-1 text-sm text-zinc-500">ตรวจยอดก่อนยืนยัน</p>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
                  <CreditCard size={18} />
                </span>
              </div>
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

              <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-sm">
                    <CreditCard size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-black">ช่องทางชำระเงิน</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      ระบบจะตรวจรายการก่อนส่งไปหน้าชำระเงิน และเปิดสิทธิ์เรียนหลังยืนยันสำเร็จ
                    </p>
                  </div>
                </div>
                <label className="mt-4 flex items-center gap-3 rounded-xl border border-black bg-white px-4 py-3 text-sm font-semibold text-black">
                  <input type="radio" checked readOnly className="h-4 w-4 accent-black" />
                  ชำระผ่านระบบของแพลตฟอร์ม
                </label>
              </div>

              <button
                type="button"
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                onClick={() => openCheckoutModal({ mode: 'all' })}
                disabled={cartCourses.length === 0 || checkoutAll || Boolean(checkoutSlug)}
              >
                {checkoutAll ? <LoaderCircle size={16} className="animate-spin" /> : <CreditCard size={16} />}
                ยืนยันและชำระเงิน
              </button>
              <button
                type="button"
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-semibold text-black transition hover:border-black"
                onClick={closeCart}
              >
                เลือกคอร์สเพิ่ม
              </button>

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
          'fixed inset-0 z-[80] bg-black/35 transition-opacity duration-200',
          cartOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={closeCart}
      />
      <aside
        className={[
          'fixed inset-0 z-[90] flex h-[100svh] w-screen max-w-none flex-col bg-white text-black shadow-2xl transition-transform duration-300 ease-out sm:inset-y-0 sm:left-auto sm:right-0 sm:w-full sm:max-w-[440px] sm:border-l sm:border-zinc-200',
          cartOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-hidden={!cartOpen}
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
                      <div className="mt-3">
                        <p className="text-base font-semibold text-black">{course.price === 0 ? 'ฟรี' : formatPrice(course.price)}</p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <footer className="border-t border-zinc-200 bg-white p-4">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-zinc-500">{'\u0e22\u0e2d\u0e14\u0e23\u0e27\u0e21'}</span>
              {totalCartPrice > 0 ? (
                <span className="text-2xl font-semibold tracking-tight text-black">{formatPrice(totalCartPrice)}</span>
              ) : null}
            </div>
          </div>

          {cartCourses.length > 0 ? (
            <button
              type="button"
              className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              onClick={() => openCheckoutModal({ mode: 'all' })}
              disabled={checkoutAll || Boolean(checkoutSlug)}
            >
              <CreditCard size={16} />
              {'\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19'}
            </button>
          ) : null}
        </footer>
      </aside>

      <div
        className={[
          'fixed inset-0 z-[100] bg-black/35 transition-opacity duration-200',
          checkoutModal ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={closeCheckoutModal}
      />
      <aside
        className={[
          'fixed inset-y-0 right-0 z-[110] flex w-full max-w-[440px] flex-col border-l border-zinc-200 bg-white text-black shadow-2xl transition-transform duration-300 ease-out',
          checkoutModal ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-hidden={!checkoutModal}
        aria-label="ชำระเงิน"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-black text-white">
              <Landmark size={20} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-black">ชำระเงิน</h2>
              <p className="mt-1 text-sm text-zinc-500">โอนเงินและแนบสลิป</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 text-black transition hover:border-black"
            onClick={closeCheckoutModal}
            aria-label="ปิดหน้าชำระเงิน"
            disabled={modalActionLoading}
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-zinc-500">ยอดที่ต้องโอน</span>
              <span className="text-2xl font-semibold tracking-tight text-black">{paymentTotalLabel}</span>
            </div>
          </div>

          <section className="hidden">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-black">
                <Landmark size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-black">บัญชีสำหรับโอนเงิน</h3>
                <div className="mt-3 space-y-1 text-sm text-zinc-600">
                  <p>ธนาคาร: กสิกรไทย</p>
                  <p>ชื่อบัญชี: MyCourse</p>
                  <p className="font-semibold text-black">เลขบัญชี: 123-4-56789-0</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 space-y-3">
            {paymentGroups.map((group) => {
              return (
              <div key={group.instructor.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-black">{group.instructor.name}</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {group.courses.length.toLocaleString('th-TH')} คอร์สในคำสั่งซื้อนี้
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">ยอดชำระ</p>
                    <p className="text-lg font-semibold text-black">{formatCartTotal(group.totalPrice)}</p>
                  </div>
                </div>

                <div className="flex justify-center bg-zinc-50 p-5">
                  <div className="flex w-full max-w-[280px] items-center justify-center rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                    <PromptPayQr
                      promptPayId={group.instructor.promptPayId}
                      amount={group.totalPrice}
                      fallbackUrl={group.instructor.paymentQrUrl}
                      instructorName={group.instructor.name}
                    />
                  </div>
                </div>

                <div className="grid gap-px border-t border-zinc-200 bg-zinc-200 sm:grid-cols-2">
                  <div className="min-w-0 bg-white px-4 py-3">
                    <p className="text-xs text-zinc-500">ชื่อบัญชี</p>
                    <p className="mt-1 break-words text-sm font-semibold text-black">
                      {group.instructor.bankAccountName || group.instructor.name}
                    </p>
                  </div>
                  <div className="min-w-0 bg-white px-4 py-3">
                    <p className="text-xs text-zinc-500">
                      {group.instructor.bankAccountNumber ? 'เลขบัญชี' : 'เลข PromptPay'}
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold tracking-wide text-black">
                      {group.instructor.bankAccountNumber || group.instructor.promptPayId || '-'}
                    </p>
                  </div>
                </div>
              </div>
              )
            })}
          </section>

          <section className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-black">แนบสลิปโอนเงิน</h3>
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-center transition hover:border-black hover:bg-white">
              {paymentSlipPreview ? (
                <img src={paymentSlipPreview} alt="สลิปโอนเงิน" className="max-h-48 w-full rounded-lg object-contain" />
              ) : (
                <>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-sm">
                    <ImagePlus size={22} />
                  </span>
                  <span className="mt-3 text-sm font-semibold text-black">เลือกรูปภาพสลิป</span>
                  <span className="mt-1 text-xs text-zinc-500">รองรับ JPG, PNG หรือ WEBP</span>
                </>
              )}
              <input type="file" accept="image/*" className="sr-only" onChange={handlePaymentSlipChange} />
            </label>
            {paymentSlipFile ? (
              <p className="mt-3 text-xs text-zinc-500">{paymentSlipFile.name}</p>
            ) : null}
            {paymentSlipError ? (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{paymentSlipError}</p>
            ) : null}
          </section>
        </div>

        <footer className="shrink-0 border-t border-zinc-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            onClick={submitPaymentSlip}
            disabled={modalActionLoading || paymentCourses.length === 0}
          >
            {modalActionLoading ? <LoaderCircle size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            {modalActionLoading ? 'กำลังส่งหลักฐาน...' : 'ส่งหลักฐานชำระเงิน'}
          </button>
          <button
            type="button"
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-black transition hover:border-black disabled:cursor-not-allowed disabled:text-zinc-400"
            onClick={() => {
              closeCheckoutModal()
              setCartOpen(true)
            }}
            disabled={modalActionLoading}
          >
            กลับไปตะกร้า
          </button>
        </footer>
      </aside>

      <div
        className={[
          'hidden',
          checkoutModal ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={closeCheckoutModal}
      >
        <section
          className={[
            'w-full max-w-[380px] rounded-[28px] border border-zinc-200 bg-white p-5 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)] transition duration-200 sm:p-6',
            checkoutModal ? 'translate-y-0 scale-100' : 'translate-y-3 scale-[0.98]',
          ].join(' ')}
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="ยืนยันการชำระเงิน"
        >
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
            <CreditCard size={20} />
          </span>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-black">ยืนยันการชำระเงิน?</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">กรุณายืนยันอีกครั้งก่อนดำเนินการชำระเงิน</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={minimalSecondaryButtonClass}
              onClick={closeCheckoutModal}
              disabled={modalActionLoading}
            >
              ยกเลิก
            </button>
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
              {modalActionLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
              {modalActionLoading ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
            </button>
          </div>
        </section>
      </div>
    </section>
  )
}
