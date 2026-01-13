'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import AdminNav from '@/components/AdminNav'

export default function NuevoUsuario() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombres: '',
    email: '',
    rol_empresa: 'Operario'
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      // Nota: Aquí se inserta en la tabla pública. 
      // Si usas Supabase Auth, el usuario se debe crear primero en Auth.
      const { error } = await supabase
        .from('empleados')
        .insert([{
          nombres: formData.nombres,
          email: formData.email,
          rol_empresa: formData.rol_empresa,
          creado_el: new Date().toISOString()
        }])

      if (error) throw error
      alert('Usuario registrado exitosamente en la base de datos.')
      router.push('/admin/usuarios')
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <AdminNav />
      <div className="max-w-2xl mx-auto p-4 md:p-10">
        <div className="bg-white rounded-[40px] shadow-2xl p-8 border border-slate-100">
          <h1 className="text-3xl font-black text-slate-900 uppercase mb-8 tracking-tighter">Registrar Nuevo</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Nombre Completo</label>
              <input type="text" required value={formData.nombres} onChange={(e)=>setFormData({...formData, nombres:e.target.value})} className="p-4 rounded-2xl bg-slate-100 font-bold outline-none border-none" placeholder="Ej: Juan Pérez" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Correo Electrónico</label>
              <input type="email" required value={formData.email} onChange={(e)=>setFormData({...formData, email:e.target.value})} className="p-4 rounded-2xl bg-slate-100 font-bold outline-none border-none" placeholder="correo@empresa.com" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Rol</label>
              <select value={formData.rol_empresa} onChange={(e)=>setFormData({...formData, rol_empresa:e.target.value})} className="p-4 rounded-2xl bg-slate-100 font-bold outline-none border-none appearance-none">
                <option value="Operario">Operario</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="w-full py-5 rounded-2xl font-black text-white shadow-xl bg-blue-600 hover:bg-blue-700 transition-all uppercase">
              {loading ? 'Registrando...' : 'Guardar Usuario'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}