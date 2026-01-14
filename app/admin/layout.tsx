'use client'
import Navbar from '@/app/components/Navbar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Contenido principal con margen arriba y abajo para que no se tape */}
      <main className="pt-20 pb-24 px-4 max-w-md mx-auto">
        {children}
      </main>
    </div>
  )
}