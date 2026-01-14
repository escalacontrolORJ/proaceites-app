'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert("Error: " + error.message)
    } else {
      // Forzamos la redirección al dashboard
      router.push('/admin/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-sm">
        <h1 className="text-2xl font-black text-blue-900 mb-6 text-center uppercase">Entrar</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" placeholder="Correo" 
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
            value={email} onChange={(e) => setEmail(e.target.value)} required
          />
          <input 
            type="password" placeholder="Contraseña" 
            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
            value={password} onChange={(e) => setPassword(e.target.value)} required
          />
          <button 
            disabled={loading}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase shadow-lg disabled:bg-slate-300"
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}