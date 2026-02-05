'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function GestionEmpleados() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ 
    nombre: '', 
    email: '', 
    password: '', // Nuevo: requerido para crear el acceso
    rol: 'vendedor', 
    telefono: '' 
  })

  useEffect(() => {
    fetchEmpleados()
  }, [])

  async function fetchEmpleados() {
    const { data } = await supabase.from('empleados').select('*').order('nombre')
    if (data) setEmpleados(data)
  }

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. CREAR EN AUTENTICACIÓN (Para que aparezca en la pestaña Authentication)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.nombre,
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. CREAR EN LA TABLA EMPLEADOS (Usando el mismo ID de la autenticación)
        const { error: dbError } = await supabase.from('empleados').insert([{
          id: authData.user.id, 
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
          telefono: form.telefono
        }])

        if (dbError) throw dbError

        alert('Empleado creado con éxito en Autenticación y Tabla.')
        setForm({ nombre: '', email: '', password: '', rol: 'vendedor', telefono: '' })
        fetchEmpleados()
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const eliminarEmpleado = async (id: string) => {
    if (!confirm('¿Seguro? Se eliminará de la tabla. Nota: El acceso en Autenticación debe borrarse manualmente desde el panel de Supabase.')) return
    await supabase.from('empleados').delete().eq('id', id)
    fetchEmpleados()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <main className="p-4 max-w-4xl mx-auto">
        
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mb-8">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Nuevo Empleado</h2>
          <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              className="bg-slate-50 p-4 rounded-2xl border-none text-sm font-bold"
              placeholder="Nombre Completo"
              value={form.nombre}
              onChange={e => setForm({...form, nombre: e.target.value})}
              required
            />
            <input 
              className="bg-slate-50 p-4 rounded-2xl border-none text-sm font-bold"
              placeholder="Correo Electrónico"
              type="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />
            {/* CAMPO DE CONTRASEÑA AÑADIDO */}
            <input 
              className="bg-slate-50 p-4 rounded-2xl border-none text-sm font-bold"
              placeholder="Contraseña (Mín. 6 caracteres)"
              type="password"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
            <input 
              className="bg-slate-50 p-4 rounded-2xl border-none text-sm font-bold"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={e => setForm({...form, telefono: e.target.value})}
            />
            <select 
              className="bg-slate-50 p-4 rounded-2xl border-none text-sm font-bold"
              value={form.rol}
              onChange={e => setForm({...form, rol: e.target.value})}
            >
              <option value="vendedor">Vendedor</option>
              <option value="admin">Administrador</option>
            </select>
            <button 
              disabled={loading}
              className="md:col-span-2 bg-blue-600 text-white p-5 rounded-2xl font-black uppercase shadow-lg shadow-blue-100 active:scale-95 transition-all"
            >
              {loading ? 'Procesando...' : 'Registrar Empleado'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-6 font-black uppercase text-slate-400">Empleado</th>
                <th className="p-6 font-black uppercase text-slate-400">Rol</th>
                <th className="p-6 text-right text-slate-400">Acción</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map(emp => (
                <tr key={emp.id} className="border-t border-slate-50">
                  <td className="p-6">
                    <p className="font-bold text-slate-800">{emp.nombre}</p>
                    <p className="text-slate-400">{emp.email}</p>
                  </td>
                  <td className="p-6">
                    <span className="font-black uppercase bg-slate-100 px-3 py-1 rounded-full">{emp.rol}</span>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => eliminarEmpleado(emp.id)}
                      className="text-red-500 font-bold uppercase active:scale-90 transition-all"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}