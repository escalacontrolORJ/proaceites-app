'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre_local: '',
    nombre_fiscal: '',
    propietario: '',
    direccion: ''
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  async function fetchClientes() {
    try {
      setLoading(true)
      setErrorMsg(null)
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre_local', { ascending: true })
      
      if (error) throw error
      setClientes(data || [])
    } catch (err: any) {
      console.error("Erro ao cargar clientes:", err)
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function crearCliente(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      const { error } = await supabase
        .from('clientes')
        .insert([{
          id: crypto.randomUUID(),
          nombre_local: nuevoCliente.nombre_local,
          nombre_fiscal: nuevoCliente.nombre_fiscal,
          propietario: nuevoCliente.propietario,
          direccion: nuevoCliente.direccion
        }])

      if (error) throw error

      setNuevoCliente({ nombre_local: '', nombre_fiscal: '', propietario: '', direccion: '' })
      setMostrarModal(false)
      fetchClientes()
    } catch (err: any) {
      alert('Erro ao gardar: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarCliente(id: string) {
    if (confirm('¿Estás seguro de que queres eliminar este cliente?')) {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
      
      if (!error) {
        fetchClientes()
      } else {
        alert('Erro ao eliminar: ' + error.message)
      }
    }
  }

  return (
    <div className="pb-24 p-4">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tight">Clientes</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Xestión de Locais</p>
        </div>
        <button 
          onClick={() => setMostrarModal(true)}
          className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-2xl">+</span>
        </button>
      </header>

      {/* Mensaxe de erro se falla a carga */}
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold uppercase">
          ⚠️ Erro: {errorMsg}
          <button onClick={fetchClientes} className="block mt-2 underline">Reintentar carga</button>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Cargando base de datos...</p>
          </div>
        ) : clientes.length === 0 ? (
          <p className="text-center py-10 text-slate-400 font-bold uppercase text-xs italic">Non hai clientes rexistrados</p>
        ) : (
          clientes.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-100 flex justify-between items-center transition-all hover:shadow-md">
              <div className="flex-1 pr-4">
                <h3 className="font-black text-slate-800 uppercase text-sm leading-tight">{c.nombre_local}</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Fiscal: {c.nombre_fiscal || 'N/A'}</p>
                <div className="mt-2 flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-blue-600 uppercase">👤 {c.propietario}</span>
                  <span className="text-[10px] text-slate-500 font-medium italic">📍 {c.direccion}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => router.push(`/admin/clientes/editar/${c.id}`)}
                  className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-blue-100"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => eliminarCliente(c.id)}
                  className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-red-100"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Creación */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[35px] p-8 shadow-2xl animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-slate-800 uppercase mb-6 text-center">Novo Local</h2>
            <form onSubmit={crearCliente} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nome Comercial</label>
                <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 ring-blue-500" value={nuevoCliente.nombre_local} onChange={e => setNuevoCliente({...nuevoCliente, nombre_local: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Razón Social (Fiscal)</label>
                <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 ring-blue-500" value={nuevoCliente.nombre_fiscal} onChange={e => setNuevoCliente({...nuevoCliente, nombre_fiscal: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Dono / Propietario</label>
                <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 ring-blue-500" value={nuevoCliente.propietario} onChange={e => setNuevoCliente({...nuevoCliente, propietario: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Dirección Completa</label>
                <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 ring-blue-500" value={nuevoCliente.direccion} onChange={e => setNuevoCliente({...nuevoCliente, direccion: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-[10px]">Cancelar</button>
                <button type="submit" disabled={guardando} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg shadow-blue-200 disabled:bg-slate-300 transition-all active:scale-95">
                  {guardando ? 'Gardando...' : 'Gardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}