'use client'
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [gpsReady, setGpsReady] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [coords, setCoords] = useState('')
  const [yaEntro, setYaEntro] = useState(false)
  const [status, setStatus] = useState('Iniciando...')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  useEffect(() => {
    const protegerRuta = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      const estadoLocal = localStorage.getItem('asistencia_estado')
      if (estadoLocal === 'INGRESO_REALIZADO') setYaEntro(true)
      setLoading(false)
      iniciarSensores()
    }
    protegerRuta()
  }, [])

  const handleSignOut = async () => {
    if (!confirm("¿Cerrar sesión?")) return
    await supabase.auth.signOut()
    localStorage.removeItem('asistencia_estado')
    router.replace('/login')
  }

  const iniciarSensores = async () => {
    setGpsReady(false)
    setStatus('Buscando señal GPS... 📡')
    
    // Cámara
    try {
      if (!cameraReady) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setCameraReady(true)
        }
      }
    } catch (err) {
      setStatus('ERROR: Activa la cámara 📸')
    }

    // GPS con lógica de reintento y menor timeout inicial
    if (!navigator.geolocation) {
      setStatus('GPS no soportado')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`)
        setGpsReady(true)
        setStatus('✅ SISTEMA LISTO')
      },
      (err) => {
        console.error("Error GPS detallado:", err)
        if (err.code === 1) {
          setStatus('ERROR: Permiso denegado ⚠️')
        } else if (err.code === 3) {
          setStatus('ERROR: Tiempo agotado. ¿Estás bajo techo? 🏠')
        } else {
          setStatus('ERROR: GPS no disponible ⚠️')
        }
      },
      { 
        enableHighAccuracy: false, // Bajamos la precisión inicial para conectar rápido
        timeout: 10000, 
        maximumAge: 0 
      }
    )
  }

  const capturarYEnviar = async (tipo: 'INGRESO' | 'SALIDA') => {
    if (!gpsReady || !cameraReady) return
    setLoading(true)
    setStatus(`Guardando ${tipo}...`)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.7))
      if (!blob) throw new Error("Error al capturar foto")

      const fileName = `${tipo.toLowerCase()}_${Date.now()}.jpg`
      await supabase.storage.from('fotos_asistencia').upload(fileName, blob)
      const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)

      const { data: { session } } = await supabase.auth.getSession()
      const hoy = new Date().toISOString().split('T')[0]

      if (tipo === 'INGRESO') {
        await supabase.from('asistencia').insert([{
          empleado_id: session?.user.id,
          fecha: hoy,
          hora_ingreso: new Date().toLocaleTimeString(),
          foto_ingreso: publicUrl,
          ubicacion_ingreso: coords
        }])
        setYaEntro(true)
        localStorage.setItem('asistencia_estado', 'INGRESO_REALIZADO')
      } else {
        await supabase.from('asistencia').update({
          hora_salida: new Date().toLocaleTimeString(),
          foto_salida: publicUrl,
          ubicacion_salida: coords
        }).match({ empleado_id: session?.user.id, fecha: hoy })
        setYaEntro(false)
        localStorage.removeItem('asistencia_estado')
      }
      alert(`${tipo} registrado ✅`)
      setStatus('✅ Listo')
    } catch (error: any) {
      alert("Error: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && status === 'Iniciando...') return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">PROACEITES...</div>

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      <div className="w-full max-w-sm flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-emerald-500">PROACEITES</h1>
          <p className={`text-[10px] font-bold uppercase ${gpsReady ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
            {status}
          </p>
        </div>
        <button onClick={handleSignOut} className="bg-rose-500/20 text-rose-500 text-[10px] font-black px-4 py-2 rounded-full border border-rose-500/50">SALIR</button>
      </div>

      <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-[40px] overflow-hidden border-2 border-slate-800 shadow-2xl mb-8">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
        <canvas ref={canvasRef} className="hidden" />
        
        {!gpsReady && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-xs font-bold text-amber-400 uppercase mb-4 leading-relaxed">
              {status}
            </p>
            {status.includes('ERROR') && (
              <button 
                onClick={iniciarSensores}
                className="bg-white text-black text-[10px] font-black px-6 py-3 rounded-full hover:bg-emerald-400 transition-colors"
              >
                🔄 REINTENTAR CONEXIÓN
              </button>
            )}
          </div>
        )}
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button 
          onClick={() => capturarYEnviar(yaEntro ? 'SALIDA' : 'INGRESO')} 
          disabled={!gpsReady || loading} 
          className={`w-full p-8 rounded-[30px] font-black text-xl transition-all shadow-xl disabled:opacity-10 ${yaEntro ? 'bg-rose-500 shadow-rose-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}
        >
          {loading ? 'ENVIANDO...' : yaEntro ? '🏁 MARCAR SALIDA' : '📸 MARCAR ENTRADA'}
        </button>
      </div>
    </div>
  )
}