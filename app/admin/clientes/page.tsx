'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function CrearCliente() {
  const [form, setForm] = useState({ nombre_fiscal: '', nombre_comercial: '', ruc: '', direccion: '', observaciones: '' })

  const guardarCliente = async (e: any) => {
    e.preventDefault()
    const { error } = await supabase.from('clientes').insert([form])
    if (error) alert("Error: " + error.message)
    else {
      alert("✅ Cliente creado con éxito")
      setForm({ nombre_fiscal: '', nombre_comercial: '', ruc: '', direccion: '', observaciones: '' })
    }
  }

  return (
    <div className="p-6 pb-24 bg-white min-h-screen text-black">
      <h1 className="text-xl font-black mb-6 uppercase text-blue-900">Nuevo Cliente</h1>
      <form onSubmit={guardarCliente} className="space-y-4">
        <input placeholder="Nombre Fiscal" className="w-full p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setForm({...form, nombre_fiscal: e.target.value})} value={form.nombre_fiscal} required />
        <input placeholder="Nombre Comercial" className="w-full p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setForm({...form, nombre_comercial: e.target.value})} value={form.nombre_comercial} />
        <input placeholder="RUC / Cédula" className="w-full p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setForm({...form, ruc: e.target.value})} value={form.ruc} required />
        <input placeholder="Dirección" className="w-full p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setForm({...form, direccion: e.target.value})} value={form.direccion} />
        <textarea placeholder="Observaciones" className="w-full p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setForm({...form, observaciones: e.target.value})} value={form.observaciones} />
        <button type="submit" className="w-full py-4 bg-blue-700 text-white rounded-2xl font-black shadow-lg uppercase">Guardar Cliente</button>
      </form>
    </div>
  )
}