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

      // Revisar si ya marcó entrada hoy en este dispositivo
      const estadoLocal = localStorage.getItem('asistencia_estado')
      if (estadoLocal === 'INGRESO_REALIZADO') setYaEntro(true)
      
      setLoading(false)
      iniciarSensores()
    }
    protegerRuta()
  }, [])

  const handleSignOut = async () => {
    const confirmar = confirm("¿Estás seguro que deseas cerrar sesión?")
    if (!confirmar) return
    await supabase.auth.signOut()
    localStorage.removeItem('asistencia_estado')
    router.replace('/login')
  }

  const iniciarSensores = async () => {
    setStatus('Configurando Cámara y GPS... ⏳')
    
    // 1. Iniciar Cámara Frontal
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraReady(true)
      }
    } catch (err) {
      console.error("Error cámara:", err)
      setStatus('ERROR: Activa la cámara 📸')
    }

    // 2. Iniciar GPS con paciencia (Solución al error inmediato)
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
        console.error("Error GPS:", err)
        if (err.code === 1) {
          setStatus('ERROR: Permiso de GPS denegado ⚠️')
        } else if (err.code === 3) {
          setStatus('ERROR: Tiempo de espera agotado ⚠️')
        } else {
          setStatus('ERROR: Activa el GPS ⚠️')
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, // Damos 15 segundos para que el usuario acepte el permiso
        maximumAge: 0 
      }
    )
  }

  const capturarYEnviar = async (tipo: 'INGRESO' | 'SALIDA') => {
    if (!gpsReady || !cameraReady) {
      alert("Espera a que los sensores estén listos (Cámara y GPS).")
      return
    }

    setLoading(true)
    setStatus(`Guardando ${tipo}...`)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return

      // Configurar tamaño de captura
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      
      // Convertir a imagen real para el Storage
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.7))
      if (!blob) throw new Error("No se pudo capturar la foto")

      const fileName = `${tipo.toLowerCase()}_${Date.now()}.jpg`
      
      // Subir al Bucket de Supabase
      const { error: storageError } = await supabase.storage
        .from('fotos_asistencia')
        .upload(fileName, blob)

      if (storageError) throw storageError
      
      const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)

      const { data: { session } } = await supabase.auth.getSession()
      const hoy = new Date().toISOString().split('T')[0]

      if (tipo === 'INGRESO') {
        const { error } = await supabase.from('asistencia').insert([{
          empleado_id: session?.user.id,
          fecha: hoy,
          hora_ingreso: new Date().toLocaleTimeString(),
          foto_ingreso: publicUrl,
          ubicacion_ingreso: coords
        }])
        if (error) throw error
        setYaEntro(true)
        localStorage.setItem('asistencia_estado', 'INGRESO_REALIZADO')
      } else {
        const { error } = await supabase.from('asistencia').update({
          hora_salida: new Date().toLocaleTimeString(),
          foto_salida: publicUrl,
          ubicacion_salida: coords
        }).match({ empleado_id: session?.user.id, fecha: hoy })
        
        if (error) throw error
        setYaEntro(false)
        localStorage.removeItem('asistencia_estado')
      }

      alert(`${tipo} registrado correctamente ✅`)
      setStatus('✅ Listo')
    } catch (error: any) {
      alert("Error crítico: " + error.message)
      setStatus('❌ Fallo al guardar')
    } finally {
      setLoading(false)
    }
  }

  if (loading && status === 'Iniciando...') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white font-black italic animate-pulse text-xl">PROACEITES...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      {/* HEADER */}
      <div className="w-full max-w-sm flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter">ASISTENCIA</h1>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${gpsReady ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
            {status}
          </p>
        </div>
        <button 
          onClick={handleSignOut}
          className="bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white text-[10px] font-black px-4 py-2 rounded-full transition-all border border-rose-500/50"
        >
          SALIR
        </button>
      </div>

      {/* CÁMARA */}
      <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-[40px] overflow-hidden border-2 border-slate-800 shadow-2xl mb-8">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Indicador visual si falta el GPS */}
        {!gpsReady && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-10 text-center">
            <p className="text-xs font-bold text-amber-400 uppercase leading-relaxed">
              Por favor acepta el permiso de ubicación <br/> para habilitar el botón
            </p>
          </div>
        )}
      </div>

      {/* BOTONES */}
      <div className="w-full max-w-sm space-y-4">
        {!yaEntro ? (
          <button 
            onClick={() => capturarYEnviar('INGRESO')} 
            disabled={!gpsReady || !cameraReady || loading} 
            className="w-full bg-emerald-500 p-8 rounded-[30px] font-black text-xl active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-20 disabled:grayscale"
          >
            {loading ? 'ENVIANDO...' : '📸 MARCAR ENTRADA'}
          </button>
        ) : (
          <button 
            onClick={() => capturarYEnviar('SALIDA')} 
            disabled={!gpsReady || !cameraReady || loading} 
            className="w-full bg-rose-500 p-8 rounded-[30px] font-black text-xl active:scale-95 transition-all shadow-xl shadow-rose-500/20 disabled:opacity-20 disabled:grayscale"
          >
            {loading ? 'ENVIANDO...' : '🏁 MARCAR SALIDA'}
          </button>
        )}
        
        <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest">
          Proaceites App v2.0 • GPS High Accuracy
        </p>
      </div>
    </div>
  )
}