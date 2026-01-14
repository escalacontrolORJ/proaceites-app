'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [gpsReady, setGpsReady] = useState(false)
  const [status, setStatus] = useState('Iniciando sensores...')
  const [coords, setCoords] = useState('')
  const [tipoSeleccionado, setTipoSeleccionado] = useState<'INGRESO' | 'SALIDA' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // 1. ACTIVACIÓN DE SENSORES AL ENTRAR
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus('GPS NO SOPORTADO')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`)
        setGpsReady(true)
        setStatus('SISTEMA LISTO ✅')
      },
      (err) => {
        setStatus('ERROR: ACTIVA EL GPS ⚠️')
        setGpsReady(false)
      },
      { enableHighAccuracy: true }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  const activarCaptura = (tipo: 'INGRESO' | 'SALIDA') => {
    if (!gpsReady) {
      alert("Esperando señal de GPS...")
      return
    }
    setTipoSeleccionado(tipo)
    // El clic solo se dispara si el GPS ya está listo
    fileInputRef.current?.click()
  }

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tipoSeleccionado) return

    setLoading(true)
    setStatus('SUBIENDO REGISTRO...')
    
    try {
      const fileName = `${Date.now()}_${tipoSeleccionado}.jpg`
      
      // Subir Foto
      const { error: upErr } = await supabase.storage
        .from('fotos_asistencia')
        .upload(fileName, file)

      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage
        .from('fotos_asistencia')
        .getPublicUrl(fileName)

      // Guardar en DB
      const { data: { session } } = await supabase.auth.getSession()
      const { error: dbError } = await supabase.from('asistencia').insert([{ 
        usuario_id: session?.user.id,
        tipo: tipoSeleccionado,
        coordenadas: coords,
        foto_url: publicUrl,
        fecha: new Date().toISOString()
      }])

      if (dbError) throw dbError

      alert(`✅ ${tipoSeleccionado} REGISTRADO CORRECTAMENTE`)
      if (tipoSeleccionado === 'INGRESO') router.push('/admin/asistencia')
      
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
      setTipoSeleccionado(null)
      setStatus('SISTEMA LISTO ✅')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col justify-center items-center text-white font-sans">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-black italic tracking-tighter mb-4">PROACEITES</h1>
        
        {/* INDICADOR DE ESTADO */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${gpsReady ? 'border-green-500 bg-green-500/10' : 'border-orange-500 bg-orange-500/10 animate-pulse'}`}>
          <div className={`w-2 h-2 rounded-full ${gpsReady ? 'bg-green-500' : 'bg-orange-500'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-[2px]">
            {status}
          </span>
        </div>
      </header>

      {/* INPUT OCULTO CON FILTROS DE CÁMARA ESTRUCTURADOS */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef}
        className="hidden" 
        onChange={handleCapture}
      />

      <div className="w-full max-w-xs space-y-6">
        <button 
          onClick={() => activarCaptura('INGRESO')}
          disabled={!gpsReady || loading}
          className={`w-full p-10 rounded-[40px] text-2xl font-black uppercase transition-all shadow-2xl
            ${gpsReady && !loading 
              ? 'bg-emerald-500 shadow-emerald-500/20 active:scale-90 border-b-8 border-emerald-700' 
              : 'bg-slate-800 text-slate-500 border-none opacity-50 cursor-not-allowed'}`}
        >
          📷 INGRESO
        </button>

        <button 
          onClick={() => activarCaptura('SALIDA')}
          disabled={!gpsReady || loading}
          className={`w-full p-10 rounded-[40px] text-2xl font-black uppercase transition-all shadow-2xl
            ${gpsReady && !loading 
              ? 'bg-rose-500 shadow-rose-500/20 active:scale-90 border-b-8 border-rose-700' 
              : 'bg-slate-800 text-slate-500 border-none opacity-50 cursor-not-allowed'}`}
        >
          🏁 SALIDA
        </button>
      </div>

      <p className="mt-12 text-slate-600 text-[9px] font-bold uppercase tracking-[4px]">
        {gpsReady ? `UBICACIÓN: ${coords}` : 'ESPERANDO COORDENADAS...'}
      </p>

      {loading && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-6 font-black text-xl animate-pulse">SINCRONIZANDO CON LA NUBE...</p>
        </div>
      )}
    </div>
  )
}