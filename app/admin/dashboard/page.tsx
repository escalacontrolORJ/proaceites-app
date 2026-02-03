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
  const [status, setStatus] = useState('Verificando sesión...')
  
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
    const confirmar = confirm("¿Estás seguro que deseas cerrar sesión?")
    if (!confirmar) return
    await supabase.auth.signOut()
    localStorage.removeItem('asistencia_estado')
    router.replace('/login')
  }

  const iniciarSensores = async () => {
    setStatus('Iniciando sensores (Cámara y GPS)...')
    
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
      console.error(err)
      setStatus('ERROR: Activa la cámara 📸')
    }

    // 2. Iniciar GPS con paciencia (Aquí estaba el error)
    if (!navigator.geolocation) {
      setStatus('GPS no soportado en este navegador')
      return
    }

    // Usamos watchPosition para que esté listo antes de que el usuario pulse el botón
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`)
        setGpsReady(true)
        setStatus('✅ Sensores Listos')
      },
      (err) => {
        console.error(err)
        // Solo mostramos error si después de intentar realmente falla o el usuario deniega
        if (err.code === 1) {
          setStatus('ERROR: Permiso de GPS denegado ⚠️')
        } else {
          setStatus('ERROR: No se pudo obtener ubicación ⚠️')
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const capturarYEnviar = async (tipo: 'INGRESO' | 'SALIDA') => {
    if (!gpsReady || !cameraReady) {
      alert("Por favor espera a que la cámara y el GPS estén listos.")
      return
    }

    setLoading(true)
    setStatus(`Procesando ${tipo}...`)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.7))
      if (!blob) throw new Error("Error al capturar la foto")

      const fileName = `${tipo.toLowerCase()}_${Date.now()}.jpg`
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

      alert(`${tipo} registrado con éxito ✅`)
      setStatus('✅ Listo')
    } catch (error: any) {
      alert("Error: " + error.message)
      setStatus('❌ Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  if (loading && status === 'Verificando sesión...') {
    return <div className="min-h-screen flex items-center justify-center font-black italic">CARGANDO...</div>
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6">
      <div className="w-full max-w-sm flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter">DASHBOARD</h1>
          <p className={`text-[10px] font-bold uppercase ${gpsReady ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
            {status}
          </p>
        </div>
        <button 
          onClick={handleSignOut}
          className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black px-4 py-2 rounded-full transition-all border border-slate-700"
        >
          SALIR 🚪
        </button>
      </div>

      <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-[40px] overflow-hidden border-2 border-slate-800 shadow-2xl mb-8">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="w-full max-w-sm space-y-4">
        {!yaEntro ? (
          <button 
            onClick={() => capturarYEnviar('INGRESO')} 
            disabled={!gpsReady || !cameraReady} 
            className="w-full bg-emerald-500 p-8 rounded-[30px] font-black text-xl active:scale-95 transition-all shadow-xl shadow-emerald-500/10 disabled:opacity-30"
          >
            📸 MARCAR ENTRADA
          </button>
        ) : (
          <button 
            onClick={() => capturarYEnviar('SALIDA')} 
            disabled={!gpsReady || !cameraReady} 
            className="w-full bg-rose-500 p-8 rounded-[30px] font-black text-xl active:scale-95 transition-all shadow-xl shadow-rose-500/10 disabled:opacity-30"
          >
            🏁 MARCAR SALIDA
          </button>
        )}
      </div>
    </div>
  )
}