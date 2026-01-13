'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      // Intentamos el inicio de sesión
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), // Limpia espacios y mayúsculas
        password: password,
      })

      if (error) throw error

      if (data?.user) {
        // Redirigir al panel de administración tras éxito
        router.push('/admin/usuarios')
      }
    } catch (err: any) {
      setErrorMsg(err.message === 'Invalid login credentials' 
        ? 'Correo o clave incorrectos. Revisa que sea admi123' 
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 border border-slate-100">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">ProAceites</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Acceso Administrativo</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-xs font-black uppercase text-center border border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase ml-4 text-slate-400">Correo Electrónico</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-100 font-bold outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all"
              placeholder="usuario@gmail.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase ml-4 text-slate-400">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-100 font-bold outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm mt-4 disabled:bg-slate-300"
          >
            {loading ? 'Verificando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}