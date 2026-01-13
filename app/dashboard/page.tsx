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
      // Buscamos al empleado que tenga este email registrado
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

  const realizarMarcacion = async () => {
    setProcesando(true)
    
    // 1. OBTENER GPS (Obligatorio)
    let ubicacionUrl = ""
    try {
      const pos: any = await new Promise((res, rej) => 
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 })
      )
      ubicacionUrl = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`
    } catch (e) {
      alert("⚠️ ERROR: El GPS es obligatorio. Activa la ubicación de tu celular/PC.");
      setProcesando(false)
      return
    }

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
    
    // 3. GUARDAR REGISTRO
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
      alert(`✅ ${tipo.toUpperCase()} REGISTRADO`);
      window.location.reload()
    } else {
      alert("Error al guardar: " + error.message)
    }
    setProcesando(false)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black uppercase text-blue-900">Validando identidad...</p>
    </div>
  )

  if (!empleado) return (
    <div className="p-10 text-center min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h2 className="text-red-600 font-black text-2xl mb-2">ERROR DE ACCESO</h2>
      <p className="text-xs font-bold text-gray-400 uppercase mb-8">El correo {user?.email} no tiene permiso.</p>
      <button onClick={() => supabase.auth.signOut().then(() => window.location.href='/')} className="bg-black text-white px-8 py-3 rounded-2xl text-[10px] font-black">SALIR</button>
    </div>
  )

  const esSalida = ultimoMovimiento?.tipo_registro === 'ingreso'

  return (
    <div className="min-h-screen bg-white p-4 flex flex-col items-center font-sans text-black">
      <div className="w-full max-w-md mt-4">
        <header className="mb-6">
          <p className="text-[10px] font-black text-blue-600 uppercase">Bienvenido,</p>
          <h1 className="text-2xl font-black text-gray-900 uppercase leading-none">{empleado.nombres}</h1>
        </header>

        {/* VISOR DE CÁMARA */}
        <div className="relative aspect-square w-full bg-gray-100 rounded-[40px] overflow-hidden border-4 border-gray-50 shadow-2xl mb-8">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover scale-x-[-1]" 
          />
          <div className="absolute inset-0 border-[20px] border-black/5 pointer-events-none"></div>
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <span className="bg-black/20 backdrop-blur-md text-white text-[8px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">Cámara Activa</span>
          </div>
        </div>

        {/* BOTÓN DE ACCIÓN */}
        <button 
          disabled={procesando}
          onClick={realizarMarcacion}
          className={`w-full py-6 rounded-[30px] font-black text-sm uppercase text-white transition-all active:scale-95 shadow-2xl ${
            esSalida ? 'bg-orange-500 shadow-orange-100' : 'bg-blue-900 shadow-blue-100'
          } ${procesando ? 'opacity-50' : ''}`}
        >
          {procesando ? 'REGISTRANDO...' : esSalida ? '🔔 MARCAR MI SALIDA' : '⚡ MARCAR MI INGRESO'}
        </button>

        {/* ESTADO ACTUAL */}
        <div className="mt-10 p-6 bg-gray-50 rounded-[30px] border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Estado actual</p>
              <p className="text-xs font-black uppercase text-gray-800">
                {esSalida ? 'En jornada laboral' : 'Fuera de turno'}
              </p>
            </div>
            {ultimoMovimiento && (
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Última hora</p>
                <p className="text-xs font-black text-gray-800">
                  {new Date(ultimoMovimiento.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.href='/')}
          className="w-full mt-8 text-[9px] font-black text-gray-300 hover:text-red-500 uppercase transition-colors"
        >
          Cerrar Sesión de {user?.email}
        </button>
      </div>
    </div>
  )
}