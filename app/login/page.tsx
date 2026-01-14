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
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        alert("Error de acceso: " + error.message)
        setLoading(false)
        return
      }

      if (data?.session) {
        // Usamos window.location para forzar la entrada al dashboard
        window.location.href = '/admin/dashboard'
      }
    } catch (err) {
      alert("Error inesperado en el servidor")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[45px] shadow-2xl w-full max-w-sm border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <span className="text-3xl">🔑</span>
          </div>
          <h1 className="text-2xl font-black text-blue-900 uppercase italic">Proaceites</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Panel de Acceso</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Tu correo electrónico" 
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 border-2 border-transparent focus:border-blue-500 transition-all"
            value={email} onChange={(e) => setEmail(e.target.value)} required
          />
          <input 
            type="password" 
            placeholder="Tu contraseña" 
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-800 border-2 border-transparent focus:border-blue-500 transition-all"
            value={password} onChange={(e) => setPassword(e.target.value)} required
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:bg-slate-300"
          >
            {loading ? 'Verificando...' : 'Entrar ahora'}
          </button>
        </form>
      </div>
    </div>
  )
}