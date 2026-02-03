'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function ReporteAdministrativo() {
  const [tipoReporte, setTipoReporte] = useState('asistencia') // asistencia | visitas | proximas
  const [filas, setFilas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchData()
  }, [fechaDesde, fechaHasta, tipoReporte])

  async function fetchData() {
    setLoading(true)
    try {
      if (tipoReporte === 'asistencia') {
        const { data: emps } = await supabase.from('empleados').select('id, nombres')
        const nombresMap = (emps || []).reduce((acc: any, cur: any) => ({ ...acc, [cur.id]: cur.nombres }), {})

        const { data: asistencia, error } = await supabase
          .from('asistencia')
          .select('empleado_id, fecha, fecha_hora, tipo_registro, foto, geolocalizacion')
          .gte('fecha', fechaDesde)
          .lte('fecha', fechaHasta)
          .order('fecha_hora', { ascending: true })

        if (error) throw error

        const agrupados: any = {}
        asistencia?.forEach(reg => {
          const key = `${reg.empleado_id}_${reg.fecha}`
          if (!agrupados[key]) {
            agrupados[key] = {
              id: key,
              nombre: nombresMap[reg.empleado_id] || 'Usuario',
              fecha: reg.fecha,
              entrada: null,
              salida: null,
              horas: '0.00'
            }
          }

          const d = new Date(reg.fecha_hora)
          d.setHours(d.getHours() - 5) // Ajuste Ecuador
          const horaStr = d.getUTCHours().toString().padStart(2, '0') + ':' + 
                          d.getUTCMinutes().toString().padStart(2, '0')

          const datosEvento = {
            hora: horaStr,
            foto: reg.foto,
            gps: reg.geolocalizacion,
            raw_time: d.getTime()
          }

          const tipo = reg.tipo_registro?.toUpperCase()
          if (tipo === 'INGRESO') agrupados[key].entrada = datosEvento
          else if (tipo === 'SALIDA') agrupados[key].salida = datosEvento

          if (agrupados[key].entrada && agrupados[key].salida) {
            const diffMs = agrupados[key].salida.raw_time - agrupados[key].entrada.raw_time
            agrupados[key].horas = (diffMs / 3600000).toFixed(2)
          }
        })
        setFilas(Object.values(agrupados).reverse())

      } else {
        // Lógica para Visitas y Agenda (usando tus campos: foto_local, valor_transaccion, ubicacion_gps)
        let query = supabase.from('visitas').select('*, empleados(nombres), clientes(nombre_comercial)')
        
        if (tipoReporte === 'visitas') {
          query = query.gte('fecha', fechaDesde).lte('fecha', fechaHasta)
        } else {
          query = query.gte('proxima_visita', fechaDesde).lte('proxima_visita', fechaHasta)
        }

        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        setFilas(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const exportarExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (tipoReporte === 'asistencia') {
      csvContent += "Empleado,Fecha,Entrada,Salida,Horas\n";
      filas.forEach(r => csvContent += `${r.nombre},${r.fecha},${r.entrada?.hora || ''},${r.salida?.hora || ''},${r.horas}\n`);
    } else {
      csvContent += "Vendedor,Cliente,Motivo,Valor,Fecha/Agenda\n";
      filas.forEach(r => csvContent += `${r.empleados?.nombres},${r.clientes?.nombre_comercial},${r.motivo},${r.valor_transaccion},${r.fecha || r.proxima_visita}\n`);
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_${tipoReporte}.csv`);
    document.body.appendChild(link);
    link.click();
  }

  const abrirMapa = (gps: any) => {
    if (!gps) return alert("Sin ubicación")
    const coords = gps.toString().replace(/[() ]/g, '')
    window.open(`https://www.google.com/maps?q=${coords}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <AdminNav />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        
        {/* CABECERA CON COMBO */}
        <div className="flex flex-col gap-6 bg-slate-900/50 p-6 rounded-3xl border border-white/5 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-xl font-black italic uppercase tracking-tighter">Panel de Control Operativo</h1>
            <select 
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value)}
              className="bg-slate-800 text-emerald-400 border-none rounded-xl p-3 text-sm font-black outline-none w-full md:w-72"
            >
              <option value="asistencia">📋 REPORTE ASISTENCIA</option>
              <option value="visitas">💼 GESTIÓN DE VISITAS</option>
              <option value="proximas">⏳ AGENDA PRÓXIMAS VISITAS</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[140px]">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 ml-2">Desde</p>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl p-2 text-xs font-bold" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 ml-2">Hasta</p>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl p-2 text-xs font-bold" />
            </div>
            <button onClick={exportarExcel} className="bg-white text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-400 transition-colors">Exportar Excel</button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[35px] border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <th className="p-6">{tipoReporte === 'asistencia' ? 'Colaborador' : 'Cliente / Vendedor'}</th>
                  <th className="p-6">{tipoReporte === 'asistencia' ? 'Ingreso' : 'Motivo'}</th>
                  <th className="p-6">{tipoReporte === 'asistencia' ? 'Salida' : 'Monto'}</th>
                  <th className="p-6 text-center">{tipoReporte === 'asistencia' ? 'Jornada' : 'Evidencia'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filas.map((r: any, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    {/* COLUMNA 1: IDENTIFICACIÓN */}
                    <td className="p-6">
                      <p className="font-black text-white italic text-lg leading-tight">
                        {tipoReporte === 'asistencia' ? r.nombre : (r.clientes?.nombre_comercial || 'S/N')}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">
                        {tipoReporte === 'asistencia' ? r.fecha : `Vendedor: ${r.empleados?.nombres}`}
                      </p>
                    </td>

                    {/* COLUMNA 2: ENTRADA / MOTIVO */}
                    <td className="p-6">
                      {tipoReporte === 'asistencia' ? (
                        r.entrada ? (
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 overflow-hidden">
                              {r.entrada.foto ? <img src={r.entrada.foto} alt="E" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-[8px] text-slate-600">S/F</div>}
                            </div>
                            <div>
                              <p className="text-emerald-400 font-black text-xl leading-none">{r.entrada.hora}</p>
                              <button onClick={() => abrirMapa(r.entrada.gps)} className="text-[9px] font-black text-slate-500 hover:text-white uppercase mt-1">📍 GPS</button>
                            </div>
                          </div>
                        ) : <span className="text-slate-700 italic">--:--</span>
                      ) : (
                        <span className="bg-slate-800 px-3 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase">{r.motivo}</span>
                      )}
                    </td>

                    {/* COLUMNA 3: SALIDA / MONTO */}
                    <td className="p-6">
                      {tipoReporte === 'asistencia' ? (
                        r.salida ? (
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 overflow-hidden">
                              {r.salida.foto ? <img src={r.salida.foto} alt="S" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-[8px] text-slate-600">S/F</div>}
                            </div>
                            <div>
                              <p className="text-rose-400 font-black text-xl leading-none">{r.salida.hora}</p>
                              <button onClick={() => abrirMapa(r.salida.gps)} className="text-[9px] font-black text-slate-500 hover:text-white uppercase mt-1">📍 GPS</button>
                            </div>
                          </div>
                        ) : <span className="text-amber-500 font-black text-[10px] animate-pulse">LABORANDO...</span>
                      ) : (
                        <p className="text-xl font-black text-white">${r.valor_transaccion?.toFixed(2) || '0.00'}</p>
                      )}
                    </td>

                    {/* COLUMNA 4: JORNADA / EVIDENCIA VISITA */}
                    <td className="p-6 text-center">
                      {tipoReporte === 'asistencia' ? (
                        <div className="inline-block bg-slate-950 px-5 py-2 rounded-2xl border border-white/5 shadow-inner">
                          <p className="text-xl font-black text-white">{r.horas}</p>
                          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Horas</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          {r.foto_local ? (
                            <img src={r.foto_local} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="Visita" />
                          ) : <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-[8px] text-slate-600">S/F</div>}
                          <button onClick={() => abrirMapa(r.ubicacion_gps)} className="text-[9px] font-black text-blue-400 hover:text-white uppercase">📍 VER MAPA</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filas.length === 0 && !loading && (
            <div className="p-24 text-center">
              <p className="text-slate-600 font-bold italic text-lg uppercase tracking-tighter">Sin registros encontrados</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}