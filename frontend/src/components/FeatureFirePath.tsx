import { motion, useInView } from "framer-motion";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, TrendingUp, PieChart, ShieldCheck, Receipt, Wallet } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

// Heights: outer → mid → center arc pattern
const cardHeights = [250, 320, 400, 400, 320, 250];

const features = [
  {
    title: "Month-by-Month Roadmap",
    desc: "AI builds a personalized financial plan from today to your FIRE date.",
    icon: CalendarDays,
    accent: "hsl(var(--accent))",
    step: "01",
  },
  {
    title: "SIP Recommendations",
    desc: "Goal-wise Systematic Investment Plan amounts optimized for your income.",
    icon: TrendingUp,
    accent: "hsl(var(--warm-red))",
    step: "02",
  },
  {
    title: "Asset Allocation Shifts",
    desc: "Dynamic rebalancing strategy that evolves as you approach each milestone.",
    icon: PieChart,
    accent: "hsl(var(--accent))",
    step: "03",
  },
  {
    title: "Insurance Gap Analysis",
    desc: "Identifies missing coverage before it becomes a costly oversight.",
    icon: ShieldCheck,
    accent: "hsl(var(--warm-red))",
    step: "04",
  },
  {
    title: "Tax-Saving Moves",
    desc: "Regime-aware deductions woven into your investment calendar.",
    icon: Receipt,
    accent: "hsl(var(--accent))",
    step: "05",
  },
  {
    title: "Emergency Fund Targets",
    desc: "Right-sized reserves based on your lifestyle and obligations.",
    icon: Wallet,
    accent: "hsl(var(--warm-red))",
    step: "06",
  },
];

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const FeatureFirePath = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasProfile } = useUserProfile();

  const handleStartPlan = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (hasProfile) {
      navigate("/fire-dashboard");
    } else {
      navigate("/fire-onboarding");
    }
  };

  return (
    <section
      id="features-section"
      ref={sectionRef}
      className="pt-32 md:pt-40 pb-24 md:pb-32 px-6 md:px-12 bg-background/50 backdrop-blur-3xl relative overflow-visible"
    >
      {/* Background decorative element */}
      <motion.div
        className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full opacity-[0.03]"
        style={{ background: "radial-gradient(circle, hsl(var(--accent)), transparent 70%)" }}
        animate={isInView ? { scale: [0.8, 1.1, 1], opacity: [0, 0.03, 0.03] } : {}}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-16 md:mb-20"
        >
          <motion.p
            className="section-label mb-4"
            initial={{ opacity: 0, letterSpacing: "0.4em" }}
            whileInView={{ opacity: 1, letterSpacing: "0.2em" }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Plan · Track · Achieve
          </motion.p>
          <h2 className="section-title mb-4">FIRE Path Planner</h2>
          <p className="section-subtitle max-w-2xl">
            Input your age, income, expenses, existing investments, and life goals.
            Our AI builds a complete, month-by-month financial roadmap to independence.
          </p>

          <motion.div
            className="mt-6 h-[1px] bg-border/60 max-w-xs origin-left"
            variants={lineVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          />
        </motion.div>

        {/* Panoramic arc cards — bottom-aligned, tallest in center */}
        <div
          className="hidden md:flex items-end justify-center gap-3 lg:gap-4 relative overflow-visible"
          style={{ height: "420px" }}
        >
          {/* Stock-style growth line SVG behind cards */}
          <motion.svg
            className="absolute w-full pointer-events-none"
            style={{ zIndex: 0, top: "-40px", left: 0, right: 0, bottom: 0, height: "calc(100% + 40px)" }}
            viewBox="0 0 1000 460"
            preserveAspectRatio="none"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.8 }}
          >
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.15" />
                <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.08" />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area fill below the line */}
            <motion.path
              d="M 83 210  C 150 190, 220 150, 333 60  C 400 30, 460 30, 500 60  S 600 30, 667 60  C 750 150, 820 190, 917 210  L 917 460 L 83 460 Z"
              fill="url(#areaGrad)"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 1.5, delay: 1 }}
            />
            {/* Growth line */}
            <motion.path
              d="M 83 210  C 150 190, 220 150, 333 60  C 400 30, 460 30, 500 60  S 600 30, 667 60  C 750 150, 820 190, 917 210"
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 1.8, delay: isInView ? 0.9 : 0, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
            {/* Dots at card connection points */}
            {[
              { cx: 83, cy: 210 },
              { cx: 250, cy: 140 },
              { cx: 417, cy: 60 },
              { cx: 583, cy: 60 },
              { cx: 750, cy: 140 },
              { cx: 917, cy: 210 },
            ].map((dot, idx) => (
              <motion.circle
                key={idx}
                cx={dot.cx}
                cy={dot.cy}
                r="4"
                fill="hsl(var(--accent))"
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { opacity: 1, scale: [0, 1.3, 1] } : { opacity: 0, scale: 0 }}
                transition={{ duration: 0.5, delay: isInView ? 1.2 + idx * 0.15 : 0 }}
              />
            ))}
          </motion.svg>
          {features.map((f, i) => {
            const Icon = f.icon;
            const h = cardHeights[i];

            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.7,
                  delay: 0.1 * i,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{
                  scale: 1.04,
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
                className="relative flex-1 min-w-0 group cursor-pointer z-10"
                style={{ height: `${h}px` }}
              >
                <div
                  className="relative h-full rounded-xl p-5 lg:p-6 flex flex-col justify-between overflow-hidden transition-shadow duration-500"
                  style={{
                    background:
                      "linear-gradient(160deg, hsl(var(--parchment) / 0.8), hsl(var(--parchment) / 0.35))",
                    border: "1px solid hsl(var(--ink) / 0.06)",
                    boxShadow:
                      "0 4px 24px -8px hsl(var(--ink) / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.3)",
                  }}
                >
                  {/* Top accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl transition-transform duration-500 origin-left scale-x-0 group-hover:scale-x-100"
                    style={{
                      background: `linear-gradient(90deg, ${f.accent}, ${f.accent}88)`,
                    }}
                  />

                  {/* Top content */}
                  <div>
                    {/* Step + Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="font-display text-2xl lg:text-3xl font-normal"
                        style={{ color: "hsl(var(--ink) / 0.1)" }}
                      >
                        {f.step}
                      </span>
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500"
                        style={{
                          background: `${f.accent}10`,
                          border: `1px solid ${f.accent}18`,
                        }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: f.accent }}
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      className="font-display text-base lg:text-lg font-normal leading-snug mb-2"
                      style={{ color: "hsl(var(--ink))" }}
                    >
                      {f.title}
                    </h3>
                  </div>

                  {/* Description at bottom */}
                  <p className="font-body text-xs lg:text-sm text-muted-foreground leading-relaxed mt-auto">
                    {f.desc}
                  </p>

                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at top right, ${f.accent}0a, transparent 70%)`,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile: vertical stack */}
        <div className="flex flex-col gap-4 md:hidden">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.08 * i }}
                className="relative group"
              >
                <div
                  className="relative rounded-xl p-6 overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(160deg, hsl(var(--parchment) / 0.8), hsl(var(--parchment) / 0.35))",
                    border: "1px solid hsl(var(--ink) / 0.06)",
                    boxShadow:
                      "0 4px 24px -8px hsl(var(--ink) / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.3)",
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
                    style={{
                      background: `linear-gradient(90deg, ${f.accent}, ${f.accent}88)`,
                    }}
                  />
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: `${f.accent}10`,
                        border: `1px solid ${f.accent}18`,
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: f.accent }}
                        strokeWidth={1.5}
                      />
                    </div>
                    <div>
                      <h3
                        className="font-display text-lg font-normal leading-snug mb-1"
                        style={{ color: "hsl(var(--ink))" }}
                      >
                        {f.title}
                      </h3>
                      <p className="font-body text-sm text-muted-foreground leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 flex items-center gap-6"
        >
          <motion.button
            onClick={handleStartPlan}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative font-body text-xs tracking-[0.2em] uppercase border border-foreground px-6 py-3 hover:bg-foreground hover:text-background transition-all duration-500 overflow-hidden group"
          >
            <span className="relative z-10">Start Your FIRE Plan</span>
          </motion.button>
        </motion.div>
      </div>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} setMode={setAuthMode} />
    </section>
  );
};

export default FeatureFirePath;
