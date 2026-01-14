'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function VisitaClientePage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [foto, setFoto] = useState<File | null>(null)
  
  const [form, setForm] = useState({
    cliente_id: '',
    motivo: 'Venta',
    recaudo: '',
    observaciones: '',
    ubicacion: ''
  })

  useEffect(() => {
    fetchClientes()
    obtenerUbicacion()
  }, [])

  async function fetchClientes() {
    const { data } = await supabase.from('clientes').select('*').order('nombre_local')
    if (data) setClientes(data)
  }

  function obtenerUbicacion() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setForm(prev => ({ ...prev, ubicacion: `${pos.coords.latitude},${pos.coords.longitude}` }))
      })
    }
  }

  async function guardarVisita(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    // 1. Subir foto si existe (Lógica simplificada)
    let fotoUrl = ''
    if (foto) {
      const fileName = `${Date.now()}-${foto.name}`
      const { data } = await supabase.storage.from('visitas').upload(fileName, foto)
      if (data) fotoUrl = data.path
    }

    // 2. Guardar en la tabla 'visitas'
    const { error } = await supabase.from('visitas').insert([{
      ...form,
      foto_url: fotoUrl,
      fecha: new Date().toISOString()
    }])

    if (!error) {
      alert('Visita registrada con éxito')
      setForm({ cliente_id: '', motivo: 'Venta', recaudo: '', observaciones: '', ubicacion: '' })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto p-6 pb-24">
      <h1 className="text-2xl font-black text-blue-900 uppercase mb-6 text-center">Registrar Visita</h1>
      
      <form onSubmit={guardarVisita} className="space-y-4">
        {/* Selector de Cliente */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">Seleccionar Cliente</label>
          <select 
            required
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold appearance-none"
            value={form.cliente_id}
            onChange={e => setForm({...form, cliente_id: e.target.value})}
          >
            <option value="">Seleccione un local...</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre_local}</option>
            ))}
          </select>
        </div>

        {/* Motivo de Visita */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">Motivo</label>
          <select 
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold appearance-none"
            value={form.motivo}
            onChange={e => setForm({...form, motivo: e.target.value})}
          >
            <option value="Venta">💰 Venta Nueva</option>
            <option value="Cobro">💵 Solo Cobro</option>
            <option value="Entrega">📦 Entrega de Pedido</option>
            <option value="Cerrado">🚫 Local Cerrado</option>
          </select>
        </div>

        {/* Recaudo en Dólares */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">Cantidad Recaudada ($)</label>
          <input 
            type="number" step="0.01" placeholder="0.00"
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold"
            value={form.recaudo}
            onChange={e => setForm({...form, recaudo: e.target.value})}
          />
        </div>

        {/* Foto del Local */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">Foto del Local (GPS Activo)</label>
          <input 
            type="file" accept="image/*" capture="environment"
            className="w-full p-4 bg-slate-100 rounded-2xl text-xs"
            onChange={e => setFoto(e.target.files?.[0] || null)}
          />
        </div>

        {/* Observaciones */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 ml-2">Observaciones</label>
          <textarea 
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold min-h-[100px]"
            value={form.observaciones}
            onChange={e => setForm({...form, observaciones: e.target.value})}
          />
        </div>

        <button 
          type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest text-sm"
        >
          {loading ? 'Guardando...' : 'Finalizar Visita'}
        </button>
      </form>
    </div>
  )
}