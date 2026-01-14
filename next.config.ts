import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Cuando alguien entre a /dashboard (la ruta vieja)
        source: '/dashboard',
        // Lo mandamos a /admin/dashboard (la ruta con botones)
        destination: '/admin/dashboard',
        permanent: true,
      },
      {
        // Si entran a la raíz de la página
        source: '/',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;