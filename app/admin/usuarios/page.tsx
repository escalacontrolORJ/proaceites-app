'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const fetchUsuarios = async () => {
    const { data } = await supabase.from('empleados').select('*')
    setUsuarios(data || [])
  }

  useEffect(() => { fetchUsuarios() }, [])

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: auth, error: aErr } = await supabase.auth.signUp({ email, password })
    if (auth?.user) {
      await supabase.from('empleados').insert([{ 
        id: auth.user.id, nombres: nombre, nombre: nombre, email, rol_empresa: 'Vendedor' 
      }])
      setNombre(''); setEmail(''); setPassword(''); fetchUsuarios()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black text-slate-800">GESTIÓN DE EQUIPO</h1>
      
      {/* Formulario Compacto */}
      <form onSubmit={handleCrear} className="bg-white p-4 rounded-2xl shadow-sm border space-y-3">
        <input className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
        <input className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm" placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm">
          {loading ? 'CARGANDO...' : 'AÑADIR EMPLEADO'}
        </button>
      </form>

      {/* Lista Estilo Celular */}
      <div className="space-y-3">
        {usuarios.map(u => (
          <div key={u.id} className="bg-white p-4 rounded-2xl border flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              {u.nombres?.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">{u.nombres}</p>
              <p className="text-xs text-slate-500">{u.email}</p>
            </div>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-600">
              {u.rol_empresa}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}