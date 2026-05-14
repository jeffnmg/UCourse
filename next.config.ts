import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  /** Menos módulos “raros” en el grafo de Webpack (ayuda con errores de chunks en dev). */
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
