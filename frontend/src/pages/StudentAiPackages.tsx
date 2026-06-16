import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  CreditCard,
  FileText,
  Menu,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react'
import LearnProSidebar from '../components/LearnProSidebar'
import { api, authStorage } from '../services/api'
import type { AiPlanId, AiUsageSnapshot } from '../services/api'

type Plan = {
  id: AiPlanId
  name: string
  description: string
  monthlyPrice: number
  badge?: string
  aiQuestions: number
  summaries: number
  quizzes: number
  features: string[]
  bestFor: string
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'เหมาะสำหรับทดลองใช้ AI ระหว่างเรียนแบบไม่เสียค่าใช้จ่าย',
    monthlyPrice: 0,
    aiQuestions: 10,
    summaries: 3,
    quizzes: 3,
    bestFor: 'ลองใช้ก่อนตัดสินใจ',
    features: ['ถามตอบจากบทเรียน', 'สรุปเนื้อหาสั้น', 'สร้างแบบทดสอบพื้นฐาน'],
  },
  {
    id: 'plus',
    name: 'AI Plus',
    description: 'คุ้มที่สุดสำหรับนักเรียนที่ใช้ AI ทบทวนทุกสัปดาห์',
    monthlyPrice: 99,
    badge: 'แนะนำ',
    aiQuestions: 300,
    summaries: 50,
    quizzes: 50,
    bestFor: 'เรียนจริงหลายคอร์ส',
    features: ['ถามตอบได้เยอะขึ้น', 'สรุปเป็นหัวข้ออ่านง่าย', 'สร้างแบบทดสอบพร้อมเฉลย', 'เหมาะกับการทบทวนประจำ'],
  },
  {
    id: 'pro',
    name: 'AI Pro',
    description: 'สำหรับคนเรียนหนัก ต้องการโควตาสูงและใช้งาน AI เป็นติวเตอร์หลัก',
    monthlyPrice: 199,
    aiQuestions: 1000,
    summaries: 200,
    quizzes: 200,
    bestFor: 'เตรียมสอบหรือเรียนเข้ม',
    features: ['โควตาถามตอบสูง', 'สรุปบทเรียนจำนวนมาก', 'สร้างชุดข้อสอบซ้ำได้', 'เหมาะกับการเตรียมสอบจริงจัง'],
  },
]

const formatPrice = (monthlyPrice: number) => {
  if (monthlyPrice === 0) return 'ฟรี'
  return `฿${monthlyPrice.toLocaleString('th-TH')}`
}

const formatQuota = (value: number, unit = 'ครั้ง/เดือน') => `${value.toLocaleString('th-TH')} ${unit}`

const platformPromptPayId = String(import.meta.env.VITE_PLATFORM_PROMPTPAY_ID ?? '').replace(/[^0-9]/g, '')
const getPromptPayQrUrl = (amount: number) =>
  platformPromptPayId && amount > 0
    ? `https://promptpay.io/${platformPromptPayId}/${amount.toFixed(2)}.png`
    : ''

export default function StudentAiPackages() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<AiPlanId>('plus')
  const [cartOpen, setCartOpen] = useState(false)
  const [usage, setUsage] = useState<AiUsageSnapshot | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(true)
  const [activatingPlan, setActivatingPlan] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const session = authStorage.getSession()
  const displayName = session?.user.name ?? 'ผู้เรียน'
  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId) ?? plans[1], [selectedPlanId])
  const currentPlan = useMemo(() => plans.find((plan) => plan.id === usage?.plan.id) ?? plans[0], [usage?.plan.id])
  const promptPayQrUrl = getPromptPayQrUrl(selectedPlan.monthlyPrice)

  useEffect(() => {
    let active = true

    setLoadingUsage(true)
    api
      .getStudentAiSubscription()
      .then((nextUsage) => {
        if (!active) return
        setUsage(nextUsage)
        setSelectedPlanId(nextUsage.plan.id)
      })
      .catch((error) => {
        if (!active) return
        setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'โหลดข้อมูลแพ็กเกจ AI ไม่สำเร็จ' })
      })
      .finally(() => {
        if (active) setLoadingUsage(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = cartOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [cartOpen])

  const activatePlan = async (planId: AiPlanId) => {
    const plan = plans.find((item) => item.id === planId)
    if (!plan || activatingPlan) return

    setActivatingPlan(true)
    setMessage(null)

    try {
      const nextUsage = await api.activateStudentAiPlan(planId)
      setUsage(nextUsage)
      setSelectedPlanId(nextUsage.plan.id)
      setCartOpen(false)
      setMessage({ tone: 'success', text: `เปิดใช้งานแพ็กเกจ ${plan.name} เรียบร้อยแล้ว` })
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'เปลี่ยนแพ็กเกจ AI ไม่สำเร็จ' })
    } finally {
      setActivatingPlan(false)
    }
  }

  const choosePlan = (planId: AiPlanId) => {
    setSelectedPlanId(planId)
    setMessage(null)
    const plan = plans.find((item) => item.id === planId)

    if (!plan) return
    if (plan.monthlyPrice > 0) {
      setCartOpen(true)
      return
    }

    void activatePlan(plan.id)
  }

  return (
    <div className="student-page-shell">
      <LearnProSidebar
        active="ai-packages"
        profileName={displayName}
        profileAvatarUrl={session?.user.avatarUrl}
        profileLabel={session?.user.email ?? 'บัญชีผู้เรียน'}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="student-page-main min-w-0">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center gap-4">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white lg:hidden"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="เปิดเมนู"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">แพ็กเกจ AI</h1>
              <p className="mt-1 text-sm text-zinc-500">เลือกโควตา AI ให้เหมาะกับการเรียนของคุณ</p>
            </div>
            <div className="ml-auto hidden items-center gap-3 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-3 sm:flex">
              {session?.user.avatarUrl ? (
                <img src={session.user.avatarUrl} alt={displayName} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
                  <UserRound size={16} />
                </span>
              )}
              <span className="text-sm font-semibold">{displayName}</span>
            </div>
          </header>

          <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">Current Plan</p>
                <h2 className="mt-2 text-2xl font-semibold text-black">
                  {loadingUsage ? 'กำลังโหลดแพ็กเกจ...' : currentPlan.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">{currentPlan.bestFor}</p>
              </div>

              {usage ? (
                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[560px]">
                  <UsagePill label="ถาม AI" used={usage.used.chat} limit={usage.limits.chat} />
                  <UsagePill label="สรุป" used={usage.used.summary} limit={usage.limits.summary} />
                  <UsagePill label="แบบทดสอบ" used={usage.used.quiz} limit={usage.limits.quiz} />
                </div>
              ) : null}
            </div>
          </section>

          {message ? (
            <p
              className={[
                'mb-6 rounded-xl border p-4 text-sm font-semibold',
                message.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700',
              ].join(' ')}
            >
              {message.text}
            </p>
          ) : null}

          <section className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const selected = selectedPlanId === plan.id
              const active = usage?.plan.id === plan.id

              return (
                <article
                  key={plan.id}
                  className={[
                    'flex min-h-[560px] flex-col rounded-2xl border bg-white p-5 shadow-sm transition sm:p-6',
                    selected ? 'border-black shadow-zinc-300/60' : 'border-zinc-200 hover:border-zinc-300',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold text-black">{plan.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">{plan.description}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {plan.badge ? <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">{plan.badge}</span> : null}
                      {active ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">ใช้งานอยู่</span> : null}
                    </div>
                  </div>

                  <div className="mt-6">
                    <span className="text-4xl font-semibold tracking-tight text-black">{formatPrice(plan.monthlyPrice)}</span>
                    {plan.monthlyPrice > 0 ? <span className="ml-2 text-sm text-zinc-500">/เดือน</span> : null}
                  </div>

                  <div className="mt-6 grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <QuotaRow icon={MessageSquareText} label="ถาม AI" value={formatQuota(plan.aiQuestions)} />
                    <QuotaRow icon={FileText} label="สรุปบทเรียน" value={formatQuota(plan.summaries)} />
                    <QuotaRow icon={ClipboardCheck} label="แบบทดสอบ" value={formatQuota(plan.quizzes, 'ชุด/เดือน')} />
                  </div>

                  <p className="mt-5 rounded-xl bg-zinc-50 px-4 py-3 text-sm font-semibold text-black">{plan.bestFor}</p>

                  <ul className="mt-5 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-sm leading-6 text-zinc-600">
                        <Check className="mt-0.5 shrink-0 text-black" size={17} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={[
                      'mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
                      selected ? 'bg-black text-white hover:bg-zinc-800' : 'border border-zinc-200 bg-white text-black hover:border-zinc-300 hover:bg-zinc-50',
                    ].join(' ')}
                    onClick={() => choosePlan(plan.id)}
                    disabled={activatingPlan || active}
                  >
                    {activatingPlan && selected ? <RefreshCw size={17} className="animate-spin" /> : plan.monthlyPrice > 0 ? <CreditCard size={17} /> : <Sparkles size={17} />}
                    {active ? 'แพ็กเกจปัจจุบัน' : plan.monthlyPrice > 0 ? 'เลือกแพ็กเกจ' : 'ใช้แพ็กเกจฟรี'}
                  </button>
                </article>
              )
            })}
          </section>
        </div>
      </main>

      <div
        className={[
          'fixed inset-0 z-[100] bg-black/35 transition-opacity',
          cartOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setCartOpen(false)}
      />
      <aside
        className={[
          'fixed inset-y-0 right-0 z-[110] flex w-full max-w-[460px] flex-col border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300',
          cartOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-hidden={!cartOpen}
        aria-label="ตะกร้าแพ็กเกจ AI"
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
              <ShoppingCart size={19} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-black">ชำระแพ็กเกจ AI</h2>
              <p className="mt-1 text-sm text-zinc-500">สแกน QR แล้วกดยืนยันเพื่อเปิดใช้งาน</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200"
            onClick={() => setCartOpen(false)}
            aria-label="ปิดตะกร้า"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">AI Package</p>
                <h3 className="mt-2 text-2xl font-semibold text-black">{selectedPlan.name}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{selectedPlan.description}</p>
              </div>
              <CreditCard className="shrink-0" size={22} />
            </div>
            <div className="mt-5 flex items-end justify-between border-t border-zinc-200 pt-5">
              <span className="text-sm text-zinc-500">ราคาต่อเดือน</span>
              <p className="text-right">
                <span className="text-3xl font-semibold text-black">{formatPrice(selectedPlan.monthlyPrice)}</span>
                <span className="ml-1 text-sm text-zinc-500">/เดือน</span>
              </p>
            </div>
          </section>

          <section className="mt-4 overflow-hidden rounded-2xl border border-zinc-200">
            <div className="flex items-center justify-between bg-zinc-50 px-4 py-3">
              <span className="text-sm text-zinc-500">ยอดสำหรับ QR</span>
              <span className="text-lg font-semibold text-black">{formatPrice(selectedPlan.monthlyPrice)}</span>
            </div>
            <div className="flex min-h-[300px] items-center justify-center bg-white p-5">
              {promptPayQrUrl ? (
                <img
                  src={promptPayQrUrl}
                  alt={`PromptPay QR ${selectedPlan.name} ${selectedPlan.monthlyPrice} บาท`}
                  className="aspect-square w-full max-w-[280px] object-contain"
                />
              ) : (
                <div className="max-w-xs text-center text-sm leading-6 text-zinc-500">
                  ยังไม่ได้ตั้งค่า PromptPay ของระบบ
                  <span className="mt-2 block font-medium text-black">VITE_PLATFORM_PROMPTPAY_ID</span>
                </div>
              )}
            </div>
            <p className="border-t border-zinc-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-700">
              QR นี้ฝังยอด {formatPrice(selectedPlan.monthlyPrice)} ตรงกับแพ็กเกจที่เลือก
            </p>
          </section>
        </div>

        <footer className="border-t border-zinc-200 bg-white p-5">
          <button
            type="button"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => activatePlan(selectedPlan.id)}
            disabled={activatingPlan}
          >
            {activatingPlan ? <RefreshCw size={17} className="animate-spin" /> : null}
            ยืนยันแพ็กเกจ {selectedPlan.name}
            <ArrowRight size={16} />
          </button>
        </footer>
      </aside>
    </div>
  )
}

function QuotaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MessageSquareText
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-2 font-medium text-zinc-600">
        <Icon size={16} />
        {label}
      </span>
      <span className="font-semibold text-black">{value}</span>
    </div>
  )
}

function UsagePill({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-zinc-500">
        <span>{label}</span>
        <span>
          {used.toLocaleString('th-TH')}/{limit.toLocaleString('th-TH')}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full rounded-full bg-black" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
