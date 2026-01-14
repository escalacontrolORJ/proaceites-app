'use client'
import Navbar from '@/app/components/Navbar' // Importamos tu componente Navbar

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* El Navbar fijo a la izquierda */}
      <div className="w-64 flex-shrink-0">
        <Navbar />
      </div>

      {/* El contenido de las páginas (Dashboard, Usuarios, etc.) */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}