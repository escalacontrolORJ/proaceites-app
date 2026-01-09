'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Image from 'next/image'

export default function DashboardAsistencia() {
  const [loading, setLoading] = useState(false)
  const [ubicacion, setUbicacion] = useState<{lat: number, lng: number} | null>(null)
  const [enTrabajo, setEnTrabajo] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [horaIngreso, setHoraIngreso] = useState<string | null>(null)
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const inicializar = async () => {
      // 1. Obtener Usuario
      const { data } = await supabase.auth.getUser()
      setUser(data?.user)

      // 2. Iniciar Cámara
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (err) {
        alert("LA CÁMARA ES OBLIGATORIA. POR FAVOR PERMITE EL ACCESO.")
      }

      // 3. Iniciar GPS (Modo Rastreo para mayor rapidez)
      obtenerUbicacionReal()
    }
    inicializar()
  }, [])

  const obtenerUbicacionReal = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setGpsError(null)
        },
        (err) => {
          let mensaje = "Activa el GPS de tu celular."
          if (err.code === 1) mensaje = "Debes dar permiso al navegador para usar el GPS."
          setGpsError(mensaje)
          // Reintentar automáticamente en 3 segundos si falla
          setTimeout(obtenerUbicacionReal, 3000)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }
  }

  const capturarFoto = () => {
    try {
      if (canvasRef.current && videoRef.current) {
        const context = canvasRef.current.getContext('2d')
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context?.drawImage(videoRef.current, 0, 0)
        return canvasRef.current.toDataURL('image/jpeg', 0.5) 
      }
    } catch (e) { return "error-foto" }
    return "sin-foto"
  }

  const validarYRegistrar = () => {
    if (!ubicacion) return; // Si no hay GPS, el botón no hace nada

    if (enTrabajo && horaIngreso) {
      const horas = (new Date().getTime() - new Date(horaIngreso).getTime()) / (1000 * 60 * 60)
      if (horas < 9) {
        setMostrarAlerta(true)
        return
      }
    }
    ejecutarRegistro(enTrabajo ? 'salida' : 'ingreso')
  }

  const ejecutarRegistro = async (tipo: 'ingreso' | 'salida') => {
    setMostrarAlerta(false)
    setLoading(true)
    
    try {
      const fotoBase64 = capturarFoto()

      const { error } = await supabase.from('asistencia').insert([{
        empleado_id: user?.id,
        empleado_email: user?.email,
        tipo_registro: tipo,
        ubicacion: `https://www.google.com/maps?q=${ubicacion?.lat},${ubicacion?.lng}`,
        foto: fotoBase64,
        fecha_hora: new Date().toISOString()
      }])

      if (error) {
        alert("ERROR AL GUARDAR: " + error.message)
      } else {
        setEnTrabajo(tipo === 'ingreso')
        if (tipo === 'ingreso') setHoraIngreso(new Date().toISOString())
        alert("✅ " + tipo.toUpperCase() + " REGISTRADO")
      }
    } catch (err: any) {
      alert("ERROR CRÍTICO: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[100dvh] bg-gray-100 flex flex-col items-center justify-between p-6 text-black relative">
      
      {/* LOGO */}
      <div className="flex flex-col items-center mt-2">
        <Image src="/logo.JPG" alt="Logo" width={70} height={70} className="rounded-2xl" priority />
        <h1 className="text-2xl font-black text-blue-900 mt-2 tracking-tighter">PROACEITES</h1>
        <p className="text-[10px] text-gray-500 font-bold uppercase">{user?.email}</p>
      </div>

      {/* CÁMARA */}
      <div className="w-56 h-56 border-4 border-white shadow-2xl rounded-full overflow-hidden bg-black">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* ESTADO GPS Y BOTÓN */}
      <div className="w-full max-w-xs space-y-4 mb-4">
        
        {/* INDICADOR DE GPS (SEGURIDAD) */}
        {!ubicacion ? (
          <div className="bg-yellow-100 p-4 rounded-2xl text-center border-2 border-yellow-400 animate-pulse">
            <p className="text-yellow-800 font-black text-sm uppercase">
              {gpsError || "Buscando señal GPS obligatoria..."}
            </p>
          </div>
        ) : (
          <div className="bg-green-100 p-3 rounded-2xl text-center border border-green-300">
            <p className="text-green-700 font-bold text-[10px] uppercase">📍 Ubicación Verificada</p>
          </div>
        )}

        <button 
          onClick={validarYRegistrar}
          disabled={loading || !ubicacion}
          className={`w-full py-7 rounded-[35px] font-black text-2xl shadow-xl transition-all
          ${!ubicacion ? 'bg-gray-400 cursor-not-allowed' : (enTrabajo ? 'bg-red-600 border-b-8 border-red-800' : 'bg-green-600 border-b-8 border-green-800')} text-white`}
        >
          {loading ? 'ENVIANDO...' : (enTrabajo ? 'MARCAR SALIDA' : 'MARCAR INGRESO')}
        </button>
      </div>

      {/* MODAL ADVERTENCIA 9 HORAS */}
      {mostrarAlerta && (
        <div className="absolute inset-0 bg-black/95 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[40px] p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-gray-900 leading-tight mb-8">
              <span className="text-red-600 font-black uppercase">Aun no cumples tu dia completo de trabajo,</span> <br/> 
              ¿AUN ASI VAS A REGISTRAR TU SALIDA?
            </h2>
            <div className="flex flex-col gap-4">
              <button onClick={() => ejecutarRegistro('salida')} className="w-full py-5 bg-red-600 text-white rounded-2xl font-black shadow-lg uppercase text-lg">Si, registrar salida</button>
              <button onClick={() => setMostrarAlerta(false)} className="w-full py-5 bg-gray-200 text-gray-800 rounded-2xl font-bold uppercase">No, volver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}