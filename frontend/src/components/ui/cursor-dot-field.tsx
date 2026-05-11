'use client';
import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';

type CursorDotFieldProps = Omit<React.ComponentProps<'div'>, 'ref'> & {
  dotColor?: string;
  dotSize?: number;
  gap?: number;
  radius?: number;
};

export function CursorDotField({
  className,
  dotColor = 'rgba(255, 255, 255, 0.8)',
  dotSize = 3,
  gap = 28,
  radius = 160,
  ...props
}: CursorDotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const dotsRef = useRef<{ x: number; y: number; alpha: number; targetAlpha: number; scale: number; targetScale: number }[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const initDots = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      dotsRef.current = [];
      for (let x = gap; x < width; x += gap) {
        for (let y = gap; y < height; y += gap) {
          dotsRef.current.push({
            x,
            y,
            alpha: 0,
            targetAlpha: 0,
            scale: 0,
            targetScale: 0,
          });
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const dot of dotsRef.current) {
        const dx = dot.x - mx;
        const dy = dot.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const strength = 1 - dist / radius;
          dot.targetAlpha = strength;
          dot.targetScale = strength;
        } else {
          dot.targetAlpha = 0;
          dot.targetScale = 0;
        }

        // Smooth lerp
        dot.alpha += (dot.targetAlpha - dot.alpha) * 0.12;
        dot.scale += (dot.targetScale - dot.scale) * 0.12;

        if (dot.alpha > 0.01) {
          const s = dotSize * (0.3 + dot.scale * 0.7);
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, s, 0, Math.PI * 2);
          ctx.fillStyle = dotColor.replace(/[\d.]+\)$/, `${dot.alpha})`);
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    const handleResize = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      initDots();
    };

    initDots();
    animate();

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [dotColor, dotSize, gap, radius]);

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 z-0', className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}
