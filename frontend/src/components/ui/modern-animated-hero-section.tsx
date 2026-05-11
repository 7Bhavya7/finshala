"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"

interface Character {
  char: string
  x: number
  y: number
  speed: number
}

// Re-engineered as a seamless background provider without the Title overlay
export const RainingLetters: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [characters, setCharacters] = useState<Character[]>([])
  const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set())

  const createCharacters = useCallback(() => {
    // Math/Finance symbols mixed with Matrix chars
    const allChars = "ABCDEF0123456789!@#$%&*+=-/\\|;:.₹€£¥"
    const charCount = 300
    const newCharacters: Character[] = []

    for (let i = 0; i < charCount; i++) {
      newCharacters.push({
        char: allChars[Math.floor(Math.random() * allChars.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
        speed: 0.1 + Math.random() * 0.3,
      })
    }

    return newCharacters
  }, [])

  useEffect(() => {
    setCharacters(createCharacters())
  }, [createCharacters])

  useEffect(() => {
    const updateActiveIndices = () => {
      const newActiveIndices = new Set<number>()
      const numActive = Math.floor(Math.random() * 3) + 3
      for (let i = 0; i < numActive; i++) {
        newActiveIndices.add(Math.floor(Math.random() * characters.length))
      }
      setActiveIndices(newActiveIndices)
    }

    const flickerInterval = setInterval(updateActiveIndices, 50)
    return () => clearInterval(flickerInterval)
  }, [characters.length])

  useEffect(() => {
    let animationFrameId: number

    const updatePositions = () => {
      setCharacters(prevChars => 
        prevChars.map(char => ({
          ...char,
          y: char.y + char.speed,
          ...(char.y >= 100 && {
            y: -5,
            x: Math.random() * 100,
            char: "ABCDEF0123456789!@#$%&*+=-/\\|;:.₹€£¥"[
              Math.floor(Math.random() * "ABCDEF0123456789!@#$%&*+=-/\\|;:.₹€£¥".length)
            ],
          }),
        }))
      )
      animationFrameId = requestAnimationFrame(updatePositions)
    }

    animationFrameId = requestAnimationFrame(updatePositions)
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    <div className="relative w-full min-h-screen bg-transparent overflow-hidden flex flex-col">
      {/* Raining Characters Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden mix-blend-screen opacity-60">
        {characters.map((char, index) => (
          <span
            key={index}
            className={`absolute transition-colors duration-100 ${
              activeIndices.has(index)
                ? "text-emerald-400 scale-125 z-10 font-bold animate-pulse text-lg"
                : "text-emerald-900/40 font-light text-sm"
            }`}
            style={{
              left: `${char.x}%`,
              top: `${char.y}%`,
              transform: `translate(-50%, -50%) ${activeIndices.has(index) ? 'scale(1.25)' : 'scale(1)'}`,
              textShadow: activeIndices.has(index) 
                ? '0 0 8px rgba(16,185,129,0.8), 0 0 12px rgba(16,185,129,0.4)' 
                : 'none',
              opacity: activeIndices.has(index) ? 1 : 0.4,
              transition: 'color 0.1s, transform 0.1s, text-shadow 0.1s',
              willChange: 'transform, top',
            }}
          >
            {char.char}
          </span>
        ))}
      </div>

      {/* Children rendered on top */}
      <div className="relative z-10 w-full h-full flex-grow">
        {children}
      </div>
    </div>
  )
}

export default RainingLetters
