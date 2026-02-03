'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function ReporteAdministrativo() {
  const [tipoReporte, setTipoReporte] = useState('asistencia') 
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
            agrupados[key] = { id: key, nombre: nombresMap[reg.empleado_id] || 'Usuario', fecha: reg.fecha, entrada: null, salida: null, horas: '0.00' }
          }
          const d = new Date(reg.fecha_hora); d.setHours(d.getHours() - 5)
          const horaStr = d.getUTCHours().toString().padStart(2, '0') + ':' + d.getUTCMinutes().toString().padStart(2, '0')
          const datosEvento = { hora: horaStr, foto: reg.foto, gps: reg.geolocalizacion, raw_time: d.getTime() }
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
        // Lógica para Visitas y Próximas Visitas basada en tu CSV
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
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const exportarExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += tipoReporte === 'asistencia' ? "Empleado,Fecha,Entrada,Salida,Horas\n" : "Vendedor,Cliente,Motivo,Monto,Fecha\n";
    filas.forEach(r => {
      let row = tipoReporte === 'asistencia' ? 
        `${r.nombre},${r.fecha},${r.entrada?.hora || ''},${r.salida?.hora || ''},${r.horas}` :
        `${r.empleados?.nombres},${r.clientes?.nombre_comercial},${r.motivo},${r.valor_transaccion},${r.fecha || r.proxima_visita}`;
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_${tipoReporte}.csv`);
    document.body.appendChild(link);
    link.click();
  }

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text(`Reporte de ${tipoReporte.toUpperCase()}`, 14, 15);
    const tableColumn = tipoReporte === 'asistencia' ? ["Empleado", "Fecha", "Entrada", "Salida", "Horas"] : ["Vendedor", "Cliente", "Motivo", "Monto", "Fecha"];
    const tableRows = filas.map(r => tipoReporte === 'asistencia' ? 
      [r.nombre, r.fecha, r.entrada?.hora, r.salida?.hora, r.horas] : 
      [r.empleados?.nombres, r.clientes?.nombre_comercial, r.motivo, r.valor_transaccion, r.fecha || r.proxima_visita]
    );
    (doc as any).autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
    doc.save(`Reporte_${tipoReporte}.pdf`);
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
        <div className="flex flex-col gap-6 bg-slate-900/50 p-6 rounded-3xl border border-white/5 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-xl font-black italic uppercase tracking-tighter">Panel de Reportes</h1>
            <select 
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value)}
              className="bg-slate-800 text-emerald-400 border-none rounded-xl p-3 text-sm font-black outline-none w-full md:w-64"
            >
              <option value="asistencia">📅 ASISTENCIA PERSONAL</option>
              <option value="visitas">💼 GESTIÓN DE VISITAS</option>
              <option value="proximas">⏳ PRÓXIMAS VISITAS</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 ml-2">Desde</p>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl p-2 text-xs font-bold" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 ml-2">Hasta</p>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl p-2 text-xs font-bold" />
            </div>
            <div className="flex gap-2">
              <button onClick={exportarExcel} className="bg-emerald-600 hover:bg-emerald-700 p-2 rounded-xl text-[10px] font-black uppercase transition-colors">Excel</button>
              <button onClick={exportarPDF} className="bg-rose-600 hover:bg-rose-700 p-2 rounded-xl text-[10px] font-black uppercase transition-colors">PDF</button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[35px] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <tr>
                <th className="p-6">{tipoReporte === 'asistencia' ? 'Colaborador' : 'Cliente / Vendedor'}</th>
                <th className="p-6">{tipoReporte === 'asistencia' ? 'Ingreso' : 'Motivo'}</th>
                <th className="p-6">{tipoReporte === 'asistencia' ? 'Salida' : 'Monto'}</th>
                <th className="p-6 text-center">{tipoReporte === 'asistencia' ? 'Jornada' : 'Evidencia'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filas.map((r, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-6">
                    <p className="font-black text-white italic text-base leading-tight">
                      {tipoReporte === 'asistencia' ? r.nombre : (r.clientes?.nombre_comercial || 'S/N')}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500">{tipoReporte === 'asistencia' ? r.fecha : r.empleados?.nombres}</p>
                  </td>
                  <td className="p-6 font-bold uppercase text-slate-400">
                    {tipoReporte === 'asistencia' ? (r.entrada?.hora || '--:--') : r.motivo}
                  </td>
                  <td className="p-6 font-black text-white">
                    {tipoReporte === 'asistencia' ? (r.salida?.hora || 'LABORANDO') : `$${r.valor_transaccion?.toFixed(2) || '0.00'}`}
                  </td>
                  <td className="p-6 text-center">
                    {tipoReporte === 'asistencia' ? (
                      <span className="bg-slate-950 px-4 py-2 rounded-2xl border border-white/5 font-black">{r.horas}h</span>
                    ) : (
                      <div className="flex justify-center gap-2">
                         {r.foto_local && <img src={r.foto_local} className="w-8 h-8 rounded-lg object-cover border border-white/10" />}
                         <button onClick={() => abrirMapa(r.ubicacion_gps)} className="text-[10px] font-black text-blue-400">MAPA</button>
                      </div>
                    )}
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