import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

const contactChannels = [
  {
    icon: Mail,
    title: 'อีเมลทีมสนับสนุน',
    value: 'support@mycourse.app',
    description: 'เหมาะสำหรับคำถามเรื่องบัญชี คอร์ส การชำระเงิน และปัญหาทั่วไป',
    href: 'mailto:support@mycourse.app',
  },
  {
    icon: MessageCircle,
    title: 'AI Learning Support',
    value: 'สรุปบทเรียน / ถามตอบ / Quiz',
    description: 'แจ้งปัญหาเกี่ยวกับระบบ AI ช่วยเรียน เช่น สรุปไม่ขึ้น หรือ Quiz ไม่ตรงบทเรียน',
  },
  {
    icon: ShieldCheck,
    title: 'Teacher & Admin Desk',
    value: 'Course operation',
    description: 'ช่วยดูเรื่องสร้างคอร์ส อัปโหลดวิดีโอ จัดบทเรียน และสิทธิ์การใช้งาน',
  },
]

const supportSteps = [
  'ระบุชื่อคอร์สหรือบทเรียนที่พบปัญหา',
  'แนบอีเมลบัญชีผู้ใช้งานที่เกี่ยวข้อง',
  'อธิบายขั้นตอนที่ทำก่อนเกิดปัญหาแบบสั้น ๆ',
]

const quickTopics = ['ระบบ AI', 'วิดีโอการเรียน', 'สมัครเรียน', 'บัญชีผู้ใช้', 'ครูผู้สอน', 'ใบประกาศ']

export default function Contact() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.currentTarget.reset()
    setSent(true)
  }

  return (
    <div className="bg-white text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
        <div className="container-page grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              <Headphones size={16} />
              Support Center
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-5xl">
              ติดต่อทีม MyCourse ได้ง่าย พร้อมช่วยทั้งผู้เรียนและผู้สอน
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              ส่งคำถาม ปัญหาการใช้งาน หรือข้อเสนอแนะเกี่ยวกับแพลตฟอร์มคอร์สออนไลน์ของคุณ ทีมสนับสนุนจะช่วยตรวจสอบทั้งระบบเรียน วิดีโอ คอร์ส และฟีเจอร์ AI อย่างเป็นขั้นตอน
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:support@mycourse.app"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/15 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
              >
                <Mail size={17} />
                ส่งอีเมลหาเรา
              </a>
              <Link
                to="/"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-200/70 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
              >
                ดูคอร์สทั้งหมด
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
                <p className="font-semibold text-slate-950">24 ชม.</p>
                <p className="mt-1">รับข้อความผ่านฟอร์ม</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
                <p className="font-semibold text-slate-950">1 วันทำการ</p>
                <p className="mt-1">เวลาตอบกลับโดยเฉลี่ย</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
                <p className="font-semibold text-slate-950">AI Ready</p>
                <p className="mt-1">ช่วยตรวจฟีเจอร์สรุปและ Quiz</p>
              </div>
            </div>
          </div>

          <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80 sm:p-6" onSubmit={handleSubmit}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">ส่งข้อความถึงเรา</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">กรอกรายละเอียดให้ครบ ทีมงานจะติดต่อกลับตามข้อมูลที่ระบุ</p>
              </div>
              <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 sm:inline-flex">
                <Send size={19} />
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="field-label">ชื่อ</span>
                <input className="field-input" name="name" placeholder="ชื่อของคุณ" required />
              </label>
              <label>
                <span className="field-label">อีเมล</span>
                <input className="field-input" name="email" type="email" placeholder="you@example.com" required />
              </label>
              <label className="sm:col-span-2">
                <span className="field-label">หัวข้อ</span>
                <select className="field-input" name="topic" defaultValue="" required>
                  <option value="" disabled>
                    เลือกหัวข้อที่ต้องการติดต่อ
                  </option>
                  {quickTopics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="field-label">ข้อความ</span>
                <textarea
                  className="field-input min-h-[150px] resize-y"
                  name="message"
                  placeholder="เล่ารายละเอียดปัญหา หรือสิ่งที่ต้องการให้ทีมงานช่วยดู"
                  required
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {sent ? (
                <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">
                  รับข้อความแล้ว ทีมงานจะติดต่อกลับโดยเร็ว
                </p>
              ) : (
                <p className="text-sm text-slate-500">ข้อมูลของคุณจะถูกใช้เพื่อการติดต่อกลับเท่านั้น</p>
              )}
              <button type="submit" className="btn-primary min-h-11 sm:ml-auto">
                <Send size={16} />
                ส่งข้อความ
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <div className="grid gap-4 lg:grid-cols-3">
          {contactChannels.map((item) => {
            const Icon = item.icon
            const content = (
              <>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Icon size={20} />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm font-semibold text-slate-700">{item.value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              </>
            )

            return item.href ? (
              <a key={item.title} href={item.href} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
                {content}
              </a>
            ) : (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
                {content}
              </div>
            )
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/80 sm:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white text-slate-950">
                  <Sparkles size={20} />
                </div>
                <h2 className="mt-5 text-2xl font-semibold">รองรับการช่วยเหลือด้าน AI ในระบบเรียน</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                  หากผู้เรียนพบปัญหากับการสรุปบทเรียน การถามตอบจากเนื้อหา Transcript หรือการสร้าง Quiz อัตโนมัติ สามารถส่งรายละเอียดมาให้ทีมตรวจสอบบทเรียนและสถานะ AI ได้ทันที
                </p>
              </div>
              <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-3 md:w-[360px] md:grid-cols-1">
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 p-3">
                  <BookOpenCheck className="shrink-0 text-emerald-300" size={18} />
                  <span>Lesson summary</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 p-3">
                  <MessageCircle className="shrink-0 text-cyan-300" size={18} />
                  <span>Content Q&A</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/10 p-3">
                  <CheckCircle2 className="shrink-0 text-emerald-300" size={18} />
                  <span>Auto Quiz</span>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
            <h2 className="text-lg font-semibold text-slate-950">ข้อมูลบริการ</h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 shrink-0 text-slate-950" size={18} />
                <div>
                  <p className="font-semibold text-slate-950">เวลาตอบกลับ</p>
                  <p>จันทร์-ศุกร์ ภายใน 1 วันทำการ</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 shrink-0 text-slate-950" size={18} />
                <div>
                  <p className="font-semibold text-slate-950">พื้นที่ให้บริการ</p>
                  <p>รองรับผู้เรียนและผู้สอนผ่านระบบออนไลน์</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Headphones className="mt-0.5 shrink-0 text-slate-950" size={18} />
                <div>
                  <p className="font-semibold text-slate-950">ช่องทางหลัก</p>
                  <p>อีเมลและแบบฟอร์มติดต่อในหน้านี้</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="container-page grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">ก่อนส่งข้อความ ควรเตรียมอะไรบ้าง?</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              รายละเอียดที่ครบจะช่วยให้ทีมงานตรวจสอบได้เร็วขึ้น โดยเฉพาะปัญหาที่เกี่ยวกับบทเรียน วิดีโอ และระบบ AI
            </p>
          </div>
          <div className="grid gap-3">
            {supportSteps.map((step, index) => (
              <div key={step} className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm font-medium leading-6 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
