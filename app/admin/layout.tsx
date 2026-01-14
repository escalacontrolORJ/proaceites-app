'use client'
import Navbar from '@/app/components/Navbar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Header fijo solo con el Logo */}
      <div className="h-16 bg-white/80 backdrop-blur-md px-6 flex items-center border-b border-gray-100 sticky top-0 z-40">
        <span className="text-lg font-black tracking-tighter text-blue-600">PROACEITES</span>
      </div>

      <main className="flex-1 px-6 pt-6 pb-32">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>

      <Navbar />
    </div>
  )
}