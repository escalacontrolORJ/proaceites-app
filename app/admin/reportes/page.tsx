'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import AdminNav from '@/components/AdminNav'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReporteAdministrativo() {
  const [tipoReporte, setTipoReporte] = useState('asistencia') 
  const [filas, setFilas] = useState<any[]>([])
  const [filasFiltradas, setFilasFiltradas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0])
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0])
  
  // Estados para filtros
  const [empleados, setEmpleados] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [filtroEmpleado, setFiltroEmpleado] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')

  useEffect(() => {
    fetchData()
  }, [fechaDesde, fechaHasta, tipoReporte])

  useEffect(() => {
    aplicarFiltros()
  }, [filtroEmpleado, filtroCliente, filas])

  async function fetchData() {
    setLoading(true)
    try {
      // Cargar Catálogos para filtros
      const { data: emps } = await supabase.from('empleados').select('id, nombres')
      const { data: clis } = await supabase.from('clientes').select('id, nombre_comercial')
      setEmpleados(emps || [])
      setClientes(clis || [])
      
      const nombresMap = (emps || []).reduce((acc: any, cur: any) => ({ ...acc, [cur.id]: cur.nombres }), {})

      if (tipoReporte === 'asistencia') {
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
              empleado_id: reg.empleado_id,
              nombre: nombresMap[reg.empleado_id] || 'Usuario', 
              fecha: reg.fecha, 
              entrada: null, 
              salida: null, 
              horas: '0.00' 
            }
          }
          const d = new Date(reg.fecha_hora); d.setHours(d.getHours() - 5)
          const horaStr = d.getUTCHours().toString().padStart(2, '0') + ':' + d.getUTCMinutes().toString().padStart(2, '0')
          const datosEvento = { hora: horaStr, foto: reg.foto, gps: reg.geolocalizacion, raw_time: d.getTime() }
          if (reg.tipo_registro?.toUpperCase() === 'INGRESO') agrupados[key].entrada = datosEvento
          else if (reg.tipo_registro?.toUpperCase() === 'SALIDA') agrupados[key].salida = datosEvento
          if (agrupados[key].entrada && agrupados[key].salida) {
            const diffMs = agrupados[key].salida.raw_time - agrupados[key].entrada.raw_time
            agrupados[key].horas = (diffMs / 3600000).toFixed(2)
          }
        })
        setFilas(Object.values(agrupados).reverse())
      } else {
        const columnaFecha = tipoReporte === 'visitas' ? 'fecha' : 'proxima_visita'
        const { data: visitas, error } = await supabase
          .from('visitas')
          .select('*, clientes(nombre_comercial)')
          .gte(columnaFecha, fechaDesde)
          .lte(columnaFecha, fechaHasta)
          .order(columnaFecha, { ascending: false })

        if (error) throw error
        setFilas((visitas || []).map(v => ({
          ...v,
          nombre_vendedor: nombresMap[v.vendedor_id] || nombresMap[v.empleado_id] || 'S/N',
          nombre_cliente: v.clientes?.nombre_comercial || 'Cliente no encontrado'
        })))
      }
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  function aplicarFiltros() {
    let temp = [...filas]
    if (filtroEmpleado) {
      temp = temp.filter(f => (f.empleado_id === filtroEmpleado || f.vendedor_id === filtroEmpleado))
    }
    if (filtroCliente && tipoReporte !== 'asistencia') {
      temp = temp.filter(f => f.cliente_id === filtroCliente)
    }
    setFilasFiltradas(temp)
  }

  const exportarExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (tipoReporte === 'asistencia') {
      csvContent += "Empleado,Fecha,Entrada,Salida,Horas\n";
      filasFiltradas.forEach(r => csvContent += `${r.nombre},${r.fecha},${r.entrada?.hora || ''},${r.salida?.hora || ''},${r.horas}\n`);
    } else {
      csvContent += "Vendedor,Cliente,Motivo,Valor,Observaciones,ProximaVisita\n";
      filasFiltradas.forEach(r => csvContent += `${r.nombre_vendedor},${r.nombre_cliente},${r.motivo},${r.valor_transaccion},${r.observaciones},${r.proxima_visita}\n`);
    }
    window.open(encodeURI(csvContent));
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.text(`Reporte de ${tipoReporte.toUpperCase()}`, 14, 15)
    doc.setFontSize(10)
    doc.text(`Periodo: ${fechaDesde} al ${fechaHasta}`, 14, 22)

    const headers = tipoReporte === 'asistencia' 
      ? [["Empleado", "Fecha", "Entrada", "Salida", "Horas"]]
      : [["Vendedor", "Cliente", "Motivo", "Monto", "Fecha", "Prox. Visita"]]
    
    const data = filasFiltradas.map(r => tipoReporte === 'asistencia'
      ? [r.nombre, r.fecha, r.entrada?.hora || '', r.salida?.hora || '', r.horas]
      : [r.nombre_vendedor, r.nombre_cliente, r.motivo, r.valor_transaccion, r.fecha, r.proxima_visita]
    )

    autoTable(doc, { head: headers, body: data, startY: 30 })
    doc.save(`Reporte_${tipoReporte}.pdf`)
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
        <div className="flex flex-col gap-6 bg-slate-900/50 p-6 rounded-3xl border border-white/5 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-xl font-black italic uppercase tracking-tighter">Panel Administrativo</h1>
            <select 
              value={tipoReporte}
              onChange={(e) => { setTipoReporte(e.target.value); setFiltroCliente(''); setFiltroEmpleado(''); }}
              className="bg-slate-800 text-emerald-400 border-none rounded-xl p-3 text-sm font-black outline-none w-full md:w-72"
            >
              <option value="asistencia">📋 REPORTE ASISTENCIA</option>
              <option value="visitas">💼 GESTIÓN DE VISITAS</option>
              <option value="proximas">⏳ AGENDA PRÓXIMAS VISITAS</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 ml-2">Desde</p>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl p-2 text-xs font-bold shadow-inner" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 ml-2">Hasta</p>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl p-2 text-xs font-bold shadow-inner" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 ml-2">Filtrar Empleado</p>
              <select value={filtroEmpleado} onChange={e => setFiltroEmpleado(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl p-2 text-xs font-bold">
                <option value="">TODOS LOS EMPLEADOS</option>
                {empleados.map(e => <option key={e.id} value={e.id}>{e.nombres}</option>)}
              </select>
            </div>
            {tipoReporte !== 'asistencia' && (
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 ml-2">Filtrar Cliente</p>
                <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl p-2 text-xs font-bold">
                  <option value="">TODOS LOS CLIENTES</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_comercial}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={exportarExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg">Excel</button>
            <button onClick={exportarPDF} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg">PDF</button>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[35px] border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <th className="p-6">Identificación</th>
                  <th className="p-6">{tipoReporte === 'asistencia' ? 'Ingreso' : 'Motivo / Fecha'}</th>
                  <th className="p-6">{tipoReporte === 'asistencia' ? 'Salida' : 'Monto'}</th>
                  <th className="p-6">Observaciones / Agenda</th>
                  {tipoReporte !== 'asistencia' && <th className="p-6 text-center">Evidencia</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filasFiltradas.map((r: any, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <p className="font-black text-white italic text-base leading-tight">
                        {tipoReporte === 'asistencia' ? r.nombre : r.nombre_cliente}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">
                        {tipoReporte === 'asistencia' ? r.fecha : `Vend: ${r.nombre_vendedor}`}
                      </p>
                    </td>
                    <td className="p-6">
                      {tipoReporte === 'asistencia' ? (
                        r.entrada ? (
                          <div className="flex items-center gap-3">
                            <img src={r.entrada.foto} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                            <div>
                              <p className="text-emerald-400 font-black text-lg">{r.entrada.hora}</p>
                              <button onClick={() => abrirMapa(r.entrada.gps)} className="text-[8px] font-black text-slate-500 underline">GPS</button>
                            </div>
                          </div>
                        ) : '--:--'
                      ) : (
                        <div>
                          <span className="bg-slate-800 px-2 py-1 rounded text-[9px] font-black text-slate-300 uppercase">{r.motivo}</span>
                          <p className="text-[9px] text-slate-600 mt-1 font-bold">{r.fecha}</p>
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      {tipoReporte === 'asistencia' ? (
                        r.salida ? (
                          <div className="flex items-center gap-3">
                            <img src={r.salida.foto} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                            <div>
                              <p className="text-rose-400 font-black text-lg">{r.salida.hora}</p>
                              <button onClick={() => abrirMapa(r.salida.gps)} className="text-[8px] font-black text-slate-500 underline">GPS</button>
                            </div>
                          </div>
                        ) : <span className="text-amber-500 font-black text-[9px] animate-pulse italic uppercase tracking-widest">En Turno</span>
                      ) : (
                        <p className="text-xl font-black text-white italic">${parseFloat(r.valor_transaccion || 0).toFixed(2)}</p>
                      )}
                    </td>
                    <td className="p-6">
                      {tipoReporte === 'asistencia' ? (
                        <div className="inline-block bg-slate-950 px-5 py-2 rounded-2xl border border-white/5">
                          <p className="text-xl font-black text-white">{r.horas}h</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 italic leading-tight max-w-[200px] break-words">
                            {r.observaciones ? `"${r.observaciones}"` : 'Sin observaciones'}
                          </p>
                          {r.proxima_visita && (
                            <p className="text-[9px] font-black text-amber-500 uppercase border-t border-white/5 pt-1">
                              📅 Prox: {r.proxima_visita}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    {tipoReporte !== 'asistencia' && (
                      <td className="p-6 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <img 
                            src={r.foto_local} 
                            className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-md cursor-pointer" 
                            onClick={() => window.open(r.foto_local, '_blank')}
                          />
                          <button onClick={() => abrirMapa(r.ubicacion_gps)} className="text-[8px] font-black text-blue-400 uppercase">📍 Mapa</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}