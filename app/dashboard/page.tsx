'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardUsuario() {
  const [user, setUser] = useState<any>(null)
  const [empleado, setEmpleado] = useState<any>(null)
  const [ultimoMovimiento, setUltimoMovimiento] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    getUsuarioYDatos()
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()) }
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
      console.error("Permiso de cámara denegado")
    }
  }

  // FUNCIÓN CRÍTICA DE GPS
  const obtenerUbicacionPromesa = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Tu navegador no soporta GPS");
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
          resolve(url);
        },
        (err) => {
          let msg = "Error de GPS desconocido";
          if (err.code === 1) msg = "Debes permitir el acceso a la ubicación en tu navegador/celular.";
          if (err.code === 2) msg = "Ubicación no disponible (revisa tu señal).";
          if (err.code === 3) msg = "Tiempo de espera agotado al buscar GPS.";
          reject(msg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // ALTA PRECISIÓN FORZADA
      );
    });
  };

  const realizarMarcacion = async () => {
    setProcesando(true)
    
    try {
      // 1. FORZAR GPS - Si falla, salta al "catch" y no registra nada
      const ubicacionUrl = await obtenerUbicacionPromesa() as string;

      // 2. CAPTURAR FOTO
      let fotoBase64 = null
      if (videoRef.current) {
        const canvas = document.createElement('canvas')
        canvas.width = 400
        canvas.height = 400
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 400, 400)
        fotoBase64 = canvas.toDataURL('image/jpeg', 0.6)
      }

      const tipo = ultimoMovimiento?.tipo_registro === 'ingreso' ? 'salida' : 'ingreso'
      
      // 3. GUARDAR REGISTRO SOLO SI EL GPS FUE EXITOSO
      const { error } = await supabase.from('asistencia').insert([{
        empleado_id: empleado.id,
        nombres: empleado.nombres,
        tipo_registro: tipo,
        fecha_hora: new Date().toISOString(),
        fecha: new Date().toISOString().split('T')[0],
        ubicacion: ubicacionUrl,
        foto_url: fotoBase64
      }])

      if (!error) {
        alert(`✅ ${tipo.toUpperCase()} REGISTRADO CON UBICACIÓN`);
        window.location.reload()
      } else {
        throw new Error(error.message);
      }

    } catch (error: any) {
      alert(`⚠️ NO SE PUDO REGISTRAR:\n${error}`);
    } finally {
      setProcesando(false)
    }
  }

  if (loading) return <div className="p-20 text-center font-black uppercase">Cargando...</div>

  if (!empleado) return <div className="p-20 text-center font-black uppercase text-red-500">Empleado no encontrado</div>

  const esSalida = ultimoMovimiento?.tipo_registro === 'ingreso'

  return (
    <div className="min-h-screen bg-white p-4 flex flex-col items-center text-black">
      <div className="w-full max-w-md">
        <header className="mb-6">
          <p className="text-[10px] font-black text-blue-600 uppercase">Personal Activo</p>
          <h1 className="text-2xl font-black uppercase">{empleado.nombres}</h1>
        </header>

        <div className="relative aspect-square w-full bg-gray-100 rounded-[40px] overflow-hidden border-4 border-gray-50 shadow-xl mb-8">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
        </div>

        <button 
          disabled={procesando}
          onClick={realizarMarcacion}
          className={`w-full py-6 rounded-[30px] font-black text-sm uppercase text-white shadow-2xl transition-all ${
            esSalida ? 'bg-orange-500' : 'bg-blue-900'
          } ${procesando ? 'opacity-50' : 'active:scale-95'}`}
        >
          {procesando ? 'OBTENIENDO GPS...' : esSalida ? '🔔 Marcar Salida' : '⚡ Marcar Ingreso'}
        </button>

        <div className="mt-8 p-6 bg-gray-50 rounded-[30px] border border-gray-100 text-center">
            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Aviso de Seguridad</p>
            <p className="text-[10px] font-bold text-gray-600 uppercase">Se requiere GPS y Cámara encendidos para validar el registro.</p>
        </div>
      </div>
    </div>
  )
}