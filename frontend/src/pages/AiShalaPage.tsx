import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, Shield, TrendingUp, AlertTriangle, Loader2, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { GenUIRenderer } from "@/components/ai-shala/GenUIRenderer";
import RainingLetters from "@/components/ui/modern-animated-hero-section";
import GlassRadioGroup from "@/components/ui/glass-radio-group";
import ProgressiveFeatureGrid from "@/components/ui/progressive-feature-grid";
import OrbitingSkills from "@/components/ui/orbiting-skills";

// ═══════════════════════════════════════════════
// AI SHALA PAGE — Agentic Financial Intelligence
// ═══════════════════════════════════════════════

const PYTHON_API = "";

interface AnalysisResult {
  status: string;
  ui_schema: any;
  insights: any;
  pipeline_log: any[];
  total_latency_ms: number;
}

const AiShalaPage = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<string>("");
  const [analysisMode, setAnalysisMode] = useState<string>("glass-deep");

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    // Get profile from localStorage (same data used by Money Health & FIRE)
    let profile: any = null;
    try {
      const raw = localStorage.getItem("finshala_user_profile");
      if (raw) profile = JSON.parse(raw);
    } catch {}

    if (!profile || !profile.profile_completed_at) {
      setError("Please complete your financial profile first via the FIRE Onboarding flow. AI Shala needs your real financial data to analyze.");
      setIsAnalyzing(false);
      return;
    }

    // Animate agent progression
    const agents = ["Tax Agent", "XAI Agent", "FIRE Agent", "Stress Agent", "GenUI Agent"];
    let agentIdx = 0;
    const agentTimer = setInterval(() => {
      if (agentIdx < agents.length) {
        setCurrentAgent(agents[agentIdx]);
        agentIdx++;
      }
    }, 3000);

    try {
      setCurrentAgent("Tax Agent");
      const resp = await fetch(`${PYTHON_API}/api/v2/ai-shala/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      clearInterval(agentTimer);

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `API Error: ${resp.status}`);
      }

      const data: AnalysisResult = await resp.json();
      setResult(data);
      setCurrentAgent("");
    } catch (e: any) {
      clearInterval(agentTimer);
      setError(e.message || "Analysis failed");
      setCurrentAgent("");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background paper-grain">
      <Navbar />

      {/* Intro Text (shown before analysis) */}
      {!result && !isAnalyzing && <ProgressiveFeatureGrid />}

      {/* Hero Section — Raining Matrix Background with Liquid Glass blur */}
      <RainingLetters>
        <section className="relative pt-24 pb-16 px-6 md:px-12 overflow-hidden backdrop-blur-[32px] bg-white/5 border-b border-white/10 shadow-2xl">
        <div className="dot-grid-bg absolute inset-0 z-0" />

        {/* Subtle radial glows */}
        <div className="absolute top-20 right-20 w-[400px] h-[400px] rounded-full z-0 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-10 w-[300px] h-[300px] rounded-full z-0 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)" }} />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Brain size={18} style={{ color: "hsl(var(--ink) / 0.5)" }} />
              <p className="text-xs font-body tracking-[0.3em] uppercase" style={{ color: "hsl(var(--ink) / 0.5)" }}>
                Multi-Agent Orchestration &middot; XAI &middot; Stress Testing &middot; GenUI
              </p>
            </div>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-normal leading-[1.05] mb-5"
              style={{ color: "hsl(var(--ink))" }}>
              AI Shala
            </h1>
            <p className="font-editorial text-lg md:text-xl font-light mb-8 max-w-2xl"
              style={{ color: "hsl(var(--ink) / 0.6)" }}>
              Five specialized AI agents collaborate to analyze your finances, explain your scores with
              SHAP-style transparency, stress-test your portfolio against synthetic crises, and dynamically
              assemble a personalized dashboard — all in one pipeline.
            </p>

            {/* Agent Pipeline Visual removed in favor of Orbiting component on the right side */}

            {!result && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mb-6"
              >
                <p className="text-xs font-body tracking-[0.25em] uppercase mb-3"
                  style={{ color: "hsl(var(--ink) / 0.4)" }}>
                  Analysis Depth
                </p>
                <GlassRadioGroup
                  name="analysis-depth"
                  value={analysisMode}
                  onChange={(val) => setAnalysisMode(val)}
                  options={[
                    {
                      id: 'glass-quick',
                      label: 'Quick Scan',
                      gradient: 'linear-gradient(135deg, #c0c0c055, #e0e0e0)',
                      glowColor: 'rgba(192, 192, 192, 0.5)',
                    },
                    {
                      id: 'glass-deep',
                      label: 'Deep Analysis',
                      gradient: 'linear-gradient(135deg, #10b98155, #34d399)',
                      glowColor: 'rgba(16, 185, 129, 0.5)',
                    },
                    {
                      id: 'glass-full',
                      label: 'Full Pipeline',
                      gradient: 'linear-gradient(135deg, #f59e0b55, #fbbf24)',
                      glowColor: 'rgba(245, 158, 11, 0.5)',
                    },
                  ]}
                />
              </motion.div>
            )}

            {!result && (
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="assessment-btn font-body text-xs tracking-[0.2em] uppercase border px-8 py-4 transition-all duration-500 hover:bg-emerald-400/20 hover:border-emerald-400/60 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                style={{ color: "hsl(var(--ink))", borderColor: "hsl(var(--ink) / 0.3)" }}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Agents analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Run AI Analysis</span>
                  </>
                )}
              </button>
            )}

            {/* Error State */}
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-lg border max-w-xl"
                style={{ borderColor: "hsl(var(--warm-red) / 0.4)", backgroundColor: "hsl(var(--warm-red) / 0.08)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} style={{ color: "hsl(var(--warm-red))" }} />
                  <span className="text-sm font-body" style={{ color: "hsl(var(--ink) / 0.8)" }}>Notice</span>
                </div>
                <p className="text-xs font-body" style={{ color: "hsl(var(--ink) / 0.6)" }}>{error}</p>
                <button onClick={runAnalysis} className="mt-3 text-xs font-body tracking-widest uppercase underline"
                  style={{ color: "hsl(var(--ink) / 0.5)" }}>
                  Retry
                </button>
              </motion.div>
            )}
          </motion.div>

          <div className="flex justify-center lg:justify-end items-center mt-12 lg:mt-0 relative w-full h-full min-h-[400px]">
            <OrbitingSkills isAnimating={isAnalyzing} />
          </div>
        </div>

        {/* Pipeline Stats */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="max-w-5xl mx-auto relative z-10 mt-8">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-body" style={{ color: "hsl(var(--ink) / 0.5)" }}>
                  Pipeline: {result.total_latency_ms}ms
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(var(--ink) / 0.5)" }} />
                <span className="text-xs font-body" style={{ color: "hsl(var(--ink) / 0.5)" }}>
                  {result.ui_schema?.components?.length || 0} components generated
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-body" style={{ color: "hsl(var(--ink) / 0.5)" }}>
                  {result.pipeline_log?.filter((l: any) => l.status === "success").length || 0}/5 agents succeeded
                </span>
              </div>
              <button onClick={() => { setResult(null); setError(null); }}
                className="text-xs font-body tracking-widest uppercase transition-colors ml-auto"
                style={{ color: "hsl(var(--ink) / 0.4)" }}>
                Re-analyze
              </button>
            </div>
          </motion.div>
        )}
      </section>
      </RainingLetters>

      {/* GenUI Rendered Dashboard */}
      {result?.ui_schema && (
        <section className="py-12 px-6 md:px-12">
          <div className="max-w-6xl mx-auto">
            <GenUIRenderer schema={result.ui_schema} />
          </div>
        </section>
      )}

    </div>
  );
};

export default AiShalaPage;
