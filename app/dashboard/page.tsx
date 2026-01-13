'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardUsuario() {
  const [user, setUser] = useState<any>(null)
  const [empleado, setEmpleado] = useState<any>(null)
  const [ultimoMovimiento, setUltimoMovimiento] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  
  // Estados para GPS y Cámara
  const [ubicacionActual, setUbicacionActual] = useState<string | null>(null)
  const [errorGps, setErrorGps] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    getUsuarioYDatos()
    
    // Iniciar el rastreo del GPS apenas cargue la página
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setUbicacionActual(url);
        setErrorGps(null);
      },
      (err) => {
        setErrorGps("GPS DESACTIVADO O SIN PERMISO");
      },
      { enableHighAccuracy: true }
    );

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      navigator.geolocation.clearWatch(watchId);
    }
  }, [])

  async function getUsuarioYDatos() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setUser(user)
      const { data: emp } = await supabase
        .from('empleados')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
      
      if (emp) {
        setEmpleado(emp)
        const { data: mov } = await supabase
          .from('asistencia')
          .select('*')
          .eq('empleado_id', emp.id)
          .order('fecha_hora', { ascending: false })
          .limit(1)
          .maybeSingle()
        setUltimoMovimiento(mov)
        activarCamara()
      }
    }
    setLoading(false)
  }

  const activarCamara = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 400, height: 400 } 
      })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch (err) {
      console.error("Cámara bloqueada");
    }
  }

  const realizarMarcacion = async () => {
    if (!ubicacionActual) {
      alert("⚠️ ESPERANDO SEÑAL GPS... Por favor, asegúrate de estar en un lugar con recepción y haber aceptado los permisos.");
      return;
    }

    setProcesando(true)
    
    try {
      // 1. CAPTURAR FOTO
      let fotoBase64 = null
      if (videoRef.current) {
        const canvas = document.createElement('canvas')
        canvas.width = 400
        canvas.height = 400
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 400, 400)
        fotoBase64 = canvas.toDataURL('image/jpeg', 0.6)
      }

      const tipo = ultimoMovimiento?.tipo_registro === 'ingreso' ? 'salida' : 'ingreso'
      
      // 2. GUARDAR EN TABLA ASISTENCIA
      const { error } = await supabase.from('asistencia').insert([{
        empleado_id: empleado.id,
        nombres: empleado.nombres,
        tipo_registro: tipo,
        fecha_hora: new Date().toISOString(),
        fecha: new Date().toISOString().split('T')[0],
        ubicacion: ubicacionActual, // Usamos la que el watchPosition ya encontró
        foto_url: fotoBase64
      }])

      if (!error) {
        alert(`✅ ${tipo.toUpperCase()} REGISTRADO CON ÉXITO`);
        window.location.reload();
      } else {
        throw error;
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setProcesando(false)
    }
  }

  if (loading) return <div className="p-20 text-center font-black">CARGANDO...</div>
  if (!empleado) return <div className="p-20 text-center text-red-500 font-black">EMPLEADO NO REGISTRADO CON ESTE EMAIL</div>

  return (
    <div className="min-h-screen bg-white p-4 flex flex-col items-center text-black">
      <div className="w-full max-w-md">
        <header className="mb-4">
          <h1 className="text-2xl font-black uppercase">{empleado.nombres}</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-3 h-3 rounded-full ${ubicacionActual ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <p className="text-[10px] font-black uppercase">
              {ubicacionActual ? 'GPS LISTO' : errorGps || 'BUSCANDO GPS...'}
            </p>
          </div>
        </header>

        <div className="aspect-square w-full bg-gray-100 rounded-[40px] overflow-hidden mb-6 shadow-xl border-4 border-gray-50">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
        </div>

        <button 
          disabled={procesando || !ubicacionActual}
          onClick={realizarMarcacion}
          className={`w-full py-6 rounded-[30px] font-black text-sm uppercase text-white shadow-2xl transition-all ${
            ultimoMovimiento?.tipo_registro === 'ingreso' ? 'bg-orange-500' : 'bg-blue-900'
          } ${(procesando || !ubicacionActual) ? 'opacity-30' : 'active:scale-95'}`}
        >
          {procesando ? 'GUARDANDO...' : !ubicacionActual ? 'ESPERANDO GPS...' : ultimoMovimiento?.tipo_registro === 'ingreso' ? 'Marcar Salida' : 'Marcar Ingreso'}
        </button>

        <p className="mt-4 text-[9px] text-gray-400 text-center font-bold uppercase">
          Si el botón no se activa, revisa que los permisos de ubicación estén habilitados en tu navegador.
        </p>
      </div>
    </div>
  )
}