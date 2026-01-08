'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Image from 'next/image'

export default function DashboardAsistencia() {
  const [loading, setLoading] = useState(false)
  const [ubicacion, setUbicacion] = useState<{lat: number, lng: number} | null>(null)
  const [enTrabajo, setEnTrabajo] = useState(false)
  const [horaIngreso, setHoraIngreso] = useState<Date | null>(null)

  // 1. Pedir permisos de GPS apenas carga la página
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => alert("Proaceites requiere GPS para funcionar. Por favor actívalo.")
      );
    }
  }, []);

  const manejarRegistro = async (tipo: 'ingreso' | 'salida') => {
    if (!ubicacion) return alert("Esperando señal de GPS...");
    setLoading(true);

    // Lógica de alerta de 9 horas para la salida
    if (tipo === 'salida' && horaIngreso) {
      const ahora = new Date();
      const diferenciaHoras = (ahora.getTime() - horaIngreso.getTime()) / (1000 * 60 * 60);
      
      if (diferenciaHoras < 9) {
        const confirmar = confirm("Aún no terminas tu día de labor (9 horas). ¿Deseas registrar salida de todos modos?");
        if (!confirmar) {
          setLoading(false);
          return;
        }
      }
    }

    // Aquí capturaríamos la foto (usando un input oculto o API de cámara)
    // Por ahora registramos en la DB
    const { data, error } = await supabase.from('asistencia').insert([{
      tipo_registro: tipo,
      geolocalizacion: `(${ubicacion.lng},${ubicacion.lat})`,
      fecha_hora: new Date().toISOString()
    }]);

    if (!error) {
      setEnTrabajo(tipo === 'ingreso');
      if (tipo === 'ingreso') setHoraIngreso(new Date());
      alert(`${tipo.toUpperCase()} registrado con éxito en Proaceites`);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      <Image src="/logo.JPG" alt="Logo" width={100} height={100} />
      
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-md w-full max-w-sm text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Panel de Asistencia</h2>
        <p className={`text-sm mb-6 ${enTrabajo ? 'text-green-600' : 'text-red-500'}`}>
          Estado: <strong>{enTrabajo ? 'DENTRO DEL TRABAJO' : 'FUERA DE LABOR'}</strong>
        </p>

        {!enTrabajo ? (
          <button 
            onClick={() => manejarRegistro('ingreso')}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'REGISTRANDO...' : 'MARCAR INGRESO'}
          </button>
        ) : (
          <button 
            onClick={() => manejarRegistro('salida')}
            disabled={loading}
            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-red-700 disabled:bg-gray-400"
          >
            {loading ? 'REGISTRANDO...' : 'MARCAR SALIDA'}
          </button>
        )}
      </div>
    </div>
  )
}