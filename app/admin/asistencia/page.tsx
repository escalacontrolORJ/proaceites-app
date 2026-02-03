'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function RegistrarVisita() {
  const router = useRouter()
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [gpsReady, setGpsReady] = useState(false)
  const [fotoTomada, setFotoTomada] = useState(false)
  const [status, setStatus] = useState('Inicie los sensores para comenzar')
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
  }, [])

  const fetchClientes = async () => {
    const { data } = await supabase.from('clientes').select('id, nombre_comercial, nombre_fiscal')
    if (data) setClientes(data)
  }

  // Paso 1: Activar Cámara Trasera y GPS al presionar el botón
  const activarCamaraYGPS = async () => {
    setStatus('Activando Cámara y GPS... ⏳')
    try {
      // Cámara Trasera (environment)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      // GPS
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`)
            setGpsReady(true)
            setStatus('✅ Cámara y GPS Listos')
          },
          (err) => setStatus('⚠️ Error GPS: Actívelo en su celular'),
          { enableHighAccuracy: true, timeout: 15000 }
        )
      }
    } catch (err) {
      setStatus('❌ Error: No se pudo acceder a la cámara')
    }
  }

  // Paso 2: Capturar la foto manualmente
  const realizarCaptura = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    canvas.width = 640
    canvas.height = 480
    canvas.getContext('2d')?.drawImage(video, 0, 0, 640, 480)
    
    // Pausamos el video para mostrar que la foto se tomó
    video.pause()
    setFotoTomada(true)
    setStatus('📸 Foto capturada. Puede finalizar.')
  }

  // Paso 3: Guardar todo en Supabase
  const finalizarVisita = async () => {
    if (!form.cliente_id) return alert("Seleccione un cliente")
    setLoading(true)
    setStatus('Enviando registro... 🚀')

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.8))
      if (!blob) throw new Error("Error al procesar la imagen")

      const fileName = `visita_${Date.now()}.jpg`
      const { error: storageError } = await supabase.storage
        .from('fotos_asistencia')
        .upload(fileName, blob)

      if (storageError) throw storageError
      const { data: { publicUrl } } = supabase.storage.from('fotos_asistencia').getPublicUrl(fileName)

      const { data: { session } } = await supabase.auth.getSession()
      
      const { error: dbError } = await supabase.from('visitas').insert([{
        empleado_id: session?.user.id,
        vendedor_id: session?.user.id,
        cliente_id: form.cliente_id,
        motivo: form.motivo,
        valor_transaccion: form.valor,
        proxima_visita: form.proxima_visita || null,
        observaciones: form.observaciones,
        foto_local: publicUrl,
        ubicacion_gps: coords
      }])

      if (dbError) throw dbError

      alert("✅ Visita guardada correctamente")
      router.push('/admin/dashboard')

    } catch (error: any) {
      alert("Error: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24 text-slate-900">
      <div className="max-w-md mx-auto space-y-5">
        <h1 className="text-2xl font-black italic tracking-tighter">REGISTRO DE VISITA</h1>
        
        {/* Estado del sistema */}
        <div className={`text-[10px] font-bold p-2 rounded-lg text-center uppercase tracking-widest ${gpsReady ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
          {status}
        </div>
        
        {/* Contenedor de Cámara / Visualizador */}
        <div className="relative w-full aspect-video bg-black rounded-[30px] overflow-hidden shadow-2xl border-4 border-white">
          <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${fotoTomada ? 'hidden' : 'block'}`} />
          <canvas ref={canvasRef} className={`w-full h-full object-cover ${fotoTomada ? 'block' : 'hidden'}`} />
          
          {!videoRef.current?.srcObject && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <button onClick={activarCamaraYGPS} className="bg-white text-slate-900 px-6 py-3 rounded-full font-black text-xs shadow-lg">
                🎥 ABRIR CÁMARA TRASERA
              </button>
            </div>
          )}
        </div>

        {/* Botón para tomar la foto (Solo si la cámara está activa) */}
        {videoRef.current?.srcObject && !fotoTomada && (
          <button 
            onClick={realizarCaptura}
            className="w-full bg-white border-2 border-slate-900 p-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:bg-slate-100"
          >
            📸 TOMAR FOTO DEL LOCAL
          </button>
        )}

        {/* Formulario (Solo visible después de seleccionar cliente) */}
        <div className="space-y-4">
          <select 
            className="w-full p-4 bg-white rounded-2xl border-none font-bold shadow-sm outline-none" 
            onChange={e => setForm({...form, cliente_id: e.target.value})}
          >
            <option value="">Seleccione el Cliente...</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre_comercial} - {c.nombre_fiscal}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <select 
              className="p-4 bg-white rounded-2xl border-none font-bold outline-none shadow-sm"
              onChange={e => setForm({...form, motivo: e.target.value})}
            >
              <option value="Visita">Visita</option>
              <option value="Venta">Venta</option>
              <option value="Cobro">Cobro</option>
              <option value="Cliente Nuevo">Cliente Nuevo</option>
            </select>
            <input 
              type="number" 
              placeholder="Valor $" 
              className="p-4 bg-blue-50 rounded-2xl border-none font-black text-blue-600 shadow-sm outline-none"
              onChange={e => setForm({...form, valor: Number(e.target.value)})}
            />
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <label className="text-[10px] font-black text-slate-400 uppercase">Próxima Visita</label>
            <input type="date" className="w-full bg-transparent font-bold outline-none mt-1" onChange={e => setForm({...form, proxima_visita: e.target.value})} />
          </div>

          <textarea 
            placeholder="Observaciones de la visita..." 
            className="w-full p-4 bg-white rounded-2xl border-none min-h-[80px] shadow-sm outline-none" 
            onChange={e => setForm({...form, observaciones: e.target.value})} 
          />
        </div>

        {/* Botón Finalizar: Solo se activa si hay Foto + GPS + Cliente */}
        <button 
          onClick={finalizarVisita} 
          disabled={loading || !fotoTomada || !gpsReady || !form.cliente_id} 
          className="w-full bg-slate-900 text-white p-6 rounded-[30px] font-black text-lg shadow-xl active:scale-95 transition-all disabled:opacity-20"
        >
          {loading ? 'GUARDANDO...' : '🚀 FINALIZAR VISITA'}
        </button>

        {fotoTomada && (
          <button onClick={() => {setFotoTomada(false); activarCamaraYGPS();}} className="w-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            🔄 Repetir Foto
          </button>
        )}
      </div>
    </div>
  )
}