import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import {
  Flame, Shield, TrendingUp, Target, AlertTriangle,
  Calendar, PieChart, BarChart3, Clock,
  Zap, CheckCircle2, XCircle, ArrowUpRight, Wallet,
  Landmark, Heart, Umbrella, RefreshCw, Leaf, Crown,
  Scale, Info, Download,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ProfileGate from "@/components/ProfileGate";
import { FIREEngine, DEFAULT_FIRE_PROFILE, type FIREVariant, type FIREPlan } from "@/services/fire-engine";
import { useUserProfile, toFireProfile } from "@/hooks/useUserProfile";
import { HeroSection } from "@/components/ui/hero-section-with-smooth-bg-shader";

/* ═══ Theme config per variant ═══ */
interface ThemeConfig { label: string; emoji: string; icon: React.ElementType; color: string; colorLight: string; colorMed: string; tagline: string; }
const THEMES: Record<FIREVariant, ThemeConfig> = {
  lean: { label: "Lean FIRE", emoji: "🌿", icon: Leaf, color: "#10b981", colorLight: "rgba(16,185,129,0.08)", colorMed: "rgba(16,185,129,0.15)", tagline: "Freedom through simplicity" },
  regular: { label: "Regular FIRE", emoji: "🔥", icon: Flame, color: "#c2703e", colorLight: "rgba(194,112,62,0.08)", colorMed: "rgba(194,112,62,0.15)", tagline: "Same life, no alarm clock" },
  fat: { label: "Fat FIRE", emoji: "👑", icon: Crown, color: "#b8860b", colorLight: "rgba(184,134,11,0.08)", colorMed: "rgba(184,134,11,0.15)", tagline: "Retire rich, live large" },
};

const fmt = (n: number) => n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr` : `₹${(n / 100000).toFixed(1)}L`;
const fmtK = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;

/* ═══ MAIN PAGE ═══ */
export default function FireDashboard() {
  const { profile, hasProfile } = useUserProfile();

  const [plan, setPlan] = useState<FIREPlan | null>(null);
  const [activeVariant, setActiveVariant] = useState<FIREVariant>("regular");
  const [activeTab, setActiveTab] = useState<"overview" | "roadmap" | "goals" | "tax" | "insurance">("overview");

  useEffect(() => {
    const fetchPlan = async () => {
      const fireProfile = hasProfile && profile ? (profile as any) : DEFAULT_FIRE_PROFILE;
      const engine = new FIREEngine(fireProfile);
      const generatedPlan = await engine.generatePlanAsync();
      setPlan(generatedPlan);
      setActiveVariant(generatedPlan.preferred_variant || "regular");
    };
    fetchPlan();
  }, [profile, hasProfile]);

  if (!hasProfile) return <><Navbar /><ProfileGate /></>;
  if (!plan) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20">
      <Navbar />
      <div className="w-12 h-12 rounded-full border-4 border-accent/20 border-t-accent animate-spin mb-4" />
      <p className="font-display text-lg">Crunching your numbers...</p>
      <p className="font-body text-xs text-muted-foreground mt-2">Generating personalized FIRE roadmap via Python Engine</p>
    </div>
  );

  const variant = plan.variants[activeVariant];
  const theme = THEMES[activeVariant];
  const ThemeIcon = theme.icon;

  return (
    <HeroSection colors={["#F8F5EE", "#EAE3D2", "#DCCBB0", "#D0D9D6", "#EACBB0", "#F8F5EE"]}>
      <div className="min-h-screen relative z-10 w-full pb-20">
        <Navbar />
        {/* Header */}
        <div className="border-b border-border/40 pt-20 pb-4 px-6 md:px-12">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: theme.colorMed }}>
                <ThemeIcon size={20} style={{ color: theme.color }} />
              </div>
              <div>
                <h1 className="font-display text-xl font-normal">FIRE Path Planner</h1>
                <p className="font-body text-xs text-muted-foreground">Lean · Regular · Fat — Your choice, your timeline</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 text-sm font-body text-muted-foreground hover:text-foreground hover:border-border transition-colors">
              <RefreshCw size={14} /> Regenerate
            </button>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-6 md:px-12 py-8 space-y-8">
          {/* ═══ VARIANT SELECTOR — 3 Cards ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["lean", "regular", "fat"] as FIREVariant[]).map((v, i) => {
              const t = THEMES[v];
              const d = plan.variants[v];
              const isActive = activeVariant === v;
              const Icon = t.icon;
              return (
                <motion.button key={v} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  onClick={() => setActiveVariant(v)}
                  className={`relative overflow-hidden rounded-xl p-6 text-left transition-all duration-300 border backdrop-blur-3xl bg-background/30 ${isActive ? "shadow-lg border-2" : "border-border/40 hover:border-border/80"}`}
                  style={{ borderColor: isActive ? t.color : "" }}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{t.emoji}</span>
                        <div>
                          <h3 className="font-display text-base font-normal">{t.label}</h3>
                          <p className="font-body text-[10px] text-muted-foreground">{v === "lean" ? "Minimalist · Essentials" : v === "regular" ? "Current Lifestyle · Kept" : "Premium · Luxury"}</p>
                        </div>
                      </div>
                      {isActive && <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: t.color }}><CheckCircle2 size={14} className="text-white" /></div>}
                    </div>
                    <div className="space-y-2.5 font-body">
                      {[{ l: "FIRE Number", v: fmt(d.fire_number), big: true }, { l: "FIRE Age", v: `${d.fire_age} (${d.years_to_fire}yr)` }, { l: "Expenses", v: fmtK(d.config.monthly_expenses) + "/mo" }, { l: "SIP Needed", v: fmtK(d.required_monthly_sip) + "/mo" }].map(r => (
                        <div key={r.l} className="flex justify-between items-baseline">
                          <span className="text-xs text-muted-foreground">{r.l}</span>
                          <span className={`${r.big ? "text-lg font-display" : "text-sm"} font-medium`} style={r.big && isActive ? { color: t.color } : {}}>{r.v}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: d.feasibility === "achievable" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: d.feasibility === "achievable" ? "#10b981" : "#f59e0b" }}>
                        {d.feasibility === "achievable" ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                        <span className="capitalize">{d.feasibility}</span>
                      </div>
                    </div>
                    <p className="font-body text-[10px] text-muted-foreground mt-3 line-clamp-2">{d.config.lifestyle_notes}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* ═══ COMPARISON STRIP ═══ */}
          <div className="account-card rounded-xl p-4 overflow-x-auto">
            <div className="flex items-center gap-2 mb-3"><Scale size={14} className="text-muted-foreground" /><h3 className="text-sm font-display">Quick Comparison</h3></div>
            <table className="w-full text-xs font-body min-w-[500px]">
              <thead><tr className="text-muted-foreground">
                <th className="text-left py-1 w-28" />
                {(["lean", "regular", "fat"] as FIREVariant[]).map(v => <th key={v} className="text-center py-1" style={activeVariant === v ? { color: THEMES[v].color, fontWeight: 700 } : {}}>{THEMES[v].emoji} {THEMES[v].label}</th>)}
              </tr></thead>
              <tbody>
                {[{ l: "FIRE Number", k: "fire_numbers" as const, f: fmt }, { l: "FIRE Age", k: "fire_ages" as const, f: (n: number) => `${n}` }, { l: "Years to FIRE", k: "years_to_fire" as const, f: (n: number) => `${n} yrs` }, { l: "Monthly SIP", k: "monthly_sip_needed" as const, f: fmtK }].map(m => (
                  <tr key={m.l} className="border-t border-border/20">
                    <td className="py-2 text-muted-foreground">{m.l}</td>
                    {(["lean", "regular", "fat"] as FIREVariant[]).map(v => <td key={v} className="text-center py-2 font-medium" style={activeVariant === v ? { color: THEMES[v].color } : {}}>{m.f(plan.comparison[m.k][v])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ═══ HERO METRICS ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: `${theme.label} Number`, value: fmt(variant.fire_number), sub: `SWR: ${(variant.config.swr * 100).toFixed(1)}%`, icon: ThemeIcon, c: theme.color },
              { label: "FIRE Age", value: `${variant.fire_age}`, sub: `${variant.years_to_fire} years`, icon: Calendar, c: "#6366f1" },
              { label: "Net Worth", value: fmt(plan.current_net_worth), sub: `${(variant.monthly_roadmap[0]?.fire_progress_pct || 0).toFixed(1)}%`, icon: TrendingUp, c: "#06b6d4" },
              { label: "SIP Needed", value: fmtK(variant.required_monthly_sip) + "/mo", sub: `${variant.savings_rate_needed}% savings`, icon: Wallet, c: "#8b5cf6" },
              { label: "Expenses at FIRE", value: fmtK(variant.monthly_expenses_at_fire) + "/mo", sub: fmt(variant.annual_withdrawal_at_fire) + "/yr", icon: ArrowUpRight, c: "#ec4899" },
            ].map((m, i) => {
              const I = m.icon; return (
                <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="account-card rounded-xl p-4 group hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${m.c}15` }}><I size={16} style={{ color: m.c }} /></div>
                  <p className="font-display text-xl font-normal">{m.value}</p>
                  <p className="font-body text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                  <p className="font-body text-[10px] text-muted-foreground">{m.sub}</p>
                </motion.div>
              );
            })}
          </div>

          {/* ═══ TAB NAV ═══ */}
          <div className="flex gap-1 p-1 rounded-xl border border-border/40 backdrop-blur-3xl bg-background/20 overflow-x-auto scrollbar-hide">
            {[
              { id: "overview" as const, label: "Overview", icon: PieChart },
              { id: "roadmap" as const, label: "Roadmap", icon: BarChart3 },
              { id: "goals" as const, label: "Goals", icon: Target, badge: variant.milestones.length },
              { id: "tax" as const, label: "Tax", icon: Landmark, badge: plan.tax_analysis.tax_saving_moves.length },
              { id: "insurance" as const, label: "Insurance", icon: Shield, badge: plan.insurance_gaps.length, badgeColor: plan.insurance_gaps.some(g => g.urgency === "critical") ? "#ef4444" : "#f59e0b" },
            ].map(tab => {
              const I = tab.icon; return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-body whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-foreground text-background shadow" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                  <I size={14} />{tab.label}
                  {tab.badge ? <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full text-white" style={{ background: tab.badgeColor || "#6366f1" }}>{tab.badge}</span> : null}
                </button>
              );
            })}
          </div>

          {/* ═══ TAB CONTENT ═══ */}
          <AnimatePresence mode="wait">
            <motion.div key={`${activeTab}-${activeVariant}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
              {activeTab === "overview" && <OverviewTab plan={plan} variant={variant} theme={theme} />}
              {activeTab === "roadmap" && <RoadmapTab variant={variant} theme={theme} />}
              {activeTab === "goals" && <GoalsTab variant={variant} theme={theme} />}
              {activeTab === "tax" && <TaxTab plan={plan} />}
              {activeTab === "insurance" && <InsuranceTab plan={plan} />}
            </motion.div>
          </AnimatePresence>


        </main>
      </div>
    </HeroSection>
  );
}

/* ═══ OVERVIEW TAB ═══ */
function OverviewTab({ plan, variant, theme }: { plan: FIREPlan; variant: any; theme: typeof THEMES.lean }) {
  const progress = variant.monthly_roadmap[0]?.fire_progress_pct || 0;
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Progress ring */}
        <div className="account-card rounded-xl p-6" style={{ borderLeft: `3px solid ${theme.color}` }}>
          <h3 className="font-display text-lg font-normal mb-6 flex items-center gap-2"><span style={{ color: theme.color }}>{theme.emoji} {theme.label}</span> Progress</h3>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="relative w-44 h-44 shrink-0">
              <svg className="w-44 h-44 -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--border))" strokeWidth="10" opacity="0.4" />
                <motion.circle cx="100" cy="100" r="90" fill="none" stroke={theme.color} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 2, ease: "easeOut" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl">{progress.toFixed(1)}%</span>
                <span className="font-body text-[10px] text-muted-foreground">to {theme.label}</span>
              </div>
            </div>
            <div className="space-y-3 font-body">
              <div><p className="text-xs text-muted-foreground">Current Net Worth</p><p className="text-lg font-display">{fmt(plan.current_net_worth)}</p></div>
              <div><p className="text-xs text-muted-foreground">{theme.label} Target</p><p className="text-lg font-display" style={{ color: theme.color }}>{fmt(variant.fire_number)}</p></div>
              <div><p className="text-xs text-muted-foreground">Remaining</p><p className="text-lg font-display">{fmt(variant.fire_number - plan.current_net_worth)}</p></div>
              <div className="flex items-center gap-1.5 text-sm" style={{ color: theme.color }}><Clock size={14} />{variant.years_to_fire} years (Age {variant.fire_age})</div>
            </div>
          </div>
        </div>

        {/* Three Path Chart */}
        <div className="account-card rounded-xl p-6">
          <h3 className="font-display text-lg font-normal mb-1 flex items-center gap-2"><BarChart3 size={16} style={{ color: "#6366f1" }} /> Three Paths to Freedom</h3>
          <p className="font-body text-xs text-muted-foreground mb-6">Net worth trajectory for each FIRE variant</p>
          <ThreePathChart plan={plan} />
        </div>

        {/* Milestones */}
        <MilestoneTimeline milestones={variant.milestones} theme={theme} />

        {/* Glide Path */}
        <GlidePathCard glidePath={plan.glide_path} currentAge={plan.profile_summary.current_age} />
      </div>

      <div className="space-y-6">
        <LifestyleCard variant={variant} theme={theme} />
        <EmergencyFundCard ef={variant.emergency_fund_plan} theme={theme} />
        <SIPCard variant={variant} theme={theme} />
        <AlertsCard plan={plan} variant={variant} theme={theme} />
      </div>
    </div>
  );
}

/* ═══ THREE PATH BAR CHART ═══ */
function ThreePathChart({ plan }: { plan: FIREPlan }) {
  const getData = (v: FIREVariant) => plan.variants[v].monthly_roadmap.filter((m: any) => m.month % 12 === 0).slice(0, 30);
  const lean = getData("lean"), regular = getData("regular"), fat = getData("fat");
  const maxNW = Math.max(...lean.map(m => m.total_net_worth), ...regular.map(m => m.total_net_worth), ...fat.map(m => m.total_net_worth));
  const years = Array.from({ length: Math.min(Math.max(lean.length, regular.length, fat.length), 25) }, (_, i) => i);

  return (
    <div>
      <div className="relative h-52 flex items-end gap-[2px]">
        {years.map(yr => {
          const lH = maxNW > 0 ? ((lean[yr]?.total_net_worth || 0) / maxNW) * 100 : 0;
          const rH = maxNW > 0 ? ((regular[yr]?.total_net_worth || 0) / maxNW) * 100 : 0;
          const fH = maxNW > 0 ? ((fat[yr]?.total_net_worth || 0) / maxNW) * 100 : 0;
          return (
            <div key={yr} className="flex-1 flex gap-px h-full items-end group relative">
              <motion.div className="flex-1 rounded-t-sm" style={{ background: "#10b981" }} initial={{ height: 0 }} animate={{ height: `${lH}%` }} transition={{ delay: yr * 0.03, duration: 0.4 }} />
              <motion.div className="flex-1 rounded-t-sm" style={{ background: "#c2703e" }} initial={{ height: 0 }} animate={{ height: `${rH}%` }} transition={{ delay: yr * 0.03 + 0.05, duration: 0.4 }} />
              <motion.div className="flex-1 rounded-t-sm" style={{ background: "#b8860b" }} initial={{ height: 0 }} animate={{ height: `${fH}%` }} transition={{ delay: yr * 0.03 + 0.1, duration: 0.4 }} />
              {yr % 5 === 0 && <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-body text-muted-foreground">Yr{yr + 1}</span>}
            </div>
          );
        })}
      </div>
      <div className="flex gap-5 mt-7 text-xs font-body text-muted-foreground">
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: "#10b981" }} /> 🌿 Lean</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: "#c2703e" }} /> 🔥 Regular</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: "#b8860b" }} /> 👑 Fat</span>
      </div>
    </div>
  );
}

/* ═══ MILESTONE TIMELINE ═══ */
function MilestoneTimeline({ milestones, theme }: { milestones: any[]; theme: typeof THEMES.lean }) {
  if (!milestones.length) return null;
  return (
    <div className="account-card rounded-xl p-6">
      <h3 className="font-display text-lg font-normal mb-6 flex items-center gap-2"><Target size={16} style={{ color: "#6366f1" }} /> {theme.label} Milestones</h3>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border/50" />
        <div className="space-y-4">
          {milestones.slice(0, 8).map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 relative">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm z-10 shrink-0 border-2" style={{ background: theme.colorLight, borderColor: theme.color }}>
                {m.name.charAt(0) === "🔥" || m.name.charAt(0) === "👑" ? "🎯" : "📌"}
              </div>
              <div className="flex-1 bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="font-body text-sm font-medium">{m.name}</p>
                  <span className="font-body text-xs text-muted-foreground">{m.target_date}</span>
                </div>
                {m.amount > 0 && <p className="font-body text-xs text-muted-foreground mt-0.5">{fmt(m.amount)}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ GLIDE PATH ═══ */
function GlidePathCard({ glidePath, currentAge }: { glidePath: any[]; currentAge: number }) {
  return (
    <div className="account-card rounded-xl p-6">
      <h3 className="font-display text-lg font-normal mb-1 flex items-center gap-2"><PieChart size={16} style={{ color: "#8b5cf6" }} /> Asset Allocation Glide Path</h3>
      <p className="font-body text-xs text-muted-foreground mb-5">Shifts as you age, regardless of variant</p>
      <div className="space-y-2">
        {glidePath.map((p, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className={`font-body text-xs w-14 text-right ${p.age === currentAge ? "font-bold" : "text-muted-foreground"}`} style={p.age === currentAge ? { color: "#c2703e" } : {}}>
              Age {p.age}{p.age === currentAge ? " ←" : ""}
            </span>
            <div className="flex-1 flex h-5 rounded-full overflow-hidden">
              <div style={{ width: `${p.equity_pct}%`, background: "#10b981" }} className="flex items-center justify-center text-[9px] font-bold text-white">{p.equity_pct > 15 && `${p.equity_pct}%`}</div>
              <div style={{ width: `${p.debt_pct}%`, background: "#6366f1" }} className="flex items-center justify-center text-[9px] font-bold text-white">{p.debt_pct > 15 && `${p.debt_pct}%`}</div>
              <div style={{ width: `${p.gold_pct}%`, background: "#eab308" }} className="flex items-center justify-center text-[9px] font-bold">{p.gold_pct > 10 && `${p.gold_pct}%`}</div>
              {p.real_estate_pct > 0 && <div style={{ width: `${p.real_estate_pct}%`, background: "#8b5cf6" }} />}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs font-body text-muted-foreground">
        <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ background: "#10b981" }} /> Equity</span>
        <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ background: "#6366f1" }} /> Debt</span>
        <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ background: "#eab308" }} /> Gold</span>
        <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ background: "#8b5cf6" }} /> RE</span>
      </div>
    </div>
  );
}

/* ═══ SIDEBAR CARDS ═══ */
function LifestyleCard({ variant, theme }: { variant: any; theme: typeof THEMES.lean }) {
  const items: Record<string, string[]> = {
    lean: ["🏠 Modest housing", "🍳 Cook at home", "🚌 Public transport", "🏖️ No intl travel", "📱 Minimal subs"],
    regular: ["🏠 Current home kept", "🍽️ Dining 2-3x/month", "🚗 Current car", "🏖️ 1 domestic trip/yr", "💊 Private health ins"],
    fat: ["🏠 Premium housing", "🍽️ Fine dining weekly", "🚗 Luxury car", "✈️ 2+ intl trips/yr", "⛳ Club memberships"],
  };
  return (
    <div className="account-card rounded-xl p-5" style={{ borderLeft: `3px solid ${theme.color}` }}>
      <h3 className="font-display text-sm font-normal mb-3 flex items-center gap-2">{theme.emoji} <span style={{ color: theme.color }}>{theme.label} Lifestyle</span></h3>
      <div className="flex justify-between items-baseline mb-3 font-body"><span className="text-xs text-muted-foreground">Monthly Budget</span><span className="text-lg font-display" style={{ color: theme.color }}>{fmtK(variant.config.monthly_expenses)}</span></div>
      <div className="space-y-1.5">{(items[variant.config.variant] || items.regular).map((it, i) => <p key={i} className="font-body text-[11px] text-muted-foreground">{it}</p>)}</div>
      <div className="mt-3 pt-3 border-t border-border/30 font-body text-[10px]" style={{ color: theme.color }}>💡 {theme.tagline}</div>
    </div>
  );
}

function EmergencyFundCard({ ef, theme }: { ef: any; theme: typeof THEMES.lean }) {
  const pct = ef.target_fund > 0 ? Math.min((ef.current_fund / ef.target_fund) * 100, 100) : 0;
  return (
    <div className="account-card rounded-xl p-5">
      <h3 className="font-display text-sm font-normal mb-4 flex items-center gap-2"><Umbrella size={14} style={{ color: "#6366f1" }} /> Emergency Fund</h3>
      <div className="flex justify-between text-xs font-body text-muted-foreground"><span>{fmt(ef.current_fund)}</span><span>{fmt(ef.target_fund)}</span></div>
      <div className="w-full h-2.5 bg-muted/50 rounded-full overflow-hidden mt-1 mb-3">
        <motion.div className="h-full rounded-full" style={{ background: theme.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.5 }} />
      </div>
      {ef.gap > 0 ? <div className="rounded-lg p-3 text-xs font-body space-y-1" style={{ background: theme.colorLight }}><p style={{ color: theme.color }} className="font-medium">Gap: {fmtK(ef.gap)}</p><p className="text-muted-foreground">{fmtK(ef.monthly_contribution)}/mo → {ef.months_to_fill} months</p></div>
        : <div className="flex items-center gap-2 text-xs font-body" style={{ color: "#10b981" }}><CheckCircle2 size={14} /> Fully funded!</div>}
    </div>
  );
}

function SIPCard({ variant, theme }: { variant: any; theme: typeof THEMES.lean }) {
  const sips = variant.monthly_roadmap[0]?.sip_allocations || [];
  const labels: Record<string, string> = { flexi_cap: "Flexi Cap", mid_cap: "Mid Cap", small_cap: "Small Cap", elss: "ELSS (Tax)", debt: "Debt Fund", liquid: "Liquid", gold_etf: "Gold ETF" };
  const colors: Record<string, string> = { flexi_cap: "#8b5cf6", mid_cap: "#10b981", small_cap: "#f97316", elss: "#22c55e", debt: "#06b6d4", liquid: "#94a3b8", gold_etf: "#eab308" };
  return (
    <div className="account-card rounded-xl p-5">
      <h3 className="font-display text-sm font-normal mb-4 flex items-center gap-2"><Zap size={14} style={{ color: theme.color }} /> SIP Plan ({theme.label})</h3>
      <div className="space-y-2">{sips.map((s: any, i: number) => (
        <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg p-2.5">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: colors[s.fund_type] || "#888" }} /><span className="font-body text-xs">{labels[s.fund_type] || s.fund_type}</span></div>
          <span className="font-body text-sm font-medium">{fmtK(s.amount)}</span>
        </div>
      ))}</div>
      <div className="mt-3 pt-3 border-t border-border/30 flex justify-between"><span className="font-body text-xs text-muted-foreground">Total SIP</span><span className="font-body text-sm font-medium" style={{ color: theme.color }}>{fmtK(sips.reduce((a: number, s: any) => a + s.amount, 0))}</span></div>
    </div>
  );
}

function AlertsCard({ plan, variant, theme }: { plan: FIREPlan; variant: any; theme: typeof THEMES.lean }) {
  const alerts: { type: "danger" | "warning" | "info"; msg: string }[] = [];
  if (variant.feasibility === "stretch") alerts.push({ type: "warning", msg: `${theme.label} needs ${fmtK(variant.required_monthly_sip)}/mo SIP` });
  plan.insurance_gaps.filter(g => g.urgency === "critical").forEach(g => alerts.push({ type: "danger", msg: `${g.type} insurance gap: ${fmt(g.gap)}` }));
  if (plan.tax_analysis.annual_savings_by_switching > 0) alerts.push({ type: "warning", msg: `Switch tax regime → save ${fmtK(plan.tax_analysis.annual_savings_by_switching)}/yr` });
  if (variant.emergency_fund_plan.gap > 0) alerts.push({ type: "info", msg: `Emergency fund gap: ${fmt(variant.emergency_fund_plan.gap)}` });
  if (!alerts.length) return <div className="account-card rounded-xl p-5 text-center" style={{ background: "rgba(16,185,129,0.06)" }}><CheckCircle2 size={28} style={{ color: "#10b981" }} className="mx-auto mb-2" /><p className="font-body text-sm" style={{ color: "#10b981" }}>All Clear!</p></div>;
  const styles = { danger: { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)", color: "#ef4444" }, warning: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", color: "#f59e0b" }, info: { bg: "rgba(99,102,241,0.06)", border: "rgba(99,102,241,0.2)", color: "#6366f1" } };
  return (
    <div className="account-card rounded-xl p-5">
      <h3 className="font-display text-sm font-normal mb-3 flex items-center gap-2"><AlertTriangle size={14} style={{ color: "#f59e0b" }} /> Actions ({alerts.length})</h3>
      <div className="space-y-2">{alerts.map((a, i) => <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg text-xs font-body border" style={{ background: styles[a.type].bg, borderColor: styles[a.type].border, color: styles[a.type].color }}>{a.type === "danger" ? <XCircle size={14} /> : a.type === "warning" ? <AlertTriangle size={14} /> : <Info size={14} />}<span>{a.msg}</span></div>)}</div>
    </div>
  );
}

/* ═══ ROADMAP TAB ═══ */
function RoadmapTab({ variant, theme }: { variant: any; theme: typeof THEMES.lean }) {
  const data = variant.monthly_roadmap.filter((m: any) => m.month % 12 === 0).slice(0, 30);
  const maxNW = Math.max(...data.map((d: any) => d.total_net_worth));
  return (
    <div className="space-y-6">
      <div className="account-card rounded-xl p-6">
        <h3 className="font-display text-lg font-normal mb-6">{theme.emoji} {theme.label} Yearly Roadmap</h3>
        <div className="overflow-x-auto"><table className="w-full text-xs font-body min-w-[700px]">
          <thead><tr className="border-b border-border/30 text-muted-foreground"><th className="text-left py-2">Year</th><th className="text-left py-2">Age</th><th className="text-right py-2">Income</th><th className="text-right py-2">Expenses</th><th className="text-right py-2">Net Worth</th><th className="text-right py-2">{theme.label} %</th><th className="text-left py-2 pl-4">Event</th></tr></thead>
          <tbody>{data.map((m: any, i: number) => (
            <tr key={i} className="border-b border-border/10 hover:bg-muted/20 transition-colors" style={m.fire_progress_pct >= 100 ? { background: theme.colorLight } : {}}>
              <td className="py-2.5">{m.date}</td><td className="py-2.5">{m.age}</td>
              <td className="py-2.5 text-right" style={{ color: "#10b981" }}>{fmtK(m.net_income)}</td>
              <td className="py-2.5 text-right" style={{ color: "#ef4444" }}>{fmtK(m.total_expenses)}</td>
              <td className="py-2.5 text-right font-medium">{fmt(m.total_net_worth)}</td>
              <td className="py-2.5 text-right"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: m.fire_progress_pct >= 100 ? theme.colorMed : m.fire_progress_pct >= 50 ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)", color: m.fire_progress_pct >= 100 ? theme.color : m.fire_progress_pct >= 50 ? "#10b981" : "#6366f1" }}>{m.fire_progress_pct.toFixed(1)}%</span></td>
              <td className="py-2.5 pl-4 text-xs" style={{ color: theme.color }}>{m.milestone_reached || ""}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </div>
  );
}

/* ═══ GOALS TAB ═══ */
function GoalsTab({ variant, theme }: { variant: any; theme: typeof THEMES.lean }) {
  const goals = variant.monthly_roadmap[0]?.goal_progress || [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {goals.map((g: any, i: number) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="account-card rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div><h4 className="font-display text-base font-normal">{g.goal_name}</h4><p className="font-body text-xs text-muted-foreground">Target: {fmt(g.target_future_value)}</p></div>
            <span className="px-2 py-1 rounded-full text-[10px] font-bold font-body" style={{ background: g.on_track ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: g.on_track ? "#10b981" : "#ef4444" }}>{g.on_track ? "✓ On Track" : "✗ Behind"}</span>
          </div>
          <div className="flex justify-between text-xs font-body text-muted-foreground mb-1"><span>{fmt(g.current_corpus)}</span><span>{g.completion_pct.toFixed(1)}%</span></div>
          <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden mb-4"><div className="h-full rounded-full" style={{ width: `${Math.min(g.completion_pct, 100)}%`, background: g.on_track ? theme.color : "#ef4444" }} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-2.5"><p className="font-body text-[10px] text-muted-foreground">SIP Needed</p><p className="font-display text-lg" style={{ color: theme.color }}>{fmtK(g.monthly_sip_needed)}</p></div>
            <div className="bg-muted/30 rounded-lg p-2.5"><p className="font-body text-[10px] text-muted-foreground">Shortfall</p><p className="font-display text-lg">{fmt(g.shortfall)}</p></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══ TAX TAB ═══ */
function TaxTab({ plan }: { plan: FIREPlan }) {
  const tax = plan.tax_analysis;
  return (
    <div className="space-y-6">
      <div className="account-card rounded-xl p-6">
        <h3 className="font-display text-lg font-normal mb-6 flex items-center gap-2"><Landmark size={16} style={{ color: "#b8860b" }} /> Tax Regime Comparison</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {(["old", "new"] as const).map(regime => {
            const isRec = tax.recommended_regime === regime; const amt = regime === "old" ? tax.old_regime_tax : tax.new_regime_tax; return (
              <div key={regime} className="rounded-xl p-5 border-2 transition-all" style={{ borderColor: isRec ? "#10b981" : "hsl(var(--border))", background: isRec ? "rgba(16,185,129,0.04)" : "transparent" }}>
                {isRec && <span className="text-[10px] px-2 py-0.5 rounded-full text-white mb-2 inline-block" style={{ background: "#10b981" }}>✓ Recommended</span>}
                <p className="font-body text-sm text-muted-foreground capitalize">{regime} Regime</p>
                <p className="font-display text-2xl mt-1">{fmtK(amt)}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="account-card rounded-xl p-6">
        <h3 className="font-display text-lg font-normal mb-4 flex items-center gap-2"><Zap size={16} style={{ color: "#eab308" }} /> Tax Saving Opportunities</h3>
        <div className="space-y-3">{tax.tax_saving_moves.map((m, i) => (
          <div key={i} className="bg-muted/20 border border-border/30 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div><span className="text-[10px] font-body px-2 py-0.5 rounded-full" style={{ background: "rgba(184,134,11,0.1)", color: "#b8860b" }}>{m.section}</span><p className="font-body text-sm mt-2">{m.description}</p></div>
              <div className="text-right"><p className="font-display text-lg" style={{ color: "#10b981" }}>{fmtK(m.potential_saving)}</p><p className="font-body text-[10px] text-muted-foreground">potential saving</p></div>
            </div>
            {m.max_limit > 0 && <div className="mb-2"><div className="flex justify-between text-[10px] font-body text-muted-foreground mb-1"><span>{fmtK(m.current_utilization)} used</span><span>{fmtK(m.max_limit)} limit</span></div><div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ background: "#b8860b", width: `${(m.current_utilization / m.max_limit) * 100}%` }} /></div></div>}
            <p className="font-body text-xs rounded-lg p-2 mt-2" style={{ background: "rgba(99,102,241,0.06)", color: "#6366f1" }}>💡 {m.action}</p>
          </div>
        ))}</div>
      </div>
    </div>
  );
}

/* ═══ INSURANCE TAB ═══ */
function InsuranceTab({ plan }: { plan: FIREPlan }) {
  const uStyles = { critical: { bg: "rgba(239,68,68,0.04)", border: "rgba(239,68,68,0.3)" }, high: { bg: "rgba(245,158,11,0.04)", border: "rgba(245,158,11,0.3)" }, medium: { bg: "rgba(99,102,241,0.04)", border: "rgba(99,102,241,0.3)" } };
  const uBadge = { critical: { bg: "#ef4444", c: "white" }, high: { bg: "#f59e0b", c: "black" }, medium: { bg: "#6366f1", c: "white" } };
  const typeIcon: Record<string, React.ReactNode> = { life: <Heart size={20} />, health: <Shield size={20} />, critical_illness: <AlertTriangle size={20} /> };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {plan.insurance_gaps.map((g, i) => {
        const us = uStyles[g.urgency]; const ub = uBadge[g.urgency]; return (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
            className="rounded-xl p-5 border-2" style={{ background: us.bg, borderColor: us.border }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">{typeIcon[g.type]}</div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-body text-white" style={{ background: ub.bg, color: ub.c }}>{g.urgency}</span>
            </div>
            <h4 className="font-display text-base font-normal capitalize mb-3">{g.type.replace("_", " ")} Insurance</h4>
            <div className="space-y-2 text-xs font-body mb-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Current</span><span style={{ color: "#ef4444" }}>{fmt(g.current_cover)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Recommended</span><span style={{ color: "#10b981" }}>{fmt(g.recommended_cover)}</span></div>
              <div className="flex justify-between font-medium"><span>Gap</span><span style={{ color: "#f97316" }}>{fmt(g.gap)}</span></div>
            </div>
            <p className="font-body text-xs bg-muted/30 rounded-lg p-3 mb-3">{g.reason}</p>
            <div className="flex items-center justify-between text-xs font-body"><span className="text-muted-foreground">Est. Premium</span><span className="font-display text-lg">{fmtK(g.estimated_premium)}<span className="text-[10px] text-muted-foreground">/yr</span></span></div>
          </motion.div>
        );
      })}
    </div>
  );
}
