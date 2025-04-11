import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Desactivar ESLint durante la compilación
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
