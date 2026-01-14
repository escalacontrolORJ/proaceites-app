'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      alert("Error: " + error.message)
      setLoading(false)
    } else {
      window.location.href = '/admin/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[45px] shadow-2xl w-full max-w-sm border border-slate-100">
        <h1 className="text-2xl font-black text-blue-900 uppercase text-center mb-8 tracking-tighter">Acceso Personal</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" placeholder="Correo electrónico" 
            className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 border-2 border-transparent focus:border-blue-500"
            onChange={(e) => setEmail(e.target.value)} required
          />
          <input 
            type="password" placeholder="Contraseña" 
            className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 border-2 border-transparent focus:border-blue-500"
            onChange={(e) => setPassword(e.target.value)} required
          />
          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-xl disabled:bg-slate-300 transition-all active:scale-95"
          >
            {loading ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}