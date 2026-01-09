'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function DashboardAsistencia() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ubicacion, setUbicacion] = useState<{lat: number, lng: number} | null>(null)
  const [enTrabajo, setEnTrabajo] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const inicializar = async () => {
      // 1. Verificar sesión
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/')
        return
      }
      setUser(data.user)
      
      // 2. Iniciar GPS
      obtenerUbicacionReal()

      // 3. Iniciar Cámara
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user" } 
        })
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (err) {
        console.error("Error cámara:", err)
      }
    }
    inicializar()
  }, [router])

  const obtenerUbicacionReal = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setGpsError(null)
        },
        (err) => {
          setGpsError("Activa el GPS y permite el acceso")
          setTimeout(obtenerUbicacionReal, 3000)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }

  const cerrarSesion = async () => {
    if (confirm("¿Deseas cerrar tu sesión?")) {
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  const capturarFoto = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d')
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      context?.drawImage(videoRef.current, 0, 0)
      return canvasRef.current.toDataURL('image/jpeg', 0.5)
    }
    return null
  }

  const ejecutarRegistro = async (tipo: 'ingreso' | 'salida') => {
    setMostrarAlerta(false)
    setLoading(true)
    const fotoBase64 = capturarFoto()

    if (!ubicacion) {
      alert("No se puede registrar sin GPS.")
      setLoading(false)
      return
    }

    const { error } = await supabase.from('asistencia').insert([{
      empleado_id: user?.id,
      tipo_registro: tipo,
      ubicacion: `https://www.google.com/maps?q=${ubicacion.lat},${ubicacion.lng}`,
      foto: fotoBase64,
      fecha_hora: new Date().toISOString()
    }])

    if (error) {
      alert("Error al guardar: " + error.message)
    } else {
      setEnTrabajo(tipo === 'ingreso')
      alert(`✅ ${tipo.toUpperCase()} REGISTRADO`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between p-6 text-black">
      
      {/* HEADER */}
      <div className="w-full flex justify-between items-center mt-4">
        <div className="w-10 h-10"></div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 relative mb-2">
             <Image src="/logo.JPG" alt="Logo" fill className="rounded-2xl object-cover shadow-lg" priority />
          </div>
          <p className="text-[10px] font-black tracking-[0.3em] text-blue-900 uppercase">Proaceites</p>
        </div>
        <button 
          onClick={cerrarSesion}
          className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl shadow-sm active:bg-red-50 active:text-red-500 transition-colors"
        >
          🚪
        </button>
      </div>

      {/* CIRCULO DE CÁMARA */}
      <div className="relative">
        <div className="w-64 h-64 rounded-full border-[6px] border-gray-50 shadow-2xl overflow-hidden bg-black ring-8 ring-blue-50/50">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black shadow-lg">
          VISTA EN VIVO
        </div>
      </div>

      {/* BOTÓN PRINCIPAL */}
      <div className="w-full max-w-xs space-y-6 mb-8">
        <div className="text-center">
          {!ubicacion ? (
            <p className="text-red-500 font-bold text-[10px] animate-pulse uppercase tracking-widest">
              ⚠️ {gpsError || "Validando ubicación GPS..."}
            </p>
          ) : (
            <p className="text-green-500 font-bold text-[10px] uppercase tracking-widest">
              📍 Ubicación confirmada
            </p>
          )}
        </div>

        <button 
          onClick={() => enTrabajo ? setMostrarAlerta(true) : ejecutarRegistro('ingreso')}
          disabled={loading || !ubicacion}
          className={`w-full py-8 rounded-[40px] font-black text-2xl shadow-2xl transition-all active:scale-95 
          ${!ubicacion ? 'bg-gray-300' : (enTrabajo ? 'bg-red-600' : 'bg-blue-700')} text-white`}
        >
          {loading ? '...' : (enTrabajo ? 'REGISTRAR SALIDA' : 'MARCAR INGRESO')}
        </button>

        <p className="text-center text-gray-400 text-[10px] font-medium uppercase tracking-widest">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* MODAL PARA SALIDA */}
      {mostrarAlerta && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-[100]">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm text-center">
            <div className="text-4xl mb-4">📢</div>
            <h2 className="text-xl font-black text-gray-900 mb-2 uppercase">Confirmar Salida</h2>
            <p className="text-gray-500 text-sm mb-8 font-medium">¿Estás seguro que deseas terminar tu jornada ahora?</p>
            <div className="grid gap-3">
              <button onClick={() => ejecutarRegistro('salida')} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200">SÍ, REGISTRAR SALIDA</button>
              <button onClick={() => setMostrarAlerta(false)} className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black">VOLVER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}