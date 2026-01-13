'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function GestionUsuarios() {
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

  // Función para obtener empleados y su última marca de asistencia
  async function fetchUsuarios() {
    // 1. Obtener todos los empleados
    const { data: emps, error: empError } = await supabase
      .from('empleados')
      .select('*')
      .order('nombres', { ascending: true })

    if (empError) return console.error(empError)

    // 2. Obtener la última marca de asistencia de cada uno
    const { data: asist } = await supabase
      .from('asistencia')
      .select('empleado_id, fecha_hora')
      .order('fecha_hora', { ascending: false })

    // 3. Cruzar datos: asignar a cada usuario su última actividad
    const listadoConActividad = emps?.map(u => {
      const ultima = asist?.find(a => a.empleado_id === u.id)
      return {
        ...u,
        ultima_actividad: ultima ? ultima.fecha_hora : null
      }
    })

    setUsuarios(listadoConActividad || [])
  }

  const guardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje({ tipo: '', texto: '' })

    try {
      if (editandoId) {
        // MODO EDICIÓN: Actualizamos nombre y email en la tabla empleados
        const { error } = await supabase
          .from('empleados')
          .update({ 
            nombres: nombre, 
            email: email,
            rol_empresa: 'Operario' // O el rol actual del usuario
          })
          .eq('id', editandoId)

        if (error) throw error
        setMensaje({ tipo: 'success', texto: 'Usuario actualizado con éxito' })
      } else {
        // MODO CREACIÓN: 1. Crear en Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (authError) throw authError

        // 2. Crear en tabla Empleados
        if (authData.user) {
          const { error: dbError } = await supabase.from('empleados').insert([
            {
              id: authData.user.id,
              nombres: nombre,
              email: email,
              rol_empresa: 'Operario'
            }
          ])
          if (dbError) throw dbError
          setMensaje({ tipo: 'success', texto: 'Usuario creado y acceso habilitado' })
        }
      }

      // Limpiar formulario y recargar
      setNombre(''); setEmail(''); setPassword(''); setEditandoId(null)
      fetchUsuarios()
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message })
    } finally {
      setCargando(false)
    }
  }

  const eliminarUsuario = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este colaborador? Perderá acceso al sistema.')) return
    
    // Eliminamos de la tabla empleados (en Auth se debe hacer manualmente o vía Edge Function por seguridad)
    const { error } = await supabase.from('empleados').delete().eq('id', id)
    
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al eliminar: ' + error.message })
    } else {
      fetchUsuarios()
    }
  }

  const prepararEdicion = (u: any) => {
    setEditandoId(u.id)
    setNombre(u.nombres)
    setEmail(u.email)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* TARJETA DE REGISTRO */}
        <div className="bg-white p-8 rounded-[45px] shadow-xl border border-white mb-10 transition-all">
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
            <span className="bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-sm">
              {editandoId ? '✎' : '+'}
            </span>
            {editandoId ? 'Editar Colaborador' : 'Registrar Nuevo Ingreso'}
          </h1>
          
          <form onSubmit={guardarUsuario} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-3">Nombre Completo</label>
              <input required type="text" placeholder="Ej: Alicia Lara" value={nombre} onChange={(e) => setNombre(e.target.value)} className="p-4 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-sm transition-all" />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-3">Correo Electrónico</label>
              <input required type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="p-4 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-sm transition-all" />
            </div>

            {!editandoId && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-3">Contraseña Temporal</label>
                <input required type="password" placeholder="Mín. 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="p-4 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-sm transition-all" />
              </div>
            )}

            <div className="md:col-span-3 flex gap-3 mt-4">
              <button disabled={cargando} className="flex-1 py-4 rounded-[25px] bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50">
                {cargando ? 'Sincronizando...' : editandoId ? 'Guardar Cambios' : 'Habilitar Acceso Biométrico'}
              </button>
              {editandoId && (
                <button type="button" onClick={() => {setEditandoId(null); setNombre(''); setEmail('')}} className="px-8 py-4 rounded-[25px] bg-slate-200 text-slate-500 font-black uppercase text-[10px] hover:bg-slate-300 transition-all">
                  Cancelar
                </button>
              )}
            </div>
          </form>
          {mensaje.texto && (
            <div className={`mt-6 p-3 rounded-2xl text-center font-black text-[10px] uppercase tracking-widest ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {mensaje.texto}
            </div>
          )}
        </div>

        {/* TABLA DE USUARIOS */}
        <div className="bg-white rounded-[45px] shadow-2xl overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="p-7">Colaborador / ID</th>
                <th className="p-7">Acceso</th>
                <th className="p-7 text-center">Última Actividad</th>
                <th className="p-7 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center font-bold text-slate-300 uppercase">No hay colaboradores registrados</td></tr>
              ) : usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50/40 transition-all">
                  <td className="p-7">
                    <p className="font-black text-slate-800 uppercase text-xs">{u.nombres}</p>
                    <span className="text-[8px] font-bold text-slate-300 tracking-tighter">UID: {u.id}</span>
                  </td>
                  <td className="p-7 text-slate-500 font-bold text-xs">{u.email}</td>
                  <td className="p-7 text-center">
                    {u.ultima_actividad ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-[9px] font-black uppercase mb-1">Activo</span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(u.ultima_actividad).toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="text-slate-200 font-black text-[9px] uppercase tracking-widest italic">Sin registros</span>
                    )}
                  </td>
                  <td className="p-7">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => prepararEdicion(u)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm">Editar</button>
                      <button onClick={() => eliminarUsuario(u.id)} className="px-4 py-2 bg-red-50 text-red-400 rounded-xl font-black text-[9px] uppercase hover:bg-red-600 hover:text-white transition-all shadow-sm">Eliminar</button>
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