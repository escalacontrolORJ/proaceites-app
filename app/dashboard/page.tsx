'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Image from 'next/image'

export default function DashboardAsistencia() {
  const [loading, setLoading] = useState(false)
  const [ubicacion, setUbicacion] = useState<{lat: number, lng: number} | null>(null)
  const [enTrabajo, setEnTrabajo] = useState(false)
  const [horaIngreso, setHoraIngreso] = useState<Date | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Obtener el usuario actual
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => alert("Proaceites requiere GPS para funcionar. Por favor actívalo.")
      );
    }
  }, []);

  const manejarRegistro = async (tipo: 'ingreso' | 'salida') => {
    if (!ubicacion) return alert("Esperando señal de GPS...");
    if (!user) return alert("Sesión no encontrada. Reingresa al sistema.");
    
    setLoading(true);

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

    // Registro en la base de datos
    const { error } = await supabase.from('asistencia').insert([{
      empleado_id: user.id,
      empleado_email: user.email,
      tipo_registro: tipo,
      ubicacion: `Lat: ${ubicacion.lat}, Lng: ${ubicacion.lng}`,
      foto_url: 'pendiente_foto' // Luego activaremos la cámara
    }]);

    if (error) {
      alert("Error al registrar: " + error.message);
    } else {
      setEnTrabajo(tipo === 'ingreso');
      if (tipo === 'ingreso') setHoraIngreso(new Date());
      alert(`${tipo.toUpperCase()} registrado con éxito en Proaceites`);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6 text-black">
      <Image src="/logo.JPG" alt="Logo" width={100} height={100} priority />
      
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-md w-full max-w-sm text-center">
        <h2 className="text-xl font-bold mb-2">Panel de Asistencia</h2>
        <p className="text-xs text-gray-500 mb-4">{user?.email}</p>
        
        <p className={`text-sm mb-6 ${enTrabajo ? 'text-green-600' : 'text-red-500'}`}>
          Estado: <strong>{enTrabajo ? 'DENTRO DEL TRABAJO' : 'FUERA DE LABOR'}</strong>
        </p>

        {!enTrabajo ? (
          <button 
            onClick={() => manejarRegistro('ingreso')}
            disabled={loading}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-700 disabled:bg-gray-400"
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