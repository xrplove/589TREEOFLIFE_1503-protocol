'use client'

import { useEffect, useRef } from 'react'

type Node = {
  x: number
  y: number
  vx: number
  vy: number
  pulse: number
  pulseSpeed: number
}

const NODE_COLOR = '#00A3FF'
const LINK_THRESHOLD = 150 // px

export default function BlockchainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let nodes: Node[] = []
    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      // Density: roughly 1 node per 18 000 px²
      const target = Math.min(140, Math.max(40, Math.floor((width * height) / 18000)))
      if (nodes.length === 0) {
        nodes = Array.from({ length: target }, () => spawn())
      } else if (nodes.length < target) {
        while (nodes.length < target) nodes.push(spawn())
      } else if (nodes.length > target) {
        nodes.length = target
      }
    }

    const spawn = (): Node => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.012 + Math.random() * 0.018,
    })

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      // Update node positions
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        n.pulse += n.pulseSpeed
        if (n.x <= 0 || n.x >= width) n.vx *= -1
        if (n.y <= 0 || n.y >= height) n.vy *= -1
      }

      // Draw links between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < LINK_THRESHOLD * LINK_THRESHOLD) {
            const d = Math.sqrt(d2)
            const alpha = (1 - d / LINK_THRESHOLD) * 0.16
            ctx.strokeStyle = `rgba(0, 163, 255, ${alpha})`
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes (with subtle pulse)
      for (const n of nodes) {
        const r = 1.4 + Math.sin(n.pulse) * 0.6
        const alpha = 0.45 + Math.sin(n.pulse) * 0.2
        ctx.fillStyle = `rgba(0, 163, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()

    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
