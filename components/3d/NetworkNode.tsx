'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COLOR_GREEN = '#10B981'
const COLOR_RED = '#EF4444'

interface NetworkNodeProps {
  position: [number, number, number]
  floatOffset?: number
}

export function NetworkNode({ position, floatOffset = 0 }: NetworkNodeProps) {
  const innerGroupRef = useRef<THREE.Group>(null)
  const coreMeshRef = useRef<THREE.Mesh>(null)
  const glowMeshRef = useRef<THREE.Mesh>(null)
  const [isError, setIsError] = useState(false)

  const color = isError ? COLOR_RED : COLOR_GREEN

  useEffect(() => {
    let errorTimer: ReturnType<typeof setTimeout>
    let recoveryTimer: ReturnType<typeof setTimeout>

    const scheduleNextError = () => {
      const delay = 4000 + Math.random() * 10000
      errorTimer = setTimeout(() => {
        setIsError(true)
        const errorDuration = 1200 + Math.random() * 2000
        recoveryTimer = setTimeout(() => {
          setIsError(false)
          scheduleNextError()
        }, errorDuration)
      }, delay)
    }

    scheduleNextError()
    return () => {
      clearTimeout(errorTimer)
      clearTimeout(recoveryTimer)
    }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + floatOffset

    if (innerGroupRef.current) {
      innerGroupRef.current.position.y = Math.sin(t * 0.6) * 0.14
      innerGroupRef.current.rotation.y = t * 0.28
      innerGroupRef.current.rotation.x = Math.sin(t * 0.4) * 0.08
    }

    const emissiveIntensity = isError
      ? 1.6 + Math.sin(t * 8) * 0.6
      : 0.9 + Math.sin(t * 1.5) * 0.3

    if (coreMeshRef.current) {
      const mat = coreMeshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = emissiveIntensity
      mat.color.set(color)
      mat.emissive.set(color)
    }

    if (glowMeshRef.current) {
      const mat = glowMeshRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = isError ? 0.18 + Math.sin(t * 8) * 0.08 : 0.1 + Math.sin(t * 1.5) * 0.04
      mat.color.set(color)
      mat.emissive.set(color)
    }
  })

  return (
    <group position={position}>
      <group ref={innerGroupRef}>
        {/* Wireframe core */}
        <mesh ref={coreMeshRef}>
          <icosahedronGeometry args={[0.19, 1]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.9}
            wireframe
          />
        </mesh>

        {/* Solid inner fill — very subtle */}
        <mesh>
          <icosahedronGeometry args={[0.14, 1]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.4}
            transparent
            opacity={0.15}
          />
        </mesh>

        {/* Outer glow shell */}
        <mesh ref={glowMeshRef}>
          <icosahedronGeometry args={[0.32, 1]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.1}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  )
}
