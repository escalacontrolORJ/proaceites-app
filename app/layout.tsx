import './globals.css' // ESTA LÍNEA ES LA QUE DA EL COLOR Y DISEÑO
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Proaceites App',
  description: 'Sistema de administración',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}