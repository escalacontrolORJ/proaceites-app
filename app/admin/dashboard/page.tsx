'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [gpsReady, setGpsReady] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [coords, setCoords] = useState('')
  const [yaEntro, setYaEntro] = useState(false) // Control de botones
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  useEffect(() => {
    // 1. Revisar si ya marcó entrada hoy en este teléfono
    const estadoLocal = localStorage.getItem('asistencia_estado')
    if (estadoLocal === 'INGRESO_REALIZADO') {
      setYaEntro(true)
    }
    
    iniciarSensores()
  }, [])

  async function iniciarSensores() {
    // GPS más agresivo
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`)
          setGpsReady(true)
        },
        () => alert("Error: Activa el GPS y recarga"),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }

    // Cámara
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
      console.error("Error cámara", err)
    }
  }

  const capturarYEnviar = async (tipo: 'INGRESO' | 'SALIDA') => {
    if (!gpsReady || !cameraReady) return
    setLoading(true)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      
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

      // LÓGICA DE BLOQUEO:
      if (tipo === 'INGRESO') {
        localStorage.setItem('asistencia_estado', 'INGRESO_REALIZADO')
        setYaEntro(true)
        alert("✅ INGRESO REGISTRADO. Ahora puede registrar visitas.")
        router.push('/admin/asistencia')
      } else {
        localStorage.removeItem('asistencia_estado') // Reset para el día siguiente
        setYaEntro(false)
        alert("✅ SALIDA REGISTRADA. Jornada finalizada.")
        window.location.reload() // Recargar para limpiar todo
      }

    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center font-sans">
      <h1 className="text-3xl font-black italic mb-2 tracking-tighter">PROACEITES</h1>
      <p className="text-[10px] text-blue-400 font-bold tracking-[3px] mb-6 uppercase">
        {yaEntro ? 'Estado: En Jornada' : 'Estado: Pendiente Ingreso'}
      </p>

      {/* VISOR DE CÁMARA */}
      <div className="relative w-full max-w-sm aspect-[3/4] bg-slate-900 rounded-[30px] overflow-hidden border-2 border-slate-800 shadow-2xl mb-8">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute top-4 right-4 flex gap-2">
            <div className={`px-3 py-1 rounded-full text-[9px] font-black ${gpsReady ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}>
                GPS {gpsReady ? 'LISTO' : 'BUSCANDO'}
            </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Solo mostramos Ingreso si NO ha entrado */}
        {!yaEntro ? (
          <button 
            onClick={() => capturarYEnviar('INGRESO')}
            disabled={!gpsReady || !cameraReady || loading}
            className="w-full bg-emerald-500 p-8 rounded-[30px] font-black uppercase text-xl shadow-lg shadow-emerald-500/20 disabled:opacity-20 transition-all active:scale-95"
          >
            {loading ? 'REGISTRANDO...' : '🚀 MARCAR INGRESO'}
          </button>
        ) : (
          /* Solo mostramos Salida si YA entró */
          <button 
            onClick={() => capturarYEnviar('SALIDA')}
            disabled={!gpsReady || !cameraReady || loading}
            className="w-full bg-rose-500 p-8 rounded-[30px] font-black uppercase text-xl shadow-lg shadow-rose-500/20 disabled:opacity-20 transition-all active:scale-95"
          >
            {loading ? 'REGISTRANDO...' : '🏁 MARCAR SALIDA'}
          </button>
        )}
      </div>

      {yaEntro && (
        <button 
          onClick={() => router.push('/admin/asistencia')}
          className="mt-8 text-blue-400 font-bold uppercase text-xs tracking-widest border-b border-blue-400/30 pb-1"
        >
          Ir a Registro de Clientes →
        </button>
      )}
    </div>
  )
}