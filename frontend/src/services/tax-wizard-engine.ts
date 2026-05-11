// ═══════════════════════════════════════════════
// TAX WIZARD ENGINE — Client-Side (Vite + React)
// Runs entirely in the browser — no server needed
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

export interface TaxSlab {
  from: number;
  to: number;
  rate: number;
  label: string;
}

export interface SlabBreakdown {
  slab: string;
  taxable_in_slab: number;
  rate: number;
  tax: number;
}

export interface DeductionItem {
  section: string;
  amount: number;
  max: number;
  description: string;
}

export interface RegimeResult {
  regime: 'old' | 'new';
  label: string;
  gross_income: number;
  total_deductions: number;
  deduction_breakdown: DeductionItem[];
  taxable_income: number;
  slab_breakdown: SlabBreakdown[];
  base_tax: number;
  rebate_87a: number;
  surcharge: number;
  cess: number;
  total_tax: number;
  effective_rate: number;
  monthly_tax: number;
}

export interface MissedDeduction {
  section: string;
  name: string;
  currently_claimed: number;
  max_limit: number;
  gap: number;
  potential_tax_saving: number;
  eligible_regime: 'old' | 'both';
  risk_level: 'none' | 'low' | 'medium' | 'high';
  liquidity: string;
  suggestions: string[];
  priority_score: number;
}

export interface InvestmentRecommendation {
  rank: number;
  instrument: string;
  section: string;
  max_amount: number;
  recommended_amount: number;
  expected_return: string;
  lock_in: string;
  risk: 'low' | 'medium' | 'high';
  liquidity: string;
  tax_saving: number;
  description: string;
  why: string;
}

export interface MonthlyBreakdown {
  month: string;
  gross_salary: number;
  deductions: number;
  tds: number;
  net_in_hand: number;
}

export interface TaxWizardResult {
  generated_at: string;
  financial_year: string;
  source: 'form16' | 'manual';
  parse_confidence: number;

  old_regime: RegimeResult;
  new_regime: RegimeResult;
  recommended_regime: 'old' | 'new';
  annual_savings: number;
  is_currently_optimal: boolean;

  missed_deductions: MissedDeduction[];
  total_potential_saving: number;

  investment_recommendations: InvestmentRecommendation[];

  salary_structure: {
    basic: number;
    hra: number;
    special_allowance: number;
    lta: number;
    gross: number;
    epf_employee: number;
  };

  monthly_breakdown: MonthlyBreakdown[];

  summary: {
    current_tax_paid: number;
    optimal_tax: number;
    over_payment: number;
    effective_current_rate: number;
    effective_optimal_rate: number;
    employer_name: string;
    employee_name: string;
    pan: string;
  };
}

export interface ParsedForm16 {
  financial_year: string;
  assessment_year: string;
  employer_name: string;
  employer_tan: string;
  employee_name: string;
  employee_pan: string;
  parse_confidence: number;
  total_tds_deposited: number;
  quarter_wise_tds: Array<{ quarter: string; tds: number }>;
  salary: {
    basic_salary: number;
    hra_received: number;
    special_allowance: number;
    lta: number;
    other_allowances: number;
    gross_salary: number;
    perquisites: number;
    profits_in_lieu: number;
    total_gross: number;
  };
  exemptions: {
    hra_exemption: number;
    lta_exemption: number;
    standard_deduction: number;
    professional_tax: number;
    other_exemptions: number;
    total_exemptions: number;
  };
  other_income: { house_property: number; other_sources: number };
  gross_total_income: number;
  deductions: {
    sec_80c: number;
    sec_80ccc: number;
    sec_80ccd_1: number;
    sec_80ccd_1b: number;
    sec_80ccd_2: number;
    total_80c_group: number;
    sec_80d: number;
    sec_80e: number;
    sec_80g: number;
    sec_80tta: number;
    sec_80u: number;
    sec_24b: number;
    other_deductions: number;
    total_deductions: number;
  };
  tax_computation: {
    total_taxable_income: number;
    tax_on_income: number;
    surcharge: number;
    cess: number;
    total_tax: number;
    relief_89: number;
    net_tax: number;
    tds_deducted: number;
    balance_tax: number;
    regime_used: 'old' | 'new';
  };
  raw_text_preview: string;
}

// ═══════════════════════════════════════════════
// PROFILE INPUT (from onboarding / Supabase)
// ═══════════════════════════════════════════════

export interface TaxProfile {
  full_name: string;
  gross_annual_income: number;
  current_tax_regime: 'old' | 'new';
  tax_basic_salary?: number;
  tax_hra_received?: number;
  tax_rent_paid?: number;
  tax_is_metro_city?: boolean;
  tax_80c_investments: number;
  tax_80d_medical: number;
  tax_nps_80ccd_1b: number;
  tax_home_loan_interest: number;
  risk_profile?: 'conservative' | 'moderate' | 'aggressive';
  dependents?: { parents?: number; children?: number };
}


// ═══════════════════════════════════════════════
// TAX WIZARD ENGINE
// ═══════════════════════════════════════════════

export class TaxWizardEngine {
  private form16: ParsedForm16;
  private profile: TaxProfile;

  constructor(form16: ParsedForm16, profile: TaxProfile) {
    this.form16 = form16;
    this.profile = profile;
  }

  public analyze(): TaxWizardResult {
    const gross = this.form16.salary.total_gross || this.profile.gross_annual_income;

    const oldRegime = this.calculateOldRegime(gross);
    const newRegime = this.calculateNewRegime(gross);

    const recommended = oldRegime.total_tax <= newRegime.total_tax ? 'old' : 'new';
    const savings = Math.abs(oldRegime.total_tax - newRegime.total_tax);
    const currentRegime = this.form16.tax_computation.regime_used || this.profile.current_tax_regime;

    const missedDeductions = this.findMissedDeductions(gross);
    const investments = this.buildInvestmentRecs(missedDeductions, gross);
    const monthlyBreakdown = this.buildMonthlyBreakdown(gross, Math.min(oldRegime.total_tax, newRegime.total_tax));

    const currentTax = this.form16.tax_computation.net_tax || this.form16.tax_computation.tds_deducted;
    const optimalTax = Math.min(oldRegime.total_tax, newRegime.total_tax);

    return {
      generated_at: new Date().toISOString(),
      financial_year: this.form16.financial_year || '2024-25',
      source: this.form16.parse_confidence > 30 ? 'form16' : 'manual',
      parse_confidence: this.form16.parse_confidence,

      old_regime: oldRegime,
      new_regime: newRegime,
      recommended_regime: recommended,
      annual_savings: savings,
      is_currently_optimal: currentRegime === recommended,

      missed_deductions: missedDeductions,
      total_potential_saving: missedDeductions.reduce((s, d) => s + d.potential_tax_saving, 0),

      investment_recommendations: investments,

      salary_structure: {
        basic: this.form16.salary.basic_salary,
        hra: this.form16.salary.hra_received,
        special_allowance: this.form16.salary.special_allowance,
        lta: this.form16.salary.lta,
        gross,
        epf_employee: Math.round(this.form16.salary.basic_salary * 0.12),
      },

      monthly_breakdown: monthlyBreakdown,

      summary: {
        current_tax_paid: currentTax,
        optimal_tax: optimalTax,
        over_payment: Math.max(currentTax - optimalTax, 0),
        effective_current_rate: gross > 0 ? Math.round((currentTax / gross) * 10000) / 100 : 0,
        effective_optimal_rate: gross > 0 ? Math.round((optimalTax / gross) * 10000) / 100 : 0,
        employer_name: this.form16.employer_name || 'N/A',
        employee_name: this.form16.employee_name || this.profile.full_name,
        pan: this.form16.employee_pan || '',
      },
    };
  }

  // ────────────── OLD REGIME ──────────────

  private calculateOldRegime(gross: number): RegimeResult {
    const deductions: DeductionItem[] = [];

    // Standard Deduction
    deductions.push({ section: 'Std Deduction', amount: 50000, max: 50000, description: 'Standard Deduction u/s 16(ia)' });

    // HRA
    const basic = this.form16.salary.basic_salary || Math.round(gross * 0.4);
    const hraReceived = this.form16.salary.hra_received || Math.round(gross * 0.2);
    const rentPaid = (this.profile.tax_rent_paid || 0) * 12;
    const metroRate = this.profile.tax_is_metro_city ? 0.5 : 0.4;
    const hraExempt = rentPaid > 0 ? Math.min(hraReceived, basic * metroRate, Math.max(rentPaid - 0.1 * basic, 0)) : 0;
    if (hraExempt > 0) {
      deductions.push({ section: 'HRA', amount: Math.round(hraExempt), max: hraReceived, description: 'HRA Exemption u/s 10(13A)' });
    }

    // Professional Tax
    const pt = this.form16.exemptions.professional_tax || 2400;
    deductions.push({ section: 'Prof Tax', amount: pt, max: 2500, description: 'Professional Tax u/s 16(iii)' });

    // 80C
    const claimed80c = this.form16.deductions.sec_80c || this.profile.tax_80c_investments;
    const capped80c = Math.min(claimed80c, 150000);
    deductions.push({ section: '80C', amount: capped80c, max: 150000, description: 'PPF, EPF, ELSS, LIC, Tuition' });

    // 80D
    const claimed80d = this.form16.deductions.sec_80d || this.profile.tax_80d_medical;
    const max80d = 25000 + ((this.profile.dependents?.parents || 0) > 0 ? 50000 : 0);
    const capped80d = Math.min(claimed80d, max80d);
    deductions.push({ section: '80D', amount: capped80d, max: max80d, description: 'Health Insurance Premiums' });

    // NPS 80CCD(1B)
    const nps1b = this.form16.deductions.sec_80ccd_1b || this.profile.tax_nps_80ccd_1b;
    const cappedNPS = Math.min(nps1b, 50000);
    if (cappedNPS > 0) {
      deductions.push({ section: '80CCD(1B)', amount: cappedNPS, max: 50000, description: 'Additional NPS' });
    }

    // Employer NPS
    const nps2 = this.form16.deductions.sec_80ccd_2;
    if (nps2 > 0) {
      deductions.push({ section: '80CCD(2)', amount: nps2, max: Math.round(basic * 0.10), description: 'Employer NPS Contribution' });
    }

    // Home Loan Interest
    const hlI = this.form16.deductions.sec_24b || this.profile.tax_home_loan_interest;
    const cappedHL = Math.min(hlI, 200000);
    if (cappedHL > 0) {
      deductions.push({ section: '24(b)', amount: cappedHL, max: 200000, description: 'Home Loan Interest' });
    }

    // 80E
    if (this.form16.deductions.sec_80e > 0) {
      deductions.push({ section: '80E', amount: this.form16.deductions.sec_80e, max: Infinity, description: 'Education Loan Interest (no limit)' });
    }

    // 80G
    if (this.form16.deductions.sec_80g > 0) {
      deductions.push({ section: '80G', amount: this.form16.deductions.sec_80g, max: Infinity, description: 'Donations' });
    }

    // 80TTA
    const tta = this.form16.deductions.sec_80tta || 0;
    if (tta > 0) {
      deductions.push({ section: '80TTA', amount: Math.min(tta, 10000), max: 10000, description: 'Savings Account Interest' });
    }

    const totalDed = deductions.reduce((s, d) => s + d.amount, 0);
    const taxable = Math.max(gross - totalDed, 0);

    const slabResult = this.applyOldSlabs(taxable, gross);

    return {
      regime: 'old',
      label: 'Old Regime',
      gross_income: gross,
      total_deductions: totalDed,
      deduction_breakdown: deductions,
      taxable_income: taxable,
      ...slabResult,
    };
  }

  private applyOldSlabs(taxable: number, gross: number) {
    const slabs: TaxSlab[] = [
      { from: 0, to: 250000, rate: 0, label: '₹0 - ₹2.5L' },
      { from: 250000, to: 500000, rate: 5, label: '₹2.5L - ₹5L' },
      { from: 500000, to: 1000000, rate: 20, label: '₹5L - ₹10L' },
      { from: 1000000, to: Infinity, rate: 30, label: '₹10L+' },
    ];

    const breakdown: SlabBreakdown[] = [];
    let tax = 0;

    for (const slab of slabs) {
      if (taxable <= slab.from) {
        breakdown.push({ slab: slab.label, taxable_in_slab: 0, rate: slab.rate, tax: 0 });
        continue;
      }
      const inSlab = Math.min(taxable, slab.to) - slab.from;
      const slabTax = Math.round(inSlab * slab.rate / 100);
      tax += slabTax;
      breakdown.push({ slab: slab.label, taxable_in_slab: Math.max(inSlab, 0), rate: slab.rate, tax: slabTax });
    }

    const rebate = taxable <= 500000 ? tax : 0;
    tax -= rebate;

    let surcharge = 0;
    if (taxable > 5000000 && taxable <= 10000000) surcharge = Math.round(tax * 0.10);
    else if (taxable > 10000000 && taxable <= 20000000) surcharge = Math.round(tax * 0.15);
    else if (taxable > 20000000 && taxable <= 50000000) surcharge = Math.round(tax * 0.25);
    else if (taxable > 50000000) surcharge = Math.round(tax * 0.37);

    const cess = Math.round((tax + surcharge) * 0.04);
    const total = Math.max(tax + surcharge + cess, 0);

    return {
      slab_breakdown: breakdown,
      base_tax: Math.round(tax + rebate),
      rebate_87a: rebate,
      surcharge,
      cess,
      total_tax: total,
      effective_rate: gross > 0 ? Math.round((total / gross) * 10000) / 100 : 0,
      monthly_tax: Math.round(total / 12),
    };
  }

  // ────────────── NEW REGIME ──────────────

  private calculateNewRegime(gross: number): RegimeResult {
    const deductions: DeductionItem[] = [];

    deductions.push({ section: 'Std Deduction', amount: 75000, max: 75000, description: 'Standard Deduction (New Regime)' });

    const nps2 = this.form16.deductions.sec_80ccd_2;
    if (nps2 > 0) {
      const basic = this.form16.salary.basic_salary || Math.round(gross * 0.4);
      deductions.push({ section: '80CCD(2)', amount: nps2, max: Math.round(basic * 0.14), description: 'Employer NPS (allowed in new regime)' });
    }

    const totalDed = deductions.reduce((s, d) => s + d.amount, 0);
    const taxable = Math.max(gross - totalDed, 0);

    const slabResult = this.applyNewSlabs(taxable, gross);

    return {
      regime: 'new',
      label: 'New Regime (FY 2025-26)',
      gross_income: gross,
      total_deductions: totalDed,
      deduction_breakdown: deductions,
      taxable_income: taxable,
      ...slabResult,
    };
  }

  private applyNewSlabs(taxable: number, gross: number) {
    const slabs: TaxSlab[] = [
      { from: 0, to: 400000, rate: 0, label: '₹0 - ₹4L' },
      { from: 400000, to: 800000, rate: 5, label: '₹4L - ₹8L' },
      { from: 800000, to: 1200000, rate: 10, label: '₹8L - ₹12L' },
      { from: 1200000, to: 1600000, rate: 15, label: '₹12L - ₹16L' },
      { from: 1600000, to: 2000000, rate: 20, label: '₹16L - ₹20L' },
      { from: 2000000, to: 2400000, rate: 25, label: '₹20L - ₹24L' },
      { from: 2400000, to: Infinity, rate: 30, label: '₹24L+' },
    ];

    const breakdown: SlabBreakdown[] = [];
    let tax = 0;

    for (const slab of slabs) {
      if (taxable <= slab.from) {
        breakdown.push({ slab: slab.label, taxable_in_slab: 0, rate: slab.rate, tax: 0 });
        continue;
      }
      const inSlab = Math.min(taxable, slab.to) - slab.from;
      const slabTax = Math.round(inSlab * slab.rate / 100);
      tax += slabTax;
      breakdown.push({ slab: slab.label, taxable_in_slab: Math.max(inSlab, 0), rate: slab.rate, tax: slabTax });
    }

    const rebate = taxable <= 1200000 ? tax : 0;
    tax -= rebate;

    // Marginal relief
    if (taxable > 1200000 && taxable <= 1275000) {
      const excessIncome = taxable - 1200000;
      tax = Math.min(tax, excessIncome);
    }

    let surcharge = 0;
    if (taxable > 5000000 && taxable <= 10000000) surcharge = Math.round(tax * 0.10);
    else if (taxable > 10000000) surcharge = Math.round(tax * 0.15);

    const cess = Math.round((tax + surcharge) * 0.04);
    const total = Math.max(tax + surcharge + cess, 0);

    return {
      slab_breakdown: breakdown,
      base_tax: Math.round(tax + rebate),
      rebate_87a: rebate,
      surcharge,
      cess,
      total_tax: total,
      effective_rate: gross > 0 ? Math.round((total / gross) * 10000) / 100 : 0,
      monthly_tax: Math.round(total / 12),
    };
  }

  // ────────────── MISSED DEDUCTIONS ──────────────

  private findMissedDeductions(gross: number): MissedDeduction[] {
    const missed: MissedDeduction[] = [];
    const marginalRate = this.getMarginalRate(gross);

    // 80C
    const used80c = this.form16.deductions.sec_80c || this.profile.tax_80c_investments;
    if (used80c < 150000) {
      const gap = 150000 - used80c;
      missed.push({
        section: '80C', name: 'Sec 80C Investments', currently_claimed: used80c,
        max_limit: 150000, gap, potential_tax_saving: Math.round(gap * marginalRate),
        eligible_regime: 'old', risk_level: 'low', liquidity: '3 years',
        suggestions: ['ELSS Mutual Funds (3yr lock-in, ~12% returns)', 'PPF (15yr, 7.1% guaranteed)', 'EPF voluntary contribution', 'NSC (5yr, 7.7%)', '5-year Tax Saver FD (safe)'],
        priority_score: Math.round((gap / 150000) * 40 + 40),
      });
    }

    // 80CCD(1B) — NPS
    const usedNPS = this.form16.deductions.sec_80ccd_1b || this.profile.tax_nps_80ccd_1b;
    if (usedNPS < 50000) {
      const gap = 50000 - usedNPS;
      missed.push({
        section: '80CCD(1B)', name: 'Additional NPS', currently_claimed: usedNPS,
        max_limit: 50000, gap, potential_tax_saving: Math.round(gap * marginalRate),
        eligible_regime: 'old', risk_level: 'medium', liquidity: 'Retirement',
        suggestions: ['NPS Tier-1 (auto/moderate/aggressive)', 'Extra ₹50K above 80C limit', 'Partial withdrawal after 3 years for specific reasons'],
        priority_score: Math.round((gap / 50000) * 30 + 30),
      });
    }

    // 80D — Health Insurance
    const max80d = 25000 + ((this.profile.dependents?.parents || 0) > 0 ? 50000 : 0);
    const used80d = this.form16.deductions.sec_80d || this.profile.tax_80d_medical;
    if (used80d < max80d) {
      const gap = max80d - used80d;
      missed.push({
        section: '80D', name: 'Health Insurance', currently_claimed: used80d,
        max_limit: max80d, gap, potential_tax_saving: Math.round(gap * marginalRate),
        eligible_regime: 'old', risk_level: 'none', liquidity: '1 year',
        suggestions: [
          'Self/family premium up to ₹25K',
          ...(this.profile.dependents?.parents ? ['Parents premium up to ₹50K (if senior)'] : []),
          'Preventive health check-up ₹5K included',
        ],
        priority_score: Math.round((gap / max80d) * 35 + 35),
      });
    }

    // HRA
    const rentPaid = (this.profile.tax_rent_paid || 0) * 12;
    const hraExempt = this.form16.exemptions.hra_exemption;
    if (rentPaid > 0 && hraExempt === 0) {
      const basic = this.form16.salary.basic_salary || Math.round(gross * 0.4);
      const hraReceived = this.form16.salary.hra_received || Math.round(gross * 0.2);
      const mp = this.profile.tax_is_metro_city ? 0.5 : 0.4;
      const possibleHRA = Math.min(hraReceived, basic * mp, Math.max(rentPaid - 0.1 * basic, 0));
      if (possibleHRA > 0) {
        missed.push({
          section: 'HRA', name: 'HRA Exemption', currently_claimed: 0,
          max_limit: Math.round(possibleHRA), gap: Math.round(possibleHRA),
          potential_tax_saving: Math.round(possibleHRA * marginalRate),
          eligible_regime: 'old', risk_level: 'none', liquidity: 'Instant',
          suggestions: ['Submit rent receipts to employer', 'Landlord PAN required if rent > ₹1L/yr', 'Keep rent agreement + bank transfer proof'],
          priority_score: 80,
        });
      }
    }

    // Section 24(b) — Home Loan
    const hlUsed = this.form16.deductions.sec_24b || this.profile.tax_home_loan_interest;
    if (hlUsed > 0 && hlUsed < 200000) {
      const gap = 200000 - hlUsed;
      missed.push({
        section: '24(b)', name: 'Home Loan Interest', currently_claimed: hlUsed,
        max_limit: 200000, gap, potential_tax_saving: Math.round(gap * marginalRate),
        eligible_regime: 'old', risk_level: 'none', liquidity: 'Instant',
        suggestions: ['Ensure full interest certificate from bank is submitted', 'Co-applicant can claim remaining deduction', 'Pre-construction interest can be claimed in 5 installments'],
        priority_score: 50,
      });
    }

    // 80TTA
    if ((this.form16.deductions.sec_80tta || 0) < 10000) {
      missed.push({
        section: '80TTA', name: 'Savings Account Interest', currently_claimed: this.form16.deductions.sec_80tta || 0,
        max_limit: 10000, gap: 10000 - (this.form16.deductions.sec_80tta || 0),
        potential_tax_saving: Math.round((10000 - (this.form16.deductions.sec_80tta || 0)) * marginalRate),
        eligible_regime: 'old', risk_level: 'none', liquidity: 'Instant',
        suggestions: ['Claim interest from all savings accounts', 'Does NOT include FD interest — only savings'],
        priority_score: 15,
      });
    }

    missed.sort((a, b) => b.priority_score - a.priority_score);
    return missed;
  }

  // ────────────── INVESTMENT RECOMMENDATIONS ──────────────

  private buildInvestmentRecs(missed: MissedDeduction[], gross: number): InvestmentRecommendation[] {
    const riskProfile = this.profile.risk_profile || 'moderate';
    const marginalRate = this.getMarginalRate(gross);
    const recs: InvestmentRecommendation[] = [];
    let rank = 0;

    const gap80c = missed.find((m) => m.section === '80C');
    if (gap80c && gap80c.gap > 0) {
      if (riskProfile !== 'conservative') {
        recs.push({
          rank: ++rank, instrument: 'ELSS Mutual Fund', section: '80C',
          max_amount: gap80c.gap, recommended_amount: Math.min(gap80c.gap, 150000),
          expected_return: '12-15% CAGR', lock_in: '3 years', risk: 'medium',
          liquidity: '3-year lock-in, then liquid', tax_saving: Math.round(Math.min(gap80c.gap, 150000) * marginalRate),
          description: 'Equity-linked savings scheme with shortest lock-in among 80C options',
          why: 'Best 80C option — equity returns + tax saving + only 3yr lock-in',
        });
      }

      recs.push({
        rank: ++rank, instrument: 'PPF (Public Provident Fund)', section: '80C',
        max_amount: 150000, recommended_amount: riskProfile === 'conservative' ? Math.min(gap80c.gap, 150000) : Math.round(gap80c.gap * 0.3),
        expected_return: '7.1% (tax-free)', lock_in: '15 years (partial after 6)', risk: 'low',
        liquidity: 'Partial withdrawal after 6 years', tax_saving: Math.round(Math.min(gap80c.gap * 0.3, 150000) * marginalRate),
        description: 'Government-backed, guaranteed returns, completely tax-free maturity',
        why: riskProfile === 'conservative' ? 'Safest 80C option with guaranteed tax-free returns' : 'Good debt allocation within 80C',
      });

      recs.push({
        rank: ++rank, instrument: '5-Year Tax Saver FD', section: '80C',
        max_amount: 150000, recommended_amount: riskProfile === 'conservative' ? Math.round(gap80c.gap * 0.5) : 0,
        expected_return: '7-7.5%', lock_in: '5 years (no premature)', risk: 'low',
        liquidity: 'Locked for 5 years', tax_saving: Math.round(Math.min(gap80c.gap * 0.3, 150000) * marginalRate),
        description: 'Bank FD with 80C benefit but interest is taxable',
        why: 'Simple, no market risk, but interest is taxable unlike PPF',
      });
    }

    const gapNPS = missed.find((m) => m.section === '80CCD(1B)');
    if (gapNPS && gapNPS.gap > 0) {
      recs.push({
        rank: ++rank, instrument: 'NPS Tier-1', section: '80CCD(1B)',
        max_amount: 50000, recommended_amount: gapNPS.gap,
        expected_return: '9-12% (based on allocation)', lock_in: 'Until 60 (partial after 3yr)', risk: 'medium',
        liquidity: 'Retirement lock, 25% partial withdrawal after 3yr', tax_saving: Math.round(gapNPS.gap * marginalRate),
        description: 'EXTRA ₹50K deduction above ₹1.5L 80C limit — most people miss this',
        why: "Free extra deduction most people don't know about",
      });
    }

    const gapHealth = missed.find((m) => m.section === '80D');
    if (gapHealth && gapHealth.gap > 0) {
      recs.push({
        rank: ++rank, instrument: 'Health Insurance Premium', section: '80D',
        max_amount: gapHealth.max_limit, recommended_amount: gapHealth.gap,
        expected_return: 'N/A (risk cover)', lock_in: '1 year renewable', risk: 'low',
        liquidity: 'Annual premium', tax_saving: Math.round(gapHealth.gap * marginalRate),
        description: 'Essential protection + tax deduction — covers self, family & parents',
        why: 'Not just tax saving — one hospitalization without insurance can wipe lakhs',
      });
    }

    return recs;
  }

  // ────────────── MONTHLY BREAKDOWN ──────────────

  private buildMonthlyBreakdown(gross: number, annualTax: number): MonthlyBreakdown[] {
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const monthlyGross = Math.round(gross / 12);
    const monthlyTDS = Math.round(annualTax / 12);
    const epf = Math.round((this.form16.salary.basic_salary || gross * 0.4) * 0.12 / 12);
    const pt = Math.round((this.form16.exemptions.professional_tax || 2400) / 12);

    return months.map((m) => ({
      month: m,
      gross_salary: monthlyGross,
      deductions: epf + pt,
      tds: monthlyTDS,
      net_in_hand: monthlyGross - epf - pt - monthlyTDS,
    }));
  }

  private getMarginalRate(gross: number): number {
    if (gross > 1500000) return 0.312;
    if (gross > 1200000) return 0.208;
    if (gross > 900000) return 0.156;
    if (gross > 600000) return 0.104;
    return 0.052;
  }
}


// ═══════════════════════════════════════════════
// HELPER: Build a Form16 shape from profile data
// ═══════════════════════════════════════════════

export function buildForm16FromProfile(p: TaxProfile): ParsedForm16 {
  const gross = p.gross_annual_income;
  const basic = p.tax_basic_salary || Math.round(gross * 0.4);
  const hra = p.tax_hra_received || Math.round(gross * 0.2);
  const special = Math.max(gross - basic - hra, 0);

  const rentPaid = (p.tax_rent_paid || 0) * 12;
  const metroRate = p.tax_is_metro_city ? 0.5 : 0.4;
  const hraExempt = rentPaid > 0 ? Math.min(hra, basic * metroRate, Math.max(rentPaid - 0.1 * basic, 0)) : 0;

  return {
    financial_year: '2024-25',
    assessment_year: '2025-26',
    employer_name: '',
    employer_tan: '',
    employee_name: p.full_name,
    employee_pan: '',
    parse_confidence: 0,
    total_tds_deposited: 0,
    quarter_wise_tds: [],
    salary: {
      basic_salary: basic, hra_received: hra, special_allowance: special,
      lta: 0, other_allowances: 0, gross_salary: gross,
      perquisites: 0, profits_in_lieu: 0, total_gross: gross,
    },
    exemptions: {
      hra_exemption: Math.round(hraExempt), lta_exemption: 0, standard_deduction: 50000,
      professional_tax: 2400, other_exemptions: 0, total_exemptions: 52400 + Math.round(hraExempt),
    },
    other_income: { house_property: 0, other_sources: 0 },
    gross_total_income: gross - 52400,
    deductions: {
      sec_80c: p.tax_80c_investments || 0, sec_80ccc: 0, sec_80ccd_1: 0,
      sec_80ccd_1b: p.tax_nps_80ccd_1b || 0, sec_80ccd_2: 0,
      total_80c_group: Math.min(p.tax_80c_investments || 0, 150000),
      sec_80d: p.tax_80d_medical || 0, sec_80e: 0, sec_80g: 0,
      sec_80tta: 0, sec_80u: 0, sec_24b: p.tax_home_loan_interest || 0,
      other_deductions: 0, total_deductions: 0,
    },
    tax_computation: {
      total_taxable_income: 0, tax_on_income: 0, surcharge: 0,
      cess: 0, total_tax: 0, relief_89: 0, net_tax: 0,
      tds_deducted: 0, balance_tax: 0, regime_used: p.current_tax_regime || 'new',
    },
    raw_text_preview: '',
  };
}
