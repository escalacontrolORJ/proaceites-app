import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from './components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Proaceites - Control de Asistencia',
  description: 'Sistema interno de gestión de personal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 text-black`}>
        {/* El 'pb-24' asegura que el contenido de las páginas 
          no quede oculto detrás de la barra de navegación inferior.
        */}
        <div className="min-h-screen pb-24">
          {children}
        </div>
        
        {/* El Navbar estará fijo en la parte inferior en todas las vistas */}
        <Navbar />
      </body>
    </html>
  )
}