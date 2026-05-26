import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function MainLayout() {
  const location = useLocation()
  const isLearningPage = location.pathname.startsWith('/learn/')
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  if (isLearningPage) {
    return <Outlet />
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Outlet />
      </main>
      {isAuthPage ? null : (
        <footer className="border-t border-zinc-100 bg-zinc-50">
          <div className="container-page grid gap-10 py-12 text-sm text-zinc-500 md:grid-cols-[1.3fr_0.5fr_0.5fr_0.8fr_1fr]">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] bg-black text-white">
                ▮▮
              </span>
              <p>เรียนรู้วันนี้ มีผู้ช่วยAI</p>
            </div>
            <div>
              <p className="font-bold text-black">Company</p>
              <div className="mt-4 space-y-2">
                <p>ติดต่อเรา 000</p>
                <p>สามารถสนับสนุนเราได้ที่นี่</p>
                <p></p>
              </div>
            </div>
            <div>
              <p className="font-bold text-black">Support</p>
              <div className="mt-4 space-y-2">
                <p>ศูนย์บริการลูกค้า</p>
                <p>สามารถติดต่อสอบถาม</p>
              </div>
            </div>
            <div>
              <p className="font-bold text-black">Follow Us</p>
              <div className="mt-4 flex gap-4 text-black">
                <span className="font-bold">f</span>
                <span className="font-bold">𝕏</span>
                <span className="font-bold">◎</span>
                <span className="font-bold">▶</span>
              </div>
            </div>
            <p className="self-end md:text-right">© 2024 LearnPro. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  )
}
