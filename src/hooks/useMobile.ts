import { useEffect, useState } from 'react'

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    check()
    const mq = window.matchMedia('(max-width: 768px)')
    mq.addEventListener('change', check)
    return () => mq.removeEventListener('change', check)
  }, [])

  return isMobile
}
