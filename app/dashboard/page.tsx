'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function DashboardAsistencia() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [ubicacion, setUbicacion] = useState<{lat: number, lng: number} | null>(null)
  const [registroHoy, setRegistroHoy] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const inicializar = async () => {
      // 1. Verificar Sesión
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      
      // 2. Buscar si ya existe un registro de hoy para este usuario
      const hoy = new Date().toISOString().split('T')[0]
      const { data: asistencia } = await supabase
        .from('asistencia')
        .select('*')
        .eq('empleado_id', user.id)
        .eq('fecha', hoy)
        .maybeSingle()
      
      if (asistencia) setRegistroHoy(asistencia)

      // 3. Activar GPS
      obtenerUbicacionReal()

      // 4. Activar Cámara
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
        (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Error GPS:", err),
        { enableHighAccuracy: true }
      )
    }
  }

  const capturarFoto = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d')
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      context?.drawImage(videoRef.current, 0, 0)
      return canvasRef.current.toDataURL('image/jpeg', 0.6)
    }
    return null
  }

  const ejecutarRegistro = async (tipo: 'ingreso' | 'salida') => {
    if (!ubicacion) {
      alert("Esperando señal de GPS...")
      return
    }

    setLoading(true)
    const fotoBase64 = capturarFoto()
    const urlMaps = `https://www.google.com/maps?q=${ubicacion.lat},${ubicacion.lng}`
    const ahora = new Date().toISOString()

    if (tipo === 'ingreso') {
      // INSERTAR NUEVA FILA
      const { data, error } = await supabase.from('asistencia').insert([{
        empleado_id: user?.id,
        fecha: ahora.split('T')[0],
        hora_ingreso: ahora,
        foto_ingreso: fotoBase64,
        ubicacion_ingreso: urlMaps
      }]).select().single()

      if (error) alert("Error: " + error.message)
      else {
        setRegistroHoy(data)
        alert("✅ INGRESO REGISTRADO")
      }
    } else {
      // ACTUALIZAR FILA EXISTENTE
      const { error } = await supabase.from('asistencia').update({
        hora_salida: ahora,
        foto_salida: fotoBase64,
        ubicacion_salida: urlMaps
      }).eq('id', registroHoy.id)

      if (error) alert("Error: " + error.message)
      else {
        setRegistroHoy({ ...registroHoy, hora_salida: ahora })
        setMostrarAlerta(false)
        alert("✅ SALIDA REGISTRADA")
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between p-6 text-black font-sans">
      
      {/* HEADER LOGO */}
      <div className="flex flex-col items-center mt-4">
        <div className="w-20 h-20 relative mb-2 shadow-xl rounded-2xl overflow-hidden">
          <Image src="/logo.JPG" alt="Logo" fill className="object-cover" priority />
        </div>
        <h1 className="text-xs font-black tracking-[0.3em] text-blue-900 uppercase">Proaceites</h1>
      </div>

      {/* VISTA PREVIA CÁMARA */}
      <div className="relative">
        <div className="w-64 h-64 rounded-full border-[6px] border-gray-100 shadow-2xl overflow-hidden bg-black ring-8 ring-blue-50">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[9px] font-black shadow-lg uppercase tracking-tighter">
          Validación Biométrica
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="w-full max-w-xs mb-8 space-y-4">
        {!registroHoy ? (
          <button 
            onClick={() => ejecutarRegistro('ingreso')}
            disabled={loading || !ubicacion}
            className="w-full py-7 bg-blue-700 text-white rounded-[35px] font-black text-xl shadow-2xl active:scale-95 transition-all disabled:bg-gray-300"
          >
            {loading ? 'REGISTRANDO...' : 'MARCAR INGRESO'}
          </button>
        ) : registroHoy.hora_salida ? (
          <div className="p-8 bg-green-50 rounded-[35px] border-2 border-green-100 text-center shadow-inner">
            <p className="text-green-600 font-black text-lg uppercase leading-none">Jornada Finalizada</p>
            <p className="text-gray-400 text-[10px] mt-2 font-bold tracking-widest uppercase">¡Nos vemos mañana!</p>
          </div>
        ) : (
          <button 
            onClick={() => setMostrarAlerta(true)}
            disabled={loading}
            className="w-full py-7 bg-red-600 text-white rounded-[35px] font-black text-xl shadow-2xl active:scale-95 transition-all"
          >
            {loading ? 'REGISTRANDO...' : 'MARCAR SALIDA'}
          </button>
        )}

        <div className="text-center space-y-1">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {!ubicacion && <p className="text-red-500 text-[9px] font-bold animate-pulse">⚠️ ESPERANDO GPS...</p>}
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN SALIDA */}
      {mostrarAlerta && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-[100]">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm text-center shadow-2xl border border-gray-100">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tighter">¿Terminar Jornada?</h2>
            <p className="text-gray-500 text-xs mb-8 font-medium px-4">Se guardará tu ubicación y foto de salida para el reporte final.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => ejecutarRegistro('salida')} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-100 active:scale-95 transition-transform">SÍ, REGISTRAR SALIDA</button>
              <button onClick={() => setMostrarAlerta(false)} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black active:scale-95 transition-transform">VOLVER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}