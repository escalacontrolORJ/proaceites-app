'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre_local: '',
    nombre_fiscal: '', // Campo que estaba faltando
    propietario: '',
    direccion: ''
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  async function fetchClientes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre_local', { ascending: true })
    if (data) setClientes(data)
    setLoading(false)
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
          nombre_fiscal: nuevoCliente.nombre_fiscal, // Enviamos el valor para evitar el error
          propietario: nuevoCliente.propietario,
          direccion: nuevoCliente.direccion
        }])

      if (error) throw error

      setNuevoCliente({ nombre_local: '', nombre_fiscal: '', propietario: '', direccion: '' })
      setMostrarModal(false)
      fetchClientes()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="pb-24 p-4">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-blue-900 uppercase">Clientes</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de Datos de Locales</p>
        </div>
        <button 
          onClick={() => setMostrarModal(true)}
          className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
        >
          <span className="text-2xl">+</span>
        </button>
      </header>

      {/* Listado */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-slate-400 font-bold py-10 animate-pulse">CARGANDO CLIENTES...</p>
        ) : (
          clientes.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-100">
              <h3 className="font-black text-slate-800 uppercase text-base">{c.nombre_local}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Razón Social: {c.nombre_fiscal}</p>
              <p className="text-xs font-bold text-blue-600 mb-2 uppercase">{c.propietario}</p>
              <div className="flex items-start gap-2 text-slate-400">
                <span className="text-xs">📍 {c.direccion}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[35px] p-8 shadow-2xl animate-in slide-in-from-bottom max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-slate-800 uppercase mb-6 text-center">Registrar Local</h2>
            
            <form onSubmit={crearCliente} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre Comercial (Local)</label>
                <input 
                  required
                  placeholder="Ej: Tienda Don Pepe"
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold text-slate-800"
                  value={nuevoCliente.nombre_local}
                  onChange={e => setNuevoCliente({...nuevoCliente, nombre_local: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre Fiscal / Razón Social</label>
                <input 
                  required
                  placeholder="Ej: Jose Martinez S.A."
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold text-slate-800"
                  value={nuevoCliente.nombre_fiscal}
                  onChange={e => setNuevoCliente({...nuevoCliente, nombre_fiscal: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre del Propietario</label>
                <input 
                  required
                  placeholder="Ej: José Martínez"
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold text-slate-800"
                  value={nuevoCliente.propietario}
                  onChange={e => setNuevoCliente({...nuevoCliente, propietario: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Dirección / Referencia</label>
                <input 
                  required
                  placeholder="Ej: Calle 123 frente al parque"
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold text-slate-800"
                  value={nuevoCliente.direccion}
                  onChange={e => setNuevoCliente({...nuevoCliente, direccion: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 py-4 text-slate-400 font-bold uppercase text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={guardando}
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg shadow-blue-200"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}