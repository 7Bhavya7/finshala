import { motion } from "framer-motion";
import { CheckCircle2, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";

// ═══════════════════════════════════════════════
// Tax Optimization Card
// ═══════════════════════════════════════════════

interface TaxMove {
  section: string;
  current: number;
  limit: number;
  gap: number;
  potential_saving: number;
  action: string;
}

interface Props {
  regime_recommendation: string;
  old_regime_tax: number;
  new_regime_tax: number;
  potential_savings: number;
  unused_sections: string[];
  explanation: string;
  tax_moves: TaxMove[];
  effective_rate: number;
}

const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const TaxOptimizationCard = (props: Props) => {
  const {
    regime_recommendation,
    old_regime_tax,
    new_regime_tax,
    potential_savings,
    unused_sections,
    explanation,
    tax_moves,
    effective_rate,
  } = props;

  const isOldBetter = regime_recommendation.toLowerCase() === "old";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="account-card rounded-lg p-6 md:p-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-body tracking-[0.2em] uppercase text-muted-foreground">
            Tax Engine Optimization
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-body">
            AI Analysis
          </span>
        </div>
        <span className="text-xs font-body text-muted-foreground bg-muted px-2 py-1 rounded">
          Effective Rate: {effective_rate}%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Regime Comparison */}
        <div className="flex flex-col gap-3">
          <div
            className={`p-4 rounded-lg border ${
              isOldBetter ? "border-emerald-400/50 bg-emerald-500/10" : "border-border bg-muted/20"
            } relative overflow-hidden`}
          >
            {isOldBetter && (
              <div className="absolute top-0 right-0 px-2 py-1 bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-bold rounded-bl-lg">
                Recommended
              </div>
            )}
            <h4 className="text-sm font-display mb-1">Old Regime</h4>
            <div className="text-2xl font-body">
              {formatINR(old_regime_tax)}
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border ${
              !isOldBetter ? "border-emerald-400/50 bg-emerald-500/10" : "border-border bg-muted/20"
            } relative overflow-hidden`}
          >
            {!isOldBetter && (
              <div className="absolute top-0 right-0 px-2 py-1 bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-bold rounded-bl-lg">
                Recommended
              </div>
            )}
            <h4 className="text-sm font-display mb-1">New Regime</h4>
            <div className="text-2xl font-body">
              {formatINR(new_regime_tax)}
            </div>
          </div>
        </div>

        {/* Breakdown & Explanation */}
        <div className="flex flex-col justify-center">
          <div className="mb-4">
            <h4 className="text-xs font-body uppercase tracking-wider text-muted-foreground mb-1">
              Potential Savings
            </h4>
            <div className="text-3xl font-display text-emerald-600">
              {formatINR(potential_savings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">per year simply by switching regimes</p>
          </div>

          <div className="p-3 bg-blue-50/50 border border-blue-100/50 rounded-lg text-sm text-foreground/80 leading-relaxed font-body">
            {explanation}
          </div>
        </div>
      </div>

      {/* Actionable Moves */}
      {tax_moves && tax_moves.length > 0 && (
        <div>
          <h4 className="text-sm font-display mb-3">Unutilized Tax Deductions</h4>
          <div className="space-y-2">
            {tax_moves.map((move, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded bg-background gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium pr-2">{move.section}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      ({formatINR(move.current)} / {formatINR(move.limit)} used)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-foreground/70">{move.action}</span>
                  <span className="text-xs font-bold text-emerald-600 py-1 px-2 bg-emerald-50 rounded whitespace-nowrap">
                    Save {formatINR(move.potential_saving)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TaxOptimizationCard;
