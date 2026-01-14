'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [gpsReady, setGpsReady] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [coords, setCoords] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  useEffect(() => {
    iniciarSensores()
  }, [])

  async function iniciarSensores() {
    // 1. Iniciar GPS
    navigator.geolocation.watchPosition(
      (pos) => {
        setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`)
        setGpsReady(true)
      },
      () => alert("Por favor activa el GPS"),
      { enableHighAccuracy: true }
    )

    // 2. Iniciar Cámara en vivo
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, 
        audio: false 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraReady(true)
      }
    } catch (err) {
      alert("Error al acceder a la cámara. Asegúrate de dar permisos.")
    }
  }

  const capturarYEnviar = async (tipo: 'INGRESO' | 'SALIDA') => {
    if (!gpsReady || !cameraReady) return
    setLoading(true)

    try {
      // Capturar foto del video
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      
      // Convertir a archivo
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.8))
      if (!blob) return

      const fileName = `${Date.now()}_${tipo}.jpg`
      const { error: upErr } = await supabase.storage.from('fotos_asistencia').upload(fileName, blob)
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)

      const { data: { session } } = await supabase.auth.getSession()
      await supabase.from('asistencia').insert([{ 
        usuario_id: session?.user.id,
        tipo,
        coordenadas: coords,
        foto_url: publicUrl,
        fecha: new Date().toISOString()
      }])

      alert(`✅ ${tipo} registrado con éxito`)
      if (tipo === 'INGRESO') router.push('/admin/asistencia')
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      <h1 className="text-2xl font-black italic mb-4">PROACEITES PRO</h1>

      {/* VISOR DE CÁMARA EN VIVO */}
      <div className="relative w-full max-w-sm aspect-square bg-slate-900 rounded-[40px] overflow-hidden border-4 border-slate-800 shadow-2xl">
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-bold animate-pulse">
            ESPERANDO CÁMARA...
          </div>
        )}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={`w-full h-full object-cover ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* INDICADOR GPS SOBRE EL VIDEO */}
        <div className="absolute top-4 left-4">
          <div className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2 ${gpsReady ? 'bg-green-500 text-white' : 'bg-red-500 animate-pulse'}`}>
             <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
             {gpsReady ? 'GPS ACTIVO' : 'BUSCANDO GPS'}
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm mt-8 space-y-4">
        <button 
          onClick={() => capturarYEnviar('INGRESO')}
          disabled={!gpsReady || !cameraReady || loading}
          className="w-full bg-emerald-500 p-6 rounded-3xl font-black uppercase text-xl disabled:opacity-20 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
        >
          {loading ? 'PROCESANDO...' : '🚀 MARCAR INGRESO'}
        </button>

        <button 
          onClick={() => capturarYEnviar('SALIDA')}
          disabled={!gpsReady || !cameraReady || loading}
          className="w-full bg-rose-500 p-6 rounded-3xl font-black uppercase text-xl disabled:opacity-20 active:scale-95 transition-all shadow-lg shadow-rose-500/20"
        >
          {loading ? 'PROCESANDO...' : '🏁 MARCAR SALIDA'}
        </button>
      </div>

      <p className="mt-6 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
        Ubicación: {coords || 'Verificando...'}
      </p>
    </div>
  )
}