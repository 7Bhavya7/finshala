import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Heart, BarChart3, TrendingUp, Calculator, Clock } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { useCountUp } from "@/hooks/useCountUp";
import { useAuth } from "@/hooks/useAuth";
import { BGPattern } from "@/components/ui/bg-pattern";

/* ─── Assessment Button ─────────────────────────────────────────────── */
const AssessmentButton = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const handleClick = () => {
    if (!isLoggedIn) {
      setAuthOpen(true);
      return;
    }
    // Check if user has completed onboarding
    try {
      const raw = localStorage.getItem('finshala_user_profile');
      const profile = raw ? JSON.parse(raw) : null;
      if (profile?.profile_completed_at) {
        navigate("/money-health");
      } else {
        navigate("/fire-onboarding");
      }
    } catch {
      navigate("/fire-onboarding");
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="assessment-btn font-body text-xs tracking-[0.2em] uppercase border px-8 py-4 transition-all duration-500 hover:bg-emerald-400/20 hover:border-emerald-400/60 relative overflow-hidden"
        style={{ color: "hsl(var(--parchment))", borderColor: "hsl(var(--parchment) / 0.3)" }}
      >
        <span className="relative z-10">View Money Health</span>
      </button>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} setMode={setAuthMode} />
    </>
  );
};

/* ─── Data ──────────────────────────────────────────────────────────── */
const iconMap: Record<string, React.ElementType> = {
  "Emergency Preparedness": Shield,
  "Insurance Coverage": Heart,
  "Debt Management": BarChart3,
  "Investment Discipline": TrendingUp,
  "Tax Efficiency": Calculator,
  "Retirement Readiness": Clock,
};

const defaultDimensions = [
  { name: "Emergency Preparedness", score: 82, icon: Shield },
  { name: "Insurance Coverage", score: 65, icon: Heart },
  { name: "Debt Management", score: 91, icon: BarChart3 },
  { name: "Investment Discipline", score: 74, icon: TrendingUp },
  { name: "Tax Efficiency", score: 58, icon: Calculator },
  { name: "Retirement Readiness", score: 70, icon: Clock },
];

function useAssessmentScores() {
  const [dimensions, setDimensions] = useState<Array<{ name: string; score: number; icon: React.ElementType }>>(defaultDimensions);
  const [overallScore, setOverallScore] = useState(73);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('finshala_user_profile');
      if (raw) {
        const profile = JSON.parse(raw);
        if (profile?.profile_completed_at) {
          // Call Python API for health score
          fetch('/api/calculate-health-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: raw,
          })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then((result: any) => {
              const mapped = result.dimension_list.map((d: any) => ({
                name: d.name,
                score: d.score,
                icon: iconMap[d.name] || BarChart3,
              }));
              setDimensions(mapped);
              setOverallScore(Math.round(result.overall_score / 9));
            })
            .catch(() => {
              // Fallback to local engine if API is down
              import('@/services/health-score-engine').then(({ HealthScoreEngine }) => {
                const engine = new HealthScoreEngine(profile as any);
                const result = engine.calculate();
                const mapped = result.dimension_list.map((d: any) => ({
                  name: d.name,
                  score: d.score,
                  icon: iconMap[d.name] || BarChart3,
                }));
                setDimensions(mapped);
                setOverallScore(Math.round(result.overall_score / 9));
              }).catch(() => { /* use defaults */ });
            });
        }
      }
    } catch { /* use defaults */ }
  }, []);

  return { dimensions, overallScore };
}

const getBarGradient = (score: number) => {
  if (score < 60) return "linear-gradient(90deg, #ef4444, #f97316)";
  if (score <= 75) return "linear-gradient(90deg, #f59e0b, #eab308)";
  return "linear-gradient(90deg, #10b981, #14b8a6)";
};

const getBarGlow = (score: number) => {
  if (score < 60) return "0 0 12px rgba(239,68,68,0.4)";
  if (score <= 75) return "0 0 12px rgba(245,158,11,0.4)";
  return "0 0 12px rgba(16,185,129,0.4)";
};

/* ─── Animated Score Number ─────────────────────────────────────────── */
const AnimatedScore = ({ score, inView }: { score: number; inView: boolean }) => {
  const value = useCountUp(score, 1400, inView);
  return <span>{value}</span>;
};

/* ─── SVG Radial Gauge ──────────────────────────────────────────────── */
const RadialGauge = ({ score, inView }: { score: number; inView: boolean }) => {
  const size = 240;
  const stroke = 14;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke * 2) / 2 - 4;
  const startAngle = 135;
  const totalAngle = 270;

  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  // Zone arcs
  const redEnd = startAngle + (40 / 100) * totalAngle;
  const yellowEnd = startAngle + (70 / 100) * totalAngle;
  const greenEnd = startAngle + totalAngle;
  const scoreEnd = startAngle + (score / 100) * totalAngle;

  const gaugeScore = useCountUp(score, 1600, inView);

  return (
    <div className="relative w-[240px] h-[240px] mx-auto mt-6 mb-2">
      {/* Glow behind gauge */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
          filter: "blur(20px)",
          transform: "scale(1.3)",
        }}
      />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative z-10">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path d={describeArc(startAngle, greenEnd)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} strokeLinecap="round" />

        {/* Red zone */}
        <path d={describeArc(startAngle, redEnd)} fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth={stroke - 4} strokeLinecap="round" />
        {/* Yellow zone */}
        <path d={describeArc(redEnd, yellowEnd)} fill="none" stroke="rgba(245,158,11,0.2)" strokeWidth={stroke - 4} strokeLinecap="round" />
        {/* Green zone */}
        <path d={describeArc(yellowEnd, greenEnd)} fill="none" stroke="rgba(16,185,129,0.2)" strokeWidth={stroke - 4} strokeLinecap="round" />

        {/* Score arc (animated) */}
        <motion.path
          d={describeArc(startAngle, scoreEnd)}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
        />

        {/* Outer accent ring */}
        <circle cx={cx} cy={cy} r={r + stroke / 2 + 6} fill="none" stroke="rgba(16,185,129,0.08)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={r - stroke / 2 - 6} fill="none" stroke="rgba(16,185,129,0.06)" strokeWidth={1} />
      </svg>

      {/* Center score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className="font-display text-5xl font-normal" style={{ color: "hsl(var(--parchment))" }}>
          {gaugeScore}
        </span>
        <span className="font-body text-xs tracking-[0.2em] uppercase mt-1" style={{ color: "hsl(var(--parchment) / 0.4)" }}>
          out of 100
        </span>
      </div>
    </div>
  );
};

/* ─── Stock Chart Background Line (SVG) ─────────────────────────────── */
const StockChartBg = () => (
  <svg className="absolute inset-0 w-full h-full z-0 opacity-[0.04] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 800 400">
    <polyline
      fill="none"
      stroke="hsl(var(--parchment))"
      strokeWidth="2"
      points="0,320 50,300 100,310 150,250 200,270 250,200 300,220 350,180 400,190 450,140 500,160 550,120 600,130 650,90 700,110 750,80 800,60"
    />
    <polyline
      fill="none"
      stroke="hsl(var(--parchment))"
      strokeWidth="1.5"
      points="0,350 60,340 120,345 180,310 240,330 300,280 360,300 420,260 480,275 540,230 600,250 660,210 720,225 780,190"
    />
  </svg>
);

/* ─── Main Section ──────────────────────────────────────────────────── */
const FeatureMoneyHealth = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  const { dimensions, overallScore } = useAssessmentScores();

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 px-6 md:px-12 overflow-hidden"
      style={{ backgroundColor: "hsl(var(--primary) / 0.8)", backdropFilter: "blur(24px)" }}
    >
      {/* Pattern background */}
      <BGPattern variant="grid" mask="fade-edges" size={32} fill="rgba(255,255,255,0.06)" className="z-0" />

      {/* Stock chart lines */}
      <StockChartBg />

      {/* Radial glow behind gauge area */}
      <div
        className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] z-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, rgba(6,78,59,0.04) 40%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* ─── Left — text + gauge ─── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs font-body tracking-[0.3em] uppercase mb-4" style={{ color: "hsl(var(--parchment) / 0.5)" }}>
              Diagnose · Score · Improve
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1] mb-5" style={{ color: "hsl(var(--parchment))" }}>
              Money Health Score
            </h2>
            <p className="font-editorial text-lg md:text-xl font-light mb-8" style={{ color: "hsl(var(--parchment) / 0.6)" }}>
              A 5-minute onboarding flow that produces a comprehensive financial wellness
              score across 6 critical dimensions — revealing exactly where your money
              is strong and where it's vulnerable.
            </p>

            {/* Radial Gauge */}
            <RadialGauge score={overallScore} inView={inView} />

            <div className="mt-8">
              <AssessmentButton />
            </div>
          </motion.div>

          {/* ─── Right — score bars in glassmorphism card ─── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glassmorphism-card relative p-6 md:p-8"
          >
            {/* Grid lines behind bars */}
            <div className="chart-grid-bg absolute inset-0 z-0 rounded-lg pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {dimensions.map((d, i) => {
                const Icon = d.icon;
                return (
                  <motion.div
                    key={d.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={14} style={{ color: "hsl(var(--parchment) / 0.5)" }} />
                        <span className="font-body text-xs tracking-widest uppercase" style={{ color: "hsl(var(--parchment) / 0.7)" }}>
                          {d.name}
                        </span>
                      </div>
                      <span className="font-display text-sm tabular-nums" style={{ color: "hsl(var(--parchment) / 0.9)" }}>
                        <AnimatedScore score={d.score} inView={inView} />
                      </span>
                    </div>
                    <div className="w-full h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--parchment) / 0.08)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${d.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.5 + i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="h-full rounded-full"
                        style={{
                          background: getBarGradient(d.score),
                          boxShadow: getBarGlow(d.score),
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}

              {/* Composite score */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="pt-6 border-t flex items-end justify-between"
                style={{ borderColor: "hsl(var(--parchment) / 0.1)" }}
              >
                <span className="font-body text-xs tracking-[0.3em] uppercase" style={{ color: "hsl(var(--parchment) / 0.5)" }}>
                  Overall Score
                </span>
                <span className="font-display text-5xl font-normal" style={{ color: "hsl(var(--parchment))" }}>
                  <AnimatedScore score={overallScore} inView={inView} />
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeatureMoneyHealth;
