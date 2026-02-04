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
    // CAMBIO: Seleccionamos nombre_local que es el nombre comercial
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre_local, nombre_fiscal')
      .order('nombre_local', { ascending: true })
    if (data) setClientes(data)
  }

  const activarCamaraYGPS = async () => {
    setStatus('Activando Cámara y GPS... ⏳')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { exact: "environment" } } 
      }).catch(() => navigator.mediaDevices.getUserMedia({ video: true }))
      
      if (videoRef.current) videoRef.current.srcObject = stream
      
      navigator.geolocation.watchPosition(
        (pos) => {
          setCoords(`${pos.coords.latitude}, ${pos.coords.longitude}`)
          setGpsReady(true)
          setStatus('Sistemas Listos ✅')
        },
        (err) => setStatus('Error GPS: active la ubicación'),
        { enableHighAccuracy: true }
      )
    } catch (err) {
      setStatus('Error de Cámara')
    }
  }

  const capturarFoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      setFotoTomada(true)
    }
  }

  const finalizarVisita = async () => {
    if (!form.cliente_id) return alert("Seleccione un cliente")
    setLoading(true)
    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.7))
      if (!blob) return

      const fileName = `visita_${Date.now()}.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos_asistencia')
        .upload(fileName, blob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('fotos_asistencia')
        .getPublicUrl(fileName)

      const { error: insertError } = await supabase.from('visitas').insert([{
        cliente_id: form.cliente_id,
        vendedor_id: (await supabase.auth.getUser()).data.user?.id,
        motivo: form.motivo,
        foto_local: publicUrl,
        ubicacion_gps: coords,
        valor_transaccion: form.valor,
        proxima_visita: form.proxima_visita,
        observaciones: form.observaciones,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString()
      }])

      if (insertError) throw insertError

      alert("Visita registrada con éxito")
      router.push('/vendedor/dashboard')
    } catch (err) {
      console.error(err)
      alert("Error al guardar la visita")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-24 font-sans">
      <div className="max-w-lg mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Registro de Visita</h1>
          <button onClick={() => router.back()} className="text-[10px] font-black uppercase text-slate-400">Cancelar</button>
        </header>

        <div className={`p-4 rounded-3xl text-center font-black uppercase text-[10px] tracking-widest shadow-sm ${gpsReady ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600 animate-pulse'}`}>
          {status}
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-sm space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Cliente / Punto de Venta</label>
            <select 
              className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 ring-blue-500 appearance-none"
              value={form.cliente_id}
              onChange={e => setForm({...form, cliente_id: e.target.value})}
            >
              <option value="">-- SELECCIONE UN LOCAL --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {/* Prioridad al nombre comercial (local) */}
                  {(c.nombre_local || c.nombre_fiscal || 'Sin nombre').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Motivo</label>
              <select 
                className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold text-slate-800"
                value={form.motivo}
                onChange={e => setForm({...form, motivo: e.target.value})}
              >
                <option value="Visita">Solo Visita</option>
                <option value="Venta">Venta Realizada</option>
                <option value="Cobro">Gestión de Cobro</option>
                <option value="Entrega">Entrega de Pedido</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Valor $</label>
              <input 
                type="number" 
                placeholder="0.00"
                className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold text-slate-800"
                onChange={e => setForm({...form, valor: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Próxima Visita</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold text-slate-800"
              onChange={e => setForm({...form, proxima_visita: e.target.value})} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Observaciones</label>
            <textarea 
              placeholder="Detalles de la gestión..." 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none min-h-[80px] outline-none font-bold text-slate-800" 
              onChange={e => setForm({...form, observaciones: e.target.value})} 
            />
          </div>
        </div>

        <div className="relative aspect-square bg-black rounded-[40px] overflow-hidden shadow-2xl border-4 border-white">
          <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${fotoTomada ? 'hidden' : 'block'}`} />
          <canvas ref={canvasRef} className={`w-full h-full object-cover ${fotoTomada ? 'block' : 'hidden'}`} />
          {gpsReady && !fotoTomada && (
             <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <button onClick={capturarFoto} className="bg-white/20 backdrop-blur-md border-2 border-white p-6 rounded-full">
                  <div className="w-12 h-12 bg-white rounded-full shadow-lg"></div>
                </button>
             </div>
          )}
        </div>

        {!fotoTomada ? (
          <button 
            onClick={activarCamaraYGPS}
            className="w-full bg-blue-600 text-white p-6 rounded-[30px] font-black text-lg shadow-xl shadow-blue-200"
          >
            📸 ABRIR CÁMARA Y GPS
          </button>
        ) : (
          <div className="space-y-3">
            <button 
              onClick={finalizarVisita} 
              disabled={loading || !gpsReady || !form.cliente_id} 
              className="w-full bg-slate-900 text-white p-6 rounded-[30px] font-black text-lg shadow-xl disabled:opacity-30"
            >
              {loading ? 'GUARDANDO...' : '🚀 FINALIZAR VISITA'}
            </button>
            <button onClick={() => setFotoTomada(false)} className="w-full text-[10px] font-black uppercase text-slate-400 text-center">Repetir Foto</button>
          </div>
        )}
      </div>
    </div>
  )
}