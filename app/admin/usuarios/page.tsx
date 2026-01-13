'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function GestionUsuariosPro() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  useEffect(() => {
    fetchUsuarios()
  }, [])

  async function fetchUsuarios() {
    // Traemos los empleados y vinculamos con su última asistencia
    const { data: emps } = await supabase.from('empleados').select('*').order('nombres', { ascending: true })
    
    // Obtenemos la última marca de cada uno
    const { data: asist } = await supabase.rpc('get_last_asistencia') 
    // Si no tienes la función RPC, usaremos una consulta normal:
    const { data: asistNormal } = await supabase.from('asistencia').select('empleado_id, fecha_hora').order('fecha_hora', { ascending: false })

    const listadoFinal = emps?.map(u => {
      const ultima = asistNormal?.find(a => a.empleado_id === u.id)
      return { ...u, ultima_actividad: ultima ? ultima.fecha_hora : null }
    })

    setUsuarios(listadoFinal || [])
  }

  const guardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje({ tipo: '', texto: '' })

    try {
      if (editandoId) {
        const { error } = await supabase.from('empleados').update({ nombres: nombre, email }).eq('id', editandoId)
        if (error) throw error
        setMensaje({ tipo: 'success', texto: 'Usuario actualizado' })
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
        if (authError) throw authError
        if (authData.user) {
          await supabase.from('empleados').insert([{ id: authData.user.id, nombres: nombre, email, rol: 'empleado' }])
          setMensaje({ tipo: 'success', texto: 'Usuario creado' })
        }
      }
      setNombre(''); setEmail(''); setPassword(''); setEditandoId(null)
      fetchUsuarios()
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message })
    } finally {
      setCargando(false)
    }
  }

  const eliminarUsuario = async (id: string) => {
    if (!confirm('¿Eliminar usuario? Perderá acceso al sistema.')) return
    await supabase.from('empleados').delete().eq('id', id)
    fetchUsuarios()
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* FORMULARIO DE GESTIÓN */}
        <div className="bg-white p-8 rounded-[45px] shadow-xl border border-white mb-10">
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-6">
            {editandoId ? '📝 Editar Colaborador' : '👤 Registrar Nuevo Ingreso'}
          </h1>
          <form onSubmit={guardarUsuario} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input required type="text" placeholder="Nombre y Apellido" value={nombre} onChange={(e) => setNombre(e.target.value)} className="p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm" />
            <input required type="email" placeholder="Email institucional" value={email} onChange={(e) => setEmail(e.target.value)} className="p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm" />
            {!editandoId && <input required type="password" placeholder="Contraseña Temporal" value={password} onChange={(e) => setPassword(e.target.value)} className="p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm" />}
            <div className="md:col-span-3 flex gap-3 mt-2">
              <button disabled={cargando} className="flex-1 py-4 rounded-2xl bg-blue-900 text-white font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-[1.02] transition-all">
                {cargando ? 'Sincronizando...' : editandoId ? 'Confirmar Cambios' : 'Crear Acceso Biométrico'}
              </button>
              {editandoId && <button onClick={() => {setEditandoId(null); setNombre(''); setEmail('')}} className="px-8 py-4 rounded-2xl bg-slate-200 text-slate-500 font-black uppercase text-[10px]">Cancelar</button>}
            </div>
          </form>
          {mensaje.texto && <p className={`mt-4 text-center font-black text-[10px] uppercase ${mensaje.tipo === 'success' ? 'text-green-500' : 'text-red-500'}`}>{mensaje.texto}</p>}
        </div>

        {/* LISTADO DE USUARIOS CON ÚLTIMA ACTIVIDAD */}
        <div className="bg-white rounded-[45px] shadow-2xl overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="p-6">Colaborador</th>
                <th className="p-6">Contacto</th>
                <th className="p-6 text-center">Última Actividad</th>
                <th className="p-6 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/30 transition-all">
                  <td className="p-6">
                    <p className="font-black text-slate-800 uppercase text-xs">{u.nombres}</p>
                    <span className="text-[9px] font-bold text-slate-400">ID: {u.id.slice(0,8)}</span>
                  </td>
                  <td className="p-6 text-slate-400 font-bold text-xs">{u.email}</td>
                  <td className="p-6 text-center">
                    {u.ultima_actividad ? (
                      <div className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-600 text-[10px] font-black uppercase">
                        {new Date(u.ultima_actividad).toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-slate-200 font-black text-[10px] uppercase">Sin registros</span>
                    )}
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => prepararEdicion(u)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase hover:bg-blue-600 hover:text-white transition-all">Editar</button>
                      <button onClick={() => eliminarUsuario(u.id)} className="px-4 py-2 bg-red-50 text-red-400 rounded-xl font-black text-[9px] uppercase hover:bg-red-600 hover:text-white transition-all">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}