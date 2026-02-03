'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function RegistrarVisita() {
  const router = useRouter()
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ cliente_id: '', motivo: 'Visita', valor: 0, proxima_visita: '', observaciones: '' })
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetchClientes()
    iniciarCamara()
  }, [])

  const fetchClientes = async () => {
    const { data } = await supabase.from('clientes').select('id, nombre_comercial, nombre_fiscal')
    if (data) setClientes(data)
  }

  const iniciarCamara = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    if (videoRef.current) videoRef.current.srcObject = stream
  }

  const capturarYGuardar = async () => {
    setLoading(true)
    const context = canvasRef.current?.getContext('2d')
    context?.drawImage(videoRef.current!, 0, 0, 400, 300)
    const fotoBase64 = canvasRef.current?.toDataURL('image/jpeg', 0.5)

    // Obtener ubicación
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { data: { user } } = await supabase.auth.getUser()
      const urlMaps = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`

      const { error } = await supabase.from('visitas').insert([{
        vendedor_id: user?.id,
        cliente_id: form.cliente_id,
        motivo: form.motivo,
        valor_transaccion: form.valor,
        proxima_visita: form.proxima_visita || null,
        observaciones: form.observaciones,
        foto_local: fotoBase64,
        ubicacion_gps: urlMaps
      }])

      if (!error) {
        alert("✅ Visita registrada correctamente")
        router.push('/dashboard')
      }
      setLoading(false)
    })
  }

  return (
    <div className="p-6 pb-24 bg-white min-h-screen text-black font-sans">
      <h1 className="text-xl font-black mb-6 uppercase text-blue-900">Registrar Visita</h1>
      
      {/* Camara para foto del local */}
      <div className="w-full h-48 bg-black rounded-3xl overflow-hidden mb-4 border-4 border-gray-100 shadow-inner">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} width="400" height="300" className="hidden" />
      </div>

      <div className="space-y-4">
        <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" onChange={e => setForm({...form, cliente_id: e.target.value})}>
          <option value="">Seleccione Cliente...</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_comercial || c.nombre_fiscal}</option>)}
        </select>

        <select className="w-full p-4 bg-gray-50 rounded-2xl border-none font-bold" onChange={e => setForm({...form, motivo: e.target.value})}>
          <option value="Visita">Visita</option>
          <option value="Venta">Venta</option>
          <option value="Cobro">Cobro</option>
          <option value="Cliente Nuevo">Cliente Nuevo</option>
        </select>

        <div className="bg-blue-50 p-4 rounded-2xl">
          <label className="text-[10px] font-black text-blue-400 uppercase">Valor ($)</label>
          <input type="number" className="w-full bg-transparent text-xl font-black outline-none" onChange={e => setForm({...form, valor: Number(e.target.value)})} />
        </div>

        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Próxima Visita</label>
          <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setForm({...form, proxima_visita: e.target.value})} />
        </div>

        <textarea placeholder="Observaciones de la visita..." className="w-full p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setForm({...form, observaciones: e.target.value})} />

        <button onClick={capturarYGuardar} disabled={loading || !form.cliente_id} className="w-full py-5 bg-blue-700 text-white rounded-3xl font-black shadow-xl uppercase active:scale-95 transition-all">
          {loading ? 'Subiendo Visita...' : 'Finalizar Registro'}
        </button>
      </div>
    </div>
  )
}