'use client'
import Navbar from '@/app/components/Navbar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* El margen superior (mt-14) y el inferior (mb-16) evitan que el contenido se tape */}
      <main className="pt-14 pb-20 px-4">
        <div className="max-w-md mx-auto py-4">
          {children}
        </div>
      </main>
    </div>
  )
}