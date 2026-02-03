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

  const [form, setForm] = useState({ 
    cliente_id: '', 
    motivo: 'Visita', 
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
    const { data } = await supabase.from('clientes').select('id, nombre_comercial, nombre_fiscal')
    if (data) setClientes(data)
  }

  const iniciarSensores = async () => {
    setStatus('Buscando GPS y Cámara... ⏳')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      setStatus('Error: Cámara no disponible 📸')
    }

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
      (err) => setStatus('Error: Activa el GPS ⚠️'),
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const capturarYGuardar = async () => {
    if (!form.cliente_id) return alert("Seleccione un cliente")
    setLoading(true)
    setStatus('Guardando visita...')

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      if (!canvas || !video) return

      canvas.width = 640
      canvas.height = 480
      canvas.getContext('2d')?.drawImage(video, 0, 0, 640, 480)
      
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.8))
      if (!blob) throw new Error("Error al capturar foto")

      const fileName = `visita_${Date.now()}.jpg`
      const { error: storageError } = await supabase.storage
        .from('fotos_asistencia')
        .upload(fileName, blob)

      if (storageError) throw storageError
      const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("No hay sesión activa")

      // MAPEO EXACTO A TU TABLA 'visitas'
      const { error: dbError } = await supabase.from('visitas').insert([{
        empleado_id: session.user.id,
        vendedor_id: session.user.id, // Mismo ID del que registra
        cliente_id: form.cliente_id,
        motivo: form.motivo,
        valor_transaccion: form.valor, // Coincide con tu base de datos
        proxima_visita: form.proxima_visita || null,
        observaciones: form.observaciones,
        foto_local: publicUrl,        // Coincide con tu base de datos
        ubicacion_gps: coords        // Coincide con tu base de datos
        // fecha y hora se llenan solos por el default de tu tabla
      }])

      if (dbError) throw dbError

      alert("✅ Visita registrada con éxito")
      router.push('/admin/dashboard')

    } catch (error: any) {
      alert("Error en base de datos: " + error.message)
    } finally {
      setLoading(false)
      setStatus('Listo')
    }
  }

  return (
    <div className="min-h-screen bg-white p-6 pb-24 text-slate-900">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-black italic">REGISTRAR VISITA</h1>
        <p className={`text-[10px] font-bold uppercase ${gpsReady ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`}>
          {status}
        </p>
        
        <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-lg">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {!gpsReady && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white text-[10px] font-bold">ESPERANDO GPS...</p>
            </div>
          )}
        </div>

        <select 
          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none" 
          onChange={e => setForm({...form, cliente_id: e.target.value})}
        >
          <option value="">Seleccionar Cliente...</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>{c.nombre_comercial} - {c.nombre_fiscal}</option>
          ))}
        </select>

        <select 
          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold text-slate-700 outline-none" 
          onChange={e => setForm({...form, motivo: e.target.value})}
          value={form.motivo}
        >
          {/* Mantenemos exactamente los permitidos por tu CHECK en SQL */}
          <option value="Visita">Visita</option>
          <option value="Venta">Venta</option>
          <option value="Cobro">Cobro</option>
          <option value="Cliente Nuevo">Cliente Nuevo</option>
        </select>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <label className="text-[10px] font-black text-blue-400 uppercase">Valor Recaudado ($)</label>
          <input 
            type="number" 
            placeholder="0.00"
            className="w-full bg-transparent text-xl font-black text-blue-600 outline-none" 
            onChange={e => setForm({...form, valor: Number(e.target.value)})} 
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Próxima Visita</label>
          <input 
            type="date" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold outline-none" 
            onChange={e => setForm({...form, proxima_visita: e.target.value})} 
          />
        </div>

        <textarea 
          placeholder="Observaciones de la visita..." 
          className="w-full p-4 bg-gray-50 rounded-2xl border-none min-h-[100px] outline-none" 
          onChange={e => setForm({...form, observaciones: e.target.value})} 
        />

        <button 
          onClick={capturarYGuardar} 
          disabled={loading || !form.cliente_id || !gpsReady} 
          className="w-full bg-blue-600 text-white p-6 rounded-3xl font-black text-lg shadow-xl active:scale-95 transition-all disabled:opacity-30"
        >
          {loading ? 'GUARDANDO...' : '🚀 FINALIZAR VISITA'}
        </button>
      </div>
    </div>
  )
}