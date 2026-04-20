'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  life: number
  maxLife: number
  type: 'trail' | 'star'
  rotation?: number
  scale?: number
}

// 定义一个鼠标动效和共享动画的组件
export default function MouseEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const particles: Particle[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    const drawDoodleStar = (x: number, y: number, r: number, rotation: number, alpha: number, scale: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      ctx.scale(scale, scale)
      ctx.beginPath()
      const n = 5
      const inset = 0.45 // 使五角星的内角锐利度
      for (let i = 0; i < n * 2; i++) {
        const radius = i % 2 === 0 ? r : r * inset
        const angle = (i * Math.PI) / n - Math.PI / 2
        const px = Math.cos(angle) * radius
        const py = Math.sin(angle) * radius
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.lineWidth = 3
      ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.lineJoin = 'round'
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    const handleMouseMove = (e: MouseEvent) => {
      // 当鼠标移动时添加轨迹粒子
      particles.push({
        x: e.clientX,
        y: e.clientY,
        life: 0,
        maxLife: 25,
        type: 'trail',
      })
    }

    const handleClick = (e: MouseEvent) => {
      // 当鼠标点击时添加五角星粒子
      particles.push({
        x: e.clientX,
        y: e.clientY,
        life: 0,
        maxLife: 60,
        type: 'star',
        rotation: (Math.random() - 0.5) * 1, // 随机初始倾斜
        scale: 0.2, // 从小变大
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleClick)

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        if (p.life >= p.maxLife) {
          particles.splice(i, 1) // 移除寿命耗尽的粒子
          continue
        }

        const progress = p.life / p.maxLife
        const alpha = 1 - Math.pow(progress, 2) // 缓出消失

        if (p.type === 'trail') {
          ctx.beginPath()
          // 根据生命周期衰减半径
          const radius = Math.max(0, (1 - progress) * 5)
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.8})` // 稍微降低轨迹黑色的不透明度防止喧宾夺主
          ctx.fill()
        } else if (p.type === 'star') {
          // 星星：从小到大，并且伴随旋转和淡出
          const currentScale = (p.scale || 0.2) + Math.pow(progress, 0.5) * 1.5
          const currentRotation = (p.rotation || 0) + progress * 0.5
          drawDoodleStar(p.x, p.y, 20, currentRotation, alpha, currentScale)
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }
    render()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleClick)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(0.4deg); }
        }
        @keyframes custom-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-doodle-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-custom-pulse {
          animation: custom-pulse 3s ease-in-out infinite;
        }
      `}} />
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50 mix-blend-normal"
        style={{ width: '100vw', height: '100vh' }}
      />
    </>
  )
}
