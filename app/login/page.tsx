'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert("Error: " + error.message)
    else router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-8 rounded-[40px] shadow-2xl">
        <h1 className="text-2xl font-black text-blue-900 mb-6 uppercase text-center">Entrar al Sistema</h1>
        <input 
          type="email" placeholder="Correo" 
          className="w-full p-4 mb-4 bg-slate-100 rounded-2xl outline-none font-bold"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input 
          type="password" placeholder="Contraseña" 
          className="w-full p-4 mb-6 bg-slate-100 rounded-2xl outline-none font-bold"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black uppercase shadow-lg shadow-blue-200">
          Iniciar Sesión
        </button>
      </form>
    </div>
  )
}