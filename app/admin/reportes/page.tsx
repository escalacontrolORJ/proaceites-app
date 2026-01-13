'use client'
// VERSION 2.2 - FIX FOTOS CLICABLES Y GPS
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
        const llave = `${reg.empleado_id}-${reg.fecha}`
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
      console.error("Error cargando datos:", error)
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

  // COMPONENTE PARA RENDERIZAR FOTO Y GPS
  const CeldaInfo = ({ registro, tipo }: { registro: any, tipo: string }) => {
    if (!registro) return <span className="text-slate-300 text-[10px] italic">No registrado</span>;

    const googleMapsUrl = `https://www.google.com/maps?q=${registro.latitud},${registro.longitud}`;

    return (
      <div className="flex flex-col items-center gap-2">
        <span className={`font-bold text-xs ${tipo === 'entrada' ? 'text-blue-600' : 'text-orange-600'}`}>
          {new Date(registro.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="flex gap-2 items-center">
          {/* FOTO CLICABLE */}
          {registro.foto_url ? (
            <a href={registro.foto_url} target="_blank" rel="noreferrer" className="block hover:scale-105 transition-transform">
              <img 
                src={registro.foto_url} 
                alt="Foto" 
                className="w-10 h-10 rounded-lg object-cover border-2 border-slate-200 shadow-sm"
              />
            </a>
          ) : (
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-[8px] text-slate-400">Sin foto</div>
          )}

          {/* LINK GPS */}
          {registro.latitud && (
            <a 
              href={googleMapsUrl} 
              target="_blank" 
              rel="noreferrer"
              className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 text-lg"
              title="Ver ubicación en mapa"
            >
              📍
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <AdminNav />
      <div className="max-w-7xl mx-auto p-6 md:p-10">

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Colaborador</label>
            <select value={empleadoSeleccionado} onChange={(e) => setEmpleadoSeleccionado(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 font-bold outline-none transition-all">
              <option value="TODOS">👥 TODOS LOS EMPLEADOS</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2 tracking-widest">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 font-bold" />
          </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden mb-8 border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="p-6">Empleado</th>
                <th className="p-6 text-center">Fecha</th>
                <th className="p-6 text-center">Entrada (Foto/GPS)</th>
                <th className="p-6 text-center">Salida (Foto/GPS)</th>
                <th className="p-6 text-center">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center animate-pulse font-black text-slate-400">CARGANDO...</td></tr>
              ) : (
                filas.map((r, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-6 font-black text-xs uppercase">{r.nombre}</td>
                    <td className="p-6 text-center text-[10px] font-bold text-slate-400">{r.fecha}</td>
                    <td className="p-6 text-center">
                      <CeldaInfo registro={r.entrada} tipo="entrada" />
                    </td>
                    <td className="p-6 text-center">
                      <CeldaInfo registro={r.salida} tipo="salida" />
                    </td>
                    <td className="p-6 text-center">
                      <span className="px-3 py-1 rounded-lg bg-slate-900 text-white font-black text-[10px]">
                        {calcularHorasNum(r.entrada, r.salida).toFixed(2)} hrs
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl flex justify-between items-center">
          <div className="text-right w-full">
            <p className="text-[10px] font-black uppercase opacity-70 mb-1">Total Acumulado</p>
            <p className="text-4xl font-black">{totalHorasRango.toFixed(2)} <span className="text-xs">HRS</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}