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
        {/* Contenedor principal para las páginas */}
        <main className="min-h-screen pb-24 relative">
          {children}
        </main>

        {/* Barra de navegación inferior fija */}
        <Navbar />
      </body>
    </html>
  )
}