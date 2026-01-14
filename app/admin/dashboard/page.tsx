'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [gpsReady, setGpsReady] = useState(false)
  const [coords, setCoords] = useState('Buscando...')
  const router = useRouter()

  // EFECTO INICIAL: Activa el GPS apenas entra el usuario
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`)
          setGpsReady(true)
        },
        (err) => {
          console.error("Error GPS:", err)
          alert("Por favor, activa el GPS para que la app funcione correctamente.")
        },
        { enableHighAccuracy: true }
      )
    }
  }, [])

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'INGRESO' | 'SALIDA') => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      // 1. Usamos las coordenadas que ya capturamos al entrar (o pedimos unas nuevas rápido)
      let finalCoords = coords
      if (!gpsReady) {
        const pos: any = await new Promise((res) => {
          navigator.geolocation.getCurrentPosition(res, () => res(null), { timeout: 2000 })
        })
        if (pos) finalCoords = `${pos.coords.latitude}, ${pos.coords.longitude}`
      }

      // 2. Subir Foto
      const fileName = `${Date.now()}_${tipo}.jpg`
      const { error: upErr } = await supabase.storage
        .from('fotos_asistencia')
        .upload(fileName, file)

      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)

      // 3. Guardar Registro
      const { data: { session } } = await supabase.auth.getSession()
      const { error: dbError } = await supabase.from('asistencia').insert([{ 
        usuario_id: session?.user.id,
        tipo,
        coordenadas: finalCoords,
        foto_url: publicUrl,
        fecha: new Date().toISOString()
      }])

      if (dbError) throw dbError

      alert(`✅ ${tipo} registrado con éxito`)
      if (tipo === 'INGRESO') router.push('/admin/asistencia')
      
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col justify-center items-center">
      <div className="mb-12 text-center">
        <h1 className="text-white text-4xl font-black uppercase tracking-tighter italic">Proaceites</h1>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${gpsReady ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
          <p className="text-blue-400 font-bold text-[9px] uppercase tracking-[3px]">
            {gpsReady ? 'GPS Sincronizado' : 'Activando Sensores...'}
          </p>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-8">
        {/* BOTÓN INGRESO (Activa cámara al toque) */}
        <label className="w-full bg-emerald-600 text-white p-10 rounded-[45px] shadow-2xl flex flex-col items-center cursor-pointer active:scale-95 transition-all border-b-8 border-emerald-800">
          <span className="text-5xl mb-2">📸</span>
          <span className="text-2xl font-black uppercase">Ingreso</span>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" // Esto fuerza la cámara en celulares
            className="hidden" 
            onChange={(e) => handleCapture(e, 'INGRESO')} 
          />
        </label>

        {/* BOTÓN SALIDA */}
        <label className="w-full bg-rose-600 text-white p-10 rounded-[45px] shadow-2xl flex flex-col items-center cursor-pointer active:scale-95 transition-all border-b-8 border-rose-800">
          <span className="text-5xl mb-2">🏁</span>
          <span className="text-2xl font-black uppercase">Salida</span>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            onChange={(e) => handleCapture(e, 'SALIDA')} 
          />
        </label>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-white font-bold uppercase text-xs animate-pulse">Enviando a base de datos...</p>
        </div>
      )}
    </div>
  )
}