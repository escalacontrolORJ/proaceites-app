'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function PaginaPrincipal() {
  useEffect(() => {
    async function redireccionar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        window.location.href = '/admin/dashboard'
      } else {
        window.location.href = '/login'
      }
    }
    redireccionar()
  }, [])

  return (
    <div style={{ backgroundColor: '#facc15', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid black', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <h1 style={{ fontWeight: '900', color: 'black', marginTop: '20px' }}>PROACEITES V2</h1>
      <p style={{ fontWeight: 'bold', color: 'black', opacity: 0.6 }}>Sincronizando archivos nuevos...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}