import React, { useEffect, useState, memo } from 'react';
import { Landmark, Brain, Flame, Zap, Palette, Layers, Sparkles } from "lucide-react";

// --- Type Definitions ---
type IconType = 'tax' | 'xai' | 'fire' | 'stress' | 'genui' | 'core';

type GlowColor = 'cyan' | 'purple';

interface SkillIconProps {
  type: IconType;
}

interface SkillConfig {
  id: string;
  orbitRadius: number;
  size: number;
  speed: number;
  iconType: IconType;
  phaseShift: number;
  glowColor: GlowColor;
  label: string;
}

interface OrbitingSkillProps {
  config: SkillConfig;
  angle: number;
}

interface GlowingOrbitPathProps {
  radius: number;
  glowColor?: GlowColor;
  animationDelay?: number;
}

// --- SVG Configurations for Finshala AI Agents ---
const iconComponents: Record<IconType, { component: () => React.JSX.Element; color: string }> = {
  tax: {
    component: () => <Landmark strokeWidth={1.5} className="w-full h-full" style={{ color: "#3b82f6" }} />,
    color: '#3b82f6'
  },
  xai: {
    component: () => <Brain strokeWidth={1.5} className="w-full h-full" style={{ color: "#ec4899" }} />,
    color: '#ec4899'
  },
  fire: {
    component: () => <Flame strokeWidth={1.5} className="w-full h-full" style={{ color: "#ef4444" }} />,
    color: '#ef4444'
  },
  stress: {
    component: () => <Zap strokeWidth={1.5} className="w-full h-full" style={{ color: "#f59e0b" }} />,
    color: '#f59e0b'
  },
  genui: {
    component: () => <Palette strokeWidth={1.5} className="w-full h-full" style={{ color: "#8b5cf6" }} />,
    color: '#8b5cf6'
  },
  core: {
    component: () => <Layers strokeWidth={1.5} className="w-full h-full" style={{ color: "#10b981" }} />,
    color: '#10b981'
  }
};

// --- Memoized Icon Component ---
const SkillIcon = memo(({ type }: SkillIconProps) => {
  const IconComponent = iconComponents[type]?.component;
  return IconComponent ? <IconComponent /> : null;
});
SkillIcon.displayName = 'SkillIcon';

// --- Configuration for the Orbiting Agents ---
const skillsConfig: SkillConfig[] = [
  // Inner Orbit
  { 
    id: 'tax',
    orbitRadius: 100, 
    size: 40, 
    speed: 1, 
    iconType: 'tax', 
    phaseShift: 0, 
    glowColor: 'cyan',
    label: 'Tax Agent'
  },
  { 
    id: 'xai',
    orbitRadius: 100, 
    size: 45, 
    speed: 1, 
    iconType: 'xai', 
    phaseShift: (2 * Math.PI) / 3, 
    glowColor: 'cyan',
    label: 'XAI Agent'
  },
  { 
    id: 'fire',
    orbitRadius: 100, 
    size: 40, 
    speed: 1, 
    iconType: 'fire', 
    phaseShift: (4 * Math.PI) / 3, 
    glowColor: 'cyan',
    label: 'FIRE Agent'
  },
  // Outer Orbit
  { 
    id: 'stress',
    orbitRadius: 180, 
    size: 50, 
    speed: -0.6, 
    iconType: 'stress', 
    phaseShift: 0, 
    glowColor: 'purple',
    label: 'Stress Agent'
  },
  { 
    id: 'genui',
    orbitRadius: 180, 
    size: 45, 
    speed: -0.6, 
    iconType: 'genui', 
    phaseShift: (2 * Math.PI) / 3, 
    glowColor: 'purple',
    label: 'GenUI Agent'
  },
  { 
    id: 'core',
    orbitRadius: 180, 
    size: 40, 
    speed: -0.6, 
    iconType: 'core', 
    phaseShift: (4 * Math.PI) / 3, 
    glowColor: 'purple',
    label: 'Orchestrator'
  },
];

// --- Memoized Orbiting Agent Component ---
const OrbitingSkill = memo(({ config, angle }: OrbitingSkillProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { orbitRadius, size, iconType, label } = config;

  const x = Math.cos(angle) * orbitRadius;
  const y = Math.sin(angle) * orbitRadius;

  return (
    <div
      className="absolute top-1/2 left-1/2 transition-all duration-300 ease-out"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
        zIndex: isHovered ? 20 : 10,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          relative w-full h-full p-2 bg-black/60 backdrop-blur-md border border-white/10
          rounded-full flex items-center justify-center
          transition-all duration-300 cursor-pointer
          ${isHovered ? 'scale-125 shadow-2xl' : 'shadow-lg hover:shadow-xl'}
        `}
        style={{
          boxShadow: isHovered
            ? `0 0 30px ${iconComponents[iconType]?.color}40, 0 0 60px ${iconComponents[iconType]?.color}20`
            : undefined
        }}
      >
        <SkillIcon type={iconType} />
        {isHovered && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded text-xs text-white whitespace-nowrap pointer-events-none">
            {label}
          </div>
        )}
      </div>
    </div>
  );
});
OrbitingSkill.displayName = 'OrbitingSkill';

// --- Optimized Orbit Path Component ---
const GlowingOrbitPath = memo(({ radius, glowColor = 'cyan', animationDelay = 0 }: GlowingOrbitPathProps) => {
  const glowColors = {
    cyan: {
      primary: 'rgba(6, 182, 212, 0.4)',
      secondary: 'rgba(6, 182, 212, 0.2)',
      border: 'rgba(6, 182, 212, 0.3)'
    },
    purple: {
      primary: 'rgba(147, 51, 234, 0.4)',
      secondary: 'rgba(147, 51, 234, 0.2)',
      border: 'rgba(147, 51, 234, 0.3)'
    }
  };

  const colors = glowColors[glowColor] || glowColors.cyan;

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
      style={{
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        animationDelay: `${animationDelay}s`,
      }}
    >
      {/* Glowing background */}
      <div
        className="absolute inset-0 rounded-full animate-pulse opacity-40"
        style={{
          background: `radial-gradient(circle, transparent 30%, ${colors.secondary} 70%, ${colors.primary} 100%)`,
          boxShadow: `0 0 60px ${colors.primary}, inset 0 0 60px ${colors.secondary}`,
          animation: 'pulse 4s ease-in-out infinite',
          animationDelay: `${animationDelay}s`,
        }}
      />

      {/* Static ring for depth */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `1px solid ${colors.border}`,
          boxShadow: `inset 0 0 20px ${colors.secondary}`,
        }}
      />
    </div>
  );
});
GlowingOrbitPath.displayName = 'GlowingOrbitPath';

interface OrbitingSkillsProps {
  isAnimating?: boolean;
}

// --- Main App Component ---
export default function OrbitingSkills({ isAnimating = true }: OrbitingSkillsProps) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    // ONLY increment time if isAnimating is true (user clicked Generate)
    if (!isAnimating) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setTime(prevTime => prevTime + deltaTime);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAnimating]);

  const orbitConfigs: Array<{ radius: number; glowColor: GlowColor; delay: number }> = [
    { radius: 100, glowColor: 'cyan', delay: 0 },
    { radius: 180, glowColor: 'purple', delay: 1.5 }
  ];

  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-[450px] aspect-square flex items-center justify-center">
        
        {/* Central Core Icon with enhanced glow */}
        <div className="w-20 h-20 bg-black/80 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center z-10 relative shadow-2xl">
          <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl animate-pulse"></div>
          <div className="absolute inset-0 rounded-full bg-teal-500/20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="relative z-10">
            <Sparkles size={32} strokeWidth={1.5} style={{ color: "hsl(var(--parchment))" }} />
          </div>
        </div>

        {/* Render glowing orbit paths */}
        {orbitConfigs.map((config) => (
          <GlowingOrbitPath
            key={`path-${config.radius}`}
            radius={config.radius}
            glowColor={config.glowColor}
            animationDelay={config.delay}
          />
        ))}

        {/* Render orbiting agent icons */}
        {skillsConfig.map((config) => {
          const angle = time * config.speed + (config.phaseShift || 0);
          return (
            <OrbitingSkill
              key={config.id}
              config={config}
              angle={angle}
            />
          );
        })}
      </div>
    </div>
  );
}
