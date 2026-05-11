import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ═══════════════════════════════════════════════
// FIRE Trajectory Chart — Lean/Regular/Fat paths
// ═══════════════════════════════════════════════

interface Props {
  fire_ages: Record<string, number>;
  fire_numbers: Record<string, number>;
  years_to_fire: Record<string, number>;
  monthly_sip_needed: Record<string, number>;
  preferred_variant: string;
  current_age: number;
  current_net_worth: number;
  lean_roadmap: any[];
  regular_roadmap: any[];
  fat_roadmap: any[];
}

const formatINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
  return `₹${Math.round(n / 1000)}K`;
};

const VARIANT_COLORS = {
  lean: { stroke: "#10b981", fill: "#10b98130", label: "Lean FIRE", emoji: "🌿" },
  regular: { stroke: "#f97316", fill: "#f9731630", label: "Regular FIRE", emoji: "🔥" },
  fat: { stroke: "#eab308", fill: "#eab30830", label: "Fat FIRE", emoji: "👑" },
};

const FireTrajectoryChart = (props: Props) => {
  const { fire_ages, fire_numbers, years_to_fire, monthly_sip_needed, preferred_variant, current_age, current_net_worth, lean_roadmap, regular_roadmap, fat_roadmap } = props;

  // Build chart data from roadmaps
  const chartData = regular_roadmap.map((r: any, i: number) => ({
    age: r.age,
    lean: lean_roadmap[i]?.total_net_worth || 0,
    regular: r.total_net_worth || 0,
    fat: fat_roadmap[i]?.total_net_worth || 0,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="account-card rounded-lg p-6 md:p-8">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-body tracking-[0.2em] uppercase text-muted-foreground">
          FIRE Trajectory Projection
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-body">
          {preferred_variant.toUpperCase()}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mt-4 mb-6">
        {(["lean", "regular", "fat"] as const).map((v) => {
          const c = VARIANT_COLORS[v];
          const isPreferred = v === preferred_variant;
          return (
            <div key={v} className={`p-3 rounded-lg border ${isPreferred ? "border-2" : "border-border/50"}`}
              style={isPreferred ? { borderColor: c.stroke } : {}}>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-sm">{c.emoji}</span>
                <span className="text-xs font-body font-medium">{c.label}</span>
              </div>
              <p className="font-display text-xl" style={{ color: c.stroke }}>
                Age {fire_ages[v] || "—"}
              </p>
              <p className="text-[11px] font-body text-muted-foreground mt-1">
                {formatINR(fire_numbers[v] || 0)} target
              </p>
              <p className="text-[11px] font-body text-muted-foreground">
                SIP: {formatINR(monthly_sip_needed[v] || 0)}/mo
              </p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: "Age", position: "bottom", fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatINR(v)} width={60} />
              <Tooltip formatter={(v: number) => formatINR(v)} labelFormatter={(l) => `Age ${l}`}
                contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area type="monotone" dataKey="fat" name="Fat FIRE" stroke={VARIANT_COLORS.fat.stroke}
                fill={VARIANT_COLORS.fat.fill} strokeWidth={1.5} />
              <Area type="monotone" dataKey="regular" name="Regular FIRE" stroke={VARIANT_COLORS.regular.stroke}
                fill={VARIANT_COLORS.regular.fill} strokeWidth={2} />
              <Area type="monotone" dataKey="lean" name="Lean FIRE" stroke={VARIANT_COLORS.lean.stroke}
                fill={VARIANT_COLORS.lean.fill} strokeWidth={1.5} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-xs font-body text-muted-foreground mt-4 text-center">
        Current age: {current_age} · Net worth: {formatINR(current_net_worth)} · 
        Assumptions: 12% equity, 7% debt, 6% inflation
      </p>
    </motion.div>
  );
};

export default FireTrajectoryChart;
