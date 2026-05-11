import { motion } from "framer-motion";
import { 
  AlertOctagon, 
  TrendingDown, 
  ArrowDownCircle 
} from "lucide-react";

// ═══════════════════════════════════════════════
// Debt Avalanche Module
// Appears dynamically when the user has high EMI obligations.
// ═══════════════════════════════════════════════

interface Loan {
  type: string;
  emi: number;
  tenure: number;
  outstanding: number;
}

interface Props {
  emi_to_income_ratio: number;
  total_emi: number;
  monthly_income: number;
  active_loans: Loan[];
  urgency: "moderate" | "high" | "critical";
}

const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const URGENCY_STYLES = {
  moderate: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-500",
    icon: TrendingDown,
    label: "Moderate Debt Load",
  },
  high: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-500",
    icon: AlertOctagon,
    label: "High Debt Warning",
  },
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-500",
    icon: AlertOctagon,
    label: "Critical Debt Emergency",
  },
};

const DebtAvalancheModule = (props: Props) => {
  const { emi_to_income_ratio, total_emi, monthly_income, active_loans, urgency } = props;
  const config = URGENCY_STYLES[urgency] || URGENCY_STYLES.moderate;
  const Icon = config.icon;

  if (!active_loans || active_loans.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`account-card rounded-lg p-6 md:p-8 border-2 ${config.border}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon size={20} className={config.text} />
          <span className="text-xs font-body tracking-[0.2em] uppercase text-muted-foreground">
            Debt Analysis Module
          </span>
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${config.bg} ${config.text}`}>
          {config.label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-6">
        <div>
          <h3 className="font-display text-2xl mb-2 text-foreground/90">
            {emi_to_income_ratio}% of your income goes to EMIs
          </h3>
          <p className="text-sm font-body text-muted-foreground mb-4">
            A healthy EMI ratio is below 30%. Your current debt load is significantly impacting your ability to save, invest, and build long-term wealth.
          </p>
          <div className="p-4 rounded border bg-background flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm font-body border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Monthly Income</span>
              <span className="font-medium text-emerald-500">{formatINR(monthly_income)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-body pt-1">
              <span className="text-muted-foreground">Total EMIs</span>
              <span className={`font-medium ${config.text}`}>{formatINR(total_emi)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar Visualization */}
        <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-background relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full ${config.bg} -mr-10 -mt-10 pointer-events-none`} />
          <div className="relative w-full mb-2">
             <div className="w-full h-8 bg-muted rounded-full overflow-hidden flex">
                <motion.div 
                   className={`h-full ${config.bg.replace('/10', '/80')} flex items-center px-2`}
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.min(emi_to_income_ratio, 100)}%` }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                >
                   <span className="text-[10px] text-white font-bold ml-auto pr-1">Debt {emi_to_income_ratio}%</span>
                </motion.div>
                <motion.div 
                   className="h-full bg-emerald-500/80 flex items-center px-2"
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.max(100 - emi_to_income_ratio, 0)}%` }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                >
                  <span className="text-[10px] text-white font-bold pl-1">Remaining</span>
                </motion.div>
             </div>
             {emi_to_income_ratio > 30 && (
                <div className="absolute top-0 bottom-0 w-0.5 bg-foreground/30 z-10" style={{ left: '30%' }} />
             )}
          </div>
          <div className="w-full flex justify-between text-[10px] font-body text-muted-foreground uppercase tracking-wider mt-1 mb-4">
             <span>0%</span>
             <span className="relative z-20">Safe Limit (30%)</span>
             <span>100%</span>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-display mb-3">Active Loan Portfolio</h4>
        <div className="space-y-2">
           {active_loans.map((loan, i) => (
             <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded bg-background">
               <div className="flex items-center gap-3 mb-2 sm:mb-0">
                  <ArrowDownCircle size={16} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium capitalize">{loan.type.replace('_', ' ')} Loan</span>
               </div>
               <div className="flex gap-4 sm:gap-6 text-xs font-body justify-between sm:justify-end">
                  <div className="text-muted-foreground">
                    EMI: <span className="text-foreground font-medium">{formatINR(loan.emi)}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Tenure: <span className="text-foreground font-medium">{loan.tenure}m</span>
                  </div>
                  <div className="text-muted-foreground text-right w-24">
                    Est. Bal: <span className="text-foreground font-medium">{formatINR(loan.outstanding)}</span>
                  </div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DebtAvalancheModule;
