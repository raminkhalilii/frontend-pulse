'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { NetworkNode } from './NetworkNode'

// ─── Topology ────────────────────────────────────────────────────────────────

const NODE_POSITIONS: [number, number, number][] = [
  [0,     0,     0   ],  // 0 — central hub
  [-2.6,  0.9,  -0.8 ],  // 1
  [ 2.6,  0.9,  -0.8 ],  // 2
  [-1.6, -1.6,   0.6 ],  // 3
  [ 1.6, -1.6,   0.6 ],  // 4
  [ 0,    2.2,  -2.0 ],  // 5 — top spine
  [-3.0, -0.4,  -2.2 ],  // 6
  [ 3.0, -0.4,  -2.2 ],  // 7
  [ 0,   -2.6,  -1.4 ],  // 8 — bottom spine
]

const CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 5], [1, 6], [2, 5], [2, 7],
  [3, 6], [3, 8], [4, 7], [4, 8],
  [5, 6], [5, 7], [6, 8], [7, 8],
  [1, 3], [2, 4],
]

// Deterministic packet config — avoids SSR/hydration random mismatch
const PACKET_SEEDS: { speed: number; offset: number; colorIdx: number }[] = [
  { speed: 0.28, offset: 0.00, colorIdx: 0 },
  { speed: 0.35, offset: 0.55, colorIdx: 1 },
  { speed: 0.22, offset: 0.20, colorIdx: 0 },
  { speed: 0.40, offset: 0.75, colorIdx: 1 },
  { speed: 0.30, offset: 0.10, colorIdx: 0 },
  { speed: 0.26, offset: 0.40, colorIdx: 1 },
  { speed: 0.38, offset: 0.85, colorIdx: 0 },
  { speed: 0.32, offset: 0.30, colorIdx: 1 },
  { speed: 0.24, offset: 0.60, colorIdx: 0 },
  { speed: 0.42, offset: 0.15, colorIdx: 1 },
  { speed: 0.29, offset: 0.90, colorIdx: 0 },
  { speed: 0.36, offset: 0.45, colorIdx: 1 },
  { speed: 0.21, offset: 0.05, colorIdx: 0 },
  { speed: 0.44, offset: 0.70, colorIdx: 1 },
  { speed: 0.31, offset: 0.25, colorIdx: 0 },
  { speed: 0.27, offset: 0.50, colorIdx: 1 },
  { speed: 0.39, offset: 0.80, colorIdx: 0 },
  { speed: 0.23, offset: 0.35, colorIdx: 1 },
  { speed: 0.41, offset: 0.65, colorIdx: 0 },
  { speed: 0.33, offset: 0.95, colorIdx: 1 },
]

const PACKET_COLORS = ['#10B981', '#3B82F6']

// ─── Data Packet ─────────────────────────────────────────────────────────────

interface DataPacketProps {
  start: THREE.Vector3
  end: THREE.Vector3
  speed: number
  offset: number
  color: string
}

function DataPacket({ start, end, speed, offset, color }: DataPacketProps) {
  const ref = useRef<THREE.Mesh>(null)
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.getElapsedTime() * speed + offset) % 1.0
    tmp.lerpVectors(start, end, t)
    ref.current.position.copy(tmp)
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.045, 6, 6]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={4}
        toneMapped={false}
      />
    </mesh>
  )
}

// ─── Main Scene ───────────────────────────────────────────────────────────────

export function NetworkScene() {
  const sceneGroupRef = useRef<THREE.Group>(null)

  // Pre-compute Vector3 positions once
  const nodeVectors = useMemo(
    () => NODE_POSITIONS.map(p => new THREE.Vector3(...p)),
    []
  )

  // Build one packet per connection, travelling in one direction only,
  // using pre-seeded deterministic values to avoid hydration mismatches.
  const packets = useMemo(() =>
    CONNECTIONS.map(([a, b], i) => {
      const seed = PACKET_SEEDS[i % PACKET_SEEDS.length]
      return {
        start: nodeVectors[a],
        end: nodeVectors[b],
        speed: seed.speed,
        offset: seed.offset,
        color: PACKET_COLORS[seed.colorIdx],
      }
    }),
    [nodeVectors]
  )

  // Slow panoramic rotation of the entire network
  useFrame(({ clock }) => {
    if (!sceneGroupRef.current) return
    sceneGroupRef.current.rotation.y = clock.getElapsedTime() * 0.04
    sceneGroupRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.025) * 0.06
  })

  return (
    <group ref={sceneGroupRef}>
      {/* ── Lighting ── */}
      <ambientLight intensity={0.08} />

      {/* Cool blue key light — front-top */}
      <pointLight position={[0, 6, 6]}   intensity={3.5} color="#3B82F6" distance={22} decay={2} />

      {/* Green fill lights — sides */}
      <pointLight position={[-6, -2, 4]} intensity={2.5} color="#10B981" distance={18} decay={2} />
      <pointLight position={[ 6, -2, 4]} intensity={2.0} color="#10B981" distance={18} decay={2} />

      {/* Subtle warm rim — back */}
      <pointLight position={[0, -4, -6]} intensity={1.2} color="#6366F1" distance={14} decay={2} />

      {/* ── Connection Lines ── */}
      {CONNECTIONS.map(([a, b], i) => (
        <Line
          key={`line-${i}`}
          points={[NODE_POSITIONS[a], NODE_POSITIONS[b]]}
          color="#1E3A5F"
          lineWidth={0.7}
          transparent
          opacity={0.45}
        />
      ))}

      {/* ── Data Packets ── */}
      {packets.map((p, i) => (
        <DataPacket key={`pkt-${i}`} {...p} />
      ))}

      {/* ── Nodes ── */}
      {NODE_POSITIONS.map((pos, i) => (
        <NetworkNode key={`node-${i}`} position={pos} floatOffset={i * 0.73} />
      ))}
    </group>
  )
}
