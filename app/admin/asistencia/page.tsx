'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AsistenciaPage() {
  const [loading, setLoading] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState('')
  const [clientes, setClientes] = useState<any[]>([])
  const [observaciones, setObservaciones] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function checkUserAndLoadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Cargar lista de clientes para el selector
      const { data } = await supabase.from('clientes').select('id, nombre_local').order('nombre_local')
      if (data) setClientes(data)
    }
    checkUserAndLoadData()
  }, [router])

  const registrarVisita = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const { error } = await supabase.from('visitas').insert([
        { 
          cliente_id: clienteSeleccionado,
          usuario_id: session?.user.id,
          observaciones: observaciones,
          fecha: new Date().toISOString()
        }
      ])

      if (error) throw error
      
      alert("✅ Visita registrada con éxito")
      router.push('/admin/dashboard')
    } catch (error: any) {
      alert("Error al registrar: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-24">
      <header className="mb-8">
        <button onClick={() => router.back()} className="text-blue-600 font-bold mb-4 flex items-center gap-2">
          ← Volver
        </button>
        <h1 className="text-3xl font-black text-blue-900 uppercase leading-none">Registrar<br/>Visita</h1>
      </header>

      <form onSubmit={registrarVisita} className="space-y-6">
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Seleccionar Cliente</label>
          <select 
            required
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 border-2 border-transparent focus:border-blue-500"
            onChange={(e) => setClienteSeleccionado(e.target.value)}
          >
            <option value="">Elegir cliente...</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre_local}</option>
            ))}
          </select>
        </div>

        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Observaciones</label>
          <textarea 
            placeholder="¿Qué se hizo en la visita?"
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 border-2 border-transparent focus:border-blue-500 min-h-[120px]"
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !clienteSeleccionado}
          className="w-full bg-blue-600 text-white p-6 rounded-[25px] font-black uppercase shadow-xl disabled:bg-slate-300 active:scale-95 transition-all"
        >
          {loading ? 'Guardando...' : 'Finalizar Registro'}
        </button>
      </form>
    </div>
  )
}