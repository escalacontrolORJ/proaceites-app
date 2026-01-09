'use client'
import Link from 'next/link'

export default function PanelAdmin() {
  const secciones = [
    {
      titulo: "Gestión de Personal",
      links: [
        { name: "Asistencia General", path: "/admin/reportes", icon: "⏱️", desc: "Ingresos, salidas y horas trabajadas" },
        { name: "Lista de Empleados", path: "/admin/empleados", icon: "👥", desc: "Administrar usuarios y roles" }
      ]
    },
    {
      titulo: "Fuerza de Ventas",
      links: [
        { name: "Visitas de Hoy", path: "/admin/reportes-visitas", icon: "📍", desc: "Seguimiento de rutas en tiempo real" },
        { name: "Agenda de Seguimiento", path: "/admin/proximas-visitas", icon: "📅", desc: "Clientes por visitar (Alertas Rojas)" },
        { name: "Base de Clientes", path: "/admin/clientes", icon: "🏢", desc: "Crear y editar clientes" }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24 text-black font-sans">
      <h1 className="text-2xl font-black text-blue-900 mb-8 uppercase tracking-tighter pt-4">Panel de Control</h1>

      {secciones.map((seccion, idx) => (
        <div key={idx} className="mb-8">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">{seccion.titulo}</h2>
          <div className="grid gap-3">
            {seccion.links.map((link) => (
              <Link key={link.path} href={link.path} className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100 flex items-center gap-4 active:scale-95 transition-all">
                <div className="text-3xl bg-blue-50 w-14 h-14 flex items-center justify-center rounded-2xl">
                  {link.icon}
                </div>
                <div>
                  <h3 className="font-black text-sm text-blue-900 uppercase tracking-tight">{link.name}</h3>
                  <p className="text-[10px] text-gray-400 font-medium">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}