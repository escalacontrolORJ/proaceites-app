'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Credenciales incorrectas')
      setLoading(false)
      return
    }

    // BUSCAR EL ROL DEL USUARIO
    const { data: emp } = await supabase
      .from('empleados')
      .select('rol_empresa')
      .eq('id', data.user.id)
      .single()

    if (emp?.rol_empresa === 'Supervisor' || emp?.rol_empresa === 'Admin') {
      router.push('/admin/reportes') // Si es admin, va al reporte
    } else {
      router.push('/dashboard') // Si es empleado, va a marcar
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[50px] shadow-2xl w-full max-w-md border border-white text-center">
        <div className="w-20 h-20 bg-blue-600 rounded-[30px] mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-200">
          <span className="text-3xl">🔐</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Bienvenido</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Sistema de Control Biométrico</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" placeholder="Correo Electrónico" 
            className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold transition-all"
            value={email} onChange={(e) => setEmail(e.target.value)} required
          />
          <input 
            type="password" placeholder="Contraseña" 
            className="w-full p-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold transition-all"
            value={password} onChange={(e) => setPassword(e.target.value)} required
          />
          
          {error && <p className="text-red-500 text-[10px] font-black uppercase">{error}</p>}

          <button 
            disabled={loading}
            className="w-full py-5 rounded-[30px] bg-slate-900 text-white font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}