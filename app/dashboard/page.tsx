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

  useEffect(() => {
    getUsuarioYDatos()
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUbicacionActual(`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`),
      (err) => console.error("Error GPS:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [])

  async function getUsuarioYDatos() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      setUser(authUser)
      const { data: emp } = await supabase.from('empleados').select('*').eq('email', authUser.email).maybeSingle()
      if (emp) {
        setEmpleado(emp)
        const { data: mov } = await supabase.from('asistencia').select('*').eq('empleado_id', emp.id).order('fecha_hora', { ascending: false }).limit(1).maybeSingle()
        setUltimoMovimiento(mov)
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).then(s => {
          if (videoRef.current) videoRef.current.srcObject = s
        })
      }
    }
    setLoading(false)
  }

  const realizarMarcacion = async () => {
    if (!ubicacionActual) return alert("Esperando señal de GPS...");
    setProcesando(true)

    try {
      const canvas = document.createElement('canvas')
      canvas.width = 300; canvas.height = 300
      videoRef.current && canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, 300, 300)
      const fotoData = canvas.toDataURL('image/jpeg', 0.6)

      const tipo = ultimoMovimiento?.tipo_registro === 'ingreso' ? 'salida' : 'ingreso'
      
      // ENVIAMOS A TODAS LAS VARIANTES DE COLUMNAS QUE TIENES EN TU CSV
      const { error } = await supabase.from('asistencia').insert([{
        empleado_id: empleado.id,
        nombres: empleado.nombres,
        tipo_registro: tipo,
        fecha: new Date().toISOString().split('T')[0],
        fecha_hora: new Date().toISOString(),
        // Enviamos a ambos nombres por si acaso
        ubicacion: ubicacionActual,
        geolocalizacion: ubicacionActual, 
        // Enviamos a ambos nombres de foto
        foto_url: fotoData,
        foto: fotoData
      }])

      if (!error) {
        alert("✅ REGISTRO CORRECTO: " + tipo.toUpperCase())
        window.location.reload()
      } else {
        alert("ERROR SUPABASE: " + error.message)
      }
    } catch (e) {
      alert("Error de ejecución")
    }
    setProcesando(false)
  }

  if (loading) return <div className="p-20 text-center font-black">CARGANDO...</div>
  if (!empleado) return <div className="p-20 text-center">EMPLEADO NO ENCONTRADO</div>

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md text-center">
        <h1 className="text-2xl font-black uppercase text-blue-900">{empleado.nombres}</h1>
        <p className="text-[10px] font-bold text-slate-400 mb-6 tracking-widest uppercase">
          {ubicacionActual ? '📍 GPS Activo' : '📡 Buscando GPS...'}
        </p>
        
        <div className="aspect-square rounded-[30px] overflow-hidden border-4 border-slate-100 mb-8 bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
        </div>

        <button 
          disabled={procesando || !ubicacionActual}
          onClick={realizarMarcacion}
          className={`w-full py-6 rounded-3xl font-black text-white transition-all ${
            ultimoMovimiento?.tipo_registro === 'ingreso' ? 'bg-orange-500' : 'bg-blue-900'
          } disabled:opacity-20`}
        >
          {procesando ? 'PROCESANDO...' : ultimoMovimiento?.tipo_registro === 'ingreso' ? 'MARCAR SALIDA' : 'MARCAR INGRESO'}
        </button>
      </div>
    </div>
  )
}