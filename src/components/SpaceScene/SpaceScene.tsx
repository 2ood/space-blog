'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import StarField from '@/components/StarField/StarField'
import BlogStars from '@/components/BlogStars/BlogStars'
import ConstellationLines from '@/components/ConstellationLines/ConstellationLines'
import TrajectoryController from '@/components/TrajectoryController/TrajectoryController'
import CameraController from '@/components/CameraController/CameraController'
import ControlPanel from '@/components/ControlPanel/ControlPanel'
import HUD from '@/components/HUD/HUD'
import PostCard from '@/components/PostCard/PostCard'
import PostOverlay from '@/components/PostOverlay/PostOverlay'
import TrajectoryExitConfirm from '@/components/TrajectoryExitConfirm/TrajectoryExitConfirm'
import SearchBar from '@/components/SearchBar/SearchBar'
import MobileControls from '@/components/MobileControls/MobileControls'
import {
  StarRegistryContext,
  useCreateStarRegistry,
} from '@/hooks/camera/useBlogStarRegistry'
import { usePosts } from '@/hooks/usePosts'
import styles from './SpaceScene.module.css'

export default function SpaceScene() {
  const registry = useCreateStarRegistry()
  const { posts, error } = usePosts()

  return (
    <StarRegistryContext.Provider value={registry}>
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
        <SearchBar />
        <ControlPanel />
        <PostCard />
        <PostOverlay />
        <TrajectoryExitConfirm />

        {error && (
          <div className={styles.error}>
            ⚠ Could not load posts: {error}
          </div>
        )}
      </div>
    </StarRegistryContext.Provider>
  )
}
