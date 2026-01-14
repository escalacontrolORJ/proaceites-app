'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [creando, setCreando] = useState(false)
  const router = useRouter()

  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombres: '',
    email: '',
    rol_empresa: 'Operario'
  })

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
      if (data) setUsuarios(data)
    } catch (error) {
      console.error('Error al cargar:', error)
    }
    setLoading(false)
  }

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault()
    setCreando(true)
    
    try {
      // SOLUCIÓN AL ERROR: Generamos un ID único manualmente
      const idUnico = crypto.randomUUID()

      const { error } = await supabase
        .from('empleados')
        .insert([{
          id: idUnico, // Enviamos el ID generado
          nombres: nuevoUsuario.nombres,
          email: nuevoUsuario.email.toLowerCase().trim(),
          rol_empresa: nuevoUsuario.rol_empresa
        }])

      if (error) throw error

      setNuevoUsuario({ nombres: '', email: '', rol_empresa: 'Operario' })
      setMostrarModal(false)
      fetchUsuarios()
    } catch (err: any) {
      alert('Error al crear: ' + err.message)
    } finally {
      setCreando(false)
    }
  }

  async function eliminarUsuario(id: string) {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      const { error } = await supabase.from('empleados').delete().eq('id', id)
      if (!error) fetchUsuarios()
    }
  }

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="pb-20">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-blue-900 uppercase">Personal</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gestión de Accesos</p>
        </div>
        <button 
          onClick={() => setMostrarModal(true)}
          className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
        >
          <span className="text-2xl">+</span>
        </button>
      </header>

      {/* Buscador */}
      <div className="mb-6">
        <input 
          type="text"
          placeholder="Buscar por nombre o email..."
          className="w-full p-4 rounded-2xl bg-white border border-slate-200 shadow-sm outline-none focus:border-blue-500 font-medium text-slate-600"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-slate-400 font-bold animate-pulse py-10 text-xs">CARGANDO...</p>
        ) : (
          usuariosFiltrados.map((u) => (
            <div key={u.id} className="bg-white p-4 rounded-[25px] shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800 uppercase text-sm">{u.nombres}</h3>
                <p className="text-[11px] text-blue-500 font-bold lowercase">{u.email}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                    u.rol_empresa === 'Supervisor' ? 'bg-purple-100 text-purple-600' : 
                    u.rol_empresa === 'Vendedor' ? 'bg-green-100 text-green-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {u.rol_empresa || 'Operario'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => router.push(`/admin/empleados/editar/${u.id}`)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => eliminarUsuario(u.id)}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[35px] p-8 shadow-2xl animate-in slide-in-from-bottom">
            <h2 className="text-xl font-black text-slate-800 uppercase mb-6 text-center">Nuevo Usuario</h2>
            <form onSubmit={crearUsuario} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre Completo</label>
                <input 
                  required
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-2 ring-blue-500 transition-all font-bold text-slate-900"
                  value={nuevoUsuario.nombres}
                  onChange={e => setNuevoUsuario({...nuevoUsuario, nombres: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Email de Acceso</label>
                <input 
                  type="email"
                  required
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-2 ring-blue-500 transition-all font-bold text-slate-900"
                  value={nuevoUsuario.email}
                  onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Rol Asignado</label>
                <select 
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-2 ring-blue-500 transition-all font-bold text-slate-900 appearance-none"
                  value={nuevoUsuario.rol_empresa}
                  onChange={e => setNuevoUsuario({...nuevoUsuario, rol_empresa: e.target.value})}
                >
                  <option value="Operario">👷 Operario</option>
                  <option value="Vendedor">💼 Vendedor</option>
                  <option value="Supervisor">🔑 Supervisor</option>
                </select>
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
                  disabled={creando}
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg shadow-blue-200 disabled:bg-slate-300"
                >
                  {creando ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}