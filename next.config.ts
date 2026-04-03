import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ── Output ──────────────────────────────────────────────────────────────
  output: 'standalone',

  // ── ESM package transpilation ────────────────────────────────────────────
  // three.js, R3F, and drei ship as pure ESM modules. Without transpilation
  // Next.js webpack can't resolve them under the default CommonJS target,
  // causing "SyntaxError: Cannot use import statement" at build time.
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
  ],

  // ── Experimental ─────────────────────────────────────────────────────────
  experimental: {
    // Tree-shake barrel imports so only the framer-motion primitives actually
    // used (motion, AnimatePresence, useScroll, etc.) end up in the bundle.
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },

  // ── Turbopack ────────────────────────────────────────────────────────────
  // Next.js 16 enables Turbopack by default. The empty object opts in
  // explicitly and silences the "webpack config present but no turbopack
  // config" warning. Extension aliasing is handled natively by Turbopack.
  turbopack: {},

  // ── API proxy rewrites ───────────────────────────────────────────────────
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:3000'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
