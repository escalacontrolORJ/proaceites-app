'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [gpsReady, setGpsReady] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [coords, setCoords] = useState('')
  const [yaEntro, setYaEntro] = useState(false)
  const [status, setStatus] = useState('Iniciando sensores...')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  useEffect(() => {
    // 1. Verificar si ya marcó entrada hoy en este dispositivo
    const estadoLocal = localStorage.getItem('asistencia_estado')
    if (estadoLocal === 'INGRESO_REALIZADO') {
      setYaEntro(true)
    }
    
    iniciarSensores()
  }, [])

  async function iniciarSensores() {
    // Iniciar GPS
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        (pos) => {
          setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`)
          setGpsReady(true)
          setStatus('SISTEMA LISTO ✅')
        },
        (err) => {
          setStatus('ERROR: ACTIVA GPS ⚠️')
          console.error(err)
        },
        { enableHighAccuracy: true }
      )
    }

    // Iniciar Cámara
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
      setStatus('ERROR: PERMISO CÁMARA ⚠️')
    }
  }

  const capturarYEnviar = async (tipo: 'INGRESO' | 'SALIDA') => {
    if (!gpsReady || !cameraReady) return
    setLoading(true)
    setStatus('PROCESANDO...')

    try {
      // Tomar foto del stream de video
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.8))
      if (!blob) return

      // Subir a Storage
      const fileName = `${Date.now()}_${tipo}.jpg`
      const { error: upErr } = await supabase.storage.from('fotos_asistencia').upload(fileName, blob)
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)
      const { data: { session } } = await supabase.auth.getSession()
      const hoy = new Date().toISOString().split('T')[0]
      const ahora = new Date().toLocaleTimeString()

      if (tipo === 'INGRESO') {
        // INSERTAR REGISTRO NUEVO (Crea la fila con datos de entrada)
        const { error: dbError } = await supabase.from('asistencia').insert([{ 
          empleado_id: session?.user.id,
          fecha: hoy,
          hora_ingreso: ahora,
          foto_ingreso: publicUrl,
          ubicacion_ingreso: coords,
          // Compatibilidad con columnas antiguas encontradas en el CSV
          tipo_registro: 'ingreso',
          foto: publicUrl,
          geolocalizacion: coords,
          fecha_hora: new Date().toISOString()
        }])

        if (dbError) throw dbError

        localStorage.setItem('asistencia_estado', 'INGRESO_REALIZADO')
        setYaEntro(true)
        alert("✅ INGRESO REGISTRADO EXITOSAMENTE")
        router.push('/admin/asistencia')
      } else {
        // ACTUALIZAR REGISTRO DE HOY (Completa la misma fila con datos de salida)
        const { error: dbError } = await supabase.from('asistencia')
          .update({ 
            hora_salida: ahora,
            foto_salida: publicUrl,
            ubicacion_salida: coords,
            tipo_registro: 'salida' // Actualiza el estado para reportes viejos
          })
          .eq('empleado_id', session?.user.id)
          .eq('fecha', hoy)

        if (dbError) throw dbError

        localStorage.removeItem('asistencia_estado')
        setYaEntro(false)
        alert("✅ SALIDA REGISTRADA. JORNADA FINALIZADA")
        window.location.reload()
      }

    } catch (err: any) {
      alert("Error crítico: " + err.message)
    } finally {
      setLoading(false)
      setStatus('SISTEMA LISTO ✅')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-black italic tracking-tighter text-white">PROACEITES</h1>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${gpsReady && cameraReady ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-[10px] font-bold uppercase tracking-[3px] text-blue-400">{status}</span>
        </div>
      </header>

      {/* VISOR DE CÁMARA */}
      <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-[40px] overflow-hidden border-2 border-slate-800 shadow-2xl mb-8">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* OVERLAY DE ESTADO */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold">
                📍 {coords || 'Buscando satélite...'}
            </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {!yaEntro ? (
          <button 
            onClick={() => capturarYEnviar('INGRESO')}
            disabled={!gpsReady || !cameraReady || loading}
            className="w-full bg-emerald-500 p-8 rounded-[35px] font-black uppercase text-xl shadow-xl shadow-emerald-500/20 disabled:opacity-20 active:scale-95 transition-all"
          >
            {loading ? 'REGISTRANDO...' : '🚀 MARCAR INGRESO'}
          </button>
        ) : (
          <button 
            onClick={() => capturarYEnviar('SALIDA')}
            disabled={!gpsReady || !cameraReady || loading}
            className="w-full bg-rose-500 p-8 rounded-[35px] font-black uppercase text-xl shadow-xl shadow-rose-500/20 disabled:opacity-20 active:scale-95 transition-all"
          >
            {loading ? 'REGISTRANDO...' : '🏁 MARCAR SALIDA'}
          </button>
        )}
      </div>

      {yaEntro && (
        <button 
          onClick={() => router.push('/admin/asistencia')}
          className="mt-10 text-blue-400 font-bold uppercase text-xs tracking-widest border-b border-blue-400/20 pb-2"
        >
          Gestionar Clientes →
        </button>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-6 font-black text-xl animate-pulse tracking-tighter">SINCRONIZANDO...</p>
        </div>
      )}
    </div>
  )
}