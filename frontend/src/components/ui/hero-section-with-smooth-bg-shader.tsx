import { MeshGradient } from "@paper-design/shaders-react"
import React, { useEffect, useState } from "react"

// Ignore TS errors for MeshGradient props
const MeshGradientAny = MeshGradient as any;

interface HeroSectionProps {
  title?: string
  highlightText?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
  colors?: string[]
  distortion?: number
  swirl?: number
  speed?: number
  offsetX?: number
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  buttonClassName?: string
  maxWidth?: string
  veilOpacity?: string
  fontFamily?: string
  fontWeight?: number
  children?: React.ReactNode
}

export function HeroSection({
  title = "Intelligent AI Agents for",
  highlightText = "Smart Brands",
  description = "Transform your brand and evolve it through AI-driven brand guidelines and always up-to-date core components.",
  buttonText = "Join Waitlist",
  onButtonClick,
  colors = ["#72b9bb", "#b5d9d9", "#ffd1bd", "#ffebe0", "#8cc5b8", "#dbf4a4"],
  distortion = 0.8,
  swirl = 0.6,
  speed = 0.42,
  offsetX = 0.08,
  className = "",
  titleClassName = "",
  descriptionClassName = "",
  buttonClassName = "",
  maxWidth = "max-w-6xl",
  veilOpacity = "bg-white/20 dark:bg-black/25",
  fontFamily = '"PP Editorial New", Georgia, sans-serif',
  fontWeight = 500,
  children,
}: HeroSectionProps) {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () =>
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick()
    }
  }

  return (
    <section className={`relative w-full min-h-screen ${children ? '' : 'overflow-hidden flex items-center justify-center'} ${className}`}>
      <div className="fixed inset-0 w-screen h-screen z-0">
        {mounted && (
          <>
            <MeshGradientAny
              width={dimensions.width}
              height={dimensions.height}
              colors={colors}
              distortion={distortion}
              swirl={swirl}
              grainMixer={0}
              grainOverlay={0}
              speed={speed}
              offsetX={offsetX}
            />
            <MeshGradientAny
              width={dimensions.width}
              height={dimensions.height}
              colors={colors}
              distortion={distortion}
              swirl={swirl}
              speed={speed * 0.6}
              wireframe="true"
              backgroundColor="transparent"
              style={{ position: 'absolute', top: 0, left: 0, opacity: 0.2, mixBlendMode: 'multiply' }}
              className="pointer-events-none"
            />
            <div className={`absolute inset-0 pointer-events-none ${veilOpacity}`} />
          </>
        )}
      </div>
      
      {children ? (
        <div className="relative z-10 w-full min-h-screen bg-transparent">{children}</div>
      ) : (
        <div className={`relative z-10 ${maxWidth} mx-auto px-6 w-full`}>
          <div className="text-center">
            <h1
              className={`font-bold text-foreground text-balance text-4xl sm:text-5xl md:text-6xl xl:text-[80px] leading-tight sm:leading-tight md:leading-tight lg:leading-tight xl:leading-[1.1] mb-6 lg:text-7xl ${titleClassName}`}
              style={{ fontFamily, fontWeight }}
            >
              {title} <span className="text-primary">{highlightText}</span>
            </h1>
            <p className={`text-lg sm:text-xl text-foreground text-pretty max-w-2xl mx-auto leading-relaxed mb-10 px-4 ${descriptionClassName}`}>
              {description}
            </p>
            <button
              onClick={handleButtonClick}
              className={`px-6 py-4 sm:px-8 sm:py-6 rounded-full border-4 bg-[rgba(63,63,63,1)] border-card text-sm sm:text-base text-white hover:bg-[rgba(63,63,63,0.9)] transition-colors ${buttonClassName}`}
            >
              {buttonText}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
