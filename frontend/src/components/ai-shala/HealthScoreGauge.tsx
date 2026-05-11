import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// ═══════════════════════════════════════════════
// Health Score Gauge — Animated radial gauge (0-900)
// ═══════════════════════════════════════════════

interface Props {
  score: number;
  grade: string;
  label: string;
  color: string;
  narrative: string;
  peer_comparison?: {
    your_score: number;
    average_score: number;
    percentile: number;
    better_than_pct: number;
  };
}

const HealthScoreGauge = ({ score, grade, label, color, narrative, peer_comparison }: Props) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const size = 220;
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

  const scoreEnd = startAngle + (Math.min(score / 900, 1)) * totalAngle;
  const greenEnd = startAngle + totalAngle;

  const getScoreColor = () => {
    if (score >= 700) return "#10b981";
    if (score >= 500) return "#f59e0b";
    if (score >= 300) return "#f97316";
    return "#ef4444";
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="account-card rounded-lg p-6 md:p-8">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-body tracking-[0.2em] uppercase text-muted-foreground">Financial Health Score</span>
        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-body">XAI-Powered</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-4">
        {/* Gauge */}
        <div className="relative mx-auto" style={{ width: size, height: size }}>
          <div className="absolute inset-0 rounded-full" style={{
            background: `radial-gradient(circle, ${getScoreColor()}15 0%, transparent 70%)`,
            filter: "blur(20px)", transform: "scale(1.3)",
          }} />
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative z-10">
            <defs>
              <linearGradient id="aiGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="35%" stopColor="#f59e0b" />
                <stop offset="65%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <filter id="aiGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <path d={describeArc(startAngle, greenEnd)} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} strokeLinecap="round" />
            <motion.path d={describeArc(startAngle, scoreEnd)} fill="none" stroke="url(#aiGaugeGrad)"
              strokeWidth={stroke} strokeLinecap="round" filter="url(#aiGlow)"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }} />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <span className="font-display text-5xl font-normal">{animatedScore}</span>
            <span className="text-xs font-body tracking-[0.15em] uppercase text-muted-foreground mt-1">out of 900</span>
            <span className="mt-2 px-3 py-1 rounded-full text-xs font-body font-medium" style={{
              backgroundColor: `${getScoreColor()}20`, color: getScoreColor()
            }}>
              {grade} — {label}
            </span>
          </div>
        </div>

        {/* Info */}
        <div>
          {narrative && (
            <div className="mb-4 p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-body tracking-widest uppercase text-muted-foreground">AI Insight</span>
              </div>
              <p className="text-sm font-body text-foreground/80 leading-relaxed">{narrative}</p>
            </div>
          )}

          {peer_comparison && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-body">
                <span className="text-muted-foreground">Your Score</span>
                <span className="font-medium">{peer_comparison.your_score}</span>
              </div>
              <div className="flex justify-between text-xs font-body">
                <span className="text-muted-foreground">Average Score</span>
                <span>{peer_comparison.average_score}</span>
              </div>
              <div className="flex justify-between text-xs font-body">
                <span className="text-muted-foreground">Better than</span>
                <span className="text-emerald-600 font-medium">{peer_comparison.better_than_pct}% of users</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default HealthScoreGauge;
