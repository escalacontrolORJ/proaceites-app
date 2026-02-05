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
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const router = useRouter()

  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombres: '',
    email: '',
    password: '', 
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

  async function guardarUsuario(e: React.FormEvent) {
    e.preventDefault()
    setCreando(true)
    
    try {
      if (editandoId) {
        // ACTUALIZACIÓN DE DATOS EN TABLA
        const { error } = await supabase
          .from('empleados')
          .update({
            nombres: nuevoUsuario.nombres,
            email: nuevoUsuario.email,
            rol_empresa: nuevoUsuario.rol_empresa
          })
          .eq('id', editandoId)

        if (error) throw error
        alert('Usuario actualizado correctamente')
      } else {
        // CREACIÓN EN AUTH Y TABLA
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: nuevoUsuario.email,
          password: nuevoUsuario.password,
        })

        if (authError) throw authError

        if (authData.user) {
          const { error: dbError } = await supabase
            .from('empleados')
            .insert([{
              id: authData.user.id,
              nombres: nuevoUsuario.nombres,
              email: nuevoUsuario.email,
              rol_empresa: nuevoUsuario.rol_empresa
            }])

          if (dbError) throw dbError
          alert('Usuario creado con éxito en Autenticación y Tabla')
        }
      }

      setNuevoUsuario({ nombres: '', email: '', password: '', rol_empresa: 'Operario' })
      setMostrarModal(false)
      setEditandoId(null)
      fetchUsuarios()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setCreando(false)
    }
  }

  async function eliminarUsuario(id: string) {
    if (!confirm('¿Seguro? Esto eliminará el registro de la tabla.')) return
    try {
      const { error } = await supabase.from('empleados').delete().eq('id', id)
      if (error) throw error
      fetchUsuarios()
    } catch (error: any) {
      alert('Error al eliminar: ' + error.message)
    }
  }

  function prepararEdicion(u: any) {
    setEditandoId(u.id)
    setNuevoUsuario({
      nombres: u.nombres,
      email: u.email,
      password: '', // Password vacío al editar por seguridad
      rol_empresa: u.rol_empresa
    })
    setMostrarModal(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 pt-4">
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Personal</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gestión de Accesos</p>
          </div>
          <button 
            onClick={() => { setEditandoId(null); setNuevoUsuario({nombres:'', email:'', password:'', rol_empresa:'Operario'}); setMostrarModal(true); }}
            className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all"
          >
            + Añadir Nuevo
          </button>
        </header>

        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..."
            className="w-full p-5 bg-white rounded-3xl shadow-sm border-none text-sm font-bold"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {usuarios
            .filter(u => u.nombres.toLowerCase().includes(busqueda.toLowerCase()))
            .map((usuario) => (
              <div key={usuario.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-100 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 uppercase">
                    {usuario.nombres.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase text-sm leading-tight">{usuario.nombres}</h3>
                    <p className="text-slate-400 text-[10px] font-bold">{usuario.email} • <span className="text-blue-600">{usuario.rol_empresa}</span></p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => prepararEdicion(usuario)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button onClick={() => eliminarUsuario(usuario.id)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 3h.01"/></svg>
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* MODAL CON CAMPO CONTRASEÑA Y ROL */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">
              {editandoId ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            
            <form onSubmit={guardarUsuario} className="space-y-4">
              <input required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" placeholder="Nombre Completo" value={nuevoUsuario.nombres} onChange={e => setNuevoUsuario({...nuevoUsuario, nombres: e.target.value})}/>
              <input required type="email" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" placeholder="Email" value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}/>
              
              {/* CAMPO CONTRASEÑA: Solo visible al crear nuevo */}
              {!editandoId && (
                <input required type="password" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm" placeholder="Contraseña (mín. 6 caracteres)" value={nuevoUsuario.password} onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}/>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Rol Asignado</label>
                <select className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-sm appearance-none" value={nuevoUsuario.rol_empresa} onChange={e => setNuevoUsuario({...nuevoUsuario, rol_empresa: e.target.value})}>
                  <option value="Operario">👷 Operario</option>
                  <option value="Vendedor">💼 Vendedor</option>
                  <option value="Supervisor">🔑 Supervisor</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 py-4 text-slate-400 font-bold uppercase text-xs">Cancelar</button>
                <button type="submit" disabled={creando} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg shadow-blue-200">
                  {creando ? 'Guardando...' : (editandoId ? 'Actualizar' : 'Crear Acceso')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}