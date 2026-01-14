'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        router.push('/admin/dashboard')
      } else {
        router.push('/login') // Cambia '/login' por la ruta de tu pantalla de acceso
      }
    }
    checkUser()
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Redireccionando...</p>
    </div>
  )
}