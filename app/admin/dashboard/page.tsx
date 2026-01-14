'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('Iniciando sensores...')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tipoSeleccionado, setTipoSeleccionado] = useState<'INGRESO' | 'SALIDA' | null>(null)
  const router = useRouter()

  // 1. PEDIR GPS AL ENTRAR (FORZADO)
  useEffect(() => {
    const pedirPermisos = () => {
      navigator.geolocation.getCurrentPosition(
        () => setStatus('GPS LISTO ✅'),
        () => setStatus('ACTIVA TU GPS ⚠️'),
        { enableHighAccuracy: true }
      )
    }
    pedirPermisos()
  }, [])

  const handleBotonClick = (tipo: 'INGRESO' | 'SALIDA') => {
    setTipoSeleccionado(tipo)
    // Forzamos el clic en el input oculto
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tipoSeleccionado) return

    setLoading(true)
    try {
      // Obtener coordenadas en el momento exacto
      const pos: any = await new Promise((res) => {
        navigator.geolocation.getCurrentPosition(res, () => res({coords:{latitude:0, longitude:0}}))
      })
      
      const coords = `${pos.coords.latitude}, ${pos.coords.longitude}`
      const fileName = `${Date.now()}_${tipoSeleccionado}.jpg`

      // Subir a Storage
      const { error: upErr } = await supabase.storage.from('fotos_asistencia').upload(fileName, file)
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)

      // Guardar DB
      const { data: { session } } = await supabase.auth.getSession()
      await supabase.from('asistencia').insert([{ 
        usuario_id: session?.user.id,
        tipo: tipoSeleccionado,
        coordenadas: coords,
        foto_url: publicUrl,
        fecha: new Date().toISOString()
      }])

      alert(`REGISTRO DE ${tipoSeleccionado} EXITOSO`)
      if (tipoSeleccionado === 'INGRESO') router.push('/admin/asistencia')
      
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
      setTipoSeleccionado(null)
    }
  }

  return (
    <div className="min-h-screen bg-black p-6 flex flex-col justify-center items-center text-white">
      <h1 className="text-4xl font-black mb-2 italic">PROACEITES</h1>
      <p className="text-[10px] tracking-[4px] mb-12 text-blue-500 font-bold uppercase">{status}</p>

      {/* INPUT OCULTO CON CAPTURE FORZADO */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef}
        className="hidden" 
        onChange={handleCapture}
      />

      <div className="w-full space-y-6 max-w-xs">
        <button 
          onClick={() => handleBotonClick('INGRESO')}
          className="w-full bg-green-600 p-10 rounded-3xl text-2xl font-black uppercase shadow-[0_0_30px_rgba(22,163,74,0.4)]"
        >
          📷 INGRESO
        </button>

        <button 
          onClick={() => handleBotonClick('SALIDA')}
          className="w-full bg-red-600 p-10 rounded-3xl text-2xl font-black uppercase shadow-[0_0_30px_rgba(220,38,38,0.4)]"
        >
          🏁 SALIDA
        </button>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center text-center">
          <p className="font-black text-2xl animate-bounce">SUBIENDO DATOS...</p>
        </div>
      )}
    </div>
  )
}