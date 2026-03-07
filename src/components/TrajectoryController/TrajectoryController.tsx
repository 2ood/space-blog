'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSpaceStore } from '@/store/spaceStore'
import { getPostColor, TRAJECTORY_SEQUENCES } from '@/config/spaceConfig'

const STOP_DISTANCE = 22
const FLY_LERP = 0.03
const TURN_SPEED = 0.08

export default function TrajectoryController() {

  const { camera } = useThree()

  const posts             = useSpaceStore((s) => s.posts)
  const navMode           = useSpaceStore((s) => s.navMode)
  const trajectorySequence = useSpaceStore((s) => s.trajectorySequence)
  const status            = useSpaceStore((s) => s.trajectoryStatus)
  const index             = useSpaceStore((s) => s.trajectoryIndex)
  const setStatus         = useSpaceStore((s) => s.setTrajectoryStatus)
  const setIndex          = useSpaceStore((s) => s.setTrajectoryIndex)
  const setProgress       = useSpaceStore((s) => s.setTrajectoryProgress)
  const setActivePost     = useSpaceStore((s) => s.setActivePost)

  const indexRef   = useRef(index)
  const statusRef  = useRef(status)
  const navModeRef = useRef(navMode)

  useEffect(()=>{indexRef.current=index},[index])
  useEffect(()=>{statusRef.current=status},[status])
  useEffect(()=>{navModeRef.current=navMode},[navMode])

  const flyStarPos = useRef<THREE.Vector3 | null>(null)
  const flyDest    = useRef<THREE.Vector3 | null>(null)

  const turning = useRef(false)

  const ordered = useMemo(() => {
    const list = [...posts]
    if (trajectorySequence === 'default') {
      return list.sort((a, b) => a.trajectoryOrder - b.trajectoryOrder)
    }
    if (trajectorySequence === 'chronological') {
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
    const seq = TRAJECTORY_SEQUENCES.find(s => s.id === trajectorySequence)
    const color = seq?.color
    if (!color) return list.sort((a, b) => a.trajectoryOrder - b.trajectoryOrder)
    return list
      .filter(p => getPostColor(p) === color)
      .sort((a, b) => a.trajectoryOrder - b.trajectoryOrder)
  }, [posts, trajectorySequence])
  const orderedRef = useRef(ordered)
  useEffect(() => { orderedRef.current = ordered }, [ordered])

  const computeDest = (camPos: THREE.Vector3, starPos: THREE.Vector3) => {
    const dir = starPos.clone().sub(camPos).normalize()
    return starPos.clone().addScaledVector(dir, -STOP_DISTANCE)
  }

  const startFlyTo = (starPos: THREE.Vector3) => {

    flyStarPos.current = starPos.clone()
    flyDest.current = computeDest(camera.position, starPos)

    turning.current = true
  }

    const handleSequenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value as typeof trajectorySequence
    setTrajectorySequence(id)
    setIndex(0)
    setProgress(0)
    setStatus('idle')
    setActivePost(null)
  }

  // Set true in spacebar handler to suppress the panel-button watcher below
  const flyInitiatedBySpacebar = useRef(false)
  const prevStatus = useRef(status)

  useEffect(() => {

    const onKey=(e:KeyboardEvent)=>{

      if(e.code!=='Space')return
      e.preventDefault()

      if(navModeRef.current!=='trajectory')return

      const currentStatus=statusRef.current
      const currentIndex=indexRef.current
      const ord=orderedRef.current

      if(currentStatus==='waiting'){

        const next=currentIndex+1

        if(next>=ord.length){
          setStatus('idle')
          setActivePost(null)
          flyStarPos.current=null
          flyDest.current=null
          return
        }

        setActivePost(null)
        setIndex(next)
        setProgress(0)
        flyInitiatedBySpacebar.current = true
        setStatus('travelling')

        startFlyTo(new THREE.Vector3(...ord[next].position))
      }

      else if(currentStatus==='idle'){

        if(ord.length===0)return

        setIndex(0)
        setProgress(0)
        flyInitiatedBySpacebar.current = true
        setStatus('travelling')

        startFlyTo(new THREE.Vector3(...ord[0].position))
      }
    }

    window.addEventListener('keydown',onKey)
    return()=>window.removeEventListener('keydown',onKey)

  },[])

  // Panel buttons (prev/next/play/restart) set index+status in the store.
  // The spacebar handler calls startFlyTo directly, so we use a flag to
  // avoid double-triggering startFlyTo from both places simultaneously.

  useEffect(() => {
    const nowTravelling = status === 'travelling' && prevStatus.current !== 'travelling'
    prevStatus.current = status

    if (nowTravelling && !flyInitiatedBySpacebar.current) {
      const ord = orderedRef.current
      if (index < ord.length) {
        startFlyTo(new THREE.Vector3(...ord[index].position))
      }
    }

    flyInitiatedBySpacebar.current = false
  }, [index, status])

  useFrame(()=>{

    if(navModeRef.current!=='trajectory')return
    if(!flyStarPos.current)return

    const starPos=flyStarPos.current

    const m=new THREE.Matrix4()
    m.lookAt(camera.position,starPos,new THREE.Vector3(0,1,0))
    const targetQuat=new THREE.Quaternion().setFromRotationMatrix(m)

    if(turning.current){

      camera.quaternion.slerp(targetQuat,TURN_SPEED)

      if(camera.quaternion.angleTo(targetQuat)<0.01){
        turning.current=false
      }

      return
    }

    if(!flyDest.current)return

    camera.quaternion.slerp(targetQuat,0.15)
    camera.position.lerp(flyDest.current,FLY_LERP)

    if(camera.position.distanceTo(flyDest.current)<0.5){

      camera.position.copy(flyDest.current)

      flyStarPos.current=null
      flyDest.current=null

      setStatus('waiting')
      setActivePost(orderedRef.current[indexRef.current])
    }

  })

  return null
}