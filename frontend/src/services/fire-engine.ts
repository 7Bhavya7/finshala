// ═══════════════════════════════════════════════════════════════
// FIRE ENGINE — Client-Side (Vite + React compatible)
// Generates Lean / Regular / Fat FIRE plans from profile data
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type FIREVariant = 'lean' | 'regular' | 'fat';

export interface FireProfile {
  full_name: string;
  dob: string;
  gender: string;
  marital_status: string;
  employment_type: string;
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
  current_tax_regime: 'old' | 'new';
  tax_rent_paid: number;
  tax_is_metro_city: boolean;
  tax_home_loan_interest: number;
  tax_nps_80ccd_1b: number;

  risk_profile: 'conservative' | 'moderate' | 'aggressive';
  life_goals: LifeGoal[];

  // FIRE Variant fields (optional — defaults applied if missing)
  fire_variant_preference?: FIREVariant;
  lean_monthly_expenses?: number;
  fat_monthly_expenses?: number;
  lean_lifestyle_notes?: string;
  fat_lifestyle_notes?: string;
  lean_target_retirement_age?: number;
  regular_target_retirement_age?: number;
  fat_target_retirement_age?: number;
  lean_swr?: number;
  regular_swr?: number;
  fat_swr?: number;
}

export interface LifeGoal {
  name: string;
  amount: number;
  years: number;
  priority: 'critical' | 'important' | 'aspirational';
  inflation_rate?: number;
}

export interface VariantConfig {
  variant: FIREVariant;
  label: string;
  emoji: string;
  description: string;
  monthly_expenses: number;
  target_retirement_age: number;
  swr: number;
  expense_ratio: number;
  lifestyle_notes: string;
  color: string;
}

export interface MonthlySnapshot {
  month: number;
  date: string;
  age: number;
  net_income: number;
  total_expenses: number;
  total_emi: number;
  investable_surplus: number;
  equity_value: number;
  debt_value: number;
  gold_value: number;
  real_estate_value: number;
  emergency_fund_value: number;
  total_net_worth: number;
  fire_number: number;
  fire_progress_pct: number;
  months_to_fire: number | null;
  goal_progress: GoalSnapshot[];
  sip_allocations: SIPAllocation[];
  milestone_reached?: string;
  rebalance_needed: boolean;
}

export interface GoalSnapshot {
  goal_name: string;
  target_future_value: number;
  current_corpus: number;
  monthly_sip_needed: number;
  on_track: boolean;
  shortfall: number;
  completion_pct: number;
}

export interface SIPAllocation {
  goal_name: string;
  fund_type: string;
  amount: number;
}

export interface InsuranceGap {
  type: 'life' | 'health' | 'critical_illness';
  current_cover: number;
  recommended_cover: number;
  gap: number;
  estimated_premium: number;
  urgency: 'critical' | 'high' | 'medium';
  reason: string;
}

export interface TaxSavingMove {
  section: string;
  description: string;
  current_utilization: number;
  max_limit: number;
  potential_saving: number;
  action: string;
  regime: 'old' | 'new' | 'both';
}

export interface TaxAnalysis {
  old_regime_tax: number;
  new_regime_tax: number;
  recommended_regime: 'old' | 'new';
  annual_savings_by_switching: number;
  tax_saving_moves: TaxSavingMove[];
  effective_tax_rate: number;
}

export interface EmergencyFundPlan {
  current_fund: number;
  target_fund: number;
  gap: number;
  monthly_contribution: number;
  months_to_fill: number;
  where_to_park: string;
}

export interface Milestone {
  name: string;
  target_date: string;
  amount: number;
  type: string;
  variant?: FIREVariant;
}

export interface GlidePath {
  age: number;
  equity_pct: number;
  debt_pct: number;
  gold_pct: number;
  real_estate_pct: number;
}

export interface VariantResult {
  variant: FIREVariant;
  config: VariantConfig;
  fire_number: number;
  fire_age: number;
  years_to_fire: number;
  monthly_expenses_at_fire: number;
  annual_withdrawal_at_fire: number;
  monthly_roadmap: MonthlySnapshot[];
  milestones: Milestone[];
  emergency_fund_plan: EmergencyFundPlan;
  required_monthly_sip: number;
  savings_rate_needed: number;
  feasibility: 'achievable' | 'stretch' | 'unrealistic';
  feasibility_reason: string;
}

export interface ProfileSummary {
  current_age: number;
  life_expectancy: number;
  monthly_gross: number;
  monthly_net: number;
  monthly_expenses_regular: number;
  monthly_expenses_lean: number;
  monthly_expenses_fat: number;
  monthly_emi: number;
  current_investable_surplus: number;
  savings_rate: number;
  current_net_worth: number;
}

export interface FIREPlan {
  generated_at: string;
  profile_summary: ProfileSummary;
  preferred_variant: FIREVariant;
  variants: {
    lean: VariantResult;
    regular: VariantResult;
    fat: VariantResult;
  };
  comparison: {
    fire_numbers: { lean: number; regular: number; fat: number };
    fire_ages: { lean: number; regular: number; fat: number };
    years_to_fire: { lean: number; regular: number; fat: number };
    monthly_sip_needed: { lean: number; regular: number; fat: number };
  };
  insurance_gaps: InsuranceGap[];
  tax_analysis: TaxAnalysis;
  glide_path: GlidePath[];
  current_net_worth: number;
}


// ═══════════════════════════════════════════════════════════════
// FIRE ENGINE — THE CORE
// ═══════════════════════════════════════════════════════════════

export class FIREEngine {
  private profile: FireProfile;

  private assumptions = {
    inflation: 0.06,
    equity_return: 0.12,
    debt_return: 0.07,
    gold_return: 0.08,
    real_estate_return: 0.09,
    salary_growth: 0.08,
    expense_growth: 0.06,
    life_expectancy: 85,
  };

  constructor(profile: FireProfile) {
    this.profile = { ...profile };

    // Auto-fill lean/fat if user didn't set them
    if (!this.profile.lean_monthly_expenses || this.profile.lean_monthly_expenses === 0) {
      this.profile.lean_monthly_expenses = Math.round(this.profile.monthly_expenses * 0.6);
    }
    if (!this.profile.fat_monthly_expenses || this.profile.fat_monthly_expenses === 0) {
      this.profile.fat_monthly_expenses = Math.round(this.profile.monthly_expenses * 1.5);
    }
  }

  // ────────────── ASYNC ENTRY (Python Backend with TS Fallback) ──────────────

  public async generatePlanAsync(): Promise<FIREPlan> {
    try {
      console.log("[FIRE Engine] Attempting to call Python backend at /api/calculate-fire-plan");
      const response = await fetch('/api/calculate-fire-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.profile),
      });

      if (!response.ok) {
        throw new Error(`Python API failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("[FIRE Engine] Successfully received FIRE plan from Python API.");
      return data as FIREPlan;
    } catch (error) {
      console.warn("[FIRE Engine] Python API failed or is unavailable. Falling back to local TypeScript engine.", error);
      return this.generatePlan();
    }
  }

  // ────────────── LOCAL ENTRY ──────────────

  public generatePlan(): FIREPlan {
    const summary = this.buildProfileSummary();
    const glidePath = this.buildGlidePath(summary.current_age);
    const taxAnalysis = this.analyzeTaxes();
    const insuranceGaps = this.analyzeInsuranceGaps(summary);

    const variantConfigs = this.buildVariantConfigs();

    const leanResult = this.simulateVariant(variantConfigs.lean, summary, glidePath);
    const regularResult = this.simulateVariant(variantConfigs.regular, summary, glidePath);
    const fatResult = this.simulateVariant(variantConfigs.fat, summary, glidePath);

    return {
      generated_at: new Date().toISOString(),
      profile_summary: summary,
      preferred_variant: this.profile.fire_variant_preference || 'regular',
      variants: { lean: leanResult, regular: regularResult, fat: fatResult },
      comparison: {
        fire_numbers: { lean: leanResult.fire_number, regular: regularResult.fire_number, fat: fatResult.fire_number },
        fire_ages: { lean: leanResult.fire_age, regular: regularResult.fire_age, fat: fatResult.fire_age },
        years_to_fire: { lean: leanResult.years_to_fire, regular: regularResult.years_to_fire, fat: fatResult.years_to_fire },
        monthly_sip_needed: { lean: leanResult.required_monthly_sip, regular: regularResult.required_monthly_sip, fat: fatResult.required_monthly_sip },
      },
      insurance_gaps: insuranceGaps,
      tax_analysis: taxAnalysis,
      glide_path: glidePath,
      current_net_worth: summary.current_net_worth,
    };
  }

  // ────────────── VARIANT CONFIGS ──────────────

  private buildVariantConfigs(): Record<FIREVariant, VariantConfig> {
    const regular = this.profile.monthly_expenses;
    return {
      lean: {
        variant: 'lean', label: 'Lean FIRE', emoji: '🌿',
        description: 'Minimalist lifestyle — cover only essentials',
        monthly_expenses: this.profile.lean_monthly_expenses!,
        target_retirement_age: this.profile.lean_target_retirement_age || 40,
        swr: this.profile.lean_swr || 0.04,
        expense_ratio: this.profile.lean_monthly_expenses! / regular,
        lifestyle_notes: this.profile.lean_lifestyle_notes || 'No dining out, no vacations, basic transport, no subscriptions, cook at home',
        color: 'emerald',
      },
      regular: {
        variant: 'regular', label: 'Regular FIRE', emoji: '🔥',
        description: 'Maintain current lifestyle without working',
        monthly_expenses: regular,
        target_retirement_age: this.profile.regular_target_retirement_age || 45,
        swr: this.profile.regular_swr || 0.035,
        expense_ratio: 1.0,
        lifestyle_notes: 'Current lifestyle maintained — same house, same habits, same city',
        color: 'orange',
      },
      fat: {
        variant: 'fat', label: 'Fat FIRE', emoji: '👑',
        description: 'Premium lifestyle with luxuries built in',
        monthly_expenses: this.profile.fat_monthly_expenses!,
        target_retirement_age: this.profile.fat_target_retirement_age || 50,
        swr: this.profile.fat_swr || 0.03,
        expense_ratio: this.profile.fat_monthly_expenses! / regular,
        lifestyle_notes: this.profile.fat_lifestyle_notes || 'Premium housing, international travel 2x/year, fine dining, club memberships, luxury car',
        color: 'amber',
      },
    };
  }

  // ────────────── PROFILE SUMMARY ──────────────

  private buildProfileSummary(): ProfileSummary {
    const currentAge = this.getAge();
    const monthlyGross = this.profile.gross_annual_income / 12;
    const monthlyTax = this.getMonthlyTax();
    const monthlyNet = monthlyGross - monthlyTax;
    const totalEMI = this.getTotalEMI();
    const surplus = Math.max(monthlyNet - this.profile.monthly_expenses - totalEMI, 0);
    const savingsRate = monthlyNet > 0 ? (surplus / monthlyNet) * 100 : 0;

    return {
      current_age: currentAge,
      life_expectancy: this.assumptions.life_expectancy,
      monthly_gross: monthlyGross,
      monthly_net: monthlyNet,
      monthly_expenses_regular: this.profile.monthly_expenses,
      monthly_expenses_lean: this.profile.lean_monthly_expenses!,
      monthly_expenses_fat: this.profile.fat_monthly_expenses!,
      monthly_emi: totalEMI,
      current_investable_surplus: surplus,
      savings_rate: Math.round(savingsRate * 100) / 100,
      current_net_worth: this.calculateNetWorth(),
    };
  }

  private getAge(): number {
    const today = new Date();
    const dob = new Date(this.profile.dob);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return Math.max(age, 18);
  }

  private getTotalEMI(): number {
    if (!this.profile.loans) return 0;
    return Object.values(this.profile.loans).reduce((s, l) => s + (l?.emi || 0), 0);
  }

  private calculateNetWorth(): number {
    const assets =
      (this.profile.emergency_fund || 0) +
      (this.profile.retirement_balance || 0) +
      (this.profile.mutual_fund_value || 0) +
      (this.profile.stock_value || 0) +
      (this.profile.savings_fd_balance || 0) +
      (this.profile.gold_real_estate || 0);

    const liabilities = this.profile.loans
      ? Object.values(this.profile.loans).reduce((s, l) => s + (l?.emi || 0) * (l?.tenure || 0), 0)
      : 0;
    return assets - liabilities;
  }

  // ────────────── FIRE NUMBER PER VARIANT ──────────────

  private calculateFIRENumber(config: VariantConfig, currentAge: number): number {
    const yearsToRetire = Math.max(config.target_retirement_age - currentAge, 1);
    const futureAnnualExpenses = config.monthly_expenses * 12 * Math.pow(1 + this.assumptions.inflation, yearsToRetire);
    return Math.round(futureAnnualExpenses / config.swr);
  }

  // ────────────── EMERGENCY FUND PER VARIANT ──────────────

  private calculateEmergencyFund(config: VariantConfig): EmergencyFundPlan {
    const months = (this.profile.dependents?.children || 0) > 0 ? 9 : 6;
    const emi = this.getTotalEMI();
    const target = (config.monthly_expenses + emi) * months;
    const gap = Math.max(target - (this.profile.emergency_fund || 0), 0);
    const monthlyContrib = gap > 0 ? Math.ceil(gap / 12) : 0;

    return {
      current_fund: this.profile.emergency_fund || 0,
      target_fund: target,
      gap,
      monthly_contribution: monthlyContrib,
      months_to_fill: monthlyContrib > 0 ? Math.ceil(gap / monthlyContrib) : 0,
      where_to_park: '50% Liquid Fund (instant redemption) + 30% Short Duration Debt + 20% Sweep FD',
    };
  }

  // ────────────── THE VARIANT SIMULATOR ──────────────

  private simulateVariant(
    config: VariantConfig,
    summary: ProfileSummary,
    glidePath: GlidePath[],
  ): VariantResult {
    const fireNumber = this.calculateFIRENumber(config, summary.current_age);
    const emergencyPlan = this.calculateEmergencyFund(config);
    const today = new Date();

    const maxMonths = (this.assumptions.life_expectancy - summary.current_age) * 12;

    let equity = (this.profile.mutual_fund_value || 0) + (this.profile.stock_value || 0);
    let debt = (this.profile.savings_fd_balance || 0) + (this.profile.retirement_balance || 0);
    let gold = (this.profile.gold_real_estate || 0) * 0.4;
    let realEstate = (this.profile.gold_real_estate || 0) * 0.6;
    let emergencyFund = this.profile.emergency_fund || 0;
    let emergencyComplete = emergencyFund >= emergencyPlan.target_fund;

    let monthlyIncome = summary.monthly_net;
    let monthlyExpenses = config.monthly_expenses;
    const activeLoans = JSON.parse(JSON.stringify(this.profile.loans || {}));

    const goalCorpuses: Record<string, number> = {};
    (this.profile.life_goals || []).forEach((g) => (goalCorpuses[g.name] = 0));

    const roadmap: MonthlySnapshot[] = [];
    const milestones: Milestone[] = [];
    let fireReached = false;
    let coastReached = false;
    let halfwayReached = false;
    let quarterReached = false;
    let debtFreeReached = false;

    const mEq = Math.pow(1 + this.assumptions.equity_return, 1 / 12) - 1;
    const mDt = Math.pow(1 + this.assumptions.debt_return, 1 / 12) - 1;
    const mGd = Math.pow(1 + this.assumptions.gold_return, 1 / 12) - 1;
    const mRE = Math.pow(1 + this.assumptions.real_estate_return, 1 / 12) - 1;

    // Only keep yearly snapshots (every 12 months) to limit size
    for (let month = 1; month <= maxMonths; month++) {
      const date = new Date(today.getFullYear(), today.getMonth() + month, 1);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const age = summary.current_age + Math.floor(month / 12);

      if (month % 12 === 0) {
        monthlyIncome *= 1 + this.assumptions.salary_growth;
        monthlyExpenses *= 1 + this.assumptions.expense_growth;
      }

      let totalEMI = 0;
      for (const [key, loan] of Object.entries(activeLoans) as [string, { emi: number; tenure: number }][]) {
        if (loan && loan.tenure > 0) {
          totalEMI += loan.emi;
          (activeLoans as any)[key] = { ...loan, tenure: loan.tenure - 1 };
        }
      }

      if (!debtFreeReached && totalEMI === 0 && summary.monthly_emi > 0 && month > 1) {
        debtFreeReached = true;
        milestones.push({ name: '🎉 Debt Free!', target_date: dateStr, amount: 0, type: 'debt_free', variant: config.variant });
      }

      const surplus = Math.max(monthlyIncome - monthlyExpenses - totalEMI, 0);

      let investable = surplus;
      if (!emergencyComplete) {
        const contrib = Math.min(emergencyPlan.monthly_contribution, investable, emergencyPlan.target_fund - emergencyFund);
        emergencyFund += contrib;
        investable -= contrib;
        if (emergencyFund >= emergencyPlan.target_fund) {
          emergencyComplete = true;
          milestones.push({ name: '🛡️ Emergency Fund Complete', target_date: dateStr, amount: emergencyPlan.target_fund, type: 'emergency_fund', variant: config.variant });
        }
      }

      const alloc = this.getAllocationForAge(glidePath, age);

      const eqSIP = investable * (alloc.equity_pct / 100);
      const dtSIP = investable * (alloc.debt_pct / 100);
      const gdSIP = investable * (alloc.gold_pct / 100);

      equity = equity * (1 + mEq) + eqSIP;
      debt = debt * (1 + mDt) + dtSIP;
      gold = gold * (1 + mGd) + gdSIP;
      realEstate = realEstate * (1 + mRE);

      const totalNW = equity + debt + gold + realEstate + emergencyFund;
      const fireProgress = (totalNW / fireNumber) * 100;

      // Goal tracking
      const goalSnapshots = (this.profile.life_goals || []).map((goal) => {
        const fv = goal.amount * Math.pow(1 + (goal.inflation_rate || this.assumptions.inflation), goal.years);
        const mLeft = Math.max(goal.years * 12 - month, 1);
        goalCorpuses[goal.name] = (goalCorpuses[goal.name] || 0) * (1 + mEq) + (investable * 0.1);
        const pct = Math.min((goalCorpuses[goal.name] / fv) * 100, 100);
        const shortfall = Math.max(fv - goalCorpuses[goal.name], 0);
        const sipNeeded = mLeft > 0 && mEq > 0 ? (shortfall * mEq) / (Math.pow(1 + mEq, mLeft) - 1) : shortfall;
        return {
          goal_name: goal.name, target_future_value: Math.round(fv), current_corpus: Math.round(goalCorpuses[goal.name]),
          monthly_sip_needed: Math.round(sipNeeded), on_track: pct >= (month / (goal.years * 12)) * 100,
          shortfall: Math.round(shortfall), completion_pct: Math.round(pct * 100) / 100,
        };
      });

      // SIP breakdown
      const sipAllocations = this.buildSIPAllocations(investable, alloc, age);

      // Rebalance check
      const total = equity + debt + gold + realEstate;
      const actualEqPct = total > 0 ? (equity / total) * 100 : 0;
      const rebalanceNeeded = Math.abs(actualEqPct - alloc.equity_pct) > 5;

      // Milestones
      let milestone: string | undefined;

      if (!quarterReached && fireProgress >= 25) {
        quarterReached = true;
        milestone = `📈 25% to ${config.label}`;
        milestones.push({ name: milestone, target_date: dateStr, amount: Math.round(totalNW), type: 'quarter', variant: config.variant });
      }

      if (!halfwayReached && fireProgress >= 50) {
        halfwayReached = true;
        milestone = `🎯 50% to ${config.label} — Halfway!`;
        milestones.push({ name: milestone, target_date: dateStr, amount: Math.round(totalNW), type: 'halfway', variant: config.variant });
      }

      const yearsTo60 = Math.max(60 - age, 0);
      const coastFV = totalNW * Math.pow(1 + this.assumptions.equity_return * 0.7, yearsTo60);
      if (!coastReached && coastFV >= fireNumber && yearsTo60 > 0) {
        coastReached = true;
        milestone = `⛵ Coast ${config.label}`;
        milestones.push({ name: `⛵ Coast ${config.label} — Can stop saving, still retire at 60`, target_date: dateStr, amount: Math.round(totalNW), type: 'coast_fire', variant: config.variant });
      }

      if (!fireReached && fireProgress >= 100) {
        fireReached = true;
        milestone = `${config.emoji} ${config.label} Achieved!`;
        milestones.push({ name: `${config.emoji} ${config.label} Achieved!`, target_date: dateStr, amount: Math.round(totalNW), type: 'fire', variant: config.variant });
      }

      // Only store yearly snapshots (month % 12 === 0) or the first month
      if (month === 1 || month % 12 === 0) {
        roadmap.push({
          month, date: dateStr, age, net_income: Math.round(monthlyIncome),
          total_expenses: Math.round(monthlyExpenses), total_emi: Math.round(totalEMI),
          investable_surplus: Math.round(surplus), equity_value: Math.round(equity),
          debt_value: Math.round(debt), gold_value: Math.round(gold),
          real_estate_value: Math.round(realEstate), emergency_fund_value: Math.round(emergencyFund),
          total_net_worth: Math.round(totalNW), fire_number: fireNumber,
          fire_progress_pct: Math.round(fireProgress * 100) / 100,
          months_to_fire: !fireReached ? this.estimateMonthsToFire(totalNW, surplus, fireNumber, alloc) : 0,
          goal_progress: goalSnapshots, sip_allocations: sipAllocations,
          milestone_reached: milestone, rebalance_needed: rebalanceNeeded,
        });
      }

      // Stop 10 years after FIRE achieved
      if (fireReached) {
        const fireMonth = milestones.find((m) => m.type === 'fire');
        if (fireMonth) {
          const fireDate = new Date(fireMonth.target_date);
          const monthsSinceFire = (date.getFullYear() - fireDate.getFullYear()) * 12 + (date.getMonth() - fireDate.getMonth());
          if (monthsSinceFire > 120) break;
        }
      }
    }

    const requiredSIP = this.calculateRequiredSIP(summary.current_net_worth, fireNumber, config.target_retirement_age - summary.current_age);
    const savingsRateNeeded = summary.monthly_net > 0 ? (requiredSIP / summary.monthly_net) * 100 : 0;
    const feasibility = this.assessFeasibility(requiredSIP, summary.current_investable_surplus, config.target_retirement_age - summary.current_age);

    const fireMonth = roadmap.find((m) => m.fire_progress_pct >= 100);
    const fireAge = fireMonth ? summary.current_age + Math.floor(fireMonth.month / 12) : summary.current_age + Math.floor(roadmap.length / 12);
    const yearsToFire = fireAge - summary.current_age;
    const monthlyExpAtFire = config.monthly_expenses * Math.pow(1 + this.assumptions.expense_growth, yearsToFire);

    return {
      variant: config.variant, config, fire_number: fireNumber, fire_age: fireAge,
      years_to_fire: yearsToFire, monthly_expenses_at_fire: Math.round(monthlyExpAtFire),
      annual_withdrawal_at_fire: Math.round(monthlyExpAtFire * 12),
      monthly_roadmap: roadmap,
      milestones: milestones.sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()),
      emergency_fund_plan: emergencyPlan, required_monthly_sip: Math.round(requiredSIP),
      savings_rate_needed: Math.round(savingsRateNeeded * 100) / 100,
      feasibility: feasibility.status, feasibility_reason: feasibility.reason,
    };
  }

  // ────────────── REQUIRED SIP TO HIT FIRE ──────────────

  private calculateRequiredSIP(currentNW: number, fireNumber: number, years: number): number {
    if (currentNW >= fireNumber) return 0;
    const months = Math.max(years * 12, 1);
    const avgReturn = 0.65 * this.assumptions.equity_return + 0.25 * this.assumptions.debt_return + 0.10 * this.assumptions.gold_return;
    const r = Math.pow(1 + avgReturn, 1 / 12) - 1;
    const fvCurrent = currentNW * Math.pow(1 + r, months);
    const remaining = Math.max(fireNumber - fvCurrent, 0);
    if (remaining <= 0) return 0;
    const sip = (remaining * r) / (Math.pow(1 + r, months) - 1);
    return Math.max(Math.round(sip), 0);
  }

  // ────────────── FEASIBILITY CHECK ──────────────

  private assessFeasibility(requiredSIP: number, currentSurplus: number, years: number): { status: 'achievable' | 'stretch' | 'unrealistic'; reason: string } {
    if (years <= 0) return { status: 'unrealistic', reason: 'Target retirement age already passed' };
    const ratio = currentSurplus > 0 ? requiredSIP / currentSurplus : Infinity;
    if (ratio <= 0.8) return { status: 'achievable', reason: `Needs ${Math.round(ratio * 100)}% of your current surplus. Comfortable with room to spare.` };
    if (ratio <= 1.2) return { status: 'stretch', reason: `Needs ${Math.round(ratio * 100)}% of your surplus. Tight but doable.` };
    return { status: 'unrealistic', reason: `Needs ${Math.round(ratio * 100)}% of your surplus — ${Math.round(ratio)}x what you currently save.` };
  }

  // ────────────── GLIDE PATH ──────────────

  private buildGlidePath(currentAge: number): GlidePath[] {
    const path: GlidePath[] = [];
    const riskMul = this.profile.risk_profile === 'aggressive' ? 1.1 : this.profile.risk_profile === 'conservative' ? 0.85 : 1.0;
    for (let age = currentAge; age <= this.assumptions.life_expectancy; age += 5) {
      let eq = Math.max(100 - age, 20);
      eq = Math.min(Math.round(eq * riskMul), 85);
      const gd = age >= 50 ? 15 : 10;
      const re = age >= 40 ? 5 : 0;
      const dt = Math.max(100 - eq - gd - re, 5);
      path.push({ age, equity_pct: eq, debt_pct: dt, gold_pct: gd, real_estate_pct: re });
    }
    return path;
  }

  private getAllocationForAge(glidePath: GlidePath[], age: number): GlidePath {
    // Find the closest age bracket
    let closest = glidePath[0];
    for (const g of glidePath) {
      if (g.age <= age) closest = g;
    }
    return closest;
  }

  // ────────────── SIP ALLOCATIONS ──────────────

  private buildSIPAllocations(total: number, alloc: GlidePath, age: number): SIPAllocation[] {
    const sips: SIPAllocation[] = [];
    const eqTotal = total * (alloc.equity_pct / 100);
    const dtTotal = total * (alloc.debt_pct / 100);
    const gdTotal = total * (alloc.gold_pct / 100);

    if (eqTotal > 0) {
      if (age < 35) {
        sips.push({ goal_name: 'Core', fund_type: 'flexi_cap', amount: Math.round(eqTotal * 0.35) });
        sips.push({ goal_name: 'Growth', fund_type: 'mid_cap', amount: Math.round(eqTotal * 0.30) });
        sips.push({ goal_name: 'Growth', fund_type: 'small_cap', amount: Math.round(eqTotal * 0.20) });
        sips.push({ goal_name: 'Tax', fund_type: 'elss', amount: Math.round(eqTotal * 0.15) });
      } else if (age < 50) {
        sips.push({ goal_name: 'Core', fund_type: 'large_cap', amount: Math.round(eqTotal * 0.40) });
        sips.push({ goal_name: 'Core', fund_type: 'flexi_cap', amount: Math.round(eqTotal * 0.30) });
        sips.push({ goal_name: 'Growth', fund_type: 'mid_cap', amount: Math.round(eqTotal * 0.20) });
        sips.push({ goal_name: 'Tax', fund_type: 'elss', amount: Math.round(eqTotal * 0.10) });
      } else {
        sips.push({ goal_name: 'Core', fund_type: 'large_cap', amount: Math.round(eqTotal * 0.60) });
        sips.push({ goal_name: 'Core', fund_type: 'flexi_cap', amount: Math.round(eqTotal * 0.30) });
        sips.push({ goal_name: 'Growth', fund_type: 'mid_cap', amount: Math.round(eqTotal * 0.10) });
      }
    }
    if (dtTotal > 0) {
      sips.push({ goal_name: 'Stability', fund_type: 'debt', amount: Math.round(dtTotal * 0.6) });
      sips.push({ goal_name: 'Liquidity', fund_type: 'liquid', amount: Math.round(dtTotal * 0.4) });
    }
    if (gdTotal > 0) {
      sips.push({ goal_name: 'Hedge', fund_type: 'gold_etf', amount: Math.round(gdTotal) });
    }
    return sips.filter((s) => s.amount > 0);
  }

  private estimateMonthsToFire(nw: number, sip: number, fireNum: number, alloc: GlidePath): number | null {
    if (nw >= fireNum) return 0;
    if (sip <= 0) return null;
    const avg = (alloc.equity_pct / 100) * this.assumptions.equity_return + (alloc.debt_pct / 100) * this.assumptions.debt_return + (alloc.gold_pct / 100) * this.assumptions.gold_return;
    const r = Math.pow(1 + avg, 1 / 12) - 1;
    let fv = nw;
    let n = 0;
    while (fv < fireNum && n < 1200) { fv = fv * (1 + r) + sip; n++; }
    return n < 1200 ? n : null;
  }

  // ────────────── TAX ENGINE ──────────────

  private analyzeTaxes(): TaxAnalysis {
    const oldTax = this.calcOldRegimeTax();
    const newTax = this.calcNewRegimeTax();
    const rec = oldTax <= newTax ? 'old' : 'new';
    return {
      old_regime_tax: oldTax, new_regime_tax: newTax,
      recommended_regime: rec as 'old' | 'new',
      annual_savings_by_switching: this.profile.current_tax_regime !== rec ? Math.abs(oldTax - newTax) : 0,
      tax_saving_moves: this.findTaxMoves(oldTax, newTax),
      effective_tax_rate: this.profile.gross_annual_income > 0 ? Math.round((Math.min(oldTax, newTax) / this.profile.gross_annual_income) * 10000) / 100 : 0,
    };
  }

  private getMonthlyTax(): number { return Math.min(this.calcOldRegimeTax(), this.calcNewRegimeTax()) / 12; }

  private calcOldRegimeTax(): number {
    const g = this.profile.gross_annual_income;
    const sd = 50000;
    const basic = this.profile.tax_basic_salary || 0;
    const hraRecv = this.profile.tax_hra_received || 0;
    const rentAnn = (this.profile.tax_rent_paid || 0) * 12;
    const mp = this.profile.tax_is_metro_city ? 0.5 : 0.4;
    const hra = hraRecv > 0 && rentAnn > 0 ? Math.min(hraRecv, basic * mp, Math.max(rentAnn - 0.1 * basic, 0)) : 0;
    const s80c = Math.min(this.profile.tax_80c_investments || 0, 150000);
    const pLim = (this.profile.dependents?.parents || 0) > 0 ? 50000 : 0;
    const s80d = Math.min(this.profile.tax_80d_medical || 0, 25000 + pLim);
    const s80ccd = Math.min(this.profile.tax_nps_80ccd_1b || 0, 50000);
    const s24b = Math.min(this.profile.tax_home_loan_interest || 0, 200000);
    const taxable = Math.max(g - sd - hra - s80c - s80d - s80ccd - s24b, 0);
    let tax = 0;
    if (taxable > 1000000) tax += (taxable - 1000000) * 0.3;
    if (taxable > 500000) tax += Math.min(taxable - 500000, 500000) * 0.2;
    if (taxable > 250000) tax += Math.min(taxable - 250000, 250000) * 0.05;
    if (taxable <= 500000) tax = 0;
    tax *= 1.04;
    return Math.round(tax);
  }

  private calcNewRegimeTax(): number {
    const taxable = Math.max(this.profile.gross_annual_income - 75000, 0);
    const slabs = [{ limit: 400000, rate: 0 }, { limit: 800000, rate: 0.05 }, { limit: 1200000, rate: 0.1 }, { limit: 1600000, rate: 0.15 }, { limit: 2000000, rate: 0.2 }, { limit: 2400000, rate: 0.25 }, { limit: Infinity, rate: 0.3 }];
    let tax = 0, prev = 0;
    for (const s of slabs) { if (taxable <= prev) break; tax += (Math.min(taxable, s.limit) - prev) * s.rate; prev = s.limit; }
    if (taxable <= 1200000) tax = 0;
    if (taxable > 1200000 && taxable <= 1275000) tax = Math.min(tax, taxable - 1200000);
    tax *= 1.04;
    return Math.round(tax);
  }

  private getMarginalRate(): number {
    const g = this.profile.gross_annual_income;
    if (g > 1500000) return 0.3; if (g > 1200000) return 0.2; if (g > 900000) return 0.15; if (g > 600000) return 0.1; return 0.05;
  }

  private findTaxMoves(oldTax: number, newTax: number): TaxSavingMove[] {
    const moves: TaxSavingMove[] = [];
    const rate = this.getMarginalRate();
    if ((this.profile.tax_80c_investments || 0) < 150000) {
      const gap = 150000 - (this.profile.tax_80c_investments || 0);
      moves.push({ section: '80C', description: 'ELSS, PPF, EPF, Life Insurance, Tuition Fees', current_utilization: this.profile.tax_80c_investments || 0, max_limit: 150000, potential_saving: Math.round(gap * rate), action: `Invest ₹${Math.round(gap / 1000)}K more in ELSS`, regime: 'old' });
    }
    if ((this.profile.tax_nps_80ccd_1b || 0) < 50000) {
      const gap = 50000 - (this.profile.tax_nps_80ccd_1b || 0);
      moves.push({ section: '80CCD(1B)', description: 'Additional NPS Contribution', current_utilization: this.profile.tax_nps_80ccd_1b || 0, max_limit: 50000, potential_saving: Math.round(gap * rate), action: `₹${Math.round(gap / 1000)}K in NPS — extra deduction above 80C`, regime: 'old' });
    }
    const dMax = 25000 + ((this.profile.dependents?.parents || 0) > 0 ? 50000 : 0);
    if ((this.profile.tax_80d_medical || 0) < dMax) {
      const gap = dMax - (this.profile.tax_80d_medical || 0);
      moves.push({ section: '80D', description: 'Health Insurance Premiums', current_utilization: this.profile.tax_80d_medical || 0, max_limit: dMax, potential_saving: Math.round(gap * rate), action: `Increase health cover — ₹${Math.round(gap / 1000)}K gap`, regime: 'old' });
    }
    if (oldTax !== newTax) {
      const better = oldTax < newTax ? 'old' : 'new';
      if (this.profile.current_tax_regime !== better) {
        moves.push({ section: 'Regime Switch', description: `Switch to ${better.toUpperCase()} regime`, current_utilization: 0, max_limit: 0, potential_saving: Math.abs(oldTax - newTax), action: `Save ₹${Math.round(Math.abs(oldTax - newTax) / 1000)}K/year by switching`, regime: 'both' });
      }
    }
    return moves;
  }

  // ────────────── INSURANCE GAPS ──────────────

  private analyzeInsuranceGaps(summary: ProfileSummary): InsuranceGap[] {
    const gaps: InsuranceGap[] = [];
    const income = this.profile.gross_annual_income;
    const deps = (this.profile.dependents?.children || 0) + (this.profile.dependents?.parents || 0);
    const totalLoans = this.profile.loans ? Object.values(this.profile.loans).reduce((s, l) => s + (l?.emi || 0) * (l?.tenure || 0), 0) : 0;

    const lifeMul = deps > 2 ? 15 : deps > 0 ? 12 : 10;
    const recLife = income * lifeMul + totalLoans;
    const lifeGap = Math.max(recLife - (this.profile.life_insurance_cover || 0), 0);
    if (lifeGap > 0) {
      gaps.push({ type: 'life', current_cover: this.profile.life_insurance_cover || 0, recommended_cover: recLife, gap: lifeGap, estimated_premium: Math.round(lifeGap * 0.003), urgency: lifeGap > income * 5 ? 'critical' : 'high', reason: `Need ${lifeMul}x income + loan cover. Gap: ₹${(lifeGap / 100000).toFixed(0)}L` });
    }

    const baseH = this.profile.tax_is_metro_city ? 1500000 : 1000000;
    const fMul = 1 + (this.profile.dependents?.children || 0) * 0.3 + (this.profile.dependents?.parents || 0) * 0.5 + (this.profile.marital_status === 'married' ? 0.5 : 0);
    const recH = baseH * fMul;
    const hGap = Math.max(recH - (this.profile.health_insurance_cover || 0), 0);
    if (hGap > 0) {
      gaps.push({ type: 'health', current_cover: this.profile.health_insurance_cover || 0, recommended_cover: recH, gap: hGap, estimated_premium: Math.round(recH * 0.015), urgency: (this.profile.health_insurance_cover || 0) === 0 ? 'critical' : 'high', reason: `Recommended ₹${(recH / 100000).toFixed(0)}L for family` });
    }

    if (!this.profile.critical_illness_cover && summary.current_age >= 30) {
      const ci = income * 3;
      gaps.push({ type: 'critical_illness', current_cover: 0, recommended_cover: ci, gap: ci, estimated_premium: Math.round(ci * 0.008), urgency: summary.current_age >= 40 ? 'critical' : 'medium', reason: `No CI cover. Need ₹${(ci / 100000).toFixed(0)}L lump-sum on diagnosis` });
    }

    return gaps;
  }
}


// ═══════════════════════════════════════════════════════════════
// DEFAULT PROFILE (used when no user data available)
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_FIRE_PROFILE: FireProfile = {
  full_name: 'Rahul Sharma',
  dob: '1993-06-15',
  gender: 'male',
  marital_status: 'married',
  employment_type: 'salaried',
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
  loans: {
    home: { emi: 15000, tenure: 180 },
  },
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
  life_goals: [
    { name: 'Child Education', amount: 5000000, years: 15, priority: 'critical' },
    { name: 'Dream Home', amount: 8000000, years: 10, priority: 'important' },
  ],
};
