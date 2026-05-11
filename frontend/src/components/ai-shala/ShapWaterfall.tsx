import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from "recharts";

// ═══════════════════════════════════════════════
// SHAP Waterfall — XAI Visualization
// KEY DIFFERENTIATOR for hackathon judges
// ═══════════════════════════════════════════════

interface Feature {
  name: string;
  impact: number;
  direction: string;
  magnitude: number;
  grade: string;
  description: string;
  emoji: string;
}

interface Props {
  baseValue: number;
  finalScore: number;
  features: Feature[];
  narrative: string;
}

const ShapWaterfall = ({ baseValue, finalScore, features, narrative }: Props) => {
  // Build waterfall chart data
  const chartData = [
    { name: "Base (Avg)", value: baseValue, fill: "#10b981", type: "base" },
    ...features.map((f) => ({
      name: f.emoji ? `${f.emoji} ${f.name}` : f.name,
      value: f.impact,
      fill: f.direction === "positive" ? "#10b981" : "#ef4444",
      type: "feature",
      grade: f.grade,
      description: f.description,
    })),
    { name: "Your Score", value: finalScore, fill: "#3b82f6", type: "final" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="account-card rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-body tracking-[0.2em] uppercase text-muted-foreground">
            Explainable AI — Score Decomposition
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-body">SHAP-Style</span>
        </div>
      </div>
      <h3 className="font-display text-lg mb-1">How Your Score Was Calculated</h3>
      <p className="text-xs font-body text-muted-foreground mb-6">
        Each bar shows how a financial dimension pushes your score above or below the population average ({baseValue}).
      </p>

      {/* Waterfall Chart */}
      <div className="w-full h-[320px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              domain={[0, "auto"]} />
            <YAxis type="category" dataKey="name" width={140}
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                const val = d.value;
                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-xs font-body">
                    <p className="font-medium mb-1">{d.name}</p>
                    {d.type === "feature" ? (
                      <>
                        <p className={val >= 0 ? "text-emerald-600" : "text-red-500"}>
                          {val >= 0 ? "+" : ""}{val} points
                        </p>
                        {d.grade && <p className="text-muted-foreground mt-1">Grade: {d.grade}</p>}
                        {d.description && <p className="text-muted-foreground">{d.description}</p>}
                      </>
                    ) : (
                      <p className="text-foreground font-medium">{val} points</p>
                    )}
                  </div>
                );
              }}
            />
            <ReferenceLine x={baseValue} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-xs font-body text-muted-foreground">Positive Impact</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-xs font-body text-muted-foreground">Negative Impact</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-xs font-body text-muted-foreground">Base Value</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-xs font-body text-muted-foreground">Final Score</span>
        </div>
      </div>

      {/* AI Narrative */}
      {narrative && (
        <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-body tracking-widest uppercase text-emerald-600">XAI Narrative</span>
          </div>
          <p className="text-sm font-body text-foreground/80 leading-relaxed">{narrative}</p>
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        {features.map((f) => (
          <div key={f.name} className={`p-3 rounded-lg border ${
            f.direction === "positive" ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30"
          }`}>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-sm">{f.emoji}</span>
              <span className="text-xs font-body font-medium truncate">{f.name}</span>
            </div>
            <span className={`text-lg font-display ${f.direction === "positive" ? "text-emerald-600" : "text-red-500"}`}>
              {f.impact >= 0 ? "+" : ""}{f.impact}
            </span>
            <p className="text-[10px] font-body text-muted-foreground mt-1 truncate">{f.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ShapWaterfall;
