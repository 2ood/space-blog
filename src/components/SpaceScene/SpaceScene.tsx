'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSpaceStore } from '@/store/spaceStore'
import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import StarField from '@/components/StarField/StarField'
import BlogStars from '@/components/BlogStars/BlogStars'
import type { Post } from '@/components/BlogStars/BlogStars'
import ConstellationLines from '@/components/ConstellationLines/ConstellationLines'
import TrajectoryController from '@/components/TrajectoryController/TrajectoryController'
import CameraController from '@/components/CameraController/CameraController'
import ControlPanel from '@/components/ControlPanel/ControlPanel'
import HUD from '@/components/HUD/HUD'
import PostCard from '@/components/PostCard/PostCard'
import MobileControls from '@/components/MobileControls/MobileControls'
import styles from './SpaceScene.module.css'

export default function SpaceScene() {
  const setPosts = useSpaceStore((s) => s.setPosts)
  const [posts, setPending] = useState<Post[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/posts')
      .then((res) => {
        if (!res.ok) throw new Error(`/api/posts returned ${res.status}`)
        return res.json()
      })
      .then((data: Post[]) => {
        const posts = data
        setPending(posts)
        setPosts(posts)
      })
      .catch((err) => {
        console.error('Failed to load posts:', err)
        setError(err.message)
      })
  }, [setPosts])

  return (
    <div className={styles.container}>
      <Canvas
        className={styles.canvas}
        camera={{ position: [0, 0, 5], fov: 75, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: false }}
      >
        <ambientLight intensity={0.15} />
        <directionalLight position={[50, 80, 60]} intensity={1.8} color="#fff5e0" />
        <pointLight position={[0, 0, 0]} intensity={0.5} color="#4a90d9" />

        <Suspense fallback={null}>
          <StarField count={10} spread={200} />
          <StarField count={6000} spread={900} opacity={0.55} size={0.5} />
          <BlogStars posts={posts} />
          <ConstellationLines posts={posts} />
          <CameraController />
          <TrajectoryController />
          <Preload all />
        </Suspense>
        <MobileControls />
      </Canvas>

      <HUD />
      <ControlPanel />
      <PostCard />
      

      {error && (
        <div className={styles.error}>
          ⚠ Could not load posts: {error}
        </div>
      )}
    </div>
  )
}
