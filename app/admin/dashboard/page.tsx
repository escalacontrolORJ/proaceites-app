'use client'
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Función para registrar la acción (Ingreso o Salida)
  const registrarEvento = async (tipo: 'INGRESO' | 'SALIDA') => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Obtenemos GPS
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { error } = await supabase.from('asistencia').insert([
          { 
            usuario_id: session?.user.id,
            tipo: tipo,
            coordenadas: `${pos.coords.latitude}, ${pos.coords.longitude}`,
            fecha: new Date().toISOString()
          }
        ])

        if (error) throw error
        alert(`✅ ${tipo} registrado con éxito`);
        if (tipo === 'INGRESO') router.push('/admin/asistencia');
      })
    } catch (error: any) {
      alert("Error: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 flex flex-col justify-center font-sans">
      <div className="mb-10 text-center">
        <h1 className="text-white text-4xl font-black uppercase tracking-tighter">Proaceites</h1>
        <p className="text-blue-400 font-bold text-[10px] tracking-[5px] uppercase">Control de Asistencia</p>
      </div>

      <div className="space-y-6">
        {/* BOTÓN DE INGRESO */}
        <button 
          onClick={() => registrarEvento('INGRESO')}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white p-8 rounded-[35px] shadow-2xl shadow-emerald-900/50 flex flex-col items-center active:scale-95 transition-all"
        >
          <span className="text-4xl mb-2">🚀</span>
          <span className="text-2xl font-black uppercase">Marcar Ingreso</span>
          <span className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-widest text-emerald-100">Iniciar Jornada</span>
        </button>

        {/* BOTÓN DE SALIDA */}
        <button 
          onClick={() => registrarEvento('SALIDA')}
          disabled={loading}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white p-8 rounded-[35px] shadow-2xl shadow-rose-900/50 flex flex-col items-center active:scale-95 transition-all"
        >
          <span className="text-4xl mb-2">🏁</span>
          <span className="text-2xl font-black uppercase">Marcar Salida</span>
          <span className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-widest text-rose-100">Finalizar Jornada</span>
        </button>
      </div>

      <button 
        onClick={() => router.push('/admin/asistencia')}
        className="mt-12 text-slate-500 font-black uppercase text-[10px] tracking-widest text-center"
      >
        Ver Clientes →
      </button>
    </div>
  )
}