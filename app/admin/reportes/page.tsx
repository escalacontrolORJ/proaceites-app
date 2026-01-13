'use client'
// VERSION 3.7 - REPARACIÓN DE LÓGICA DE COLOR Y CLIC
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
        if (reg.tipo_registro === 'ingreso') agrupados[llave].entrada = reg
        else if (reg.tipo_registro === 'salida') agrupados[llave].salida = reg
      })

      setFilas(Object.values(agrupados))
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const verMapa = (geo: any) => {
    if (!geo) return;
    let lat, lon;

    try {
      if (typeof geo === 'object' && geo !== null) {
        // En Postgres Point, X es Longitud y Y es Latitud
        lat = geo.y;
        lon = geo.x;
      } else {
        // Limpiar strings tipo "( -0.21, -79.11 )"
        const limpio = geo.replace(/[()]/g, '').split(',');
        lon = limpio[0].trim();
        lat = limpio[1].trim();
      }

      if (lat && lon) {
        // URL de Google Maps Directa
        const url = "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lon;
        window.open(url, '_blank');
      }
    } catch (e) {
      console.error("Error al procesar GPS:", e);
    }
  };

  const CeldaInfo = ({ registro, tipo }: { registro: any, tipo: string }) => {
    if (!registro) return <span className="text-slate-300 text-[10px]">--</span>;

    // Detectar si el campo geolocalizacion tiene contenido
    const tieneDatoGPS = registro.geolocalizacion !== null && registro.geolocalizacion !== undefined;

    return (
      <div className="flex flex-col items-center gap-2 py-2">
        <span className={`text-[11px] font-black ${tipo === 'entrada' ? 'text-blue-600' : 'text-orange-500'}`}>
          {new Date(registro.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        
        <div className="flex gap-2 items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          {/* FOTO */}
          {registro.foto_url ? (
            <button 
              onClick={() => {
                const w = window.open();
                w?.document.write(`<img src="${registro.foto_url}" style="width:100%; border-radius:10px;"/>`);
              }}
              className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200"
            >
              <img src={registro.foto_url} className="w-full h-full object-cover" alt="Foto" />
            </button>
          ) : <div className="w-10 h-10 bg-slate-50 rounded-lg" />}

          {/* BOTÓN GPS - AHORA AZUL SI HAY DATO */}
          {tieneDatoGPS ? (
            <button 
              onClick={() => verMapa(registro.geolocalizacion)}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all text-xl cursor-pointer"
              title="Click para ver mapa"
            >
              📍
            </button>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-300 rounded-lg text-xl" title="Sin GPS">
              📍
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <AdminNav />
      <div className="max-w-7xl mx-auto p-4 md:p-10">
        
        {/* FILTROS */}
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={empleadoSeleccionado} onChange={(e) => setEmpleadoSeleccionado(e.target.value)} className="p-3 rounded-2xl bg-slate-50 font-bold border-none outline-none">
            <option value="TODOS">TODOS</option>
            {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
          </select>
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="p-3 rounded-2xl bg-slate-50 font-bold outline-none" />
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="p-3 rounded-2xl bg-slate-50 font-bold outline-none" />
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                  <th className="p-6">Empleado</th>
                  <th className="p-6 text-center">Fecha</th>
                  <th className="p-6 text-center">Entrada</th>
                  <th className="p-6 text-center">Salida</th>
                  <th className="p-6 text-center">Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {filas.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 text-xs uppercase text-slate-700">{r.nombre}</td>
                    <td className="p-6 text-center text-[10px] text-slate-400">{r.fecha}</td>
                    <td className="p-6"><CeldaInfo registro={r.entrada} tipo="entrada" /></td>
                    <td className="p-6"><CeldaInfo registro={r.salida} tipo="salida" /></td>
                    <td className="p-6 text-center">
                      <span className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black">
                        { ( (r.entrada && r.salida) ? ( (new Date(r.salida.fecha_hora).getTime() - new Date(r.entrada.fecha_hora).getTime()) / (1000*60*60) ).toFixed(2) : "0.00" ) } H
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}