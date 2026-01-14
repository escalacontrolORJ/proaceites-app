'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        
        <header>
          <div className="bg-blue-600 w-20 h-20 rounded-[30px] flex items-center justify-center mx-auto shadow-xl shadow-blue-200 mb-4">
            <span className="text-4xl">🛢️</span>
          </div>
          <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">Proaceites</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px]">Sistema de Campo</p>
        </header>

        <div className="grid gap-4">
          {/* BOTÓN PARA ASISTENCIA (EL RELOJ) */}
          <button 
            onClick={() => router.push('/admin/dashboard')}
            className="w-full bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 flex items-center gap-4 active:scale-95 transition-all text-left group"
          >
            <div className="bg-orange-100 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-orange-200 transition-colors">⏰</div>
            <div>
              <p className="font-black text-slate-800 uppercase text-sm">Marcar Asistencia</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Entrada / Salida Personal</p>
            </div>
          </button>

          {/* BOTÓN PARA VISITAS A CLIENTES */}
          <button 
            onClick={() => router.push('/admin/asistencia')}
            className="w-full bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 flex items-center gap-4 active:scale-95 transition-all text-left group"
          >
            <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-200 transition-colors">📍</div>
            <div>
              <p className="font-black text-slate-800 uppercase text-sm">Visita a Clientes</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Foto + GPS + Recaudo</p>
            </div>
          </button>

          {/* BOTÓN PARA GESTIÓN DE CLIENTES */}
          <button 
            onClick={() => router.push('/admin/clientes')}
            className="w-full bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 flex items-center gap-4 active:scale-95 transition-all text-left group"
          >
            <div className="bg-purple-100 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-purple-200 transition-colors">🏪</div>
            <div>
              <p className="font-black text-slate-800 uppercase text-sm">Base de Clientes</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Crear o Editar Locales</p>
            </div>
          </button>
        </div>

        <footer className="pt-8">
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">© 2026 PROACEITES CONTROL SYSTEM</p>
        </footer>
      </div>
    </div>
  )
}