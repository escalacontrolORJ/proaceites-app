'use client'
import React, { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const iniciarProceso = (tipo: 'INGRESO' | 'SALIDA') => {
    setLoading(true)

    // 1. ABRIR CÁMARA PRIMERO (Acción directa del usuario para evitar bloqueos)
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'

    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) { setLoading(false); return; }

      try {
        // 2. PEDIR GPS MIENTRAS SE PROCESA LA FOTO
        const position: any = await new Promise((res, rej) => {
          navigator.geolocation.getCurrentPosition(res, rej, { 
            enableHighAccuracy: true,
            timeout: 5000 
          })
        }).catch(() => ({ coords: { latitude: 0, longitude: 0 } })) // Si falla GPS, guarda 0,0

        const coords = `${position.coords.latitude}, ${position.coords.longitude}`

        // 3. SUBIR A SUPABASE
        const fileName = `${Date.now()}_${tipo}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('fotos_asistencia')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('fotos_asistencia')
          .getPublicUrl(fileName)

        // 4. GUARDAR REGISTRO
        const { data: { session } } = await supabase.auth.getSession()
        const { error: dbError } = await supabase.from('asistencia').insert([
          { 
            usuario_id: session?.user.id,
            tipo: tipo,
            coordenadas: coords,
            foto_url: publicUrl,
            fecha: new Date().toISOString()
          }
        ])

        if (dbError) throw dbError
        
        alert(`✅ ${tipo} registrado con éxito`)
        if (tipo === 'INGRESO') router.push('/admin/asistencia')
        
      } catch (err: any) {
        alert("Error: " + err.message)
      } finally {
        setLoading(false)
      }
    }

    input.click()
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 flex flex-col justify-center items-center">
      <div className="mb-12 text-center">
        <h1 className="text-white text-5xl font-black uppercase tracking-tighter">Proaceites</h1>
        <p className="text-blue-400 font-bold text-xs tracking-[4px] mt-2">CONTROL DE ASISTENCIA</p>
      </div>

      <div className="w-full max-w-xs space-y-6">
        <button 
          onClick={() => iniciarProceso('INGRESO')}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white p-10 rounded-[40px] shadow-2xl flex flex-col items-center transition-all active:scale-90"
        >
          <span className="text-5xl mb-2">📸</span>
          <span className="text-2xl font-black uppercase">{loading ? '...' : 'Ingreso'}</span>
        </button>

        <button 
          onClick={() => iniciarProceso('SALIDA')}
          disabled={loading}
          className="w-full bg-rose-500 hover:bg-rose-400 text-white p-10 rounded-[40px] shadow-2xl flex flex-col items-center transition-all active:scale-90"
        >
          <span className="text-5xl mb-2">🏁</span>
          <span className="text-2xl font-black uppercase">{loading ? '...' : 'Salida'}</span>
        </button>
      </div>
      
      {loading && (
        <p className="mt-8 text-blue-300 font-bold animate-pulse text-sm uppercase">Procesando datos...</p>
      )}
    </div>
  )
}