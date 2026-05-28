import { Check, GraduationCap, LayoutDashboard, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'

const coreReasons = [
  'รวมคอร์สที่เลือกเรียนได้จริงไว้ในที่เดียว',
  'ผู้เรียนซื้อคอร์สแล้วกลับมาเรียนต่อได้จากแดชบอร์ด',
  'ครูจัดการคอร์ส บทเรียน นักเรียน และข้อความได้ง่ายขึ้น',
]

const careerReasons = [
  {
    title: 'เหมาะกับคอร์สสอนอาชีพ',
    description: 'จัดโครงสร้างคอร์สให้ผู้เรียนเห็นเป้าหมายชัด ตั้งแต่เริ่มต้นจนต่อยอดเป็นงานจริง',
    icon: GraduationCap,
  },
  {
    title: 'ระบบสำหรับครูและสถาบัน',
    description: 'มีพื้นที่จัดการคอร์ส บทเรียน นักเรียน รีวิว และข้อความ โดยไม่ต้องกระจายงานหลายที่',
    icon: LayoutDashboard,
  },
  {
    title: 'ประสบการณ์ซื้อคอร์สที่ลื่นไหล',
    description: 'ผู้เรียนค้นหาคอร์ส ดูรายละเอียด เก็บลงตะกร้า และกลับมาเรียนต่อได้จากพื้นที่ของตัวเอง',
    icon: UsersRound,
  },
  {
    title: 'พร้อมต่อยอดด้วย AI',
    description: 'เหมาะสำหรับเพิ่มฟีเจอร์สรุปบทเรียน สร้างแบบทดสอบ และผู้ช่วยตอบคำถามจากเนื้อหาคอร์ส',
    icon: Sparkles,
  },
]

export default function WhyMyCourse() {
  return (
    <div className="bg-white text-black">
      <section className="container-page py-14 sm:py-18 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">WHY MYCOURSE</p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl">
              ทำไมต้อง
              <span className="block">MyCourse</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
              แพลตฟอร์มเรียนออนไลน์ที่ออกแบบให้ผู้เรียนค้นหา ซื้อ และกลับมาเรียนต่อได้ลื่นไหล
              ส่วนคุณครูก็จัดการคอร์สได้ในที่เดียว
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {coreReasons.map((reason) => (
              <article key={reason} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  <Check size={20} />
                </span>
                <p className="mt-8 text-base font-semibold leading-7 text-zinc-950">{reason}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50/70 py-12 sm:py-16 lg:py-20">
        <div className="container-page">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">CAREER COURSE PLATFORM</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">สร้างระบบคอร์สที่พร้อมขายและพร้อมเรียน</h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {careerReasons.map((item) => {
              const Icon = item.icon

              return (
                <article key={item.title} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
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
        <div className="rounded-xl border border-zinc-200 bg-black p-7 text-white shadow-sm sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white text-black">
                <ShieldCheck size={20} />
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">เหมาะสำหรับเริ่มจากระบบที่ใช้ง่าย แล้วค่อยต่อยอด</h2>
              <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">
                เริ่มจากระบบคอร์สหลักให้แข็งแรงก่อน จากนั้นค่อยเพิ่ม AI, automation, certificate, portfolio และ integration ตามแพ็กเกจผู้ใช้
              </p>
            </div>
            <a
              href="/contact"
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              ติดต่อเรา
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
