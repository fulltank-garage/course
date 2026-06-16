import { ArrowRight, Check, GraduationCap, LayoutDashboard, ShieldCheck, Sparkles, UsersRound, Video } from 'lucide-react'
import { Link } from 'react-router-dom'

const coreReasons = [
  'รวมคอร์สที่เลือกเรียนได้จริงไว้ในที่เดียว',
  'ผู้เรียนซื้อคอร์สแล้วกลับมาเรียนต่อได้ง่ายจากแดชบอร์ด',
  'ครูจัดการคอร์ส บทเรียน นักเรียน รีวิว และข้อความได้เป็นระบบ',
]

const featureCards = [
  {
    title: 'เหมาะกับคอร์สอาชีพ',
    description: 'จัดโครงสร้างคอร์สให้ผู้เรียนเห็นเป้าหมายชัด ตั้งแต่เริ่มต้นจนต่อยอดเป็นงานจริง',
    icon: GraduationCap,
  },
  {
    title: 'แดชบอร์ดสำหรับครู',
    description: 'ครูดูภาพรวมคอร์ส บทเรียน นักเรียน รายได้ และสถานะการสอนจากพื้นที่เดียว',
    icon: LayoutDashboard,
  },
  {
    title: 'ประสบการณ์เรียนต่อเนื่อง',
    description: 'ผู้เรียนค้นหาคอร์ส ซื้อคอร์ส กลับมาเรียนต่อ และติดตามความคืบหน้าได้ง่าย',
    icon: UsersRound,
  },
  {
    title: 'ต่อยอดด้วย AI',
    description: 'รองรับการสรุปบทเรียน สร้างแบบทดสอบ และผู้ช่วยตอบคำถามจากเนื้อหาคอร์ส',
    icon: Sparkles,
  },
]

const workflow = [
  { title: 'สร้างคอร์ส', description: 'ใส่ข้อมูลคอร์ส ราคา รูปปก และหมวดหมู่' },
  { title: 'เพิ่มบทเรียน', description: 'อัปโหลดวิดีโอ จัดลำดับบทเรียน และเปิดพรีวิวได้' },
  { title: 'เปิดขาย', description: 'ผู้เรียนเลือกซื้อและกลับมาเรียนต่อจากแดชบอร์ดของตัวเอง' },
]

export default function WhyMyCourse() {
  return (
    <div className="bg-white text-black">
      <section className="container-page py-12 sm:py-16 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Why MyCourse</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
              ทำไมต้องเลือก MyCourse
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
              MyCourse ออกแบบมาให้ครูสร้างคอร์สได้ง่าย และให้ผู้เรียนกลับมาเรียนต่อได้ลื่นไหล
              โดยรวมระบบคอร์ส วิดีโอ การชำระเงิน และ AI ไว้ในพื้นที่เดียว
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/student/store"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                ดูคอร์สทั้งหมด
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-zinc-200 bg-white px-5 text-sm font-semibold text-black transition hover:border-black"
              >
                ติดต่อเรา
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:gap-4">
            {coreReasons.map((reason) => (
              <article key={reason} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                  <Check size={18} />
                </span>
                <p className="mt-5 text-sm font-semibold leading-6 text-zinc-950">{reason}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-[#faf9f7] py-12 sm:py-16 lg:py-20">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                ระบบเดียวสำหรับคอร์สออนไลน์
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-600 sm:text-base">
                โครงสร้างหน้าเว็บและแดชบอร์ดถูกออกแบบให้ใช้งานง่ายทั้งมือถือ แท็บเล็ต และเดสก์ท็อป
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {featureCards.map((item) => {
              const Icon = item.icon

              return (
                <article key={item.title} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md sm:p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-black text-white">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-zinc-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-600">{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-black text-white">
              <Video size={20} />
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950">จากคอร์สแรกสู่ระบบที่ขยายต่อได้</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
              เริ่มจากการขายและจัดการคอร์สหลักให้แข็งแรงก่อน แล้วค่อยต่อยอดเป็น AI, ใบประกาศ, portfolio
              และเครื่องมือสำหรับครูในอนาคต
            </p>
          </div>

          <div className="grid gap-3">
            {workflow.map((item, index) => (
              <article key={item.title} className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-black">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-950">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-12 sm:pb-16 lg:pb-20">
        <div className="rounded-2xl bg-black p-6 text-white shadow-sm sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white text-black">
                <ShieldCheck size={20} />
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">พร้อมสำหรับทั้งผู้เรียนและคุณครู</h2>
              <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">
                หน้าเว็บเรียบ ใช้งานง่าย และมีแดชบอร์ดแยกตามบทบาท ทำให้ประสบการณ์ทั้งสองฝั่งต่อเนื่องกว่าเดิม
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              เริ่มใช้งาน
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
