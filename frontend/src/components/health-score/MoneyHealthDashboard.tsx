'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Shield, TrendingUp, CreditCard, Landmark, Umbrella,
  RefreshCw, ChevronRight, CheckCircle2, XCircle, AlertTriangle,
  Info, ArrowUpRight, Zap, Target, Clock,
  Star, Award, BarChart3, Activity, Loader2,
} from 'lucide-react';
import type { HealthScoreResult } from '@/services/health-score-engine';

import { useUserProfile, toHealthProfile } from '@/hooks/useUserProfile';
import { DEFAULT_HEALTH_PROFILE } from '@/services/health-score-engine';
import ProfileGate from '@/components/ProfileGate';

// ═══════════════════════════════════════════════
// THEME MAPS (Finshala Warm Theme)
// ═══════════════════════════════════════════════

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  emergency: <Shield className="w-5 h-5" />,
  insurance: <Umbrella className="w-5 h-5" />,
  investment: <TrendingUp className="w-5 h-5" />,
  debt: <CreditCard className="w-5 h-5" />,
  tax: <Landmark className="w-5 h-5" />,
  retirement: <Clock className="w-5 h-5" />,
};

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-[#4a6e2f] text-white',
  'A': 'bg-[#6B7F3A] text-white', // Olive Green
  'B': 'bg-[#8B6F47] text-white', // Copper
  'C': 'bg-[#B8860B] text-white', // Gold
  'D': 'bg-[#c2703e] text-white', // Terracotta
  'F': 'bg-[#A0522D] text-white', // Sienna
};

const DIMENSION_COLORS: Record<string, { ring: string; border: string; bg: string }> = {
  blue: { ring: '#5F8575', border: 'border-[#5F8575]/30', bg: 'bg-[#5F8575]/10' },
  cyan: { ring: '#5F8575', border: 'border-[#5F8575]/30', bg: 'bg-[#5F8575]/10' },
  violet: { ring: '#8B6F47', border: 'border-[#8B6F47]/30', bg: 'bg-[#8B6F47]/10' },
  green: { ring: '#6B7F3A', border: 'border-[#6B7F3A]/30', bg: 'bg-[#6B7F3A]/10' },
  emerald: { ring: '#6B7F3A', border: 'border-[#6B7F3A]/30', bg: 'bg-[#6B7F3A]/10' },
  red: { ring: '#A0522D', border: 'border-[#A0522D]/30', bg: 'bg-[#A0522D]/10' },
  amber: { ring: '#B8860B', border: 'border-[#B8860B]/30', bg: 'bg-[#B8860B]/10' },
  orange: { ring: '#c2703e', border: 'border-[#c2703e]/30', bg: 'bg-[#c2703e]/10' },
  yellow: { ring: '#B8860B', border: 'border-[#B8860B]/30', bg: 'bg-[#B8860B]/10' },
};

const SCORE_COLORS = {
  gauge: (score: number) => {
    if (score >= 800) return { from: '#6B7F3A', to: '#5F8575' }; // Excellent (Greens)
    if (score >= 700) return { from: '#5F8575', to: '#8B6F47' }; // Good
    if (score >= 550) return { from: '#B8860B', to: '#8B6F47' }; // Okay
    if (score >= 400) return { from: '#c2703e', to: '#B8860B' }; // Poor
    return { from: '#A0522D', to: '#c2703e' }; // Critical
  },
};

// ═══════════════════════════════════════════════
// API HELPER
// ═══════════════════════════════════════════════

async function fetchHealthScore(profile: any): Promise<HealthScoreResult> {
  const resp = await fetch('/api/calculate-health-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'API error' }));
    throw new Error(err.error || 'Failed to calculate health score');
  }
  return resp.json();
}

// ═══════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════

export default function MoneyHealthDashboard() {
  const [data, setData] = useState<HealthScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDim, setExpandedDim] = useState<string | null>(null);


  const { profile, hasProfile } = useUserProfile();

  const runEngine = async () => {
    const healthProfile = hasProfile && profile ? (profile as any) : DEFAULT_HEALTH_PROFILE;
    const result = await fetchHealthScore(healthProfile);
    return result;
  };

  useEffect(() => { 
    console.log("🚀 Requesting Health Score from Python Backend...");
    runEngine().then((result) => {
      console.log("✅ Received Health Score from Python API!", result);
      setData(result);
      setLoading(false);
    }).catch((err) => {
      console.warn("⚠️ Python API failed, falling back to local TypeScript engine", err);
      // Fallback to local engine if API is down
      import('@/services/health-score-engine').then(({ HealthScoreEngine }) => {
        const healthProfile = hasProfile && profile ? (profile as any) : DEFAULT_HEALTH_PROFILE;
        const engine = new HealthScoreEngine(healthProfile);
        const result = engine.calculate();
        console.log("☑️ Calculated Health Score locally using TS engine", result);
        setData(result);
        setLoading(false);
      });
    });
  }, []);

  const regenerate = () => {
    setLoading(true);
    runEngine().then((result) => {
      setData(result);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  if (!hasProfile) return <ProfileGate />;
  if (loading) return <ScoreLoadingSkeleton />;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-background text-foreground font-body pb-16">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-16 z-40 px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#8B6F47]/10 rounded-xl text-[#8B6F47]">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-ink">Money Health Score</h1>
              <p className="text-sm text-ink-light font-body mt-0.5">6-dimension financial wellness check</p>
            </div>
          </div>
          <button onClick={regenerate} className="flex items-center gap-2 px-4 py-2 bg-card border border-border/50 hover:bg-muted rounded-lg text-sm text-ink font-medium shadow-sm transition-colors">
            <RefreshCw className="w-4 h-4" /> Recalculate
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">
        {/* Hero: Score Gauge */}
        <ScoreGauge data={data} />

        {/* Dimension Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.dimension_list.map((dim, i) => (
            <DimensionCard
              key={dim.id}
              dim={dim}
              index={i}
              expanded={expandedDim === dim.id}
              onToggle={() => setExpandedDim(expandedDim === dim.id ? null : dim.id)}
            />
          ))}
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Radar Chart */}
          <div className="lg:col-span-1">
            <RadarChart dimensions={data.dimension_list} />
          </div>

          {/* Priority Actions */}
          <div className="lg:col-span-2">
            <PriorityActions actions={data.top_actions} />
          </div>
        </div>

        {/* Peer Comparison + Score Trend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PeerComparison data={data.peer_comparison} />
          <ScoreTrend history={data.score_history_placeholder} current={data.overall_score} />
        </div>


      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SCORE GAUGE — Hero Section
// ═══════════════════════════════════════════════

function ScoreGauge({ data }: { data: HealthScoreResult }) {
  const score = data.overall_score;
  const maxScore = 900;
  const percentage = (score / maxScore) * 100;
  const colors = SCORE_COLORS.gauge(score);

  const radius = 120;
  const circumference = Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm text-center">
      <div className="flex flex-col md:flex-row items-center gap-10">
        {/* Gauge */}
        <div className="relative w-72 h-44 flex-shrink-0 mx-auto md:mx-0">
          <svg className="w-72 h-44 drop-shadow-sm" viewBox="0 0 260 150">
            {/* Background arc */}
            <path d="M 20 140 A 120 120 0 0 1 240 140" fill="none" stroke="hsl(var(--muted)/0.5)" strokeWidth="16" strokeLinecap="round" />
            {/* Score arc */}
            <motion.path
              d="M 20 140 A 120 120 0 0 1 240 140" fill="none" stroke={`url(#gaugeGrad)`} strokeWidth="16" strokeLinecap="round"
              strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
              transition={{ duration: 2, ease: 'easeOut', delay: 0.3 }}
            />
            {/* Tick marks */}
            {[200, 400, 550, 700, 800, 900].map((tick, i) => {
              const angle = Math.PI - (tick / maxScore) * Math.PI;
              const x1 = 130 + Math.cos(angle) * 105;
              const y1 = 140 - Math.sin(angle) * 105;
              const x2 = 130 + Math.cos(angle) * 95;
              const y2 = 140 - Math.sin(angle) * 95;
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--muted-foreground)/0.3)" strokeWidth="1.5" />
                  <text x={130 + Math.cos(angle) * 85} y={140 - Math.sin(angle) * 85} textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--ink-light))" fontSize="10" className="font-medium" >
                    {tick}
                  </text>
                </g>
              );
            })}
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colors.from} />
                <stop offset="100%" stopColor={colors.to} />
              </linearGradient>
            </defs>
          </svg>

          {/* Center score */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center pb-2">
            <motion.p className="text-6xl font-black font-display drop-shadow-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} style={{ color: colors.to }}>
              {score}
            </motion.p>
            <p className="text-xs text-ink-light font-medium uppercase tracking-wider mt-1">out of {maxScore}</p>
          </div>
        </div>

        {/* Score details */}
        <div className="flex-1 text-left space-y-6">
          <div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm ${GRADE_COLORS[data.overall_grade]}`}>
                Grade {data.overall_grade}
              </span>
              <h2 className="text-3xl font-bold font-display" style={{ color: colors.to }}>
                {data.overall_label}
              </h2>
            </div>
            <p className="text-[15px] text-ink-light mt-2 max-w-md leading-relaxed">
              Your holistic financial health across 6 key dimensions. Keep pushing to optimize your weak spots!
            </p>
          </div>

          {/* Mini dimension bars */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {data.dimension_list.map((dim: any) => {
              const dc = DIMENSION_COLORS[dim.color] || DIMENSION_COLORS.blue;
              return (
                <div key={dim.id} className="flex items-center gap-2">
                  <span className="text-xs font-semibold w-24 text-ink-light truncate">{dim.emoji} {dim.name.split(' ')[0]}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: dc.ring }} initial={{ width: 0 }} animate={{ width: `${dim.score}%` }} transition={{ duration: 1.5, delay: 0.5 }} />
                  </div>
                  <span className="text-xs font-bold w-6 text-right" style={{ color: dc.ring }}>{dim.score}</span>
                </div>
              );
            })}
          </div>

          <div className="h-px w-full bg-border/50 my-4"></div>

          {/* Net Worth */}
          <div className="flex flex-wrap gap-8 text-sm">
            <div>
              <p className="text-ink-light font-medium mb-1 uppercase tracking-wider text-[10px]">Net Worth</p>
              <p className="text-xl font-bold text-ink">
                ₹{data.meta.net_worth >= 10000000 ? `${(data.meta.net_worth / 10000000).toFixed(2)}Cr` : `${(data.meta.net_worth / 100000).toFixed(1)}L`}
              </p>
            </div>
            <div>
              <p className="text-ink-light font-medium mb-1 uppercase tracking-wider text-[10px]">Monthly Income</p>
              <p className="text-xl font-bold text-ink">₹{(data.meta.monthly_income / 1000).toFixed(0)}K</p>
            </div>
            <div>
              <p className="text-ink-light font-medium mb-1 uppercase tracking-wider text-[10px]">Age</p>
              <p className="text-xl font-bold text-ink">{data.meta.current_age}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// DIMENSION CARD
// ═══════════════════════════════════════════════

function DimensionCard({ dim, index, expanded, onToggle }: { dim: any; index: number; expanded: boolean; onToggle: () => void }) {
  const dc = DIMENSION_COLORS[dim.color] || DIMENSION_COLORS.blue;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const off = circ - (dim.score / 100) * circ;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
      className={`bg-card border rounded-2xl overflow-hidden transition-all cursor-pointer bg-[#fffcf5]
                  ${expanded ? dc.border + ' shadow-md scale-[1.02] z-10' : 'border-border/60 hover:border-border hover:shadow-sm'}`}
      onClick={onToggle}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                <motion.circle cx="32" cy="32" r={r} fill="none" stroke={dc.ring} strokeWidth="5" strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: off }} transition={{ duration: 1.5, delay: index * 0.1 + 0.3 }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold font-display" style={{ color: dc.ring }}>{dim.score}</span>
              </div>
            </div>
            <div>
              <p className="font-bold text-base text-ink flex items-center gap-1.5">{dim.emoji} {dim.name}</p>
              <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase shadow-sm ${GRADE_COLORS[dim.grade]}`}>
                Grade {dim.grade}
              </span>
            </div>
          </div>
          <ChevronRight className={`w-5 h-5 text-ink-light transition-transform ${expanded ? 'rotate-90 text-ink' : ''}`} />
        </div>
        <p className="text-[13px] text-ink-light mt-4 font-medium leading-relaxed">{dim.description}</p>
        <div className="mt-4 space-y-2">
          {dim.sub_scores.slice(0, expanded ? undefined : 2).map((sub: any, i: number) => (
            <div key={i}>
              <div className="flex justify-between text-[11px] font-semibold text-ink-light mb-1 uppercase tracking-wide">
                <span>{sub.label}</span>
                <span>{sub.score}/{sub.max}</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: dc.ring }} initial={{ width: 0 }} animate={{ width: `${sub.max > 0 ? (sub.score / sub.max) * 100 : 0}%` }} transition={{ duration: 1, delay: index * 0.1 + i * 0.1 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="border-t border-border/50 bg-[#F9F7EF]">
            <div className="p-5 space-y-5">
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest">Findings</p>
                {dim.findings.map((f: any, i: number) => (
                  <div key={i} className={`flex items-start gap-2.5 text-xs p-3 rounded-xl font-medium border
                    ${f.type === 'positive' ? 'bg-[#6B7F3A]/10 text-[#5c6e31] border-[#6B7F3A]/20' :
                      f.type === 'negative' ? 'bg-[#A0522D]/10 text-[#8b4625] border-[#A0522D]/20' :
                      f.type === 'warning' ? 'bg-[#B8860B]/10 text-[#966b04] border-[#B8860B]/20' :
                      'bg-muted/50 text-ink border-border/50'}`}>
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
              {dim.recommendations.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest mt-2">Recommended Actions</p>
                  {dim.recommendations.map((rec: any, i: number) => {
                    const prioColors = {
                      critical: 'border-[#A0522D]/30 bg-[#A0522D]/5',
                      high: 'border-[#c2703e]/30 bg-[#c2703e]/5',
                      medium: 'border-[#B8860B]/30 bg-[#B8860B]/5',
                    };
                    const prioBadge = {
                      critical: 'bg-[#A0522D]',
                      high: 'bg-[#c2703e]',
                      medium: 'bg-[#B8860B]',
                    };
                    return (
                      <div key={i} className={`border rounded-xl p-3.5 shadow-sm ${prioColors[rec.priority as keyof typeof prioColors]}`}>
                        <span className={`inline-block mb-2 px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider ${prioBadge[rec.priority as keyof typeof prioBadge]}`}>
                          {rec.priority}
                        </span>
                        <p className="text-[13px] text-ink font-bold">{rec.action}</p>
                        <p className="text-xs text-ink-light mt-1 font-medium">{rec.impact}</p>
                        {rec.estimated_benefit && <p className="text-[11px] text-[#6B7F3A] font-bold mt-1.5 bg-[#6B7F3A]/10 px-2 py-1 rounded inline-block">💡 {rec.estimated_benefit}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// RADAR CHART
// ═══════════════════════════════════════════════

function RadarChart({ dimensions }: { dimensions: any[] }) {
  const cx = 150, cy = 150, maxR = 110;
  const n = dimensions.length;
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (value / 100) * maxR;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  };
  const polygonPoints = dimensions.map((d, i) => `${getPoint(i, d.score).x},${getPoint(i, d.score).y}`).join(' ');

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col items-center">
      <h3 className="text-base font-bold font-display w-full mb-4 flex items-center gap-2 text-ink">
        <Activity className="w-5 h-5 text-[#8B6F47]" /> Health Radar
      </h3>
      <svg viewBox="0 0 300 300" className="w-full max-w-[280px]">
        {[25, 50, 75, 100].map((level) => (
          <polygon key={level} points={dimensions.map((_, i) => `${getPoint(i, level).x},${getPoint(i, level).y}`).join(' ')} fill="none" stroke="hsl(var(--muted-foreground)/0.2)" strokeWidth="1" />
        ))}
        {dimensions.map((_, i) => <line key={i} x1={cx} y1={cy} x2={getPoint(i, 100).x} y2={getPoint(i, 100).y} stroke="hsl(var(--muted-foreground)/0.2)" strokeWidth="1" />)}
        <motion.polygon points={polygonPoints} fill="url(#radarFill)" stroke="#8B6F47" strokeWidth="2.5" strokeLinejoin="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} />
        {dimensions.map((d, i) => {
          const p = getPoint(i, d.score);
          const dc = DIMENSION_COLORS[d.color] || DIMENSION_COLORS.blue;
          return (
            <g key={i}>
              <motion.circle cx={p.x} cy={p.y} r="5" fill={dc.ring} stroke="#fff" strokeWidth="1.5" initial={{ r: 0 }} animate={{ r: 5 }} transition={{ delay: 0.5 + i * 0.1 }} />
              <text x={getPoint(i, 125).x} y={getPoint(i, 125).y} textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--ink))" fontSize="12" fontWeight="700">{d.emoji}</text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B6F47" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c2703e" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PRIORITY ACTIONS
// ═══════════════════════════════════════════════

function PriorityActions({ actions }: { actions: any[] }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm h-full">
      <h3 className="text-base font-bold font-display mb-6 flex items-center gap-2 text-ink">
        <Zap className="w-5 h-5 text-[#B8860B] fill-[#B8860B]" /> Priority Actions <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-ink-light ml-2">{actions.length}</span>
      </h3>
      <div className="space-y-3">
        {actions.map((action, i) => {
          const isCritical = action.priority === 'critical';
          const isHigh = action.priority === 'high';
          const ringColor = isCritical ? 'border-[#A0522D]/40 bg-[#A0522D]/5' : (isHigh ? 'border-[#c2703e]/40 bg-[#c2703e]/5' : 'border-border/50 bg-[#F9F7EF]');
          const badgeBg = isCritical ? 'bg-[#A0522D]' : (isHigh ? 'bg-[#c2703e]' : 'bg-[#8B6F47]');
          const icon = isCritical ? <XCircle className="w-5 h-5 text-[#A0522D]" /> : (isHigh ? <AlertTriangle className="w-5 h-5 text-[#c2703e]" /> : <CheckCircle2 className="w-5 h-5 text-[#8B6F47]" />);

          return (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className={`flex items-start gap-4 p-4 rounded-xl border ${ringColor}`}>
              <div className="mt-1 bg-white rounded-full p-1 shadow-sm">{icon}</div>
              <div className="flex-1">
                <span className={`inline-block mb-1.5 px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-widest ${badgeBg}`}>{action.priority}</span>
                <p className="text-[15px] font-bold text-ink leading-tight">{action.action}</p>
                <p className="text-[13px] text-ink-light mt-1 font-medium">{action.impact}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PEER COMPARISON & SCORE TREND
// ═══════════════════════════════════════════════

function PeerComparison({ data }: { data: any }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-bold font-display mb-5 flex items-center gap-2 text-ink">
        <Award className="w-5 h-5 text-[#8B6F47]" /> How You Compare
      </h3>
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-ink-light font-bold uppercase tracking-wider mb-2">
              <span>Your Score</span><span className="text-ink text-sm">{data.your_score}</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-[#8B6F47] to-[#B8860B]" initial={{ width: 0 }} animate={{ width: `${(data.your_score / 900) * 100}%` }} transition={{ duration: 1.5 }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-ink-light font-bold uppercase tracking-wider mb-2">
              <span>India Avg</span><span>{data.average_score}</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-ink-light/50" style={{ width: `${(data.average_score / 900) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="bg-[#F9F7EF] border border-[#8B6F47]/20 rounded-xl p-5 text-center shadow-sm">
          <p className="text-3xl font-black font-display text-[#8B6F47]">Top {100 - data.better_than_pct}%</p>
          <p className="text-sm font-medium text-ink-light mt-1">Better than {data.better_than_pct}% of peers</p>
        </div>
      </div>
    </div>
  );
}

function ScoreTrend({ history, current }: { history: any[]; current: number }) {
  const maxVal = Math.max(...history.map(h => h.score), current) * 1.05;
  const minVal = Math.min(...history.map(h => h.score)) * 0.9;
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-bold font-display mb-6 flex items-center gap-2 text-ink">
        <BarChart3 className="w-5 h-5 text-[#6B7F3A]" /> Score Trend
      </h3>
      <div className="flex items-end gap-3 h-32 px-2">
        {history.map((h, i) => {
          const height = ((h.score - minVal) / (maxVal - minVal)) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <span className="text-[10px] font-bold text-ink opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm px-1.5 py-0.5 rounded">{h.score}</span>
              <motion.div className={`w-full rounded-t-md ${i === history.length - 1 ? 'bg-gradient-to-t from-[#6B7F3A] to-[#8eb04c]' : 'bg-muted-foreground/30'}`} initial={{ height: 0 }} animate={{ height: `${height}%` }} transition={{ delay: i * 0.1, duration: 0.5 }} />
              <span className="text-[10px] font-bold text-ink-light uppercase">{h.month}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-center gap-2 text-sm bg-[#6B7F3A]/10 text-[#5c6e31] py-2 rounded-lg font-bold">
        <ArrowUpRight className="w-4 h-4" /> +{current - history[0].score} points since Jan
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════
function ScoreLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="h-48 bg-muted/50 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-muted/50 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );
}
