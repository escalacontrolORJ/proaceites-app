'use client'
// VERSION 2.4 - REPARACIÓN TOTAL LINKS Y FOTOS
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'

export default function ReporteAdministrativo() {
  const [filas, setFilas] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('TODOS')

  useEffect(() => {
    fetchData()
  }, [fechaDesde, fechaHasta, empleadoSeleccionado])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: emps } = await supabase.from('empleados').select('id, nombres')
      setEmpleados(emps || [])
      const nombresMap = Object.fromEntries(emps?.map(e => [e.id, e.nombres]) || [])

      let query = supabase
        .from('asistencia')
        .select('*')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)
        .order('fecha_hora', { ascending: true })

      if (empleadoSeleccionado !== 'TODOS') {
        query = query.eq('empleado_id', empleadoSeleccionado)
      }

      const { data: asist } = await query

      const agrupados: Record<string, any> = {}
      asist?.forEach(reg => {
        const llave = reg.empleado_id + '-' + reg.fecha
        if (!agrupados[llave]) {
          agrupados[llave] = {
            nombre: nombresMap[reg.empleado_id] || 'Sin Nombre',
            fecha: reg.fecha,
            entrada: null,
            salida: null
          }
        }
        
        if (reg.tipo_registro === 'ingreso') {
          agrupados[llave].entrada = reg
        } else if (reg.tipo_registro === 'salida') {
          agrupados[llave].salida = reg
        }
      })

      setFilas(Object.values(agrupados))
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const calcularHorasNum = (entrada: any, salida: any) => {
    if (!entrada || !salida) return 0
    const ms = new Date(salida.fecha_hora).getTime() - new Date(entrada.fecha_hora).getTime()
    return Math.max(0, ms / (1000 * 60 * 60))
  }

  const totalHorasRango = filas.reduce((acc, curr) => acc + calcularHorasNum(curr.entrada, curr.salida), 0)

  // COMPONENTE DE CELDA CORREGIDO CON CONCATENACIÓN SIMPLE
  const CeldaInfo = ({ registro, tipo }: { registro: any, tipo: string }) => {
    if (!registro) return <span className="text-slate-300 text-[10px] font-bold">--</span>;

    // URL DE MAPAS USANDO CONCATENACIÓN TRADICIONAL PARA EVITAR ERRORES
    const urlMapa = "https://www.google.com/maps/search/?api=1&query=" + registro.latitud + "," + registro.longitud;

    return (
      <div className="flex flex-col items-center justify-center gap-2">
        <span className={tipo === 'entrada' ? 'text-blue-600 font-black text-sm' : 'text-orange-600 font-black text-sm'}>
          {new Date(registro.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        
        <div className="flex gap-4 items-center">
          {/* FOTO - Enlace directo */}
          {registro.foto_url && (
            <a 
              href={registro.foto_url} 
              target="_blank" 
              rel="noreferrer" 
              className="border-2 border-slate-200 rounded-lg overflow-hidden hover:border-blue-500 transition-all shadow-sm"
            >
              <img 
                src={registro.foto_url} 
                alt="Ver" 
                className="w-12 h-12 object-cover"
              />
            </a>
          )}

          {/* GPS - Icono clicable */}
          {registro.latitud && (
            <a 
              href={urlMapa} 
              target="_blank" 
              rel="noreferrer"
              className="text-2xl hover:scale-125 transition-transform"
              title="Abrir Ubicación"
            >
              📍
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <AdminNav />
      <div className="max-w-7xl mx-auto p-4 md:p-10">

        {/* FILTROS */}
        <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-2">Empleado</label>
            <select value={empleadoSeleccionado} onChange={(e) => setEmpleadoSeleccionado(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-blue-500 font-bold outline-none">
              <option value="TODOS">TODOS</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-2">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-2">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full p-3 rounded-xl bg-slate-50 font-bold" />
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="bg-white rounded-[30px] shadow-xl overflow-hidden mb-6 border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                  <th className="p-5">Colaborador</th>
                  <th className="p-5 text-center">Fecha</th>
                  <th className="p-5 text-center">Entrada (Foto/GPS)</th>
                  <th className="p-5 text-center">Salida (Foto/GPS)</th>
                  <th className="p-5 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center font-bold text-slate-400">CARGANDO...</td></tr>
                ) : (
                  filas.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5 font-black text-xs uppercase">{r.nombre}</td>
                      <td className="p-5 text-center text-[10px] font-bold text-slate-400">{r.fecha}</td>
                      <td className="p-5"><CeldaInfo registro={r.entrada} tipo="entrada" /></td>
                      <td className="p-5"><CeldaInfo registro={r.salida} tipo="salida" /></td>
                      <td className="p-5 text-center">
                        <span className="px-3 py-1 bg-slate-900 text-white rounded-lg font-black text-[10px]">
                          {calcularHorasNum(r.entrada, r.salida).toFixed(2)} HRS
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOTAL ACUMULADO */}
        <div className="bg-blue-600 p-6 rounded-[30px] text-white shadow-lg flex justify-between items-center">
           <span className="text-xs font-black uppercase tracking-widest opacity-80">Total del Periodo</span>
           <span className="text-3xl font-black">{totalHorasRango.toFixed(2)} HRS</span>
        </div>
      </div>
    </div>
  )
}