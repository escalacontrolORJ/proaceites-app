'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardUsuario() {
  const [user, setUser] = useState<any>(null)
  const [empleado, setEmpleado] = useState<any>(null)
  const [ultimoMovimiento, setUltimoMovimiento] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  
  // Referencia para la cámara
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    getUsuarioYDatos()
    return () => stopCamera() // Limpiar cámara al salir
  }, [])

  async function getUsuarioYDatos() {
    setLoading(true)
    // 1. Obtener el usuario que hizo Login
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setUser(user)
      // 2. Buscar los datos de este empleado por su correo
      const { data: emp } = await supabase
        .from('empleados')
        .select('*')
        .eq('email', user.email)
        .single()
      
      if (emp) {
        setEmpleado(emp)
        // 3. Buscar su último movimiento histórico
        const { data: mov } = await supabase
          .from('asistencia')
          .select('*')
          .eq('empleado_id', emp.id)
          .order('fecha_hora', { ascending: false })
          .limit(1)
          .maybeSingle()
        setUltimoMovimiento(mov)
        // Iniciar cámara automáticamente
        startCamera()
      }
    }
    setLoading(false)
  }

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch (err) {
      alert("Error: Debes permitir el acceso a la cámara para marcar asistencia.")
    }
  }

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop())
  }

  const capturarFotoYRegistrar = async () => {
    setProcesando(true)
    
    // 1. Obligar captura de GPS
    let ubicacion = "Sin GPS"
    try {
      const pos: any = await new Promise((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      )
      ubicacion = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`
    } catch (e) {
      alert("Error: Es obligatorio activar el GPS para registrar tu asistencia.")
      setProcesando(false)
      return
    }

    // 2. Capturar Foto (Base64 simple para la prueba)
    let fotoBase64 = null
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
      fotoBase64 = canvas.toDataURL('image/jpeg', 0.5)
    }

    const tipo = ultimoMovimiento?.tipo_registro === 'ingreso' ? 'salida' : 'ingreso'
    const ahora = new Date()

    // 3. Guardar en Supabase
    const { error } = await supabase.from('asistencia').insert([{
      empleado_id: empleado.id,
      nombres: empleado.nombres,
      tipo_registro: tipo,
      fecha_hora: ahora.toISOString(),
      fecha: ahora.toISOString().split('T')[0],
      ubicacion: ubicacion,
      foto_url: fotoBase64 // Guardamos la foto directamente
    }])

    if (!error) {
      alert(`✅ ${tipo.toUpperCase()} REGISTRADO CON ÉXITO`)
      window.location.reload() // Recargamos para actualizar estado
    } else {
      alert("Error: " + error.message)
    }
    setProcesando(false)
  }

  if (loading) return <div className="p-10 text-center font-black animate-pulse">CARGANDO PERFIL...</div>

  if (!empleado) return <div className="p-10 text-center">No se encontraron datos de empleado para {user?.email}</div>

  const esSalida = ultimoMovimiento?.tipo_registro === 'ingreso'

  return (
    <div className="min-h-screen bg-white p-4 font-sans text-black flex flex-col items-center">
      <header className="w-full max-w-md mb-6">
        <h1 className="text-2xl font-black text-blue-900 uppercase leading-none">Hola, {empleado.nombres.split(' ')[0]}</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
          {esSalida ? 'Actualmente en turno' : 'Sesión iniciada - Fuera de turno'}
        </p>
      </header>

      {/* VISOR DE CÁMARA */}
      <div className="w-full max-w-md aspect-video bg-black rounded-[30px] overflow-hidden shadow-2xl mb-6 relative border-4 border-blue-900">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none">
          <span className="bg-red-600 text-white text-[8px] px-2 py-1 rounded font-bold animate-pulse">REC VIDEO LIVE</span>
          <span className="text-white/50 text-[10px] font-mono">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="w-full max-w-md">
        <button 
          disabled={procesando}
          onClick={capturarFotoYRegistrar}
          className={`w-full py-6 rounded-[25px] font-black text-sm uppercase text-white shadow-xl transition-all active:scale-95 ${
            esSalida ? 'bg-orange-500 shadow-orange-100' : 'bg-blue-700 shadow-blue-100'
          } ${procesando ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {procesando ? 'PROCESANDO...' : esSalida ? '🔔 MARCAR MI SALIDA' : '⚡ MARCAR MI INGRESO'}
        </button>

        {ultimoMovimiento && (
          <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Última actividad registrada:</p>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase">{ultimoMovimiento.tipo_registro}</span>
              <span className="text-xs font-mono">{new Date(ultimoMovimiento.fecha_hora).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}