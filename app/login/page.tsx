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
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      alert("Error: " + error.message)
      setLoading(false)
    } else {
      window.location.href = '/admin/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-sm">
        <h1 className="text-2xl font-black text-blue-900 text-center mb-6 uppercase">Proaceites</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-blue-500" onChange={(e)=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Clave" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-blue-500" onChange={(e)=>setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase shadow-lg">
            {loading ? 'Verificando...' : 'Entrar Ahora'}
          </button>
        </form>
      </div>
    </div>
  )
}