'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

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
    } catch (err: any) { alert(err.message) }
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <AdminNav />
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white p-8 rounded-[40px] shadow-lg mb-8">
          <form onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input required placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none" />
            <input required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none" />
            {!editandoId && <input required type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="p-4 bg-slate-50 rounded-2xl outline-none" />}
            <button className="bg-slate-900 text-white p-4 rounded-2xl font-black uppercase">{cargando ? 'Cargando...' : 'Confirmar'}</button>
          </form>
        </div>
        <input type="text" placeholder="🔍 BUSCAR..." className="w-full p-4 mb-6 rounded-2xl border-2 border-slate-200 uppercase font-black text-xs" onChange={e => setBusqueda(e.target.value)} />
        <div className="bg-white rounded-[40px] shadow-xl overflow-hidden">
          <table className="w-full text-left">
            <tbody className="divide-y">
              {usuarios.filter(u => u.nombres.toLowerCase().includes(busqueda.toLowerCase())).map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-6 font-bold uppercase text-xs">{u.nombres}</td>
                  <td className="p-6 text-slate-400 text-xs">{u.email}</td>
                  <td className="p-6 text-center text-[10px] font-bold text-blue-600">{u.ultima_actividad ? new Date(u.ultima_actividad).toLocaleString() : '---'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}