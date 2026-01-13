'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardUsuario() {
  const [user, setUser] = useState<any>(null)
  const [empleado, setEmpleado] = useState<any>(null)
  const [ultimoMovimiento, setUltimoMovimiento] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  
  // Estados de Sensores
  const [ubicacionActual, setUbicacionActual] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    getUsuarioYDatos()
    
    // Iniciar GPS en segundo plano apenas carga la página
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setUbicacionActual(url);
      },
      (err) => console.error("Error obteniendo GPS:", err),
      { enableHighAccuracy: true, timeout: 10000 }
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
      // Buscar el empleado por email
      const { data: emp } = await supabase
        .from('empleados')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
      
      if (emp) {
        setEmpleado(emp)
        // Buscar último movimiento para saber si toca Ingreso o Salida
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
      console.error("Cámara bloqueada o no disponible");
    }
  }

  const realizarMarcacion = async () => {
    if (!ubicacionActual) {
      alert("⚠️ ESPERANDO SEÑAL GPS... Por favor, asegúrate de tener la ubicación activada.");
      return;
    }

    setProcesando(true)
    
    try {
      // 1. CAPTURAR FOTO (Miniatura ligera)
      let fotoBase64 = null
      if (videoRef.current) {
        const canvas = document.createElement('canvas')
        canvas.width = 250
        canvas.height = 250
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 250, 250)
        fotoBase64 = canvas.toDataURL('image/jpeg', 0.5)
      }

      // 2. DETERMINAR TIPO (Si lo último fue ingreso, toca salida)
      const tipo = ultimoMovimiento?.tipo_registro === 'ingreso' ? 'salida' : 'ingreso'
      
      // 3. ENVIAR A SUPABASE (Incluimos nombres explícitamente)
      const { error } = await supabase.from('asistencia').insert([{
        empleado_id: empleado.id,
        nombres: empleado.nombres, // IMPORTANTE: Para que aparezca en el reporte
        tipo_registro: tipo,
        fecha_hora: new Date().toISOString(),
        fecha: new Date().toISOString().split('T')[0],
        ubicacion: ubicacionActual,
        foto_url: fotoBase64
      }])

      if (!error) {
        alert(`✅ ${tipo.toUpperCase()} REGISTRADO CON ÉXITO`);
        window.location.reload();
      } else {
        alert("Error de Supabase: " + error.message);
      }
    } catch (error: any) {
      alert("Error crítico: " + error.message);
    } finally {
      setProcesando(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen font-black text-blue-900 animate-pulse">
      VERIFICANDO IDENTIDAD...
    </div>
  )

  if (!empleado) return (
    <div className="p-10 text-center flex flex-col items-center justify-center min-h-screen">
      <p className="text-red-500 font-bold mb-4">No se encontró el empleado con el correo: {user?.email}</p>
      <button onClick={() => supabase.auth.signOut().then(() => window.location.href='/')} className="bg-black text-white px-6 py-2 rounded-xl text-xs font-black">CERRAR SESIÓN</button>
    </div>
  )

  const esSalida = ultimoMovimiento?.tipo_registro === 'ingreso'

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center font-sans text-slate-900">
      <div className="w-full max-w-md bg-white p-6 rounded-[40px] shadow-2xl border border-white">
        
        <header className="mb-6 flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">Panel de Asistencia</p>
            <h1 className="text-xl font-black uppercase leading-none">{empleado.nombres}</h1>
          </div>
          <div className={`w-3 h-3 rounded-full ${ubicacionActual ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        </header>

        {/* VISOR CÁMARA */}
        <div className="relative aspect-square w-full bg-slate-900 rounded-[35px] overflow-hidden mb-8 shadow-inner border-4 border-slate-50">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
          {!ubicacionActual && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-center p-6">
              <p className="text-white text-[10px] font-black uppercase animate-pulse">Obteniendo coordenadas GPS obligatorias...</p>
            </div>
          )}
        </div>

        {/* BOTÓN PRINCIPAL */}
        <button 
          disabled={procesando || !ubicacionActual}
          onClick={realizarMarcacion}
          className={`w-full py-6 rounded-[25px] font-black text-sm uppercase text-white shadow-xl transition-all ${
            esSalida ? 'bg-orange-500 shadow-orange-100' : 'bg-blue-900 shadow-blue-100'
          } ${(procesando || !ubicacionActual) ? 'opacity-30' : 'active:scale-95'}`}
        >
          {procesando ? 'GUARDANDO...' : !ubicacionActual ? 'BUSCANDO GPS...' : esSalida ? '🔔 MARCAR SALIDA' : '⚡ MARCAR INGRESO'}
        </button>

        {/* INFO EXTRA */}
        <div className="mt-8 pt-6 border-t border-slate-100">
           <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
              <span>Último Estado:</span>
              <span className="text-slate-900">{ultimoMovimiento ? ultimoMovimiento.tipo_registro : 'Sin registros'}</span>
           </div>
           {ultimoMovimiento && (
             <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase mt-2">
                <span>Hora:</span>
                <span className="text-slate-900">{new Date(ultimoMovimiento.fecha_hora).toLocaleString()}</span>
             </div>
           )}
        </div>

        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.href='/')}
          className="w-full mt-8 text-[9px] font-black text-slate-300 hover:text-red-500 uppercase transition-colors"
        >
          Cerrar Sesión de {user?.email}
        </button>

      </div>
    </div>
  )
}