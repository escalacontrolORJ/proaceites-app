'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function GestionUsuarios() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('USER') // Estado para el Rol
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMensaje({ tipo: '', texto: '' })

    try {
      // 1. Crear el usuario en la autenticación de Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Insertar los datos adicionales (como el ROL) en tu tabla de perfiles/usuarios
        // Asegúrate de que tu tabla en Supabase se llame 'usuarios' o 'perfiles'
        const { error: dbError } = await supabase
          .from('perfiles') 
          .insert([
            { 
              id: authData.user.id, 
              email: email, 
              rol: rol 
            }
          ])

        if (dbError) throw dbError

        setMensaje({ tipo: 'success', texto: `Usuario ${email} creado con éxito como ${rol}` })
        setEmail('')
        setPassword('')
      }
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <AdminNav />
      
      <div className="max-w-xl mx-auto p-6 md:p-10">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100">
          <div className="mb-8">
            <h1 className="text-2xl font-black tracking-tighter">GESTIÓN DE USUARIOS</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Crear nuevo acceso al sistema</p>
          </div>

          <form onSubmit={handleRegistro} className="space-y-6">
            {/* EMAIL */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Correo Electrónico</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@proaceites.com"
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 font-bold outline-none transition-all"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Contraseña</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 font-bold outline-none transition-all"
              />
            </div>

            {/* ROL SELECTOR */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Rol del Sistema</label>
              <select 
                value={rol} 
                onChange={(e) => setRol(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 font-bold outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="USER">👤 COLABORADOR (USER)</option>
                <option value="ADMIN">🔐 ADMINISTRADOR (ADMIN)</option>
              </select>
            </div>

            {/* MENSAJES */}
            {mensaje.texto && (
              <div className={`p-4 rounded-2xl text-xs font-bold text-center ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {mensaje.texto}
              </div>
            )}

            {/* BOTÓN SUBMIT */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Registrar Usuario'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}