import { useMemo, useState } from 'react'
import {
  Check,
  ClipboardCheck,
  CreditCard,
  FileText,
  Menu,
  MessageSquareText,
  Sparkles,
  UserRound,
} from 'lucide-react'
import LearnProSidebar from '../components/LearnProSidebar'
import { authStorage } from '../services/api'

type PlanId = 'free' | 'plus' | 'pro'

const plans: Array<{
  id: PlanId
  name: string
  description: string
  monthlyPrice: number
  badge?: string
  aiQuestions: string
  summaries: string
  quizzes: string
  features: string[]
}> = [
  {
    id: 'free',
    name: 'Free',
    description: 'เหมาะสำหรับทดลองใช้ AI ระหว่างเรียน',
    monthlyPrice: 0,
    aiQuestions: '10 ครั้ง/เดือน',
    summaries: '3 ครั้ง/เดือน',
    quizzes: '3 ชุด/เดือน',
    features: ['ถามตอบจากบทเรียน', 'สรุปเนื้อหาสั้น', 'สร้างแบบทดสอบพื้นฐาน'],
  },
  {
    id: 'plus',
    name: 'AI Plus',
    description: 'คุ้มสำหรับนักเรียนที่ใช้ AI ช่วยทบทวนทุกสัปดาห์',
    monthlyPrice: 99,
    badge: 'แนะนำ',
    aiQuestions: '300 ครั้ง/เดือน',
    summaries: '50 ครั้ง/เดือน',
    quizzes: '50 ชุด/เดือน',
    features: ['ถามตอบจากบทเรียนแบบละเอียด', 'สรุปเป็นหัวข้ออ่านง่าย', 'สร้างแบบทดสอบพร้อมเฉลย', 'เหมาะกับการเรียนหลายคอร์ส'],
  },
  {
    id: 'pro',
    name: 'AI Pro',
    description: 'สำหรับคนที่เรียนจริงจังและต้องการโควตาสูง',
    monthlyPrice: 199,
    aiQuestions: '1,000 ครั้ง/เดือน',
    summaries: '200 ครั้ง/เดือน',
    quizzes: '200 ชุด/เดือน',
    features: ['โควตาถามตอบสูง', 'สรุปบทเรียนจำนวนมาก', 'สร้างชุดข้อสอบซ้ำได้', 'เหมาะกับการเตรียมสอบ'],
  },
]

const formatPrice = (monthlyPrice: number) => {
  if (monthlyPrice === 0) return 'ฟรี'
  return `฿${monthlyPrice.toLocaleString('th-TH')}`
}

export default function StudentAiPackages() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('plus')
  const [confirmedPlanId, setConfirmedPlanId] = useState<PlanId | null>(null)
  const session = authStorage.getSession()
  const displayName = session?.user.name ?? 'ผู้เรียน'
  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId) ?? plans[1], [selectedPlanId])

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
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center gap-4">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-200 bg-white lg:hidden"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="เปิดเมนู"
            >
              <Menu size={20} />
            </button>
            <div className="ml-auto flex items-center gap-3 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-3">
              {session?.user.avatarUrl ? (
                <img src={session.user.avatarUrl} alt={displayName} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white">
                  <UserRound size={16} />
                </span>
              )}
              <span className="hidden text-sm font-semibold sm:inline">{displayName}</span>
            </div>
          </header>

          <section className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const selected = selectedPlanId === plan.id
              return (
                <article
                  key={plan.id}
                  className={[
                    'flex min-h-[560px] flex-col rounded-xl border bg-white p-6 shadow-sm transition',
                    selected ? 'border-black shadow-zinc-300/60' : 'border-zinc-200 hover:border-zinc-300',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold text-black">{plan.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">{plan.description}</p>
                    </div>
                    {plan.badge ? <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">{plan.badge}</span> : null}
                  </div>

                  <div className="mt-6">
                    <span className="text-4xl font-semibold tracking-tight text-black">{formatPrice(plan.monthlyPrice)}</span>
                    {plan.monthlyPrice > 0 ? (
                      <span className="ml-2 text-sm text-zinc-500">/เดือน</span>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                    <QuotaRow icon={MessageSquareText} label="ถาม AI" value={plan.aiQuestions} />
                    <QuotaRow icon={FileText} label="สรุปบทเรียน" value={plan.summaries} />
                    <QuotaRow icon={ClipboardCheck} label="แบบทดสอบ" value={plan.quizzes} />
                  </div>

                  <ul className="mt-6 space-y-3">
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
                      'mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition',
                      selected ? 'bg-black text-white hover:bg-zinc-800' : 'border border-zinc-200 bg-white text-black hover:border-zinc-300 hover:bg-zinc-50',
                    ].join(' ')}
                    onClick={() => {
                      setSelectedPlanId(plan.id)
                      setConfirmedPlanId(null)
                    }}
                  >
                    {plan.monthlyPrice > 0 ? <CreditCard size={17} /> : <Sparkles size={17} />}
                    {selected ? 'เลือกแพ็กเกจนี้แล้ว' : plan.monthlyPrice > 0 ? 'เลือกแพ็กเกจ' : 'ใช้แพ็กเกจฟรี'}
                  </button>
                </article>
              )
            })}
          </section>

          <section className="mt-7 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-500">รายการที่เลือก</p>
                <h2 className="mt-1 text-2xl font-semibold text-black">{selectedPlan.name}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  ตรวจสอบแพ็กเกจและยืนยันเพื่อใช้เป็นแผน AI ของบัญชีนี้
                </p>
                {confirmedPlanId ? (
                  <p className="mt-3 inline-flex rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                    ยืนยันแพ็กเกจ {plans.find((plan) => plan.id === confirmedPlanId)?.name} แล้ว
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-black px-6 text-sm font-semibold text-white transition hover:bg-zinc-800"
                onClick={() => setConfirmedPlanId(selectedPlan.id)}
              >
                <CreditCard size={17} />
                ดำเนินการต่อ
              </button>
            </div>
          </section>
        </div>
      </main>
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
