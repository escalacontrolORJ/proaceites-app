'use client'
import { useState } from 'react'
import { supabase } from '../../../../lib/supabaseClient' // Verifica que la ruta sea correcta
import { useRouter } from 'next/navigation'

export default function NuevoEmpleado() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    id: '', // Aquí pegarás el UUID de Supabase Auth
    nombre: '',
    cedula: '',
    rol_empresa: 'Operario'
  })

  const crearEmpleado = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Insertar en la tabla empleados
    const { error } = await supabase
      .from('empleados')
      .insert([form])

    if (error) {
      alert("Error: " + error.message)
    } else {
      alert("✅ Empleado creado con éxito")
      router.push('/admin/empleados')
      router.refresh() // Refresca la lista
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white p-6 pb-24 text-black font-sans">
      <div className="max-w-md mx-auto">
        <header className="mb-8 pt-4">
          <h1 className="text-2xl font-black text-blue-900 uppercase tracking-tighter">Alta de Personal</h1>
        </header>

        <form onSubmit={crearEmpleado} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-[25px] border-2 border-dashed border-gray-200">
            <label className="text-[10px] font-black text-blue-500 uppercase ml-2 mb-1 block">UUID de Supabase Auth</label>
            <input 
              type="text"
              required
              placeholder="00000000-0000-0000-0000-000000000000"
              className="w-full p-2 bg-transparent font-mono text-xs outline-none"
              value={form.id}
              onChange={e => setForm({...form, id: e.target.value})}
            />
          </div>

          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Nombre Completo</label>
            <input 
              type="text"
              required
              className="w-full p-2 bg-transparent font-bold outline-none"
              value={form.nombre}
              onChange={e => setForm({...form, nombre: e.target.value})}
            />
          </div>

          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1 block">Rol</label>
            <select 
              className="w-full p-2 bg-transparent font-black text-blue-900 outline-none"
              value={form.rol_empresa}
              onChange={e => setForm({...form, rol_empresa: e.target.value})}
            >
              <option value="Operario">Operario</option>
              <option value="Vendedor">Vendedor</option>
              <option value="Supervisor">Supervisor</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-blue-700 text-white rounded-[25px] font-black shadow-xl uppercase mt-6"
          >
            {loading ? 'Guardando...' : 'Registrar'}
          </button>
        </form>
      </div>
    </div>
  )
}