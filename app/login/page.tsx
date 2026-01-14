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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      })

      if (error) throw error

      if (data?.user) {
        // CORRECCIÓN AQUÍ: Ahora te envía a la pantalla de marcar (inicio)
        router.push('/admin/dashboard')
      }
    } catch (err: any) {
      setErrorMsg(err.message === 'Invalid login credentials' 
        ? 'Correo o clave incorrectos.' 
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 border border-slate-100 text-center">
        
        {/* LOGO DE PROACEITES */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-blue-600 tracking-tighter uppercase">PROACEITES</h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">Gestión de Personal</p>
        </div>

        <h2 className="text-xl font-black text-slate-800 uppercase mb-8">Iniciar Sesión</h2>

        {errorMsg && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 text-xs font-bold uppercase border border-red-100">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase ml-4 text-slate-400">Correo Electrónico</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all text-slate-900"
              placeholder="admin@proaceites.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase ml-4 text-slate-400">Contraseña</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 font-bold outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all text-slate-900"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm mt-6 disabled:bg-slate-300"
          >
            {loading ? 'Entrando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}