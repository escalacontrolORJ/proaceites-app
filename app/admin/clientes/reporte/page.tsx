'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import Link from 'next/link'

export default function ReporteClientes() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)
  const [filtro, setFiltro] = useState('')
  const [clienteAEliminar, setClienteAEliminar] = useState<any>(null)

  useEffect(() => {
    fetchClientes()
  }, [])

  async function fetchClientes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre_fiscal', { ascending: true })
    if (data) setClientes(data)
    setLoading(false)
  }

  const eliminarCliente = async () => {
    if (!clienteAEliminar) return
    
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', clienteAEliminar.id)

    if (error) {
      alert("Error al eliminar: " + error.message)
    } else {
      setClientes(clientes.filter(c => c.id !== clienteAEliminar.id))
      setClienteAEliminar(null)
    }
  }

  const clientesFiltrados = clientes.filter(c => 
    c.nombre_fiscal?.toLowerCase().includes(filtro.toLowerCase()) || 
    c.nombre_comercial?.toLowerCase().includes(filtro.toLowerCase()) ||
    c.ruc?.includes(filtro)
  )

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen font-sans text-black">
      <div className="max-w-md mx-auto">
        <header className="pt-6 mb-6">
          <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter leading-none">Cartera de Clientes</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Base de Datos Proaceites</p>
        </header>

        {/* BUSCADOR */}
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Buscar por nombre o RUC..." 
            className="w-full p-4 pl-12 rounded-[22px] border-none shadow-sm text-sm focus:ring-2 focus:ring-blue-500 transition-all bg-white"
            onChange={(e) => setFiltro(e.target.value)}
          />
          <span className="absolute left-4 top-4 opacity-30 text-lg">🔍</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-black text-[10px] uppercase tracking-widest">Sincronizando...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {clientesFiltrados.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
                
                {/* FOTO MINIATURA */}
                <div 
                  className="relative w-20 h-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border-2 border-gray-50 group bg-gray-100"
                  onClick={() => setFotoExpandida(c.foto_local)}
                >
                  {c.foto_local ? (
                    <img src={c.foto_local} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">SIN FOTO</div>
                  )}
                </div>

                {/* INFO DEL CLIENTE */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="font-black text-blue-900 uppercase text-[11px] leading-tight truncate pr-2">
                      {c.nombre_comercial || c.nombre_fiscal}
                    </h2>
                    <div className="flex gap-1 flex-shrink-0">
                      <Link href={`/admin/clientes/editar/${c.id}`} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors">
                        <span className="text-xs">✏️</span>
                      </Link>
                      <button 
                        onClick={() => setClienteAEliminar(c)}
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors"
                      >
                        <span className="text-xs">🗑️</span>
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-gray-400 font-mono mb-1">ID/RUC: {c.ruc}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-1 mb-2">📍 {c.direccion || 'Dirección no registrada'}</p>
                  
                  <div className="flex gap-2">
                    <a href={c.ubicacion_gps} target="_blank" className="text-[8px] font-black bg-gray-50 text-gray-400 px-3 py-1.5 rounded-full uppercase tracking-tighter hover:bg-blue-100 hover:text-blue-600 transition-colors">
                      📍 GPS Fachada
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL ELIMINAR */}
        {clienteAEliminar && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white rounded-[45px] p-8 w-full max-w-sm text-center shadow-2xl border border-gray-100">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-black uppercase text-gray-900 mb-2">¿Eliminar Cliente?</h2>
              <p className="text-xs text-gray-500 mb-8 px-4">Estás por borrar a <span className="font-bold text-black">{clienteAEliminar.nombre_fiscal}</span>. Los datos de este cliente se perderán para siempre.</p>
              <div className="flex flex-col gap-3">
                <button onClick={eliminarCliente} className="w-full py-5 bg-red-600 text-white rounded-[20px] font-black uppercase shadow-lg shadow-red-100 active:scale-95 transition-transform">SÍ, ELIMINAR AHORA</button>
                <button onClick={() => setClienteAEliminar(null)} className="w-full py-4 bg-gray-50 text-gray-400 rounded-[20px] font-black uppercase active:scale-95 transition-transform">CANCELAR</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FOTO GRANDE (LIGHTBOX) */}
        {fotoExpandida && (
          <div 
            className="fixed inset-0 bg-black/95 z-[120] flex flex-col items-center justify-center p-4 animate-in zoom-in duration-200" 
            onClick={() => setFotoExpandida(null)}
          >
            <div className="relative w-full max-w-lg">
              <img src={fotoExpandida} className="w-full rounded-[40px] shadow-2xl border-4 border-white/10" />
              <button className="absolute -top-12 right-0 text-white font-black text-xl bg-white/10 w-12 h-12 rounded-full flex items-center justify-center">✕</button>
              <p className="text-center text-white/40 text-[9px] mt-6 font-bold uppercase tracking-[0.4em]">Vista de Fachada Registrada</p>
            </div>
          </div>
        )}

        {clientesFiltrados.length === 0 && !loading && (
          <div className="text-center py-20 opacity-30">
            <p className="text-5xl mb-4">📂</p>
            <p className="text-xs font-black uppercase tracking-widest">Lista Vacía</p>
          </div>
        )}
      </div>
    </div>
  )
}