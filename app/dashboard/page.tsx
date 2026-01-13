'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardUsuario() {
  const [user, setUser] = useState<any>(null)
  const [empleado, setEmpleado] = useState<any>(null)
  const [ultimoMovimiento, setUltimoMovimiento] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  
  const [ubicacionActual, setUbicacionActual] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    getUsuarioYDatos()
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUbicacionActual(`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`);
      },
      (err) => console.error("Error GPS:", err),
      { enableHighAccuracy: true }
    );
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      navigator.geolocation.clearWatch(watchId);
    }
  }, [])

  async function getUsuarioYDatos() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const { data: emp } = await supabase.from('empleados').select('*').eq('email', user.email).maybeSingle()
      if (emp) {
        setEmpleado(emp)
        const { data: mov } = await supabase.from('asistencia').select('*').eq('empleado_id', emp.id).order('fecha_hora', { ascending: false }).limit(1).maybeSingle()
        setUltimoMovimiento(mov)
        activarCamara()
      }
    }
    setLoading(false)
  }

  const activarCamara = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch (err) { alert("Activa la cámara para marcar."); }
  }

  const realizarMarcacion = async () => {
    if (!ubicacionActual) return alert("Esperando señal GPS...");
    setProcesando(true)
    
    try {
      // CAPTURA DE FOTO PEQUEÑA (Para no saturar la base de datos)
      let fotoSmall = null
      if (videoRef.current) {
        const canvas = document.createElement('canvas')
        canvas.width = 200; canvas.height = 200; // Tamaño reducido
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 200, 200)
        fotoSmall = canvas.toDataURL('image/jpeg', 0.4) // Calidad baja
      }

      const tipo = ultimoMovimiento?.tipo_registro === 'ingreso' ? 'salida' : 'ingreso'
      const payload = {
        empleado_id: empleado.id,
        nombres: empleado.nombres,
        tipo_registro: tipo,
        fecha_hora: new Date().toISOString(),
        fecha: new Date().toISOString().split('T')[0],
        ubicacion: ubicacionActual,
        foto_url: fotoSmall
      }

      const { error } = await supabase.from('asistencia').insert([payload])

      if (error) {
        console.error("Detalle del error:", error);
        alert(`ERROR DE BASE DE DATOS: ${error.message}\nCódigo: ${error.code}`);
      } else {
        alert(`✅ ${tipo.toUpperCase()} GUARDADO CORRECTAMENTE`);
        window.location.reload();
      }
    } catch (e: any) {
      alert("Error inesperado: " + e.message);
    } finally {
      setProcesando(false)
    }
  }

  if (loading) return <div className="p-20 text-center font-black">CARGANDO...</div>
  if (!empleado) return <div className="p-20 text-center">No estás en la lista de empleados.</div>

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col items-center text-black">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-black uppercase mb-1">{empleado.nombres}</h1>
        <p className={`text-[10px] font-black mb-6 ${ubicacionActual ? 'text-green-500' : 'text-red-500'}`}>
          {ubicacionActual ? '📍 GPS CONECTADO' : '⌛ BUSCANDO UBICACIÓN...'}
        </p>

        <div className="aspect-square bg-gray-100 rounded-[40px] overflow-hidden mb-6 border-4 border-blue-900">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
        </div>

        <button 
          disabled={procesando || !ubicacionActual}
          onClick={realizarMarcacion}
          className={`w-full py-6 rounded-[30px] font-black text-white shadow-2xl ${
            ultimoMovimiento?.tipo_registro === 'ingreso' ? 'bg-orange-500' : 'bg-blue-900'
          } ${procesando || !ubicacionActual ? 'opacity-30' : 'active:scale-95'}`}
        >
          {procesando ? 'GUARDANDO...' : ultimoMovimiento?.tipo_registro === 'ingreso' ? 'MARCAR SALIDA' : 'MARCAR INGRESO'}
        </button>
      </div>
    </div>
  )
}