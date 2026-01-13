'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav' // IMPORTANTE

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  useEffect(() => { fetchUsuarios() }, [])

  async function fetchUsuarios() {
    const { data: emps } = await supabase.from('empleados').select('*').order('nombres', { ascending: true })
    const { data: asist } = await supabase.from('asistencia').select('empleado_id, fecha_hora').order('fecha_hora', { ascending: false })
    const listado = emps?.map(u => ({
      ...u,
      ultima_actividad: asist?.find(a => a.empleado_id === u.id)?.fecha_hora || null
    }))
    setUsuarios(listado || [])
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault(); setCargando(true)
    try {
      if (editandoId) {
        await supabase.from('empleados').update({ nombres: nombre, email: email.trim() }).eq('id', editandoId)
      } else {
        const { data: auth } = await supabase.auth.signUp({ email: email.trim(), password })
        if (auth.user) await supabase.from('empleados').insert([{ id: auth.user.id, nombres: nombre, email: email.trim(), rol_empresa: 'Operario' }])
      }
      setNombre(''); setEmail(''); setPassword(''); setEditandoId(null); fetchUsuarios()
      setMensaje({ tipo: 'success', texto: 'Operación exitosa' })
    } catch (err: any) { setMensaje({ tipo: 'error', texto: err.message }) }
    setCargando(false)
  }

  const borrar = async (id: string) => {
    if (confirm('¿Eliminar?')) { await supabase.from('empleados').delete().eq('id', id); fetchUsuarios() }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <AdminNav /> {/* MENÚ INTEGRADO */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white p-8 rounded-[40px] shadow-lg mb-8">
          <h2 className="font-black uppercase mb-6 text-xl">{editandoId ? 'Editar' : 'Nuevo'} Colaborador</h2>
          <form onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input required placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold" />
            <input required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold" />
            {!editandoId && <input required type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 font-bold" />}
            <button className="md:col-span-3 bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest">{cargando ? 'Cargando...' : 'Confirmar'}</button>
          </form>
        </div>

        <input type="text" placeholder="🔍 BUSCAR..." className="w-full p-4 mb-6 rounded-2xl border-2 border-slate-200 uppercase font-black text-xs" onChange={e => setBusqueda(e.target.value)} />

        <div className="bg-white rounded-[40px] shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-400">
              <tr><th className="p-6">Nombre</th><th className="p-6">Email</th><th className="p-6 text-center">Última Actividad</th><th className="p-6 text-center">Acciones</th></tr>
            </thead>
            <tbody className="divide-y">
              {usuarios.filter(u => u.nombres.toLowerCase().includes(busqueda.toLowerCase())).map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-6 font-bold uppercase text-xs">{u.nombres}</td>
                  <td className="p-6 text-slate-400 text-xs">{u.email}</td>
                  <td className="p-6 text-center text-[10px] font-bold text-blue-600">{u.ultima_actividad ? new Date(u.ultima_actividad).toLocaleString() : '---'}</td>
                  <td className="p-6 flex justify-center gap-2">
                    <button onClick={() => {setEditandoId(u.id); setNombre(u.nombres); setEmail(u.email)}} className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg font-black text-[10px]">EDITAR</button>
                    <button onClick={() => borrar(u.id)} className="bg-red-100 text-red-600 px-3 py-1 rounded-lg font-black text-[10px]">BORRAR</button>
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