// Dentro del return de tu página de asistencia, usa este estilo:
<div className="space-y-4">
  {marcaciones.map((m: any) => (
    <div key={m.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${m.tipo === 'entrada' ? 'bg-green-50' : 'bg-red-50'}`}>
          {m.tipo === 'entrada' ? '⬇️' : '⬆️'}
        </div>
        <div>
          <p className="font-bold text-slate-800">{m.empleados?.nombres}</p>
          <p className="text-xs text-slate-500">{m.fecha} • {m.hora}</p>
        </div>
      </div>
      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${m.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {m.tipo}
      </span>
    </div>
  ))}
</div>