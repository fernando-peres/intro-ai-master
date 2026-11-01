import { type ReactNode, useEffect, useRef, useState } from "react"

/** Mounts `children` once scrolled into view, and keeps them mounted after that. */
export function WhenVisible({ children }: { children: ReactNode }) {
  const box = useRef<HTMLSpanElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!box.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setSeen(true)
    })
    observer.observe(box.current)
    return () => observer.disconnect()
  }, [])
  return (
    <span ref={box} className="block h-full w-full">
      {seen && children}
    </span>
  )
}
