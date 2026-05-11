export type FIREVariant = "lean" | "regular" | "fat";

export interface FIREPlan {
  generated_at: string;
  profile_summary: {
    current_age: number;
    monthly_income: number;
    monthly_expenses: number;
    savings_rate: number;
  };
  preferred_variant: FIREVariant;
  variants: Record<FIREVariant, VariantData>;
  comparison: {
    fire_numbers: Record<FIREVariant, number>;
    fire_ages: Record<FIREVariant, number>;
    years_to_fire: Record<FIREVariant, number>;
    monthly_sip_needed: Record<FIREVariant, number>;
  };
  insurance_gaps: InsuranceGap[];
  tax_analysis: TaxAnalysis;
  glide_path: GlidePoint[];
  current_net_worth: number;
}

export interface VariantData {
  fire_number: number;
  fire_age: number;
  years_to_fire: number;
  required_monthly_sip: number;
  savings_rate_needed: number;
  monthly_expenses_at_fire: number;
  annual_withdrawal_at_fire: number;
  feasibility: "achievable" | "stretch" | "unrealistic";
  feasibility_reason: string;
  config: {
    variant: FIREVariant;
    monthly_expenses: number;
    swr: number;
    lifestyle_notes: string;
  };
  milestones: Milestone[];
  emergency_fund_plan: EmergencyFund;
  monthly_roadmap: RoadmapMonth[];
}

export interface Milestone {
  type: string;
  name: string;
  target_date: string;
  amount: number;
}

export interface EmergencyFund {
  current_fund: number;
  target_fund: number;
  gap: number;
  monthly_contribution: number;
  months_to_fill: number;
  where_to_park: string;
}

export interface RoadmapMonth {
  month: number;
  date: string;
  age: number;
  net_income: number;
  total_expenses: number;
  total_emi: number;
  investable_surplus: number;
  total_net_worth: number;
  fire_progress_pct: number;
  milestone_reached?: string;
  rebalance_needed?: boolean;
  sip_allocations: { fund_type: string; amount: number; goal_name: string }[];
  goal_progress: GoalProgress[];
}

export interface GoalProgress {
  goal_name: string;
  target_future_value: number;
  current_corpus: number;
  completion_pct: number;
  monthly_sip_needed: number;
  shortfall: number;
  on_track: boolean;
}

export interface InsuranceGap {
  type: string;
  current_cover: number;
  recommended_cover: number;
  gap: number;
  urgency: "critical" | "high" | "medium";
  reason: string;
  estimated_premium: number;
}

export interface TaxAnalysis {
  old_regime_tax: number;
  new_regime_tax: number;
  recommended_regime: "old" | "new";
  effective_tax_rate: number;
  annual_savings_by_switching: number;
  tax_saving_moves: TaxMove[];
}

export interface TaxMove {
  section: string;
  description: string;
  potential_saving: number;
  current_utilization: number;
  max_limit: number;
  action: string;
}

export interface GlidePoint {
  age: number;
  equity_pct: number;
  debt_pct: number;
  gold_pct: number;
  real_estate_pct: number;
}

// ─── Generate roadmap helper ───
function generateRoadmap(
  variant: FIREVariant,
  startAge: number,
  income: number,
  expenses: number,
  fireNumber: number,
  startNW: number,
  years: number
): RoadmapMonth[] {
  const months: RoadmapMonth[] = [];
  let nw = startNW;
  const monthlyReturn = 0.01;
  const incomeGrowth = 1.005;
  const expenseGrowth = 1.004;
  let mi = income;
  let me = expenses;

  for (let m = 0; m <= years * 12; m += 12) {
    const surplus = mi - me;
    nw = nw * (1 + monthlyReturn * 12) + surplus * 12;
    const pct = Math.min((nw / fireNumber) * 100, 150);
    const yr = Math.floor(m / 12);
    const date = `${2025 + yr}`;

    let milestone: string | undefined;
    if (pct >= 100 && months.length > 0 && months[months.length - 1].fire_progress_pct < 100) {
      milestone = `🔥 ${variant === "lean" ? "Lean" : variant === "regular" ? "Regular" : "Fat"} FIRE!`;
    } else if (pct >= 50 && months.length > 0 && months[months.length - 1].fire_progress_pct < 50) {
      milestone = "50% milestone";
    } else if (pct >= 25 && months.length > 0 && months[months.length - 1].fire_progress_pct < 25) {
      milestone = "25% milestone";
    }

    months.push({
      month: m,
      date,
      age: startAge + yr,
      net_income: mi,
      total_expenses: me,
      total_emi: variant === "lean" ? 0 : 15000,
      investable_surplus: surplus,
      total_net_worth: Math.max(nw, 0),
      fire_progress_pct: pct,
      milestone_reached: milestone,
      rebalance_needed: yr % 3 === 0 && yr > 0,
      sip_allocations: [
        { fund_type: "flexi_cap", amount: surplus * 0.28, goal_name: "FIRE Corpus" },
        { fund_type: "mid_cap", amount: surplus * 0.22, goal_name: "FIRE Corpus" },
        { fund_type: "small_cap", amount: surplus * 0.14, goal_name: "Growth" },
        { fund_type: "elss", amount: surplus * 0.09, goal_name: "Tax Saving" },
        { fund_type: "debt", amount: surplus * 0.12, goal_name: "Stability" },
        { fund_type: "liquid", amount: surplus * 0.07, goal_name: "Emergency" },
        { fund_type: "gold_etf", amount: surplus * 0.08, goal_name: "Hedge" },
      ],
      goal_progress: [
        { goal_name: "FIRE Corpus", target_future_value: fireNumber, current_corpus: nw * 0.7, completion_pct: pct * 0.7, monthly_sip_needed: surplus * 0.5, shortfall: Math.max(fireNumber * 0.7 - nw * 0.7, 0), on_track: pct > 8 * yr },
        { goal_name: "Child Education", target_future_value: 8950000, current_corpus: nw * 0.15, completion_pct: Math.min((nw * 0.15 / 8950000) * 100, 100), monthly_sip_needed: 12000, shortfall: Math.max(8950000 - nw * 0.15, 0), on_track: true },
        { goal_name: "Emergency Fund", target_future_value: 540000, current_corpus: Math.min(nw * 0.05, 540000), completion_pct: Math.min((nw * 0.05 / 540000) * 100, 100), monthly_sip_needed: 20000, shortfall: Math.max(540000 - nw * 0.05, 0), on_track: true },
      ],
    });

    mi *= incomeGrowth;
    me *= expenseGrowth;
  }
  return months;
}

// ─── Mock FIRE Plan ───
const age = 32;
const income = 120000;
const nw = 2850000;

export const MOCK_FIRE_PLAN: FIREPlan = {
  generated_at: new Date().toISOString(),
  profile_summary: { current_age: age, monthly_income: income, monthly_expenses: 50000, savings_rate: 58 },
  preferred_variant: "regular",
  variants: {
    lean: {
      fire_number: 18000000, fire_age: 38, years_to_fire: 6, required_monthly_sip: 35000,
      savings_rate_needed: 41, monthly_expenses_at_fire: 42000, annual_withdrawal_at_fire: 504000,
      feasibility: "achievable", feasibility_reason: "Requires 41% of surplus. Comfortable with disciplined spending.",
      config: { variant: "lean", monthly_expenses: 30000, swr: 0.035, lifestyle_notes: "No dining out, basic living, public transport, minimal subscriptions" },
      milestones: [
        { type: "emergency_fund", name: "🛡️ Emergency Fund Complete", target_date: "Dec 2025", amount: 540000 },
        { type: "debt_free", name: "🎉 Debt Free!", target_date: "Mar 2027", amount: 0 },
        { type: "quarter", name: "📈 25% to Lean FIRE", target_date: "Jun 2028", amount: 4500000 },
        { type: "goal", name: "🎯 Child Education Funded", target_date: "Jun 2032", amount: 8950000 },
        { type: "coast_fire", name: "⛵ Coast Lean FIRE", target_date: "Sep 2030", amount: 10800000 },
        { type: "halfway", name: "🎯 50% to Lean FIRE", target_date: "Feb 2030", amount: 9000000 },
        { type: "fire", name: "🔥 Lean FIRE Achieved!", target_date: "Apr 2031", amount: 18000000 },
      ],
      emergency_fund_plan: { current_fund: 300000, target_fund: 540000, gap: 240000, monthly_contribution: 20000, months_to_fill: 12, where_to_park: "Liquid fund + High-yield savings" },
      monthly_roadmap: generateRoadmap("lean", age, income, 30000, 18000000, nw, 25),
    },
    regular: {
      fire_number: 41000000, fire_age: 45, years_to_fire: 13, required_monthly_sip: 65000,
      savings_rate_needed: 76, monthly_expenses_at_fire: 97000, annual_withdrawal_at_fire: 1164000,
      feasibility: "achievable", feasibility_reason: "Requires 76% of surplus. Achievable with current savings rate of 58%.",
      config: { variant: "regular", monthly_expenses: 50000, swr: 0.035, lifestyle_notes: "Same life, no alarm clock. Dining 2-3x/month, 1 domestic trip/year" },
      milestones: [
        { type: "emergency_fund", name: "🛡️ Emergency Fund Complete", target_date: "Dec 2025", amount: 540000 },
        { type: "debt_free", name: "🎉 Debt Free!", target_date: "Mar 2027", amount: 0 },
        { type: "quarter", name: "📈 25% to Regular FIRE", target_date: "Jan 2030", amount: 10250000 },
        { type: "goal", name: "🎯 Child Education Funded", target_date: "Jun 2032", amount: 8950000 },
        { type: "coast_fire", name: "⛵ Coast Regular FIRE", target_date: "Sep 2033", amount: 18000000 },
        { type: "halfway", name: "🎯 50% to Regular FIRE", target_date: "Feb 2034", amount: 20500000 },
        { type: "fire", name: "🔥 Regular FIRE Achieved!", target_date: "Apr 2038", amount: 41200000 },
      ],
      emergency_fund_plan: { current_fund: 300000, target_fund: 540000, gap: 240000, monthly_contribution: 20000, months_to_fill: 12, where_to_park: "Liquid fund + High-yield savings" },
      monthly_roadmap: generateRoadmap("regular", age, income, 50000, 41000000, nw, 30),
    },
    fat: {
      fire_number: 92000000, fire_age: 53, years_to_fire: 21, required_monthly_sip: 120000,
      savings_rate_needed: 141, monthly_expenses_at_fire: 175000, annual_withdrawal_at_fire: 2100000,
      feasibility: "stretch", feasibility_reason: "Requires 141% of surplus. Very aggressive — needs income growth or reduced goals.",
      config: { variant: "fat", monthly_expenses: 75000, swr: 0.035, lifestyle_notes: "International travel, fine dining, luxury brands, premium healthcare" },
      milestones: [
        { type: "emergency_fund", name: "🛡️ Emergency Fund Complete", target_date: "Dec 2025", amount: 540000 },
        { type: "quarter", name: "📈 25% to Fat FIRE", target_date: "Jun 2035", amount: 23000000 },
        { type: "goal", name: "🎯 Child Education Funded", target_date: "Jun 2032", amount: 8950000 },
        { type: "halfway", name: "🎯 50% to Fat FIRE", target_date: "Mar 2040", amount: 46000000 },
        { type: "fire", name: "👑 Fat FIRE Achieved!", target_date: "Jan 2046", amount: 92000000 },
      ],
      emergency_fund_plan: { current_fund: 300000, target_fund: 540000, gap: 240000, monthly_contribution: 20000, months_to_fill: 12, where_to_park: "Liquid fund + High-yield savings" },
      monthly_roadmap: generateRoadmap("fat", age, income, 75000, 92000000, nw, 35),
    },
  },
  comparison: {
    fire_numbers: { lean: 18000000, regular: 41000000, fat: 92000000 },
    fire_ages: { lean: 38, regular: 45, fat: 53 },
    years_to_fire: { lean: 6, regular: 13, fat: 21 },
    monthly_sip_needed: { lean: 35000, regular: 65000, fat: 120000 },
  },
  insurance_gaps: [
    { type: "life", current_cover: 5000000, recommended_cover: 27000000, gap: 22000000, urgency: "critical", reason: "Income replacement needs ₹2.2Cr cover for family protection", estimated_premium: 18000 },
    { type: "health", current_cover: 500000, recommended_cover: 2000000, gap: 1500000, urgency: "high", reason: "Medical inflation requires at least ₹20L super top-up", estimated_premium: 12000 },
    { type: "critical_illness", current_cover: 0, recommended_cover: 2500000, gap: 2500000, urgency: "medium", reason: "No critical illness cover — one event can derail FIRE", estimated_premium: 8000 },
  ],
  tax_analysis: {
    old_regime_tax: 285000, new_regime_tax: 241000, recommended_regime: "new",
    effective_tax_rate: 16.7, annual_savings_by_switching: 44000,
    tax_saving_moves: [
      { section: "80C", description: "ELSS mutual fund for tax saving + growth", potential_saving: 46800, current_utilization: 50000, max_limit: 150000, action: "Invest ₹1L more in ELSS funds via SIP of ₹8.3K/mo" },
      { section: "80D", description: "Health insurance premium deduction", potential_saving: 7800, current_utilization: 12000, max_limit: 25000, action: "Upgrade to ₹25K health plan or add parents' cover" },
      { section: "NPS", description: "Additional ₹50K NPS deduction u/s 80CCD(1B)", potential_saving: 15600, current_utilization: 0, max_limit: 50000, action: "Start NPS SIP of ₹4.2K/mo for extra ₹50K deduction" },
    ],
  },
  glide_path: [
    { age: 32, equity_pct: 68, debt_pct: 18, gold_pct: 10, real_estate_pct: 4 },
    { age: 37, equity_pct: 63, debt_pct: 22, gold_pct: 10, real_estate_pct: 5 },
    { age: 42, equity_pct: 58, debt_pct: 25, gold_pct: 12, real_estate_pct: 5 },
    { age: 47, equity_pct: 52, debt_pct: 28, gold_pct: 13, real_estate_pct: 7 },
    { age: 50, equity_pct: 50, debt_pct: 30, gold_pct: 12, real_estate_pct: 8 },
    { age: 55, equity_pct: 42, debt_pct: 35, gold_pct: 13, real_estate_pct: 10 },
    { age: 60, equity_pct: 35, debt_pct: 40, gold_pct: 15, real_estate_pct: 10 },
  ],
  current_net_worth: nw,
};
