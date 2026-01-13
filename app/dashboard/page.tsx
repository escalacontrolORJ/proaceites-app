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
        const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setUbicacionActual(url);
      },
      (err) => console.error("Error GPS:", err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      navigator.geolocation.clearWatch(watchId);
    }
  }, [])

  async function getUsuarioYDatos() {
    setLoading(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      setUser(authUser)
      const { data: emp } = await supabase.from('empleados').select('*').eq('email', authUser.email).maybeSingle()
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
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 400, height: 400 } })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch (err) { console.error("Error cámara:", err); }
  }

  const realizarMarcacion = async () => {
    if (!ubicacionActual) return alert("Esperando GPS...");
    setProcesando(true)
    try {
      let fotoBase64 = null
      if (videoRef.current) {
        const canvas = document.createElement('canvas')
        canvas.width = 250; canvas.height = 250
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 250, 250)
        fotoBase64 = canvas.toDataURL('image/jpeg', 0.5)
      }
      const tipo = ultimoMovimiento?.tipo_registro === 'ingreso' ? 'salida' : 'ingreso'
      const { error } = await supabase.from('asistencia').insert([{
        empleado_id: empleado.id,
        nombres: empleado.nombres,
        tipo_registro: tipo,
        fecha_hora: new Date().toISOString(),
        fecha: new Date().toISOString().split('T')[0],
        ubicacion: ubicacionActual,
        foto_url: fotoBase64
      }])
      if (!error) {
        alert(`¡${tipo.toUpperCase()} registrado!`);
        window.location.reload();
      } else {
        alert("Error: " + error.message);
      }
    } catch (err: any) { alert("Error crítico."); }
    setProcesando(false)
  }

  if (loading) return <div className="p-20 text-center font-black uppercase text-black">Cargando...</div>
  if (!empleado) return <div className="p-20 text-center text-red-500 font-black uppercase">Usuario no vinculado</div>

  const esSalida = ultimoMovimiento?.tipo_registro === 'ingreso'

  return (
    <div className="min-h-screen bg-slate-100 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-[50px] shadow-2xl">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-xl font-black text-black uppercase">{empleado.nombres}</h1>
          <div className={`w-3 h-3 rounded-full ${ubicacionActual ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </header>
        <div className="aspect-square bg-black rounded-[40px] overflow-hidden mb-8 border-4 border-slate-50">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
        </div>
        <button 
          disabled={procesando || !ubicacionActual}
          onClick={realizarMarcacion}
          className={`w-full py-6 rounded-[30px] font-black text-white text-sm shadow-xl transition-all ${esSalida ? 'bg-orange-500' : 'bg-blue-900'} disabled:opacity-30 active:scale-95`}
        >
          {procesando ? 'GUARDANDO...' : !ubicacionActual ? 'BUSCANDO GPS...' : esSalida ? '🔔 MARCAR SALIDA' : '⚡ MARCAR INGRESO'}
        </button>
      </div>
    </div>
  )
}