'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import Link from 'next/link'

export default function ListaEmpleados() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmarEliminar, setConfirmarEliminar] = useState<any>(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchEmpleados()
  }, [])

  async function fetchEmpleados() {
    setLoading(true)
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .order('nombre', { ascending: true })
    
    if (error) console.error(error)
    else setEmpleados(data || [])
    setLoading(false)
  }

  const borrarEmpleado = async () => {
    if (!confirmarEliminar) return
    
    const { error } = await supabase
      .from('empleados')
      .delete()
      .eq('id', confirmarEliminar.id)

    if (error) {
      alert("Error al eliminar: " + error.message)
    } else {
      setEmpleados(empleados.filter(e => e.id !== confirmarEliminar.id))
      setConfirmarEliminar(null)
    }
  }

  const filtrados = empleados.filter(e => 
    e.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.rol_empresa?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 text-black font-sans">
      <div className="max-w-md mx-auto pt-6">
        
        {/* HEADER CON BOTÓN NUEVO */}
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter leading-none">Personal</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gestión Proaceites</p>
          </div>
          <Link 
            href="/admin/empleados/nuevo" 
            className="w-12 h-12 bg-blue-700 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-100 active:scale-90 transition-all"
          >
            +
          </Link>
        </header>

        {/* BUSCADOR */}
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Buscar por nombre o cargo..." 
            className="w-full p-4 pl-12 rounded-[22px] border-none shadow-sm text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span className="absolute left-4 top-4 opacity-30 text-lg">🔍</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-black text-[10px] uppercase tracking-widest">Sincronizando...</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtrados.map((emp) => (
              <div key={emp.id} className="bg-white p-4 rounded-[30px] shadow-sm border border-gray-100 flex items-center justify-between transition-all active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  {/* Avatar con iniciales */}
                  <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 font-black text-xs uppercase">
                    {emp.nombre ? emp.nombre.substring(0, 2) : '??'}
                  </div>
                  
                  <div className="min-w-0">
                    <h2 className="font-black text-xs uppercase text-gray-800 leading-tight truncate w-32">
                      {emp.nombre || 'Sin Nombre'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                        emp.rol_empresa === 'Supervisor' ? 'bg-purple-100 text-purple-600' :
                        emp.rol_empresa === 'Vendedor' ? 'bg-orange-100 text-orange-600' : 
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {emp.rol_empresa}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACCIONES */}
                <div className="flex gap-1">
                  <Link 
                    href={`/admin/empleados/editar/${emp.id}`} 
                    className="w-9 h-9 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <span className="text-xs">✏️</span>
                  </Link>
                  <button 
                    onClick={() => setConfirmarEliminar(emp)}
                    className="w-9 h-9 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <span className="text-xs">🗑️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODAL DE ELIMINACIÓN */}
        {confirmarEliminar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white rounded-[45px] p-8 w-full max-w-sm text-center shadow-2xl">
              <div className="text-5xl mb-4">🚫</div>
              <h2 className="text-xl font-black uppercase text-gray-900 mb-2 leading-none">Dar de Baja</h2>
              <p className="text-[11px] text-gray-500 mb-8 px-4 leading-relaxed">
                ¿Confirmas la eliminación de <span className="font-bold text-black">{confirmarEliminar.nombre}</span>? Esta acción no se puede revertir.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={borrarEmpleado} 
                  className="w-full py-5 bg-red-600 text-white rounded-[22px] font-black uppercase shadow-lg shadow-red-100 active:scale-95 transition-transform"
                >
                  Eliminar del Sistema
                </button>
                <button 
                  onClick={() => setConfirmarEliminar(null)} 
                  className="w-full py-4 bg-gray-50 text-gray-400 rounded-[22px] font-black uppercase active:scale-95 transition-transform"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {filtrados.length === 0 && !loading && (
          <div className="text-center py-20 opacity-20">
            <p className="text-4xl mb-4">👥</p>
            <p className="text-[10px] font-black uppercase tracking-widest">No hay personal</p>
          </div>
        )}
      </div>
    </div>
  )
}