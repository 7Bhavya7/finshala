import { motion } from "framer-motion";
import { AlertTriangle, Shield, Zap } from "lucide-react";

// ═══════════════════════════════════════════════
// Stress Test Simulator — Monte Carlo Results
// Shows portfolio survival under AI-generated crises
// ═══════════════════════════════════════════════

interface Scenario {
  scenario_name: string;
  narrative: string;
  parameters: {
    inflation: number;
    equity_return: number;
    debt_return: number;
    volatility: number;
    duration_years: number;
  };
  survival_probability: number;
  median_final_corpus: number;
  worst_case_corpus: number;
  best_case_corpus: number;
  corpus_depletion_risk: number;
  breakeven_probability: number;
  recommended_adjustment: string;
}

interface Props {
  scenarios: Scenario[];
  resilience_score: number;
  resilience_label: string;
  portfolio_tested: {
    current_corpus: number;
    monthly_expenses: number;
    monthly_sip: number;
    years_simulated: number;
  };
  simulations_per_scenario: number;
}

const formatINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

const getScenarioIcon = (name: string) => {
  if (name.toLowerCase().includes("stagflation")) return "📊";
  if (name.toLowerCase().includes("crash") || name.toLowerCase().includes("correction")) return "📉";
  if (name.toLowerCase().includes("swan") || name.toLowerCase().includes("pandemic")) return "🦢";
  return "⚡";
};

const getSurvivalColor = (prob: number) => {
  if (prob >= 0.9) return "#10b981";
  if (prob >= 0.7) return "#f59e0b";
  if (prob >= 0.5) return "#f97316";
  return "#ef4444";
};

const StressTestSimulator = ({ scenarios, resilience_score, resilience_label, portfolio_tested, simulations_per_scenario }: Props) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="account-card rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-body tracking-[0.2em] uppercase text-muted-foreground">
            Synthetic Stress Testing
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-body">Monte Carlo</span>
        </div>
        <span className="text-xs font-body text-muted-foreground">
          {simulations_per_scenario.toLocaleString()} simulations/scenario
        </span>
      </div>

      {/* Resilience Score */}
      <div className="flex items-center gap-4 mt-4 mb-6 p-4 rounded-lg bg-muted/30 border border-border/50">
        <div className="relative w-16 h-16">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
            <motion.circle cx="32" cy="32" r="28" fill="none" stroke={getSurvivalColor(resilience_score / 100)}
              strokeWidth="4" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - resilience_score / 100)}`}
              transform="rotate(-90 32 32)"
              initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - resilience_score / 100) }}
              transition={{ duration: 1.5, ease: "easeOut" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-lg">{resilience_score}%</span>
          </div>
        </div>
        <div>
          <h3 className="font-display text-xl">Portfolio Resilience: {resilience_label}</h3>
          <p className="text-xs font-body text-muted-foreground mt-1">
            Tested against {scenarios.length} AI-generated crisis scenarios with {formatINR(portfolio_tested.current_corpus)} corpus
          </p>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((scenario, i) => (
          <motion.div key={scenario.scenario_name}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="p-4 rounded-lg border border-border/50 bg-background hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start gap-2 mb-3">
              <span className="text-2xl">{getScenarioIcon(scenario.scenario_name)}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-display text-sm font-medium leading-tight">{scenario.scenario_name}</h4>
                <span className="text-[10px] font-body text-muted-foreground">
                  {scenario.parameters.duration_years}yr stress period
                </span>
              </div>
            </div>

            {/* Narrative */}
            <p className="text-xs font-body text-muted-foreground mb-4 leading-relaxed line-clamp-3">
              {scenario.narrative}
            </p>

            {/* Survival Gauge */}
            <div className="mb-3">
              <div className="flex justify-between text-xs font-body mb-1">
                <span className="text-muted-foreground">Survival Probability</span>
                <span className="font-medium" style={{ color: getSurvivalColor(scenario.survival_probability) }}>
                  {Math.round(scenario.survival_probability * 100)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full rounded-full"
                  style={{ backgroundColor: getSurvivalColor(scenario.survival_probability) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${scenario.survival_probability * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.2 }} />
              </div>
            </div>

            {/* Parameters */}
            <div className="space-y-1.5 text-[11px] font-body mb-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inflation</span>
                <span className="text-red-500">{(scenario.parameters.inflation * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equity Return</span>
                <span className={scenario.parameters.equity_return >= 0 ? "text-emerald-600" : "text-red-500"}>
                  {(scenario.parameters.equity_return * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volatility</span>
                <span className="text-amber-600">{(scenario.parameters.volatility * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Corpus Outcomes */}
            <div className="p-2 rounded bg-muted/30 space-y-1 text-[11px] font-body mb-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Median Corpus</span>
                <span className="font-medium">{formatINR(scenario.median_final_corpus)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Worst Case (5th %ile)</span>
                <span className="text-red-500">{formatINR(scenario.worst_case_corpus)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best Case (95th %ile)</span>
                <span className="text-emerald-600">{formatINR(scenario.best_case_corpus)}</span>
              </div>
            </div>

            {/* Recommendation */}
            <p className="text-[11px] font-body text-foreground/70 leading-relaxed italic">
              {scenario.recommended_adjustment}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default StressTestSimulator;
