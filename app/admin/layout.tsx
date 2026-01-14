'use client'
import Navbar from '@/app/components/Navbar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <Navbar />

      {/* Área de Contenido con Espaciado Elegante */}
      <main className="flex-1 ml-72 p-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}