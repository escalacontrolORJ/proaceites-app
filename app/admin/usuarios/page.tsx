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
    password: '', // AÑADIDO: Necesario para el registro
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
      // 1. CREAR EN AUTENTICACIÓN (Para que aparezca en la pestaña Authentication)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: nuevoUsuario.email,
        password: nuevoUsuario.password,
        options: {
          data: {
            full_name: nuevoUsuario.nombres,
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. INSERTAR EN TABLA EMPLEADOS usando el ID de Autenticación
        const { error: dbError } = await supabase
          .from('empleados')
          .insert([{
            id: authData.user.id, // ID real de Supabase Auth
            nombres: nuevoUsuario.nombres,
            email: nuevoUsuario.email,
            rol_empresa: nuevoUsuario.rol_empresa
          }])

        if (dbError) throw dbError

        alert('Usuario creado con éxito en Autenticación y Tabla de Datos')
        setNuevoUsuario({ nombres: '', email: '', password: '', rol_empresa: 'Operario' })
        setMostrarModal(false)
        fetchUsuarios()
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setCreando(false)
    }
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
            onClick={() => setMostrarModal(true)}
            className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-100 active:scale-95 transition-all"
          >
            + Añadir Nuevo
          </button>
        </header>

        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..."
            className="w-full p-5 bg-white rounded-3xl shadow-sm border-none text-sm font-bold placeholder:text-slate-300 outline-none focus:ring-2 ring-blue-500 transition-all"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {usuarios
              .filter(u => u.nombres.toLowerCase().includes(busqueda.toLowerCase()) || u.email.toLowerCase().includes(busqueda.toLowerCase()))
              .map((usuario) => (
                <div key={usuario.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 uppercase">
                      {usuario.nombres.substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 uppercase text-sm leading-tight">{usuario.nombres}</h3>
                      <p className="text-slate-400 text-[10px] font-bold">{usuario.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-full ${
                      usuario.rol_empresa === 'Supervisor' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {usuario.rol_empresa}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* MODAL DE CREACIÓN */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[40px] md:rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Nuevo Usuario</h2>
            
            <form onSubmit={crearUsuario} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre Completo</label>
                <input 
                  required
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-2 ring-blue-500 transition-all font-bold text-slate-900"
                  placeholder="Ej. Juan Pérez"
                  value={nuevoUsuario.nombres}
                  onChange={e => setNuevoUsuario({...nuevoUsuario, nombres: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Email Laboral</label>
                <input 
                  required
                  type="email"
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-2 ring-blue-500 transition-all font-bold text-slate-900"
                  placeholder="juan@empresa.com"
                  value={nuevoUsuario.email}
                  onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Contraseña</label>
                <input 
                  required
                  type="password"
                  className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-2 ring-blue-500 transition-all font-bold text-slate-900"
                  placeholder="Mínimo 6 caracteres"
                  value={nuevoUsuario.password}
                  onChange={e => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
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
                  {creando ? 'Creando Acceso...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}