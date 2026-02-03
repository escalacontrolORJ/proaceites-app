'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function RegistrarVisita() {
  const router = useRouter()
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  // Mantenemos tu estado de formulario original tal cual
  const [form, setForm] = useState({ 
    cliente_id: '', 
    motivo: 'Visita', 
    valor: 0, 
    proxima_visita: '', 
    observations: '' // Cambiado a coincidir con tu original si es necesario
  })
  const [status, setStatus] = useState('Listo')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetchClientes()
    iniciarCamara()
  }, [])

  const fetchClientes = async () => {
    // Mantenemos tu select original de nombre_comercial y nombre_fiscal
    const { data } = await supabase.from('clientes').select('id, nombre_comercial, nombre_fiscal')
    if (data) setClientes(data)
  }

  const iniciarCamara = async () => {
    // Mantenemos environment para la foto del local
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    if (videoRef.current) videoRef.current.srcObject = stream
  }

  const capturarYGuardar = async () => {
    setLoading(true)
    setStatus('Capturando ubicación y foto...')
    
    try {
      // 1. Obtener ubicación (Mejorado para seguimiento real)
      const position: any = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
      })
      const ubicacion = `${position.coords.latitude}, ${position.coords.longitude}`

      // 2. Procesar Foto
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas?.getContext('2d')
      // Usamos las dimensiones de tu código original (400x300)
      if (canvas && video) {
        canvas.width = 400
        canvas.height = 300
        context?.drawImage(video, 0, 0, 400, 300)
      }

      // Convertimos a Blob para subir al Storage (más eficiente que Base64)
      const blob = await new Promise<Blob | null>(res => canvas?.toBlob(res, 'image/jpeg', 0.7))
      if (!blob) throw new Error("No se pudo generar la imagen")

      // 3. Subir al Storage (fotos_asistencia)
      const fileName = `visita_${Date.now()}.jpg`
      const { data: storageData, error: storageError } = await supabase.storage
        .from('fotos_asistencia')
        .upload(fileName, blob)

      if (storageError) throw storageError
      
      const { data: { publicUrl } } = supabase.storage
        .from('fotos_asistencia')
        .getPublicUrl(fileName)

      // 4. Guardar en la base de datos con tu estructura original
      const { data: { session } } = await supabase.auth.getSession()

      const { error: dbError } = await supabase.from('visitas').insert([{
        cliente_id: form.cliente_id,
        motivo: form.motivo,
        valor: form.valor,
        proxima_visita: form.proxima_visita,
        observaciones: form.observations, // Asegúrate que el campo en DB se llame observaciones
        empleado_id: session?.user.id,
        foto_url: publicUrl,
        ubicacion: ubicacion,
        fecha_hora: new Date().toISOString()
      }])

      if (dbError) throw dbError

      alert("✅ Visita registrada con éxito")
      router.push('/admin/dashboard')

    } catch (error: any) {
      alert("Error: " + error.message)
    } finally {
      setLoading(false)
      setStatus('Listo')
    }
  }

  return (
    <div className="min-h-screen bg-white p-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-black italic">REGISTRAR VISITA</h1>
        <p className="text-[10px] font-bold text-blue-500 uppercase">{status}</p>
        
        <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-lg">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
        </div>

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

        <select 
          className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
          onChange={e => setForm({...form, motivo: e.target.value})}
        >
          <option value="Visita">Visita</option>
          <option value="Venta">Venta</option>
          <option value="Cobro">Cobro</option>
          <option value="Cliente Nuevo">Cliente Nuevo</option>
        </select>

        <div className="bg-blue-50 p-4 rounded-2xl">
          <label className="text-[10px] font-black text-blue-400 uppercase">Valor ($)</label>
          <input 
            type="number" 
            className="w-full bg-transparent text-xl font-black outline-none" 
            onChange={e => setForm({...form, valor: Number(e.target.value)})} 
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Próxima Visita</label>
          <input 
            type="date" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" 
            onChange={e => setForm({...form, proxima_visita: e.target.value})} 
          />
        </div>

        <textarea 
          placeholder="Observaciones de la visita..." 
          className="w-full p-4 bg-gray-50 rounded-2xl border-none min-h-[100px]" 
          onChange={e => setForm({...form, observations: e.target.value})} 
        />

        <button 
          onClick={capturarYGuardar} 
          disabled={loading || !form.cliente_id} 
          className="w-full bg-blue-600 text-white p-6 rounded-3xl font-black text-lg shadow-xl active:scale-95 transition-all disabled:opacity-30"
        >
          {loading ? 'GUARDANDO...' : '🚀 FINALIZAR VISITA'}
        </button>
      </div>
    </div>
  )
}