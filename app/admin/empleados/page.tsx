'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import Link from 'next/link'

export default function RegistroEmpleados() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombres, setNombres] = useState('')
  const [rol, setRol] = useState('Operario')
  const [fechaNac, setFechaNac] = useState('')
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  const registrarTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensaje({ tipo: 'info', texto: 'Procesando registro...' })

    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setMensaje({ tipo: 'error', texto: "Error: " + authError.message })
      return
    }

    if (authData.user) {
      // 2. Crear registro en tabla empleados
      const { error: dbError } = await supabase.from('empleados').insert([{
        id: authData.user.id,
        nombres,
        rol_empresa: rol,
        fecha_nacimiento: fechaNac
      }])

      if (dbError) {
        setMensaje({ tipo: 'error', texto: "Error en DB: " + dbError.message })
      } else {
        setMensaje({ tipo: 'success', texto: "✅ Empleado creado y vinculado correctamente" })
        // Limpiar formulario
        setEmail(''); setPassword(''); setNombres(''); setFechaNac('')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-black">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <h1 className="text-2xl font-black text-blue-900 mb-2 uppercase tracking-tighter">Gestión de Personal</h1>
        <p className="text-gray-500 text-sm mb-6 font-medium">Crear nuevo acceso y perfil de empleado</p>

        <form onSubmit={registrarTodo} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Datos Personales</label>
            <input type="text" placeholder="Nombres Completos" className="w-full p-4 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
              value={nombres} onChange={e => setNombres(e.target.value)} required />
            <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-200 outline-none" 
              value={fechaNac} onChange={e => setFechaNac(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Rol en Proaceites</label>
            <select className="w-full p-4 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-200 outline-none font-bold text-blue-800"
              value={rol} onChange={e => setRol(e.target.value)}>
              <option value="Operario">Operario</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Vendedor">Vendedor</option>
              <option value="Varios">Varios</option>
            </select>
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Credenciales de Acceso</label>
            <input type="email" placeholder="Correo institucional" className="w-full p-4 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-200 outline-none" 
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Contraseña (mín. 6 caracteres)" className="w-full p-4 bg-gray-50 rounded-2xl border-none ring-1 ring-gray-200 outline-none" 
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-all mt-4 uppercase">
            Registrar Empleado
          </button>
        </form>

        {mensaje.texto && (
          <div className={`mt-6 p-4 rounded-2xl text-center font-bold text-sm ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {mensaje.texto}
          </div>
        )}
        
        <Link href="/admin/reportes" className="block text-center mt-6 text-blue-600 font-bold text-xs underline">
          Ir a Reportes de Asistencia →
        </Link>
      </div>
    </div>
  )
}