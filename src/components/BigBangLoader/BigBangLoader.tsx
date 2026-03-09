'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './BigBangLoader.module.css'

// ── Copy ──────────────────────────────────────────────────────────────────────
const LOADING_MESSAGES = [
  'Big bang is being prepared…',
  'Inflating spacetime…',
  'Seeding quantum fluctuations…',
  'Something is about to explode.',
  'Coalescing stardust into planets…',
  'Calibrating gravitational constants…',
  'Igniting stellar nurseries…',
  'Negotiating with dark matter…',
  'Folding eleven dimensions into three…',
  'Teaching electrons to behave…',
  'Assembling atoms, one at a time…',
  'Waiting for the universe to cool down…',
]

const DID_YOU_KNOW = [
  'The observable universe is 93 billion light-years in diameter.',
  'There are more stars in the universe than grains of sand on Earth.',
  'A neutron star teaspoon weighs about a billion tonnes.',
  'Light from the Sun takes 8 minutes and 20 seconds to reach Earth.',
  'The Milky Way will collide with Andromeda in ~4.5 billion years.',
  'Space is completely silent — sound needs a medium to travel.',
  'One day on Venus is longer than one year on Venus.',
  'The footprints on the Moon will last millions of years.',
  'Black holes can spin at nearly the speed of light.',
  'There may be more universes than atoms in our own.',
  'The Voyager 1 probe has been travelling for over 45 years.',
  'Neutron stars can rotate 700 times per second.',
]

const MSG_INTERVAL   = 2200   // ms between loading message swaps
const FACT_INTERVAL  = 5000   // ms between did-you-know swaps

// ─────────────────────────────────────────────────────────────────────────────

interface BigBangLoaderProps {
  visible: boolean   // false triggers the fade-out exit
}

export default function BigBangLoader({ visible }: BigBangLoaderProps) {
  const [msgIndex,  setMsgIndex]  = useState(0)
  const [factIndex, setFactIndex] = useState(0)
  const [dots, setDots] = useState('')
  const msgRef  = useRef(0)
  const factRef = useRef(0)
  const factInitRef = useRef(false)   // whether we've randomised the start yet

  // Cycle loading messages
  useEffect(() => {
    const id = setInterval(() => {
      msgRef.current = (msgRef.current + 1) % LOADING_MESSAGES.length
      setMsgIndex(msgRef.current)
    }, MSG_INTERVAL)
    return () => clearInterval(id)
  }, [])

  // Cycle facts — randomise starting position on first tick (client-only, avoids SSR mismatch)
  useEffect(() => {
    const id = setInterval(() => {
      if (!factInitRef.current) {
        factInitRef.current = true
        factRef.current = Math.floor(Math.random() * DID_YOU_KNOW.length)
      } else {
        factRef.current = (factRef.current + 1) % DID_YOU_KNOW.length
      }
      setFactIndex(factRef.current)
    }, FACT_INTERVAL)
    return () => clearInterval(id)
  }, [])

  // Animated ellipsis
  useEffect(() => {
    const id = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 400)
    return () => clearInterval(id)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          {/* Central singularity dot */}
          <div className={styles.singularity}>
            <div className={styles.core} />
            <div className={styles.ring1} />
            <div className={styles.ring2} />
            <div className={styles.ring3} />
          </div>

          {/* Loading message */}
          <div className={styles.messageArea}>
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                className={styles.message}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
              >
                {LOADING_MESSAGES[msgIndex].replace(/…$/, '')}{dots}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Did you know */}
          <div className={styles.factArea}>
            <span className={styles.factLabel}>DID YOU KNOW?</span>
            <AnimatePresence mode="wait">
              <motion.p
                key={factIndex}
                className={styles.fact}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                {DID_YOU_KNOW[factIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
