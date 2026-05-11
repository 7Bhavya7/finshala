import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRight,
  LucideIcon,
  CheckCircle2
} from "lucide-react";

// ═══════════════════════════════════════════════
// Actionable Cards Module
// Displays AI-prioritized actions from across the pipeline.
// ═══════════════════════════════════════════════

interface ActionItem {
  priority: "critical" | "high" | "medium" | "low";
  action: string;
  impact?: string;
  estimated_benefit?: string;
}

interface Props {
  actions: ActionItem[];
}

const PRIORITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    color: "red",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/30",
    textClass: "text-red-500",
  },
  high: {
    icon: ShieldAlert,
    color: "amber",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-500",
  },
  medium: {
    icon: TrendingUp,
    color: "emerald",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-500",
  },
  low: {
    icon: CheckCircle2,
    color: "blue",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30",
    textClass: "text-blue-500",
  },
};

const ActionableCards = ({ actions }: Props) => {
  if (!actions || actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="account-card rounded-lg p-6 md:p-8 col-span-1 lg:col-span-2"
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs font-body tracking-[0.2em] uppercase text-muted-foreground">
          AI Prioritized Actions
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-body">
          Cross-Pipeline Recommendations
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {actions.map((item, i) => {
          const config = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
          const Icon = config.icon;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-xl border flex flex-col h-full bg-background ${config.borderClass}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-full ${config.bgClass}`}>
                  <Icon size={18} className={config.textClass} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${config.bgClass} ${config.textClass}`}>
                  {item.priority}
                </span>
              </div>
              
              <p className="text-sm font-medium font-body leading-relaxed flex-grow text-foreground/90">
                {item.action}
              </p>

              {(item.impact || item.estimated_benefit) && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  {item.impact && (
                    <div className="flex items-center text-xs font-body text-muted-foreground mb-1">
                      <ArrowRight size={12} className="mr-1 inline-block" />
                      <span className="truncate">{item.impact}</span>
                    </div>
                  )}
                  {item.estimated_benefit && (
                    <div className="text-xs font-semibold font-body text-emerald-600 truncate mt-1">
                      {item.estimated_benefit}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ActionableCards;
