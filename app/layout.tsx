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
        {/* El contenedor principal tiene un min-h-screen para asegurar que el fondo cubra todo.
          El pb-24 (padding-bottom) es VITAL para que el contenido no quede oculto 
          detrás del Navbar que está fijo abajo.
        */}
        <div className="min-h-screen pb-24 relative">
          {children}
        </div>
        
        {/* El Navbar se renderiza en todas las páginas, pero él mismo 
            se oculta en el login '/' gracias a su lógica interna. */}
        <Navbar />
      </body>
    </html>
  )
}