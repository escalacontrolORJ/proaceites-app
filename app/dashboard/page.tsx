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
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user)
    }
    fetchUser()
    iniciarCamara()

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => alert("Activa el GPS"),
        { enableHighAccuracy: true }
      )
    }
  }, [])

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      console.error("Error camara:", err)
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

  const validarYRegistrar = () => {
    if (enTrabajo && horaIngreso) {
      const horas = (new Date().getTime() - new Date(horaIngreso).getTime()) / (1000 * 60 * 60)
      if (horas < 9) {
        setMostrarAlerta(true) // Activa el mensaje grande y negrita
        return
      }
    }
    ejecutarRegistro(enTrabajo ? 'salida' : 'ingreso')
  }

  const ejecutarRegistro = async (tipo: 'ingreso' | 'salida') => {
    setMostrarAlerta(false)
    setLoading(true)
    const fotoBase64 = capturarFoto()

    const { error } = await supabase.from('asistencia').insert([{
      empleado_id: user?.id,
      empleado_email: user?.email,
      tipo_registro: tipo,
      ubicacion: `${ubicacion?.lat}, ${ubicacion?.lng}`,
      foto: fotoBase64,
      fecha_hora: new Date().toISOString()
    }])

    if (!error) {
      setEnTrabajo(tipo === 'ingreso')
      if (tipo === 'ingreso') setHoraIngreso(new Date().toISOString())
      alert("REGISTRO EXITOSO")
    }
    setLoading(false)
  }

  return (
    <div className="h-[100dvh] bg-gray-100 flex flex-col items-center justify-between p-6 text-black relative overflow-hidden">
      
      {/* HEADER */}
      <div className="flex flex-col items-center mt-2">
        <Image src="/logo.JPG" alt="Logo" width={70} height={70} className="rounded-2xl" />
        <h1 className="text-2xl font-black text-blue-900 mt-2">PROACEITES</h1>
      </div>

      {/* CÁMARA */}
      <div className="w-56 h-56 border-4 border-white shadow-2xl rounded-full overflow-hidden bg-black">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* BOTÓN REGISTRO */}
      <button 
        onClick={validarYRegistrar}
        className={`w-full max-w-xs py-8 rounded-[35px] font-black text-2xl shadow-xl 
        ${enTrabajo ? 'bg-red-600 border-b-8 border-red-800' : 'bg-green-600 border-b-8 border-green-800'} text-white`}
      >
        {loading ? 'CARGANDO...' : (enTrabajo ? 'MARCAR SALIDA' : 'MARCAR INGRESO')}
      </button>

      {/* MODAL DE ADVERTENCIA (MENSAJE GRANDE Y NEGRITA) */}
      {mostrarAlerta && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[40px] p-8 text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="text-red-600 mb-4">⚠️</div>
            <h2 className="text-2xl font-black text-gray-900 leading-tight mb-6">
              AUN NO CUMPLES TU DIA COMPLETO DE TRABAJO, ¿AUN ASI VAS A REGISTRAR TU SALIDA?
            </h2>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => ejecutarRegistro('salida')}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-lg"
              >
                SI, REGISTRAR SALIDA
              </button>
              <button 
                onClick={() => setMostrarAlerta(false)}
                className="w-full py-4 bg-gray-200 text-gray-800 rounded-2xl font-bold"
              >
                NO, VOLVER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}