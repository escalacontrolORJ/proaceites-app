'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function RegistrarVisita() {
  const router = useRouter()
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [gpsReady, setGpsReady] = useState(false)
  const [status, setStatus] = useState('Iniciando sensores...')
  const [coords, setCoords] = useState('')

  // Mantenemos todos tus campos originales y añadimos los nuevos
  const [form, setForm] = useState({ 
    cliente_id: '', 
    motivo: 'Venta', 
    valor: 0, 
    proxima_visita: '', 
    observaciones: '' 
  })
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetchClientes()
    iniciarSensores()
  }, [])

  const fetchClientes = async () => {
    // Mantenemos tu select de nombre_comercial y nombre_fiscal
    const { data } = await supabase.from('clientes').select('id, nombre_comercial, nombre_fiscal')
    if (data) setClientes(data)
  }

  const iniciarSensores = async () => {
    setStatus('Buscando GPS y Cámara... ⏳')
    
    // 1. Cámara (Mantenemos tu configuración de cámara trasera)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setStatus('Error: Cámara no disponible 📸')
    }

    // 2. GPS (Con la lógica de espera para que el botón se active solo al estar listo)
    if (!navigator.geolocation) {
      setStatus('GPS no soportado')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`)
        setGpsReady(true)
        setStatus('✅ SISTEMA LISTO')
      },
      (err) => {
        setStatus('Error: Activa el GPS ⚠️')
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const capturarYGuardar = async () => {
    setLoading(true)
    setStatus('Guardando visita...')

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return

      // Dimensiones de tu código original
      canvas.width = 400
      canvas.height = 300
      canvas.getContext('2d')?.drawImage(video, 0, 0, 400, 300)
      
      // Cambio de Base64 a Blob para usar Storage (más eficiente)
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.7))
      if (!blob) throw new Error("No se pudo capturar la foto")

      const fileName = `visita_${Date.now()}.jpg`
      const { error: storageError } = await supabase.storage
        .from('fotos_asistencia')
        .upload(fileName, blob)

      if (storageError) throw storageError
      const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)

      const { data: { session } } = await supabase.auth.getSession()

      const { error: dbError } = await supabase.from('visitas').insert([{
        cliente_id: form.cliente_id,
        motivo: form.motivo,
        valor: form.valor,
        proxima_visita: form.proxima_visita,
        observaciones: form.observaciones,
        empleado_id: session?.user.id,
        foto_url: publicUrl,
        ubicacion: coords,
        fecha_hora: new Date().toISOString()
      }])

      if (dbError) throw dbError

      alert("✅ Visita registrada con éxito")
      router.push('/admin/dashboard')

    } catch (error: any) {
      alert("Error: " + error.message)
    } finally {
      setLoading(false)
      setStatus('✅ Listo')
    }
  }

  return (
    <div className="min-h-screen bg-white p-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-black italic">REGISTRAR VISITA</h1>
        <p className={`text-[10px] font-bold uppercase ${gpsReady ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`}>
          {status}
        </p>
        
        {/* Cámara */}
        <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-lg border-2 border-slate-100">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {!gpsReady && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white text-[10px] font-bold animate-bounce">ESPERANDO SEÑAL GPS...</p>
            </div>
          )}
        </div>

        {/* Listado de Clientes (Mantenemos tu lógica original) */}
        <select 
          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
          onChange={e => setForm({...form, cliente_id: e.target.value})}
        >
          <option value="">Seleccionar Cliente...</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre_comercial} - {c.nombre_fiscal}
            </option>
          ))}
        </select>

        {/* Nuevo Combo de Motivos solicitado */}
        <select 
          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-slate-700" 
          onChange={e => setForm({...form, motivo: e.target.value})}
          value={form.motivo}
        >
          <option value="Cliente Nuevo">Cliente Nuevo</option>
          <option value="Venta">Venta</option>
          <option value="Cobro">Cobro</option>
          <option value="Recuperar Cliente">Recuperar Cliente</option>
          <option value="Otros">Otros</option>
        </select>

        {/* Nuevo Campo de Valor Monetario */}
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <label className="text-[10px] font-black text-blue-400 uppercase">Valor Recaudado ($)</label>
          <input 
            type="number" 
            placeholder="0.00"
            className="w-full bg-transparent text-xl font-black text-blue-600 outline-none" 
            onChange={e => setForm({...form, valor: Number(e.target.value)})} 
          />
        </div>

        {/* Próxima Visita (Mantenemos tu campo original) */}
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Próxima Visita</label>
          <input 
            type="date" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
            onChange={e => setForm({...form, proxima_visita: e.target.value})} 
          />
        </div>

        {/* Observaciones (Mantenemos tu campo original) */}
        <textarea 
          placeholder="Observaciones de la visita..." 
          className="w-full p-4 bg-gray-50 rounded-2xl border-none min-h-[100px]" 
          onChange={e => setForm({...form, observaciones: e.target.value})} 
        />

        {/* Botón con validación de GPS y carga */}
        <button 
          onClick={capturarYGuardar} 
          disabled={loading || !form.cliente_id || !gpsReady} 
          className="w-full bg-blue-600 text-white p-6 rounded-3xl font-black text-lg shadow-xl active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
        >
          {loading ? 'GUARDANDO...' : '🚀 FINALIZAR VISITA'}
        </button>
      </div>
    </div>
  )
}