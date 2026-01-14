'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardUsuario() {
  const [empleado, setEmpleado] = useState<any>(null)
  const [ultimoMov, setUltimoMov] = useState<any>(null)
  const [gps, setGps] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    iniciarApp()
    const watchId = navigator.geolocation.watchPosition(
      (p) => setGps(`https://www.google.com/maps?q=${p.coords.latitude},${p.coords.longitude}`),
      (e) => console.error(e),
      { enableHighAccuracy: true }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  async function iniciarApp() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data: emp } = await supabase.from('empleados').select('*').eq('email', user.email).maybeSingle()
    if (emp) {
      setEmpleado(emp)
      const { data: mov } = await supabase.from('asistencia')
        .select('*').eq('empleado_id', emp.id).order('fecha_hora', { ascending: false }).limit(1).maybeSingle()
      setUltimoMov(mov)
      
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      if (videoRef.current) videoRef.current.srcObject = s
    }
  }

  const marcar = async () => {
    if (!gps) return alert("Esperando señal GPS...")
    setProcesando(true)
    
    const canvas = document.createElement('canvas')
    canvas.width = 300; canvas.height = 300
    videoRef.current && canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 300, 300)
    const foto = canvas.toDataURL('image/jpeg', 0.6)

    const tipo = ultimoMov?.tipo_registro === 'ingreso' ? 'salida' : 'ingreso'

    const { error } = await supabase.from('asistencia').insert([{
      empleado_id: empleado.id,
      nombres: empleado.nombres,
      tipo_registro: tipo,
      fecha: new Date().toISOString().split('T')[0],
      fecha_hora: new Date().toISOString(),
      ubicacion: gps,
      foto_url: foto
    }])

    if (!error) {
      alert(`✅ ${tipo.toUpperCase()} REGISTRADO`)
      window.location.reload()
    }
    setProcesando(false)
  }

  if (!empleado) return <div className="p-20 text-center font-bold">Cargando perfil...</div>

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-[40px] shadow-2xl w-full max-w-md border border-white">
        <h1 className="text-xl font-black uppercase text-center mb-1">{empleado.nombres}</h1>
        <p className="text-[10px] text-center mb-6 font-bold text-slate-400 uppercase tracking-widest">
          {gps ? '📍 GPS LISTO' : '📡 BUSCANDO SEÑAL...'}
        </p>
        <div className="aspect-square rounded-[35px] overflow-hidden bg-black mb-8 border-4 border-slate-50 shadow-inner">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
        </div>
        <button 
          disabled={procesando || !gps}
          onClick={marcar}
          className={`w-full py-6 rounded-3xl font-black text-white shadow-xl transition-all ${
            ultimoMov?.tipo_registro === 'ingreso' ? 'bg-orange-500 shadow-orange-100' : 'bg-blue-900 shadow-blue-100'
          } disabled:opacity-20`}
        >
          {procesando ? 'GUARDANDO...' : ultimoMov?.tipo_registro === 'ingreso' ? '🔔 MARCAR SALIDA' : '⚡ MARCAR INGRESO'}
        </button>
      </div>
    </div>
  )
}