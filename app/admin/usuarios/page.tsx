'use client'
/**
 * SISTEMA DE GESTIÓN DE ASISTENCIA
 * VERSION: V1.1 (Sincronizada con tabla empleados)
 * MÓDULO: GESTIÓN DE USUARIOS
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [version] = useState("V1.1")

  useEffect(() => {
    fetchUsuarios()
  }, [])

  async function fetchUsuarios() {
    setLoading(true)
    try {
      // Consultamos las columnas exactas de tu archivo CSV
      const { data, error } = await supabase
        .from('empleados')
        .select('id, nombres, email, rol_empresa, creado_el')
        .order('nombres', { ascending: true })

      if (error) throw error
      setUsuarios(data || [])
    } catch (error: any) {
      console.error('Error Supabase:', error.message)
      alert('Error al cargar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const eliminarUsuario = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${nombre}? Esta acción es permanente.`)) {
      const { error } = await supabase
        .from('empleados')
        .delete()
        .eq('id', id)

      if (error) {
        alert('No se pudo eliminar: ' + error.message)
      } else {
        setUsuarios(usuarios.filter(u => u.id !== id))
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <AdminNav />
      
      <div className="max-w-6xl mx-auto p-4 md:p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Personal</h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Base de Datos Activa {version}
            </p>
          </div>
          
          <button 
            onClick={() => window.location.href = '/admin/usuarios/nuevo'}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest"
          >
            + Registrar Nuevo
          </button>
        </div>

        <div className="bg-white rounded-[45px] shadow-2xl overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                  <th className="p-8">Colaborador</th>
                  <th className="p-8">Correo Electrónico</th>
                  <th className="p-8 text-center">Cargo / Rol</th>
                  <th className="p-8 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {loading ? (
                  <tr><td colSpan={4} className="p-24 text-center text-slate-300 font-black uppercase animate-pulse">Cargando Empleados...</td></tr>
                ) : usuarios.length === 0 ? (
                  <tr><td colSpan={4} className="p-24 text-center text-slate-200 font-black uppercase">No se encontraron registros en 'empleados'</td></tr>
                ) : (
                  usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-blue-50/40 transition-all group">
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-200 text-slate-600 rounded-2xl flex items-center justify-center font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                            {u.nombres?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-slate-800 uppercase text-sm tracking-tight">{u.nombres}</div>
                            <div className="text-[9px] text-slate-400 font-medium">REG: {new Date(u.creado_el).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-8 text-xs text-slate-500 font-medium italic lowercase">
                        {u.email}
                      </td>
                      <td className="p-8 text-center">
                        <span className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[9px] uppercase font-black tracking-widest group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                          {u.rol_empresa || 'Operario'}
                        </span>
                      </td>
                      <td className="p-8">
                        <div className="flex justify-center gap-3">
                          <button 
                            onClick={() => window.location.href = `/admin/usuarios/editar/${u.id}`}
                            className="w-11 h-11 bg-white border border-slate-100 flex items-center justify-center rounded-2xl shadow-sm hover:bg-blue-600 hover:text-white transition-all text-lg"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => eliminarUsuario(u.id, u.nombres)}
                            className="w-11 h-11 bg-white border border-slate-100 flex items-center justify-center rounded-2xl shadow-sm hover:bg-red-600 hover:text-white transition-all text-lg"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}