'use client'
import React, { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'INGRESO' | 'SALIDA') => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      // 1. Obtener GPS (con tiempo límite de 5 segundos)
      const position: any = await new Promise((res) => {
        navigator.geolocation.getCurrentPosition(res, () => res({coords:{latitude:0, longitude:0}}), { 
          enableHighAccuracy: true, timeout: 5000 
        })
      })
      const coords = `${position.coords.latitude}, ${position.coords.longitude}`

      // 2. Subir Foto
      const fileName = `${Date.now()}_${tipo}.jpg`
      const { data: upData, error: upErr } = await supabase.storage
        .from('fotos_asistencia')
        .upload(fileName, file)

      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)

      // 3. Guardar en Base de Datos
      const { data: { session } } = await supabase.auth.getSession()
      await supabase.from('asistencia').insert([{ 
        usuario_id: session?.user.id,
        tipo,
        coordenadas: coords,
        foto_url: publicUrl,
        fecha: new Date().toISOString()
      }])

      alert("✅ Registro guardado con éxito")
      if (tipo === 'INGRESO') router.push('/admin/asistencia')
      
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
      // Limpiar el input para permitir otra captura si falla
      e.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 flex flex-col justify-center items-center font-sans">
      <div className="mb-12 text-center">
        <h1 className="text-white text-5xl font-black uppercase tracking-tighter">Proaceites</h1>
        <p className="text-blue-400 font-bold text-xs tracking-[4px] mt-2 italic text-center w-full">Registro de Campo</p>
      </div>

      <div className="w-full max-w-xs space-y-8">
        {/* BOTÓN INGRESO */}
        <div className="relative">
          <label className={`w-full bg-emerald-500 text-white p-10 rounded-[40px] shadow-2xl flex flex-col items-center cursor-pointer active:scale-95 transition-all ${loading ? 'opacity-50' : 'opacity-100'}`}>
            <span className="text-5xl mb-2">📸</span>
            <span className="text-2xl font-black uppercase">Ingreso</span>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              disabled={loading}
              onChange={(e) => handleCapture(e, 'INGRESO')} 
            />
          </label>
        </div>

        {/* BOTÓN SALIDA */}
        <div className="relative">
          <label className={`w-full bg-rose-500 text-white p-10 rounded-[40px] shadow-2xl flex flex-col items-center cursor-pointer active:scale-95 transition-all ${loading ? 'opacity-50' : 'opacity-100'}`}>
            <span className="text-5xl mb-2">🏁</span>
            <span className="text-2xl font-black uppercase">Salida</span>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              disabled={loading}
              onChange={(e) => handleCapture(e, 'SALIDA')} 
            />
          </label>
        </div>
      </div>

      {loading && (
        <div className="mt-10 flex flex-col items-center">
          <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-blue-300 font-bold text-xs uppercase animate-pulse">Subiendo registro...</p>
        </div>
      )}
    </div>
  )
}