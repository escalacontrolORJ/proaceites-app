'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AsistenciaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [form, setForm] = useState({
    cliente_id: '',
    notas: '',
    ubicacion: ''
  })

  useEffect(() => {
    // 1. Cargar clientes para el buscador
    const fetchClientes = async () => {
      const { data } = await supabase.from('clientes').select('id, nombre_local').order('nombre_local')
      if (data) setClientes(data)
    }
    fetchClientes()

    // 2. Pedir permiso de GPS de una vez
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setForm(prev => ({ ...prev, ubicacion: `${pos.coords.latitude}, ${pos.coords.longitude}` }))
      })
    }
  }, [])

  const guardarVisita = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const { error } = await supabase.from('visitas').insert([
        { 
          cliente_id: form.cliente_id,
          usuario_id: session?.user.id,
          notas: form.notas,
          coordenadas: form.ubicacion,
          fecha: new Date().toISOString()
        }
      ])

      if (error) throw error
      alert("✅ ¡Visita registrada correctamente!")
      router.push('/admin/dashboard')
    } catch (err: any) {
      alert("Error guardando: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-6 pb-12">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-xl">←</button>
        <h1 className="text-2xl font-black text-blue-900 uppercase">Nueva Visita</h1>
      </header>

      <form onSubmit={guardarVisita} className="space-y-6">
        {/* Selector de Cliente */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Seleccionar Punto de Venta</label>
          <select 
            required
            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[25px] font-bold outline-blue-500"
            onChange={(e) => setForm({...form, cliente_id: e.target.value})}
          >
            <option value="">Buscar cliente...</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre_local}</option>
            ))}
          </select>
        </div>

        {/* GPS Status */}
        <div className={`p-4 rounded-[20px] border flex items-center gap-3 ${form.ubicacion ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
          <span className="text-xl">{form.ubicacion ? '📍' : '⏳'}</span>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500">GPS Status</p>
            <p className="text-xs font-bold text-slate-700">{form.ubicacion ? 'Ubicación Detectada' : 'Obteniendo señal...'}</p>
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Notas de la visita</label>
          <textarea 
            placeholder="¿Qué novedades hubo?"
            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[25px] font-bold outline-blue-500 min-h-[120px]"
            onChange={(e) => setForm({...form, notas: e.target.value})}
          />
        </div>

        {/* Botón Guardar */}
        <button 
          type="submit"
          disabled={loading || !form.cliente_id}
          className="w-full bg-blue-600 text-white p-6 rounded-[30px] font-black uppercase shadow-xl shadow-blue-200 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Finalizar Registro'}
        </button>
      </form>
    </div>
  )
}