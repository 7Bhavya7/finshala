import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { useUserProfile } from "@/hooks/useUserProfile";
import { GlassEffect } from "@/components/ui/liquid-glass";

import fireVideo from "../../images/fireplannervideo.mp4";
import healthVideo from "../../images/moneyhealthvideo.mp4";

interface PanelData {
  id: string;
  image?: string;
  videoSrc?: string;
  title: string;
  subtitle: string;
  label: string;
  isCenter?: boolean;
  centerLetter?: string;
}

const panels: PanelData[] = [
  {
    id: "fire",
    videoSrc: fireVideo,
    title: "FIRE Path",
    subtitle: "Journey to Financial Independence",
    label: "Explore Roadmap & Milestones",
  },
  {
    id: "health",
    videoSrc: healthVideo,
    title: "Money Health",
    subtitle: "Your 6-Dimension Financial Pulse",
    label: "Explore Score & Audit",
  },
  {
    id: "center",
    isCenter: true,
    centerLetter: "₹",
    title: "Finshala",
    subtitle: "Your Sovereign Financial Path",
    label: "Featured Work",
  },
  {
    id: "tax",
    title: "Tax Wizard",
    subtitle: "AI-Driven Regime Optimization",
    label: "Explore Savings & Strategy",
  },
  {
    id: "ai-shala",
    title: "AI Shala",
    subtitle: "AI Financial Guidance",
    label: "Explore AI Insights",
  },
];

const defaultTitle = "Finshala";
const defaultSubtitle = "Your Sovereign Financial Path";
const defaultLabel = "Explore Tools & Intelligence";

const HeroPanels = () => {
  const [hoveredPanel, setHoveredPanel] = useState<PanelData | null>(null);
  const [loadedVideos, setLoadedVideos] = useState<Record<string, boolean>>({});
  const [isShuffling, setIsShuffling] = useState(false);
  const [panelOrder, setPanelOrder] = useState(panels);
  const navigate = useNavigate();
  const { hasProfile } = useUserProfile();

  const handlePanelClick = useCallback((panel: PanelData) => {
    if (panel.id === "fire") navigate(hasProfile ? "/fire-dashboard" : "/fire-onboarding");
    if (panel.id === "health") navigate(hasProfile ? "/money-health" : "/health-onboarding");
    if (panel.id === "tax") navigate(hasProfile ? "/tax-wizard" : "/tax-onboarding");
    if (panel.id === "ai-shala") navigate("/ai-shala");
  }, [navigate, hasProfile]);
  const shuffleInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleMouseEnter = useCallback((panel: PanelData) => {
    if (isShuffling) return;
    setHoveredPanel(panel);
    setLoadedVideos((prev) => ({ ...prev, [panel.id]: true }));
  }, [isShuffling]);

  const handleMouseLeave = useCallback((panel: PanelData) => {
    if (isShuffling) return;
    setHoveredPanel(null);
  }, [isShuffling]);

  const shufflePanels = useCallback(() => {
    setPanelOrder((prev) => {
      // Keep center panel fixed, shuffle others
      const centerIndex = prev.findIndex((p) => p.isCenter);
      const centerPanel = prev[centerIndex];
      const others = prev.filter((p) => !p.isCenter);
      // Fisher-Yates shuffle
      for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
      }
      const result = [...others];
      result.splice(centerIndex, 0, centerPanel);
      return result;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    if (isShuffling) {
      if (shuffleInterval.current) clearInterval(shuffleInterval.current);
      shuffleInterval.current = null;
      setIsShuffling(false);
      setHoveredPanel(null);
    } else {
      setIsShuffling(true);
      setHoveredPanel(null);
      shufflePanels();
      // Auto-stop after animation
      setTimeout(() => {
        setIsShuffling(false);
        setHoveredPanel(null);
      }, 600);
    }
  }, [isShuffling, shufflePanels]);

  useEffect(() => {
    return () => {
      if (shuffleInterval.current) clearInterval(shuffleInterval.current);
    };
  }, []);

  const activeTitle = hoveredPanel?.title ?? defaultTitle;
  const activeSubtitle = hoveredPanel?.subtitle ?? defaultSubtitle;
  const activeLabel = hoveredPanel?.label ?? defaultLabel;

  return (
    <section className="h-screen flex flex-col items-center justify-center relative px-6 md:px-12">
      {/* Panels */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="panels-container"
      >
        {panelOrder.map((panel, i) => (
          <motion.div
            key={panel.id}
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              layout: { type: "spring", stiffness: 300, damping: 30 },
              duration: 1,
              delay: 0.6 + i * 0.12,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className={`hero-panel ${panel.isCenter ? "center-panel" : ""}`}
            onMouseEnter={() => handleMouseEnter(panel)}
            onMouseLeave={() => handleMouseLeave(panel)}
            onClick={() => handlePanelClick(panel)}
          >
            <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: hoveredPanel?.id === panel.id ? 0 : 1 }}>
              <GlassEffect className={`w-full h-full rounded-2xl ${panel.isCenter ? '' : 'bg-white/15'}`} />

              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                {panel.isCenter && panel.centerLetter ? (
                  <span
                    className="font-display text-8xl md:text-9xl font-bold select-none"
                    style={{ color: "hsl(0 0% 8% / 0.85)" }}
                  >
                    {panel.centerLetter}
                  </span>
                ) : (
                  <span className="font-display text-2xl md:text-3xl font-medium tracking-wider text-center whitespace-nowrap -rotate-90 transition-transform duration-500" style={{ color: "hsl(0 0% 8% / 0.75)" }}>
                    {panel.title}
                  </span>
                )}
              </div>
            </div>

            {panel.videoSrc && loadedVideos[panel.id] && (
              <div
                className="absolute inset-0 pointer-events-none z-20 overflow-hidden transition-opacity duration-1000"
                style={{ opacity: hoveredPanel?.id === panel.id ? 1 : 0 }}
              >
                <video
                  src={panel.videoSrc}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            )}

            {/* Letter already rendered above in glass wrapper */}
          </motion.div>
        ))}
      </motion.div>

      {/* Text below panels */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="text-center mt-10 md:mt-14 space-y-3"
      >
        <p
          className="section-label transition-opacity duration-300"
          style={{ opacity: hoveredPanel ? 1 : 0.7 }}
        >
          {activeLabel}
        </p>
        <h1
          className="font-display text-3xl md:text-5xl lg:text-6xl font-normal transition-opacity duration-300"
          style={{ color: "hsl(var(--ink))" }}
        >
          {activeTitle === "Finshala" ? (
            <span className="inline-flex items-baseline">
              F
              <span className="relative inline-flex flex-col items-center">
                <motion.span
                  onClick={toggleShuffle}
                  className="absolute -top-[0.14em] cursor-pointer hover:scale-110 transition-transform flex items-center justify-center border border-foreground/40 rounded-full w-[0.34em] h-[0.34em]"
                  whileTap={{ scale: 0.9 }}
                  animate={{ borderColor: ["rgba(0,0,0,0.1)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.1)"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg width="0.16em" height="0.16em" viewBox="0 0 24 24" fill="currentColor" className="ml-[0.02em]">
                    <polygon points="7 5 19 12 7 19 7 5" />
                  </svg>
                </motion.span>
                <span className="mt-[0.05em]">ı</span>
              </span>
              nshala
            </span>
          ) : activeTitle}
        </h1>
        <p className="font-editorial text-lg md:text-xl font-light text-muted-foreground transition-opacity duration-300">
          {activeSubtitle}
        </p>
      </motion.div>

      {/* Bottom utilities */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="absolute bottom-8 left-0 right-0 flex items-center px-8 md:px-12"
      >
        <div className="flex items-center gap-6">
          <span
            onClick={() => {
              const section = document.getElementById("features-section");
              if (section) section.scrollIntoView({ behavior: "smooth" });
            }}
            className="font-body text-[10px] tracking-widest uppercase border border-foreground/30 px-4 py-2 hover:bg-foreground hover:text-background transition-all duration-500 cursor-pointer"
          >
            See all tools
          </span>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroPanels;
