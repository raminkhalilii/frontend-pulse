'use client'

import dynamic from 'next/dynamic'

// ─── Skeleton ─────────────────────────────────────────────────────────────────
// Approximated 2D projections of the 9 NetworkScene nodes as seen from
// PerspectiveCamera position={[1.5, 0.8, 9]} fov={58}.
// Coordinates are expressed as percentages of the container dimensions.

const SKEL_NODES = [
  { x: 51, y: 48 },  // 0 — hub
  { x: 27, y: 37 },  // 1
  { x: 73, y: 37 },  // 2
  { x: 35, y: 62 },  // 3
  { x: 66, y: 62 },  // 4
  { x: 51, y: 24 },  // 5 — top spine
  { x: 20, y: 49 },  // 6
  { x: 80, y: 49 },  // 7
  { x: 51, y: 70 },  // 8 — bottom spine
] as const

// A representative subset of connections (avoids a crowded skeleton)
const SKEL_EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 6], [2, 7], [5, 6], [5, 7], [6, 8], [7, 8], [3, 8], [4, 8],
]

function SceneSkeleton() {
  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ background: '#0A0F1A' }}
      aria-hidden="true"
    >
      {/* Central ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 52% 50%, rgba(16,185,129,0.055) 0%, transparent 70%)',
        }}
      />

      {/* Network skeleton — SVG fills the full container */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Pulse animation for edges */}
          <style>{`
            @keyframes skel-edge-pulse {
              0%, 100% { opacity: 0.12; }
              50%       { opacity: 0.28; }
            }
            @keyframes skel-node-pulse {
              0%, 100% { opacity: 0.25; r: 0.85; }
              50%       { opacity: 0.55; r: 1.1;  }
            }
            @keyframes skel-node-pulse-delay {
              0%, 100% { opacity: 0.18; r: 0.7;  }
              50%       { opacity: 0.45; r: 0.95; }
            }
            @keyframes skel-shimmer {
              0%   { stroke-dashoffset: 24; }
              100% { stroke-dashoffset: 0;  }
            }
          `}</style>
        </defs>

        {/* Edges */}
        {SKEL_EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={SKEL_NODES[a].x}
            y1={SKEL_NODES[a].y}
            x2={SKEL_NODES[b].x}
            y2={SKEL_NODES[b].y}
            stroke="#10B981"
            strokeWidth="0.18"
            strokeDasharray="1.4 1.6"
            style={{
              animation: `skel-edge-pulse ${2.8 + (i % 3) * 0.6}s ease-in-out infinite`,
              animationDelay: `${(i * 0.22) % 1.8}s`,
            }}
          />
        ))}

        {/* Node outer glow rings */}
        {SKEL_NODES.map((node, i) => (
          <circle
            key={`glow-${i}`}
            cx={node.x}
            cy={node.y}
            r={i === 0 ? 2.4 : 1.7}
            fill="none"
            stroke="#10B981"
            strokeWidth="0.08"
            style={{
              opacity: 0.1,
              animation: `skel-node-pulse ${2.4 + (i % 4) * 0.5}s ease-in-out infinite`,
              animationDelay: `${(i * 0.31) % 2}s`,
            }}
          />
        ))}

        {/* Node cores */}
        {SKEL_NODES.map((node, i) => (
          <circle
            key={`core-${i}`}
            cx={node.x}
            cy={node.y}
            r={i === 0 ? 1.1 : 0.75}
            fill="#10B981"
            style={{
              opacity: 0.22,
              animation: `skel-node-pulse-delay ${2 + (i % 3) * 0.7}s ease-in-out infinite`,
              animationDelay: `${(i * 0.27) % 1.6}s`,
            }}
          />
        ))}
      </svg>

      {/* Loading label */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span
            className="block w-1 h-1 rounded-full bg-pulse-green"
            style={{ animation: 'skel-node-pulse-delay 1s ease-in-out infinite' }}
          />
          <span className="font-mono text-[10px] text-slate-600 tracking-widest uppercase">
            Initialising scene
          </span>
          <span
            className="block w-1 h-1 rounded-full bg-pulse-green"
            style={{ animation: 'skel-node-pulse-delay 1s ease-in-out infinite 0.33s' }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Dynamic import — no SSR ──────────────────────────────────────────────────
// Canvas, drei helpers, and NetworkScene are all browser-only (WebGL).
// `ssr: false` prevents Next.js from attempting server-side rendering of any
// of these modules, which would crash on `window` / `navigator` access.

const CanvasScene = dynamic(
  async () => {
    const [
      { Canvas },
      { PerspectiveCamera },
      { NetworkScene },
    ] = await Promise.all([
      import('@react-three/fiber'),
      import('@react-three/drei'),
      import('./NetworkScene'),
    ])

    function InternalCanvas() {
      return (
        <Canvas
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          style={{ background: '#0A0F1A' }}
        >
          <PerspectiveCamera makeDefault position={[1.5, 0.8, 9]} fov={58} />
          <NetworkScene />
        </Canvas>
      )
    }

    return InternalCanvas
  },
  {
    ssr: false,
    loading: SceneSkeleton,
  },
)

// ─── Public export ────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for the Canvas + NetworkScene block in Hero.tsx.
 * Safe to render in any Server Component tree — the WebGL scene is loaded
 * exclusively in the browser after hydration.
 *
 * Usage in Hero.tsx: replace the `<div className="absolute inset-0 z-0">…</div>`
 * block (Suspense + Canvas) with:
 *   <div className="absolute inset-0 z-0">
 *     <DynamicScene />
 *   </div>
 */
export function DynamicScene() {
  return <CanvasScene />
}
