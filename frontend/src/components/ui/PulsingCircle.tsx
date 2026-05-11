import { motion, AnimatePresence } from "framer-motion";
import { MeshGradient } from "@paper-design/shaders-react";
import React, { useState } from "react";
import { GlobalChatbot } from "./GlobalChatbot";

// Forcing any type for the shader component to avoid TS issues with unknown library exports
const MeshGradientAny = MeshGradient as any;

/**
 * PulsingCircle Component
 * Adds a theme-matching pulsing shader circle with rotating branding text.
 */
export function PulsingCircle() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Theme-matching colors: Emeralds, Parchment, Ink, and Gold highlights
  const themeColors = [
    "#10B981", // Emerald Primary
    "#059669", // Mid Green
    "#064E3B", // Deep Ink Green
    "#F5E6D3", // Parchment
    "#B91C1C", // Warm Accent Red
    "#D4AF37", // Premium Gold
    "#1A1A1A"  // Ink Black
  ];

  return (
    <>
      <div
        className="fixed bottom-10 right-10 z-[2000] cursor-pointer"
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Pulsing Border Circle (Shader-based) */}
          <div className="relative w-14 h-14 rounded-full overflow-hidden border border-white/10 shadow-2xl">
            <MeshGradientAny
              colors={themeColors}
              speed={1.0}
              distortion={0.5}
              pixelate={0}
              className="w-full h-full"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
              }}
            />
            {/* Subtle overlay to soften the shader */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
          </div>

          {/* Rotating Text Around the Circle Logo */}
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.span
              className="absolute -top-[0.14em] flex items-center justify-center border border-foreground/40 rounded-full w-[0.34em] h-[0.34em] bg-background/20 backdrop-blur-sm shadow-sm"
              animate={{ borderColor: ["rgba(0,0,0,0.1)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.1)"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="0.16em" height="0.16em" viewBox="0 0 24 24" fill="currentColor" className="ml-[0.02em] text-foreground">
                <polygon points="7 5 19 12 7 19 7 5" />
              </svg>
            </motion.span>
          </span>

          {/* Rotating Text Around the Circle */}
          <motion.svg
            className="absolute inset-0 w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            animate={{ rotate: 360 }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ transform: "scale(1.6)" }}
          >
            <defs>
              <path id="text-ring-path" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" />
            </defs>
            <text className="text-[11.5px] font-bold tracking-widest" style={{ fill: "rgba(0, 0, 0, 0.85)" }}>
              <textPath href="#text-ring-path" startOffset="0%">
                Finshala AI
              </textPath>
            </text>
          </motion.svg>

          {/* Center Accent Dot */}
          <div className="absolute w-1 h-1 bg-white rounded-full opacity-50 shadow-[0_0_8px_white]" />
        </div>
      </div>

      <GlobalChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}

export default PulsingCircle;
