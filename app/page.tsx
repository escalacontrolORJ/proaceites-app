'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({ 
      email: email, 
      password: password 
    })
    
    if (error) {
      alert("Acceso denegado: " + error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8 border-t-8 border-green-600">
        
        <div className="flex justify-center">
          <Image src="/logo.JPG" alt="Logo Proaceites" width={180} height={180} priority className="object-contain" />
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Proaceites</h2>
          <p className="text-sm text-gray-500 mt-2">Ingresa tus credenciales</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <input 
              type="email" 
              required
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-black"
            />
            <input 
              type="password" 
              required
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-black"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:bg-gray-400"
          >
            {loading ? 'VALIDANDO...' : 'ENTRAR AL SISTEMA'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 uppercase tracking-tighter">
          © 2026 Proaceites S.A.
        </p>
      </div>
    </div>
  )
}