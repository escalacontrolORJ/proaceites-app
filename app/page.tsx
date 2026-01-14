'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    async function inicializarApp() {
      // Forzamos una limpieza de sesión antes de verificar
      const { data: { session } } = await supabase.auth.getSession()
      
      // Usamos replace con un parámetro aleatorio para romper la caché del navegador
      if (session) {
        window.location.replace('/admin/dashboard?v=' + Date.now())
      } else {
        window.location.replace('/login?v=' + Date.now())
      }
    }
    inicializarApp()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-blue-900 font-black uppercase text-xs tracking-widest">Actualizando Sistema v1.1</h2>
    </div>
  )
}