'use client'
/**
 * SISTEMA DE GESTIÓN DE ASISTENCIA
 * VERSION: V1.1
 * MÓDULO: GESTIÓN DE USUARIOS (LECTURA / EDICIÓN / ELIMINACIÓN)
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [version] = useState("V1.1") // Control de versión

  useEffect(() => {
    fetchUsuarios()
  }, [])

  async function fetchUsuarios() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .order('nombres', { ascending: true })

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const eliminarUsuario = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${nombre}? V-${version}`)) {
      const { error } = await supabase
        .from('empleados')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Error: ' + error.message)
      } else {
        setUsuarios(usuarios.filter(u => u.id !== id))
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans relative">
      <AdminNav />
      
      {/* MARCA DE VERSIÓN FLOTANTE */}
      <div className="absolute top-24 right-10 bg-slate-900 text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest opacity-50">
        {version}
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Personal</h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Panel de Control de Usuarios</p>
          </div>
          
          <button 
            onClick={() => window.location.href = '/admin/usuarios/nuevo'}
            className="bg-blue-600 text-white px-8 py-4 rounded-[20px] font-black text-xs shadow-2xl hover:bg-blue-700 hover:-translate-y-1 transition-all uppercase tracking-widest"
          >
            + Registrar Nuevo
          </button>
        </div>

        {/* CONTENEDOR DE TABLA V1.1 */}
        <div className="bg-white rounded-[45px] shadow-2xl overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                  <th className="p-8">Colaborador</th>
                  <th className="p-8">Identificación / Email</th>
                  <th className="p-8">Cargo / Rol</th>
                  <th className="p-8 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {loading ? (
                  <tr><td colSpan={4} className="p-24 text-center animate-pulse text-slate-300 font-black uppercase tracking-widest">Sincronizando con base de datos...</td></tr>
                ) : usuarios.length === 0 ? (
                  <tr><td colSpan={4} className="p-24 text-center text-slate-200 font-black uppercase">No hay personal registrado</td></tr>
                ) : (
                  usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-blue-50/30 transition-all group">
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-lg group-hover:bg-blue-600 transition-colors">
                            {u.nombres?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-slate-800 uppercase text-sm tracking-tight">{u.nombres}</div>
                            <div className="text-[10px] text-slate-400 font-medium">ID: {u.id.substring(0,8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-8 text-xs text-slate-500 font-medium lowercase italic">
                        {u.email || u.cedula || 'N/A'}
                      </td>
                      <td className="p-8">
                        <span className="bg-slate-100 text-slate-400 px-4 py-2 rounded-xl text-[9px] uppercase font-black tracking-widest group-hover:bg-white transition-colors">
                          {u.rol || 'Empleado'}
                        </span>
                      </td>
                      <td className="p-8">
                        <div className="flex justify-center gap-3">
                          {/* EDITAR */}
                          <button 
                            onClick={() => window.location.href = `/admin/usuarios/editar/${u.id}`}
                            className="w-11 h-11 bg-white border border-slate-100 flex items-center justify-center rounded-2xl shadow-sm hover:bg-blue-600 hover:text-white transition-all text-lg"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          
                          {/* ELIMINAR */}
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

        {/* PIE DE PÁGINA VERSIÓN */}
        <div className="mt-8 text-center">
            <span className="text-[10px] font-black text-slate-3