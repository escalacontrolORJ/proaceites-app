'use client'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const menu = [
    { n: 'Dashboard', p: '/admin/dashboard', i: '📊' },
    { n: 'Usuarios', p: '/admin/usuarios', i: '👥' },
    { n: 'Marcas', p: '/admin/asistencia', i: '⏱️' },
    { n: 'Reportes', p: '/admin/reportes', i: '📁' }
  ]

  return (
    <div style={{ minHeight: '100-screen', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <header style={{ backgroundColor: '#1d4ed8', color: 'white', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <span style={{ fontWeight: 'bold' }}>PROACEITES ADMIN</span>
        <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
          SALIR
        </button>
      </header>

      {/* CONTENIDO */}
      <main style={{ flex: 1, padding: '20px', paddingBottom: '100px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* NAVEGACIÓN INFERIOR */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', height: '80px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: '1px solid #e5e7eb', zIndex: 50, boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
        {menu.map((item) => (
          <button 
            key={item.p} 
            onClick={() => router.push(item.p)}
            style={{ border: 'none', background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '4px', color: pathname === item.p ? '#1d4ed8' : '#9ca3af' }}
          >
            <span style={{ fontSize: '24px' }}>{item.i}</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{item.n.toUpperCase()}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}