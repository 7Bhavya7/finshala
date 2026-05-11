// ═══════════════════════════════════════════════
// HEALTH SCORE ENGINE — Client-Side (Vite + React)
// 6-dimension financial health scoring
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface SubScore {
  label: string;
  score: number;
  max: number;
  description: string;
}

export interface Finding {
  type: 'positive' | 'negative' | 'warning' | 'neutral';
  text: string;
  icon?: string;
}

export interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  impact: string;
  estimated_benefit?: string;
}

export interface DimensionScore {
  id: string;
  name: string;
  emoji: string;
  score: number;
  grade: Grade;
  color: string;
  description: string;
  sub_scores: SubScore[];
  findings: Finding[];
  recommendations: Recommendation[];
}

export interface HealthScoreResult {
  generated_at: string;
  overall_score: number;
  overall_grade: Grade;
  overall_label: string;
  overall_color: string;
  dimensions: {
    emergency: DimensionScore;
    insurance: DimensionScore;
    investment: DimensionScore;
    debt: DimensionScore;
    tax: DimensionScore;
    retirement: DimensionScore;
  };
  dimension_list: DimensionScore[];
  top_actions: Recommendation[];
  peer_comparison: {
    your_score: number;
    average_score: number;
    percentile: number;
    better_than_pct: number;
  };
  score_history_placeholder: Array<{ month: string; score: number }>;
  meta: {
    current_age: number;
    monthly_income: number;
    monthly_expenses: number;
    total_emi: number;
    net_worth: number;
    total_assets: number;
    total_liabilities: number;
  };
}

export interface HealthProfile {
  dob: string;
  marital_status: string;
  dependents: { children: number; parents: number };
  gross_annual_income: number;
  monthly_expenses: number;
  emergency_fund: number;
  retirement_balance: number;
  mutual_fund_value: number;
  stock_value: number;
  savings_fd_balance: number;
  gold_real_estate: number;
  monthly_sip: number;
  loans: Record<string, { emi: number; tenure: number }>;
  missed_emi: boolean;
  missed_emi_amount: number;
  life_insurance_cover: number;
  health_insurance_cover: number;
  critical_illness_cover: boolean;
  tax_basic_salary: number;
  tax_hra_received: number;
  tax_80c_investments: number;
  tax_80d_medical: number;
  current_tax_regime: string;
  tax_rent_paid: number;
  tax_is_metro_city: boolean;
  tax_home_loan_interest: number;
  tax_nps_80ccd_1b: number;
  risk_profile: string;
}


// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function getAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(age, 18);
}

function getGrade(score: number): Grade {
  if (score >= 90) return 'A+';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

function getOverallLabel(score: number): string {
  if (score >= 800) return 'Excellent';
  if (score >= 700) return 'Very Good';
  if (score >= 550) return 'Good';
  if (score >= 400) return 'Fair';
  if (score >= 200) return 'Needs Work';
  return 'Critical';
}

function getOverallColor(score: number): string {
  if (score >= 800) return 'emerald';
  if (score >= 700) return 'green';
  if (score >= 550) return 'yellow';
  if (score >= 400) return 'orange';
  return 'red';
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function lerp(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
  const ratio = clamp((value - fromMin) / (fromMax - fromMin), 0, 1);
  return toMin + ratio * (toMax - toMin);
}

function getTotalEMI(loans: Record<string, { emi: number; tenure: number }>): number {
  if (!loans) return 0;
  return Object.values(loans).reduce((s, l) => s + (l?.emi || 0), 0);
}

function getTotalOutstanding(loans: Record<string, { emi: number; tenure: number }>): number {
  if (!loans) return 0;
  return Object.values(loans).reduce((s, l) => s + (l?.emi || 0) * (l?.tenure || 0), 0);
}


// ═══════════════════════════════════════════════
// SCORING ENGINE
// ═══════════════════════════════════════════════

export class HealthScoreEngine {
  private p: HealthProfile;
  private age: number;
  private monthlyIncome: number;
  private totalEMI: number;
  private totalAssets: number;
  private totalLiabilities: number;

  constructor(profile: HealthProfile) {
    this.p = profile;
    this.age = getAge(profile.dob);
    this.monthlyIncome = profile.gross_annual_income / 12;
    this.totalEMI = getTotalEMI(profile.loans);
    this.totalAssets =
      (profile.emergency_fund || 0) + (profile.retirement_balance || 0) +
      (profile.mutual_fund_value || 0) + (profile.stock_value || 0) +
      (profile.savings_fd_balance || 0) + (profile.gold_real_estate || 0);
    this.totalLiabilities = getTotalOutstanding(profile.loans);
  }

  public calculate(): HealthScoreResult {
    const emergency = this.scoreEmergency();
    const insurance = this.scoreInsurance();
    const investment = this.scoreInvestment();
    const debt = this.scoreDebt();
    const tax = this.scoreTax();
    const retirement = this.scoreRetirement();

    const dimensions = { emergency, insurance, investment, debt, tax, retirement };
    const dimensionList = [emergency, insurance, investment, debt, tax, retirement];

    const weightedAvg =
      emergency.score * 0.20 + insurance.score * 0.20 +
      investment.score * 0.15 + debt.score * 0.15 +
      tax.score * 0.15 + retirement.score * 0.15;

    const overallScore = Math.round(weightedAvg * 9);

    const allRecs = dimensionList.flatMap((d) => d.recommendations);
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    allRecs.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

    let percentile = 50;
    if (overallScore >= 800) percentile = 95 + Math.round((overallScore - 800) / 20);
    else if (overallScore >= 650) percentile = 80 + Math.round((overallScore - 650) / 10);
    else if (overallScore >= 500) percentile = 50 + Math.round((overallScore - 500) / 5);
    else percentile = Math.max(5, Math.round(overallScore / 10));
    percentile = clamp(percentile, 1, 99);

    return {
      generated_at: new Date().toISOString(),
      overall_score: overallScore,
      overall_grade: getGrade(overallScore / 9),
      overall_label: getOverallLabel(overallScore),
      overall_color: getOverallColor(overallScore),
      dimensions,
      dimension_list: dimensionList,
      top_actions: allRecs.slice(0, 6),
      peer_comparison: { your_score: overallScore, average_score: 512, percentile, better_than_pct: percentile },
      score_history_placeholder: this.generateScoreHistory(overallScore),
      meta: {
        current_age: this.age,
        monthly_income: Math.round(this.monthlyIncome),
        monthly_expenses: this.p.monthly_expenses,
        total_emi: this.totalEMI,
        net_worth: this.totalAssets - this.totalLiabilities,
        total_assets: this.totalAssets,
        total_liabilities: this.totalLiabilities,
      },
    };
  }

  // ────────────── 1. EMERGENCY PREPAREDNESS ──────────────

  private scoreEmergency(): DimensionScore {
    const monthlyBurn = this.p.monthly_expenses + this.totalEMI;
    const monthsCovered = monthlyBurn > 0 ? (this.p.emergency_fund || 0) / monthlyBurn : 0;
    const hasChildren = (this.p.dependents?.children || 0) > 0;
    const targetMonths = hasChildren ? 9 : 6;

    const coveragePts = clamp(lerp(monthsCovered, 0, targetMonths, 0, 70), 0, 70);
    const liquidityPts = (this.p.emergency_fund || 0) > 0 ? 15 : 0;
    const adequacyPts = monthsCovered >= targetMonths ? 15 : monthsCovered >= 3 ? 8 : 0;
    const totalScore = Math.round(coveragePts + liquidityPts + adequacyPts);

    const findings: Finding[] = [];
    const recs: Recommendation[] = [];

    if (monthsCovered === 0) {
      findings.push({ type: 'negative', text: 'No emergency fund exists', icon: '🚨' });
      recs.push({ priority: 'critical', action: `Build ₹${Math.round((monthlyBurn * targetMonths) / 1000)}K emergency fund immediately`, impact: 'Without this, one emergency forces you to break investments at a loss', estimated_benefit: `Protection from ${targetMonths} months of income disruption` });
    } else if (monthsCovered < 3) {
      findings.push({ type: 'warning', text: `Only ${monthsCovered.toFixed(1)} months covered — minimum is 3`, icon: '⚠️' });
      const gap = (3 * monthlyBurn) - (this.p.emergency_fund || 0);
      recs.push({ priority: 'high', action: `Add ₹${Math.round(gap / 1000)}K to reach 3-month minimum`, impact: 'Protects against job loss or medical emergency' });
    } else if (monthsCovered < targetMonths) {
      findings.push({ type: 'warning', text: `${monthsCovered.toFixed(1)} months covered, target is ${targetMonths}`, icon: '📊' });
      const gap = (targetMonths * monthlyBurn) - (this.p.emergency_fund || 0);
      recs.push({ priority: 'medium', action: `Top up by ₹${Math.round(gap / 1000)}K for full ${targetMonths}-month coverage`, impact: `Full coverage for ${hasChildren ? 'family with children' : 'your situation'}` });
    } else {
      findings.push({ type: 'positive', text: `${monthsCovered.toFixed(1)} months covered — excellent!`, icon: '✅' });
    }

    if ((this.p.emergency_fund || 0) > 0) {
      findings.push({ type: 'neutral', text: `₹${Math.round((this.p.emergency_fund || 0) / 1000)}K in emergency reserves`, icon: '💰' });
    }

    return {
      id: 'emergency', name: 'Emergency Preparedness', emoji: '🛡️', score: totalScore,
      grade: getGrade(totalScore), color: 'blue', description: `${monthsCovered.toFixed(1)} months of expenses covered`,
      sub_scores: [
        { label: 'Months Coverage', score: Math.round(coveragePts), max: 70, description: `${monthsCovered.toFixed(1)} of ${targetMonths} months` },
        { label: 'Fund Exists', score: liquidityPts, max: 15, description: (this.p.emergency_fund || 0) > 0 ? 'Yes' : 'No fund' },
        { label: 'Adequacy', score: adequacyPts, max: 15, description: monthsCovered >= targetMonths ? 'Fully adequate' : 'Below target' },
      ],
      findings, recommendations: recs,
    };
  }

  // ────────────── 2. INSURANCE COVERAGE ──────────────

  private scoreInsurance(): DimensionScore {
    const income = this.p.gross_annual_income;
    const deps = (this.p.dependents?.children || 0) + (this.p.dependents?.parents || 0);
    const totalLoans = this.totalLiabilities;

    const lifeMul = deps > 2 ? 15 : deps > 0 ? 12 : 10;
    const recLife = income * lifeMul + totalLoans;
    const lifeRatio = recLife > 0 ? Math.min((this.p.life_insurance_cover || 0) / recLife, 1) : 0;
    const lifePts = Math.round(lifeRatio * 40);

    const baseHealth = this.p.tax_is_metro_city ? 1500000 : 1000000;
    const familyMul = 1 + (this.p.dependents?.children || 0) * 0.3 + (this.p.dependents?.parents || 0) * 0.5 + (this.p.marital_status === 'married' ? 0.5 : 0);
    const recHealth = baseHealth * familyMul;
    const healthRatio = recHealth > 0 ? Math.min((this.p.health_insurance_cover || 0) / recHealth, 1) : 0;
    const healthPts = Math.round(healthRatio * 40);

    const ciPts = this.p.critical_illness_cover ? 20 : (this.age >= 30 ? 0 : 10);
    const totalScore = lifePts + healthPts + ciPts;

    const findings: Finding[] = [];
    const recs: Recommendation[] = [];

    if ((this.p.life_insurance_cover || 0) === 0 && deps > 0) {
      findings.push({ type: 'negative', text: 'No life insurance with dependents — critical risk', icon: '🚨' });
      recs.push({ priority: 'critical', action: `Get term insurance of ₹${Math.round(recLife / 100000)}L immediately`, impact: 'Family has zero protection', estimated_benefit: `₹${Math.round(recLife * 0.003 / 1000)}K/yr premium` });
    } else if (lifeRatio < 0.5) {
      const gap = recLife - (this.p.life_insurance_cover || 0);
      findings.push({ type: 'warning', text: `Life cover is ${Math.round(lifeRatio * 100)}% of recommended`, icon: '⚠️' });
      recs.push({ priority: 'high', action: `Increase life cover by ₹${Math.round(gap / 100000)}L`, impact: 'Current cover leaves significant gap' });
    } else if (lifeRatio >= 0.8) {
      findings.push({ type: 'positive', text: `Life cover is ${Math.round(lifeRatio * 100)}% adequate`, icon: '✅' });
    }

    if ((this.p.health_insurance_cover || 0) === 0) {
      findings.push({ type: 'negative', text: 'No health insurance — one hospitalization can wipe savings', icon: '🏥' });
      recs.push({ priority: 'critical', action: `Get ₹${Math.round(recHealth / 100000)}L health cover + super top-up`, impact: 'Average cardiac surgery costs ₹5-10L', estimated_benefit: `₹${Math.round(recHealth * 0.015 / 1000)}K/yr premium` });
    } else if (healthRatio < 0.5) {
      findings.push({ type: 'warning', text: `Health cover only ₹${Math.round((this.p.health_insurance_cover || 0) / 100000)}L vs recommended ₹${Math.round(recHealth / 100000)}L`, icon: '⚠️' });
      recs.push({ priority: 'high', action: 'Add a super top-up policy to bridge the gap', impact: 'Super top-ups are cheap and double your effective cover' });
    } else {
      findings.push({ type: 'positive', text: `Health cover ₹${Math.round((this.p.health_insurance_cover || 0) / 100000)}L — adequate`, icon: '✅' });
    }

    if (!this.p.critical_illness_cover && this.age >= 30) {
      findings.push({ type: 'warning', text: 'No critical illness cover', icon: '💊' });
      recs.push({ priority: this.age >= 40 ? 'high' : 'medium', action: `Get ₹${Math.round((income * 3) / 100000)}L critical illness cover`, impact: 'Lump-sum on diagnosis of cancer, heart attack' });
    } else if (this.p.critical_illness_cover) {
      findings.push({ type: 'positive', text: 'Critical illness cover active', icon: '✅' });
    }

    return {
      id: 'insurance', name: 'Insurance Coverage', emoji: '🏥', score: totalScore,
      grade: getGrade(totalScore), color: 'cyan',
      description: `Life ${Math.round(lifeRatio * 100)}% | Health ${Math.round(healthRatio * 100)}% adequate`,
      sub_scores: [
        { label: 'Life Insurance', score: lifePts, max: 40, description: `₹${Math.round((this.p.life_insurance_cover || 0) / 100000)}L of ₹${Math.round(recLife / 100000)}L needed` },
        { label: 'Health Insurance', score: healthPts, max: 40, description: `₹${Math.round((this.p.health_insurance_cover || 0) / 100000)}L of ₹${Math.round(recHealth / 100000)}L needed` },
        { label: 'Critical Illness', score: ciPts, max: 20, description: this.p.critical_illness_cover ? 'Covered' : 'Not covered' },
      ],
      findings, recommendations: recs,
    };
  }

  // ────────────── 3. INVESTMENT DIVERSIFICATION ──────────────

  private scoreInvestment(): DimensionScore {
    const equity = (this.p.mutual_fund_value || 0) + (this.p.stock_value || 0);
    const fixedIncome = (this.p.savings_fd_balance || 0) + (this.p.retirement_balance || 0);
    const gold = (this.p.gold_real_estate || 0) * 0.4;
    const re = (this.p.gold_real_estate || 0) * 0.6;
    const total = equity + fixedIncome + gold + re;

    const hasInvestments = total > 0;
    const existsPts = hasInvestments ? 15 : 0;
    const classes = [equity > 0, fixedIncome > 0, gold > 0, re > 0].filter(Boolean).length;
    const diversePts = Math.min(classes * 12, 36);

    let concentrationPts = 15;
    if (total > 0) {
      const maxPct = Math.max(equity, fixedIncome, gold, re) / total;
      if (maxPct > 0.8) concentrationPts = 0;
      else if (maxPct > 0.7) concentrationPts = 5;
      else if (maxPct > 0.6) concentrationPts = 10;
    } else { concentrationPts = 0; }

    const sipPts = (this.p.monthly_sip || 0) > 0 ? 15 : 0;

    const equityPct = total > 0 ? (equity / total) * 100 : 0;
    const idealEquity = Math.max(100 - this.age, 20);
    const equityDeviation = Math.abs(equityPct - idealEquity);
    const equityFitPts = equityDeviation < 15 ? 19 : equityDeviation < 25 ? 12 : equityDeviation < 40 ? 6 : 0;

    const totalScore = Math.min(existsPts + diversePts + concentrationPts + sipPts + equityFitPts, 100);

    const findings: Finding[] = [];
    const recs: Recommendation[] = [];

    if (!hasInvestments) {
      findings.push({ type: 'negative', text: 'No investments — money is losing to inflation', icon: '📉' });
      recs.push({ priority: 'critical', action: 'Start a ₹5,000/month SIP in a flexi-cap mutual fund today', impact: '₹5K/month at 12% for 20 years = ₹49.5L' });
    } else {
      findings.push({ type: 'neutral', text: `Portfolio: ₹${Math.round(total / 100000)}L across ${classes} asset class${classes > 1 ? 'es' : ''}`, icon: '📊' });
      if (classes < 3) recs.push({ priority: 'medium', action: `Add ${classes < 2 ? 'debt and gold' : 'gold/debt'} exposure for diversification`, impact: 'Reduces risk of 30-40% drops in crashes' });
      if (total > 0 && (Math.max(equity, fixedIncome, gold, re) / total) > 0.7) {
        const dominant = equity > fixedIncome ? 'equity' : 'fixed income';
        findings.push({ type: 'warning', text: `Over-concentrated in ${dominant}`, icon: '⚠️' });
        recs.push({ priority: 'medium', action: 'Rebalance — no single asset should exceed 65%', impact: 'Reduces catastrophic loss risk' });
      }
    }

    if ((this.p.monthly_sip || 0) > 0) {
      findings.push({ type: 'positive', text: `Active SIP: ₹${Math.round((this.p.monthly_sip || 0) / 1000)}K/month`, icon: '✅' });
    } else if (hasInvestments) {
      findings.push({ type: 'warning', text: 'No active SIP — lump-sum investing is risky', icon: '⚠️' });
      recs.push({ priority: 'high', action: 'Start a SIP for rupee-cost averaging', impact: 'SIPs reduce timing risk' });
    }

    if (total > 0) {
      findings.push({ type: 'neutral', text: `Equity: ${equityPct.toFixed(0)}% | Ideal for age ${this.age}: ~${idealEquity}%`, icon: equityDeviation < 15 ? '✅' : '📐' });
    }

    return {
      id: 'investment', name: 'Investment Diversification', emoji: '📊', score: totalScore,
      grade: getGrade(totalScore), color: 'violet',
      description: `${classes} asset class${classes !== 1 ? 'es' : ''}, ₹${Math.round(total / 100000)}L invested`,
      sub_scores: [
        { label: 'Has Investments', score: existsPts, max: 15, description: hasInvestments ? 'Yes' : 'None' },
        { label: 'Diversification', score: diversePts, max: 36, description: `${classes} of 4 asset classes` },
        { label: 'Concentration', score: concentrationPts, max: 15, description: concentrationPts >= 10 ? 'Well spread' : 'Too concentrated' },
        { label: 'SIP Discipline', score: sipPts, max: 15, description: (this.p.monthly_sip || 0) > 0 ? `₹${Math.round((this.p.monthly_sip || 0) / 1000)}K/mo` : 'No SIP' },
        { label: 'Age-Appropriate Equity', score: equityFitPts, max: 19, description: `${equityPct.toFixed(0)}% vs ideal ${idealEquity}%` },
      ],
      findings, recommendations: recs,
    };
  }

  // ────────────── 4. DEBT HEALTH ──────────────

  private scoreDebt(): DimensionScore {
    const emiToIncomeRatio = this.monthlyIncome > 0 ? (this.totalEMI / this.monthlyIncome) * 100 : 0;
    const hasDebt = this.totalEMI > 0;
    const hasCreditCard = (this.p.loans?.credit_card?.emi || 0) > 0;
    const hasPersonal = (this.p.loans?.personal?.emi || 0) > 0;

    let totalScore: number;
    if (!hasDebt) { totalScore = 100; } else {
      let ratioPts: number;
      if (emiToIncomeRatio <= 15) ratioPts = 50;
      else if (emiToIncomeRatio <= 25) ratioPts = 40;
      else if (emiToIncomeRatio <= 35) ratioPts = 30;
      else if (emiToIncomeRatio <= 45) ratioPts = 20;
      else if (emiToIncomeRatio <= 55) ratioPts = 10;
      else ratioPts = 0;

      let qualityPts = 25;
      if (hasCreditCard) qualityPts -= 15;
      if (hasPersonal) qualityPts -= 10;

      let disciplinePts = 25;
      if (this.p.missed_emi) disciplinePts -= 20;
      if (this.p.missed_emi_amount > 0) disciplinePts -= 5;

      totalScore = Math.max(ratioPts + Math.max(qualityPts, 0) + Math.max(disciplinePts, 0), 0);
    }

    const findings: Finding[] = [];
    const recs: Recommendation[] = [];

    if (!hasDebt) {
      findings.push({ type: 'positive', text: 'Completely debt-free! Maximum score.', icon: '🎉' });
    } else {
      findings.push({ type: emiToIncomeRatio <= 30 ? 'neutral' : 'negative', text: `EMI-to-Income ratio: ${emiToIncomeRatio.toFixed(0)}% ${emiToIncomeRatio <= 30 ? '(healthy)' : '(elevated)'}`, icon: emiToIncomeRatio <= 30 ? '📊' : '🚨' });
      if (hasCreditCard) {
        const ccEmi = this.p.loans.credit_card.emi;
        const ccTenure = this.p.loans.credit_card.tenure;
        findings.push({ type: 'negative', text: `Credit card debt: ₹${Math.round(ccEmi * ccTenure / 1000)}K outstanding at 30-40% interest`, icon: '💳' });
        recs.push({ priority: 'critical', action: 'Pay off credit card debt FIRST — it charges 36%+ interest', impact: 'No investment returns 36% — always pay CC debt first' });
      }
      if (hasPersonal) {
        findings.push({ type: 'warning', text: 'Personal loan active — high interest unsecured debt', icon: '⚠️' });
        recs.push({ priority: 'high', action: 'Accelerate personal loan repayment', impact: 'Personal loans charge 12-18%' });
      }
      if (this.p.missed_emi) {
        findings.push({ type: 'negative', text: 'Missed EMI detected — credit score at risk', icon: '🚨' });
        recs.push({ priority: 'critical', action: `Clear missed EMI of ₹${Math.round(this.p.missed_emi_amount / 1000)}K immediately`, impact: 'Each missed EMI drops CIBIL score by 50-100 points' });
      }
      if (emiToIncomeRatio > 50) {
        recs.push({ priority: 'critical', action: 'EMI exceeds 50% of income — consider debt restructuring', impact: 'High EMI leaves no room for savings' });
      }
    }

    const activeLoans = this.p.loans ? Object.entries(this.p.loans).filter(([_, l]) => l && l.emi > 0) : [];
    if (activeLoans.length > 0) {
      findings.push({ type: 'neutral', text: `${activeLoans.length} active loan${activeLoans.length > 1 ? 's' : ''}: ${activeLoans.map(([k, l]) => `${k} ₹${Math.round(l.emi / 1000)}K`).join(', ')}`, icon: '📋' });
    }

    return {
      id: 'debt', name: 'Debt Health', emoji: '💳', score: totalScore,
      grade: getGrade(totalScore), color: hasDebt ? (totalScore >= 60 ? 'green' : 'red') : 'emerald',
      description: hasDebt ? `${emiToIncomeRatio.toFixed(0)}% EMI-to-income ratio` : 'Debt free!',
      sub_scores: hasDebt ? [
        { label: 'EMI-to-Income', score: Math.round(lerp(100 - emiToIncomeRatio, 0, 100, 0, 50)), max: 50, description: `${emiToIncomeRatio.toFixed(0)}% (under 30% is ideal)` },
        { label: 'Debt Quality', score: Math.max(25 - (hasCreditCard ? 15 : 0) - (hasPersonal ? 10 : 0), 0), max: 25, description: hasCreditCard ? 'Has high-interest debt' : 'Secured debt only' },
        { label: 'Payment Record', score: this.p.missed_emi ? 0 : 25, max: 25, description: this.p.missed_emi ? 'Missed payments' : 'Clean record' },
      ] : [{ label: 'Debt Status', score: 100, max: 100, description: 'No outstanding debt' }],
      findings, recommendations: recs,
    };
  }

  // ────────────── 5. TAX EFFICIENCY ──────────────

  private scoreTax(): DimensionScore {
    const income = this.p.gross_annual_income;
    if (income <= 500000) {
      return { id: 'tax', name: 'Tax Efficiency', emoji: '🏛️', score: 85, grade: 'A', color: 'amber', description: 'Income below taxable threshold', sub_scores: [{ label: 'Overall', score: 85, max: 100, description: 'Low income, low tax concern' }], findings: [{ type: 'positive', text: 'Income under ₹5L — nil or minimal tax', icon: '✅' }], recommendations: [] };
    }

    const c80ratio = Math.min((this.p.tax_80c_investments || 0) / 150000, 1);
    const c80pts = Math.round(c80ratio * 30);

    const d80max = 25000 + ((this.p.dependents?.parents || 0) > 0 ? 50000 : 0);
    const d80ratio = d80max > 0 ? Math.min((this.p.tax_80d_medical || 0) / d80max, 1) : 0;
    const d80pts = Math.round(d80ratio * 20);

    const npsRatio = Math.min((this.p.tax_nps_80ccd_1b || 0) / 50000, 1);
    const npsPts = Math.round(npsRatio * 15);

    const oldTax = this.calcOldTax();
    const newTax = this.calcNewTax();
    const optimalRegime = oldTax <= newTax ? 'old' : 'new';
    const isOptimal = this.p.current_tax_regime === optimalRegime;
    const regimePts = isOptimal ? 20 : 5;

    let hraPts = 0;
    if ((this.p.tax_rent_paid || 0) > 0 && (this.p.tax_hra_received || 0) > 0) hraPts = 15;
    else if ((this.p.tax_rent_paid || 0) > 0) hraPts = 0;
    else hraPts = 10;

    const totalScore = Math.min(c80pts + d80pts + npsPts + regimePts + hraPts, 100);
    const findings: Finding[] = [];
    const recs: Recommendation[] = [];

    if (c80ratio < 1) {
      const gap = 150000 - (this.p.tax_80c_investments || 0);
      findings.push({ type: 'warning', text: `80C: ₹${Math.round((this.p.tax_80c_investments || 0) / 1000)}K of ₹1.5L used (${Math.round(c80ratio * 100)}%)`, icon: '📋' });
      recs.push({ priority: gap > 100000 ? 'high' : 'medium', action: `Invest ₹${Math.round(gap / 1000)}K in ELSS to fill 80C gap`, impact: `Save ₹${Math.round(gap * this.getMarginalRate() / 1000)}K in tax` });
    } else {
      findings.push({ type: 'positive', text: '80C fully utilized (₹1.5L)', icon: '✅' });
    }

    if (!isOptimal) {
      const saving = Math.abs(oldTax - newTax);
      findings.push({ type: 'negative', text: `Wrong regime! ${optimalRegime.toUpperCase()} saves ₹${Math.round(saving / 1000)}K more`, icon: '🔄' });
      recs.push({ priority: saving > 30000 ? 'high' : 'medium', action: `Switch to ${optimalRegime} regime`, impact: `Annual saving of ₹${Math.round(saving / 1000)}K` });
    } else {
      findings.push({ type: 'positive', text: `Optimal regime selected (${optimalRegime})`, icon: '✅' });
    }

    if (npsRatio < 1) {
      const gap = 50000 - (this.p.tax_nps_80ccd_1b || 0);
      recs.push({ priority: 'medium', action: `Add ₹${Math.round(gap / 1000)}K to NPS for 80CCD(1B)`, impact: `Extra ₹${Math.round(gap * this.getMarginalRate() / 1000)}K saving` });
    }

    const effectiveRate = income > 0 ? (Math.min(oldTax, newTax) / income) * 100 : 0;
    findings.push({ type: 'neutral', text: `Effective tax rate: ${effectiveRate.toFixed(1)}%`, icon: '📊' });

    return {
      id: 'tax', name: 'Tax Efficiency', emoji: '🏛️', score: totalScore,
      grade: getGrade(totalScore), color: 'amber',
      description: `${Math.round((c80ratio + d80ratio + npsRatio) / 3 * 100)}% deductions utilized`,
      sub_scores: [
        { label: 'Section 80C', score: c80pts, max: 30, description: `₹${Math.round((this.p.tax_80c_investments || 0) / 1000)}K of ₹1.5L` },
        { label: 'Section 80D', score: d80pts, max: 20, description: `₹${Math.round((this.p.tax_80d_medical || 0) / 1000)}K of ₹${Math.round(d80max / 1000)}K` },
        { label: 'NPS 80CCD(1B)', score: npsPts, max: 15, description: `₹${Math.round((this.p.tax_nps_80ccd_1b || 0) / 1000)}K of ₹50K` },
        { label: 'Regime', score: regimePts, max: 20, description: isOptimal ? 'Optimal' : 'Sub-optimal' },
        { label: 'HRA', score: hraPts, max: 15, description: hraPts >= 15 ? 'Claimed' : 'Not optimized' },
      ],
      findings, recommendations: recs,
    };
  }

  // ────────────── 6. RETIREMENT READINESS ──────────────

  private scoreRetirement(): DimensionScore {
    const yearsToRetire = Math.max(60 - this.age, 1);
    const annualExpenses = this.p.monthly_expenses * 12;
    const futureExpenses = annualExpenses * Math.pow(1.06, yearsToRetire);
    const retirementCorpus = futureExpenses / 0.035;

    const currentRetirement = (this.p.retirement_balance || 0) + (this.p.mutual_fund_value || 0) * 0.5;
    const corpusRatio = retirementCorpus > 0 ? Math.min(currentRetirement / retirementCorpus, 1) : 0;

    const hasSavingsPts = currentRetirement > 0 ? 25 : 0;
    const corpusPts = Math.round(corpusRatio * 40);
    const sipPts = (this.p.monthly_sip || 0) > 0 ? 15 : 0;

    const monthlyReturn = Math.pow(1.10, 1 / 12) - 1;
    const months = yearsToRetire * 12;
    const fvCurrent = currentRetirement * Math.pow(1 + monthlyReturn, months);
    const remaining = Math.max(retirementCorpus - fvCurrent, 0);
    const neededSIP = remaining > 0 && monthlyReturn > 0 ? (remaining * monthlyReturn) / (Math.pow(1 + monthlyReturn, months) - 1) : 0;
    const sipAdequacy = neededSIP > 0 ? Math.min((this.p.monthly_sip || 0) / neededSIP, 1) : ((this.p.monthly_sip || 0) > 0 ? 1 : 0);
    const sipAdequacyPts = Math.round(sipAdequacy * 20);

    const totalScore = hasSavingsPts + corpusPts + sipPts + sipAdequacyPts;
    const findings: Finding[] = [];
    const recs: Recommendation[] = [];

    findings.push({ type: 'neutral', text: `Retirement corpus needed by 60: ₹${Math.round(retirementCorpus / 10000000 * 100) / 100}Cr`, icon: '🎯' });

    if (currentRetirement === 0) {
      findings.push({ type: 'negative', text: 'Zero retirement savings', icon: '🚨' });
      recs.push({ priority: 'critical', action: `Start retirement SIP of ₹${Math.round(neededSIP / 1000)}K/month`, impact: 'You need ₹' + (Math.round(retirementCorpus / 10000000 * 100) / 100) + 'Cr by age 60' });
    } else {
      findings.push({ type: corpusRatio >= 0.2 ? 'positive' : 'warning', text: `${Math.round(corpusRatio * 100)}% of retirement corpus accumulated`, icon: corpusRatio >= 0.2 ? '📈' : '⚠️' });
    }

    if ((this.p.monthly_sip || 0) > 0 && neededSIP > 0) {
      if (sipAdequacy >= 0.8) {
        findings.push({ type: 'positive', text: `SIP of ₹${Math.round((this.p.monthly_sip || 0) / 1000)}K covers ${Math.round(sipAdequacy * 100)}% of retirement need`, icon: '✅' });
      } else {
        const deficit = Math.max(neededSIP - (this.p.monthly_sip || 0), 0);
        findings.push({ type: 'warning', text: `SIP shortfall: ₹${Math.round(deficit / 1000)}K/month`, icon: '⚠️' });
        recs.push({ priority: 'high', action: `Increase SIP by ₹${Math.round(deficit / 1000)}K/month`, impact: 'Bridges gap to retirement corpus' });
      }
    }

    findings.push({ type: 'neutral', text: `${yearsToRetire} years to retirement at age 60`, icon: '⏱️' });

    return {
      id: 'retirement', name: 'Retirement Readiness', emoji: '🏖️', score: totalScore,
      grade: getGrade(totalScore), color: 'orange',
      description: `${Math.round(corpusRatio * 100)}% corpus built, ${yearsToRetire} years to go`,
      sub_scores: [
        { label: 'Has Retirement Savings', score: hasSavingsPts, max: 25, description: currentRetirement > 0 ? `₹${Math.round(currentRetirement / 100000)}L` : 'Nothing saved' },
        { label: 'Corpus Progress', score: corpusPts, max: 40, description: `${Math.round(corpusRatio * 100)}% of ₹${Math.round(retirementCorpus / 10000000 * 100) / 100}Cr` },
        { label: 'SIP Active', score: sipPts, max: 15, description: (this.p.monthly_sip || 0) > 0 ? 'Yes' : 'No' },
        { label: 'SIP Adequacy', score: sipAdequacyPts, max: 20, description: `${Math.round(sipAdequacy * 100)}% of needed SIP` },
      ],
      findings, recommendations: recs,
    };
  }

  // ────────────── TAX HELPERS ──────────────

  private getMarginalRate(): number {
    const g = this.p.gross_annual_income;
    if (g > 1500000) return 0.30; if (g > 1200000) return 0.20; if (g > 900000) return 0.15; if (g > 600000) return 0.10; return 0.05;
  }

  private calcOldTax(): number {
    const g = this.p.gross_annual_income;
    const sd = 50000;
    const b = this.p.tax_basic_salary || 0;
    const hraR = this.p.tax_hra_received || 0;
    const rentA = (this.p.tax_rent_paid || 0) * 12;
    const mp = this.p.tax_is_metro_city ? 0.5 : 0.4;
    const hra = hraR > 0 && rentA > 0 ? Math.min(hraR, b * mp, Math.max(rentA - 0.1 * b, 0)) : 0;
    const c80 = Math.min(this.p.tax_80c_investments || 0, 150000);
    const pl = (this.p.dependents?.parents || 0) > 0 ? 50000 : 0;
    const d80 = Math.min(this.p.tax_80d_medical || 0, 25000 + pl);
    const nps = Math.min(this.p.tax_nps_80ccd_1b || 0, 50000);
    const hl = Math.min(this.p.tax_home_loan_interest || 0, 200000);
    const taxable = Math.max(g - sd - hra - c80 - d80 - nps - hl, 0);
    let tax = 0;
    if (taxable > 1000000) tax += (taxable - 1000000) * 0.3;
    if (taxable > 500000) tax += Math.min(taxable - 500000, 500000) * 0.2;
    if (taxable > 250000) tax += Math.min(taxable - 250000, 250000) * 0.05;
    if (taxable <= 500000) tax = 0;
    return Math.round(tax * 1.04);
  }

  private calcNewTax(): number {
    const taxable = Math.max(this.p.gross_annual_income - 75000, 0);
    const slabs = [{ l: 400000, r: 0 }, { l: 800000, r: 0.05 }, { l: 1200000, r: 0.10 }, { l: 1600000, r: 0.15 }, { l: 2000000, r: 0.20 }, { l: 2400000, r: 0.25 }, { l: Infinity, r: 0.30 }];
    let tax = 0, prev = 0;
    for (const s of slabs) { if (taxable <= prev) break; tax += (Math.min(taxable, s.l) - prev) * s.r; prev = s.l; }
    if (taxable <= 1200000) tax = 0;
    if (taxable > 1200000 && taxable <= 1275000) tax = Math.min(tax, taxable - 1200000);
    return Math.round(tax * 1.04);
  }

  private generateScoreHistory(current: number): Array<{ month: string; score: number }> {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const scoreDiff = (5 - i) * 12;
      return {
        month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        score: Math.max(Math.min(current - scoreDiff, 900), 100),
      };
    });
  }
}


// ═══════════════════════════════════════════════
// DEFAULT PROFILE (used when no user data available)
// ═══════════════════════════════════════════════

export const DEFAULT_HEALTH_PROFILE: HealthProfile = {
  dob: '1993-06-15',
  marital_status: 'married',
  dependents: { children: 1, parents: 2 },
  gross_annual_income: 1800000,
  monthly_expenses: 50000,
  emergency_fund: 300000,
  retirement_balance: 250000,
  mutual_fund_value: 800000,
  stock_value: 400000,
  savings_fd_balance: 600000,
  gold_real_estate: 500000,
  monthly_sip: 30000,
  loans: { home: { emi: 15000, tenure: 180 } },
  missed_emi: false,
  missed_emi_amount: 0,
  life_insurance_cover: 5000000,
  health_insurance_cover: 500000,
  critical_illness_cover: false,
  tax_basic_salary: 720000,
  tax_hra_received: 360000,
  tax_80c_investments: 110000,
  tax_80d_medical: 25000,
  current_tax_regime: 'new',
  tax_rent_paid: 20000,
  tax_is_metro_city: true,
  tax_home_loan_interest: 180000,
  tax_nps_80ccd_1b: 0,
  risk_profile: 'moderate',
};
