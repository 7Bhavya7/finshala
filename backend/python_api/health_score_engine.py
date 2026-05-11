# ═══════════════════════════════════════════════
# HEALTH SCORE ENGINE — Python (migrated from TypeScript)
# 6-dimension financial health scoring
# ═══════════════════════════════════════════════

import math
from datetime import datetime, date


# ═══════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════

def get_age(dob_str):
    try:
        birth = datetime.strptime(dob_str, "%Y-%m-%d").date()
    except Exception:
        return 30
    today = date.today()
    age = today.year - birth.year
    if (today.month, today.day) < (birth.month, birth.day):
        age -= 1
    return max(age, 18)


def get_grade(score):
    if score >= 90: return 'A+'
    if score >= 75: return 'A'
    if score >= 60: return 'B'
    if score >= 40: return 'C'
    if score >= 20: return 'D'
    return 'F'


def get_overall_label(score):
    if score >= 800: return 'Excellent'
    if score >= 700: return 'Very Good'
    if score >= 550: return 'Good'
    if score >= 400: return 'Fair'
    if score >= 200: return 'Needs Work'
    return 'Critical'


def get_overall_color(score):
    if score >= 800: return 'emerald'
    if score >= 700: return 'green'
    if score >= 550: return 'yellow'
    if score >= 400: return 'orange'
    return 'red'


def clamp(val, mn, mx):
    return max(mn, min(mx, val))


def lerp(value, from_min, from_max, to_min, to_max):
    if from_max == from_min:
        return to_min
    ratio = clamp((value - from_min) / (from_max - from_min), 0, 1)
    return to_min + ratio * (to_max - to_min)


def get_total_emi(loans):
    if not loans:
        return 0
    return sum(l.get('emi', 0) or 0 for l in loans.values() if l)


def get_total_outstanding(loans):
    if not loans:
        return 0
    return sum((l.get('emi', 0) or 0) * (l.get('tenure', 0) or 0) for l in loans.values() if l)


def _safe(val, default=0):
    """Safely convert to number."""
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


# ═══════════════════════════════════════════════
# SCORING ENGINE
# ═══════════════════════════════════════════════

class HealthScoreEngine:
    def __init__(self, profile):
        self.p = profile
        self.age = get_age(profile.get('dob', ''))
        self.monthly_income = _safe(profile.get('gross_annual_income')) / 12
        self.total_emi = get_total_emi(profile.get('loans', {}))
        self.total_assets = (
            _safe(profile.get('emergency_fund')) +
            _safe(profile.get('retirement_balance')) +
            _safe(profile.get('mutual_fund_value')) +
            _safe(profile.get('stock_value')) +
            _safe(profile.get('savings_fd_balance')) +
            _safe(profile.get('gold_real_estate'))
        )
        self.total_liabilities = get_total_outstanding(profile.get('loans', {}))

    def calculate(self):
        emergency = self._score_emergency()
        insurance = self._score_insurance()
        investment = self._score_investment()
        debt = self._score_debt()
        tax = self._score_tax()
        retirement = self._score_retirement()

        dimension_list = [emergency, insurance, investment, debt, tax, retirement]

        weighted_avg = (
            emergency['score'] * 0.20 + insurance['score'] * 0.20 +
            investment['score'] * 0.15 + debt['score'] * 0.15 +
            tax['score'] * 0.15 + retirement['score'] * 0.15
        )
        overall_score = round(weighted_avg * 9)

        all_recs = []
        for d in dimension_list:
            all_recs.extend(d['recommendations'])
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        all_recs.sort(key=lambda a: priority_order.get(a['priority'], 3))

        percentile = 50
        if overall_score >= 800:
            percentile = 95 + round((overall_score - 800) / 20)
        elif overall_score >= 650:
            percentile = 80 + round((overall_score - 650) / 10)
        elif overall_score >= 500:
            percentile = 50 + round((overall_score - 500) / 5)
        else:
            percentile = max(5, round(overall_score / 10))
        percentile = clamp(percentile, 1, 99)

        return {
            'generated_at': datetime.utcnow().isoformat() + 'Z',
            'overall_score': overall_score,
            'overall_grade': get_grade(overall_score / 9),
            'overall_label': get_overall_label(overall_score),
            'overall_color': get_overall_color(overall_score),
            'dimensions': {
                'emergency': emergency, 'insurance': insurance,
                'investment': investment, 'debt': debt,
                'tax': tax, 'retirement': retirement,
            },
            'dimension_list': dimension_list,
            'top_actions': all_recs[:6],
            'peer_comparison': {
                'your_score': overall_score, 'average_score': 512,
                'percentile': percentile, 'better_than_pct': percentile,
            },
            'score_history_placeholder': self._generate_score_history(overall_score),
            'meta': {
                'current_age': self.age,
                'monthly_income': round(self.monthly_income),
                'monthly_expenses': int(_safe(self.p.get('monthly_expenses'))),
                'total_emi': int(self.total_emi),
                'net_worth': int(self.total_assets - self.total_liabilities),
                'total_assets': int(self.total_assets),
                'total_liabilities': int(self.total_liabilities),
            },
        }

    # ────────────── 1. EMERGENCY PREPAREDNESS ──────────────

    def _score_emergency(self):
        monthly_burn = _safe(self.p.get('monthly_expenses')) + self.total_emi
        ef = _safe(self.p.get('emergency_fund'))
        months_covered = ef / monthly_burn if monthly_burn > 0 else 0
        deps = self.p.get('dependents') or {}
        has_children = (deps.get('children', 0) or 0) > 0
        target_months = 9 if has_children else 6

        coverage_pts = clamp(lerp(months_covered, 0, target_months, 0, 70), 0, 70)
        liquidity_pts = 15 if ef > 0 else 0
        adequacy_pts = 15 if months_covered >= target_months else (8 if months_covered >= 3 else 0)
        total_score = round(coverage_pts + liquidity_pts + adequacy_pts)

        findings = []
        recs = []

        if months_covered == 0:
            findings.append({'type': 'negative', 'text': 'No emergency fund exists', 'icon': '🚨'})
            recs.append({'priority': 'critical', 'action': f'Build ₹{round(monthly_burn * target_months / 1000)}K emergency fund immediately', 'impact': f'Without this, one emergency forces you to break investments at a loss', 'estimated_benefit': f'Protection from {target_months} months of income disruption'})
        elif months_covered < 3:
            findings.append({'type': 'warning', 'text': f'Only {months_covered:.1f} months covered — minimum is 3', 'icon': '⚠️'})
            gap = (3 * monthly_burn) - ef
            recs.append({'priority': 'high', 'action': f'Add ₹{round(gap / 1000)}K to reach 3-month minimum', 'impact': 'Protects against job loss or medical emergency'})
        elif months_covered < target_months:
            findings.append({'type': 'warning', 'text': f'{months_covered:.1f} months covered, target is {target_months}', 'icon': '📊'})
            gap = (target_months * monthly_burn) - ef
            family = 'family with children' if has_children else 'your situation'
            recs.append({'priority': 'medium', 'action': f'Top up by ₹{round(gap / 1000)}K for full {target_months}-month coverage', 'impact': f'Full coverage for {family}'})
        else:
            findings.append({'type': 'positive', 'text': f'{months_covered:.1f} months covered — excellent!', 'icon': '✅'})

        if ef > 0:
            findings.append({'type': 'neutral', 'text': f'₹{round(ef / 1000)}K in emergency reserves', 'icon': '💰'})

        return {
            'id': 'emergency', 'name': 'Emergency Preparedness', 'emoji': '🛡️',
            'score': total_score, 'grade': get_grade(total_score), 'color': 'blue',
            'description': f'{months_covered:.1f} months of expenses covered',
            'sub_scores': [
                {'label': 'Months Coverage', 'score': round(coverage_pts), 'max': 70, 'description': f'{months_covered:.1f} of {target_months} months'},
                {'label': 'Fund Exists', 'score': liquidity_pts, 'max': 15, 'description': 'Yes' if ef > 0 else 'No fund'},
                {'label': 'Adequacy', 'score': adequacy_pts, 'max': 15, 'description': 'Fully adequate' if months_covered >= target_months else 'Below target'},
            ],
            'findings': findings, 'recommendations': recs,
        }

    # ────────────── 2. INSURANCE COVERAGE ──────────────

    def _score_insurance(self):
        income = _safe(self.p.get('gross_annual_income'))
        deps = self.p.get('dependents') or {}
        dep_count = (deps.get('children', 0) or 0) + (deps.get('parents', 0) or 0)
        total_loans = self.total_liabilities

        life_mul = 15 if dep_count > 2 else (12 if dep_count > 0 else 10)
        rec_life = income * life_mul + total_loans
        life_cover = _safe(self.p.get('life_insurance_cover'))
        life_ratio = min(life_cover / rec_life, 1) if rec_life > 0 else 0
        life_pts = round(life_ratio * 40)

        is_metro = self.p.get('tax_is_metro_city', False)
        base_health = 1500000 if is_metro else 1000000
        family_mul = 1 + (deps.get('children', 0) or 0) * 0.3 + (deps.get('parents', 0) or 0) * 0.5
        if self.p.get('marital_status') == 'married':
            family_mul += 0.5
        rec_health = base_health * family_mul
        health_cover = _safe(self.p.get('health_insurance_cover'))
        health_ratio = min(health_cover / rec_health, 1) if rec_health > 0 else 0
        health_pts = round(health_ratio * 40)

        ci = self.p.get('critical_illness_cover', False)
        ci_pts = 20 if ci else (0 if self.age >= 30 else 10)
        total_score = life_pts + health_pts + ci_pts

        findings = []
        recs = []

        if life_cover == 0 and dep_count > 0:
            findings.append({'type': 'negative', 'text': 'No life insurance with dependents — critical risk', 'icon': '🚨'})
            recs.append({'priority': 'critical', 'action': f'Get term insurance of ₹{round(rec_life / 100000)}L immediately', 'impact': 'Family has zero protection', 'estimated_benefit': f'₹{round(rec_life * 0.003 / 1000)}K/yr premium'})
        elif life_ratio < 0.5:
            gap = rec_life - life_cover
            findings.append({'type': 'warning', 'text': f'Life cover is {round(life_ratio * 100)}% of recommended', 'icon': '⚠️'})
            recs.append({'priority': 'high', 'action': f'Increase life cover by ₹{round(gap / 100000)}L', 'impact': 'Current cover leaves significant gap'})
        elif life_ratio >= 0.8:
            findings.append({'type': 'positive', 'text': f'Life cover is {round(life_ratio * 100)}% adequate', 'icon': '✅'})

        if health_cover == 0:
            findings.append({'type': 'negative', 'text': 'No health insurance — one hospitalization can wipe savings', 'icon': '🏥'})
            recs.append({'priority': 'critical', 'action': f'Get ₹{round(rec_health / 100000)}L health cover + super top-up', 'impact': 'Average cardiac surgery costs ₹5-10L', 'estimated_benefit': f'₹{round(rec_health * 0.015 / 1000)}K/yr premium'})
        elif health_ratio < 0.5:
            findings.append({'type': 'warning', 'text': f'Health cover only ₹{round(health_cover / 100000)}L vs recommended ₹{round(rec_health / 100000)}L', 'icon': '⚠️'})
            recs.append({'priority': 'high', 'action': 'Add a super top-up policy to bridge the gap', 'impact': 'Super top-ups are cheap and double your effective cover'})
        else:
            findings.append({'type': 'positive', 'text': f'Health cover ₹{round(health_cover / 100000)}L — adequate', 'icon': '✅'})

        if not ci and self.age >= 30:
            findings.append({'type': 'warning', 'text': 'No critical illness cover', 'icon': '💊'})
            recs.append({'priority': 'high' if self.age >= 40 else 'medium', 'action': f'Get ₹{round(income * 3 / 100000)}L critical illness cover', 'impact': 'Lump-sum on diagnosis of cancer, heart attack'})
        elif ci:
            findings.append({'type': 'positive', 'text': 'Critical illness cover active', 'icon': '✅'})

        return {
            'id': 'insurance', 'name': 'Insurance Coverage', 'emoji': '🏥',
            'score': total_score, 'grade': get_grade(total_score), 'color': 'cyan',
            'description': f'Life {round(life_ratio * 100)}% | Health {round(health_ratio * 100)}% adequate',
            'sub_scores': [
                {'label': 'Life Insurance', 'score': life_pts, 'max': 40, 'description': f'₹{round(life_cover / 100000)}L of ₹{round(rec_life / 100000)}L needed'},
                {'label': 'Health Insurance', 'score': health_pts, 'max': 40, 'description': f'₹{round(health_cover / 100000)}L of ₹{round(rec_health / 100000)}L needed'},
                {'label': 'Critical Illness', 'score': ci_pts, 'max': 20, 'description': 'Covered' if ci else 'Not covered'},
            ],
            'findings': findings, 'recommendations': recs,
        }

    # ────────────── 3. INVESTMENT DIVERSIFICATION ──────────────

    def _score_investment(self):
        equity = _safe(self.p.get('mutual_fund_value')) + _safe(self.p.get('stock_value'))
        fixed_income = _safe(self.p.get('savings_fd_balance')) + _safe(self.p.get('retirement_balance'))
        gold = _safe(self.p.get('gold_real_estate')) * 0.4
        re = _safe(self.p.get('gold_real_estate')) * 0.6
        total = equity + fixed_income + gold + re

        has_investments = total > 0
        exists_pts = 15 if has_investments else 0
        classes = sum(1 for x in [equity, fixed_income, gold, re] if x > 0)
        diverse_pts = min(classes * 12, 36)

        concentration_pts = 15
        if total > 0:
            max_pct = max(equity, fixed_income, gold, re) / total
            if max_pct > 0.8: concentration_pts = 0
            elif max_pct > 0.7: concentration_pts = 5
            elif max_pct > 0.6: concentration_pts = 10
        else:
            concentration_pts = 0

        sip = _safe(self.p.get('monthly_sip'))
        sip_pts = 15 if sip > 0 else 0

        equity_pct = (equity / total) * 100 if total > 0 else 0
        ideal_equity = max(100 - self.age, 20)
        equity_deviation = abs(equity_pct - ideal_equity)
        if equity_deviation < 15: equity_fit_pts = 19
        elif equity_deviation < 25: equity_fit_pts = 12
        elif equity_deviation < 40: equity_fit_pts = 6
        else: equity_fit_pts = 0

        total_score = min(exists_pts + diverse_pts + concentration_pts + sip_pts + equity_fit_pts, 100)

        findings = []
        recs = []

        if not has_investments:
            findings.append({'type': 'negative', 'text': 'No investments — money is losing to inflation', 'icon': '📉'})
            recs.append({'priority': 'critical', 'action': 'Start a ₹5,000/month SIP in a flexi-cap mutual fund today', 'impact': '₹5K/month at 12% for 20 years = ₹49.5L'})
        else:
            findings.append({'type': 'neutral', 'text': f'Portfolio: ₹{round(total / 100000)}L across {classes} asset class{"es" if classes > 1 else ""}', 'icon': '📊'})
            if classes < 3:
                recs.append({'priority': 'medium', 'action': f'Add {"debt and gold" if classes < 2 else "gold/debt"} exposure for diversification', 'impact': 'Reduces risk of 30-40% drops in crashes'})
            if total > 0 and max(equity, fixed_income, gold, re) / total > 0.7:
                dominant = 'equity' if equity > fixed_income else 'fixed income'
                findings.append({'type': 'warning', 'text': f'Over-concentrated in {dominant}', 'icon': '⚠️'})
                recs.append({'priority': 'medium', 'action': 'Rebalance — no single asset should exceed 65%', 'impact': 'Reduces catastrophic loss risk'})

        if sip > 0:
            findings.append({'type': 'positive', 'text': f'Active SIP: ₹{round(sip / 1000)}K/month', 'icon': '✅'})
        elif has_investments:
            findings.append({'type': 'warning', 'text': 'No active SIP — lump-sum investing is risky', 'icon': '⚠️'})
            recs.append({'priority': 'high', 'action': 'Start a SIP for rupee-cost averaging', 'impact': 'SIPs reduce timing risk'})

        if total > 0:
            findings.append({'type': 'neutral', 'text': f'Equity: {equity_pct:.0f}% | Ideal for age {self.age}: ~{ideal_equity}%', 'icon': '✅' if equity_deviation < 15 else '📐'})

        return {
            'id': 'investment', 'name': 'Investment Diversification', 'emoji': '📊',
            'score': total_score, 'grade': get_grade(total_score), 'color': 'violet',
            'description': f'{classes} asset class{"es" if classes != 1 else ""}, ₹{round(total / 100000)}L invested',
            'sub_scores': [
                {'label': 'Has Investments', 'score': exists_pts, 'max': 15, 'description': 'Yes' if has_investments else 'None'},
                {'label': 'Diversification', 'score': diverse_pts, 'max': 36, 'description': f'{classes} of 4 asset classes'},
                {'label': 'Concentration', 'score': concentration_pts, 'max': 15, 'description': 'Well spread' if concentration_pts >= 10 else 'Too concentrated'},
                {'label': 'SIP Discipline', 'score': sip_pts, 'max': 15, 'description': f'₹{round(sip / 1000)}K/mo' if sip > 0 else 'No SIP'},
                {'label': 'Age-Appropriate Equity', 'score': equity_fit_pts, 'max': 19, 'description': f'{equity_pct:.0f}% vs ideal {ideal_equity}%'},
            ],
            'findings': findings, 'recommendations': recs,
        }

    # ────────────── 4. DEBT HEALTH ──────────────

    def _score_debt(self):
        emi_to_income = (self.total_emi / self.monthly_income) * 100 if self.monthly_income > 0 else 0
        has_debt = self.total_emi > 0
        loans = self.p.get('loans') or {}
        has_cc = (loans.get('credit_card', {}) or {}).get('emi', 0) > 0
        has_personal = (loans.get('personal', {}) or {}).get('emi', 0) > 0

        if not has_debt:
            total_score = 100
        else:
            if emi_to_income <= 15: ratio_pts = 50
            elif emi_to_income <= 25: ratio_pts = 40
            elif emi_to_income <= 35: ratio_pts = 30
            elif emi_to_income <= 45: ratio_pts = 20
            elif emi_to_income <= 55: ratio_pts = 10
            else: ratio_pts = 0

            quality_pts = 25
            if has_cc: quality_pts -= 15
            if has_personal: quality_pts -= 10

            discipline_pts = 25
            if self.p.get('missed_emi'): discipline_pts -= 20
            if _safe(self.p.get('missed_emi_amount')) > 0: discipline_pts -= 5

            total_score = max(ratio_pts + max(quality_pts, 0) + max(discipline_pts, 0), 0)

        findings = []
        recs = []

        if not has_debt:
            findings.append({'type': 'positive', 'text': 'Completely debt-free! Maximum score.', 'icon': '🎉'})
        else:
            f_type = 'neutral' if emi_to_income <= 30 else 'negative'
            label = '(healthy)' if emi_to_income <= 30 else '(elevated)'
            findings.append({'type': f_type, 'text': f'EMI-to-Income ratio: {emi_to_income:.0f}% {label}', 'icon': '📊' if emi_to_income <= 30 else '🚨'})

            if has_cc:
                cc = loans['credit_card']
                findings.append({'type': 'negative', 'text': f'Credit card debt: ₹{round(cc["emi"] * cc["tenure"] / 1000)}K outstanding at 30-40% interest', 'icon': '💳'})
                recs.append({'priority': 'critical', 'action': 'Pay off credit card debt FIRST — it charges 36%+ interest', 'impact': 'No investment returns 36% — always pay CC debt first'})

            if has_personal:
                findings.append({'type': 'warning', 'text': 'Personal loan active — high interest unsecured debt', 'icon': '⚠️'})
                recs.append({'priority': 'high', 'action': 'Accelerate personal loan repayment', 'impact': 'Personal loans charge 12-18%'})

            if self.p.get('missed_emi'):
                findings.append({'type': 'negative', 'text': 'Missed EMI detected — credit score at risk', 'icon': '🚨'})
                recs.append({'priority': 'critical', 'action': f'Clear missed EMI of ₹{round(_safe(self.p.get("missed_emi_amount")) / 1000)}K immediately', 'impact': 'Each missed EMI drops CIBIL score by 50-100 points'})

            if emi_to_income > 50:
                recs.append({'priority': 'critical', 'action': 'EMI exceeds 50% of income — consider debt restructuring', 'impact': 'High EMI leaves no room for savings'})

        active_loans = [(k, l) for k, l in loans.items() if l and l.get('emi', 0) > 0]
        if active_loans:
            loan_strs = ', '.join(f'{k} ₹{round(l["emi"] / 1000)}K' for k, l in active_loans)
            findings.append({'type': 'neutral', 'text': f'{len(active_loans)} active loan{"s" if len(active_loans) > 1 else ""}: {loan_strs}', 'icon': '📋'})

        color = 'emerald' if not has_debt else ('green' if total_score >= 60 else 'red')
        sub_scores = [{'label': 'Debt Status', 'score': 100, 'max': 100, 'description': 'No outstanding debt'}] if not has_debt else [
            {'label': 'EMI-to-Income', 'score': round(lerp(100 - emi_to_income, 0, 100, 0, 50)), 'max': 50, 'description': f'{emi_to_income:.0f}% (under 30% is ideal)'},
            {'label': 'Debt Quality', 'score': max(25 - (15 if has_cc else 0) - (10 if has_personal else 0), 0), 'max': 25, 'description': 'Has high-interest debt' if has_cc else 'Secured debt only'},
            {'label': 'Payment Record', 'score': 0 if self.p.get('missed_emi') else 25, 'max': 25, 'description': 'Missed payments' if self.p.get('missed_emi') else 'Clean record'},
        ]

        return {
            'id': 'debt', 'name': 'Debt Health', 'emoji': '💳',
            'score': total_score, 'grade': get_grade(total_score), 'color': color,
            'description': f'{emi_to_income:.0f}% EMI-to-income ratio' if has_debt else 'Debt free!',
            'sub_scores': sub_scores, 'findings': findings, 'recommendations': recs,
        }

    # ────────────── 5. TAX EFFICIENCY ──────────────

    def _score_tax(self):
        income = _safe(self.p.get('gross_annual_income'))
        if income <= 500000:
            return {
                'id': 'tax', 'name': 'Tax Efficiency', 'emoji': '🏛️', 'score': 85, 'grade': 'A', 'color': 'amber',
                'description': 'Income below taxable threshold',
                'sub_scores': [{'label': 'Overall', 'score': 85, 'max': 100, 'description': 'Low income, low tax concern'}],
                'findings': [{'type': 'positive', 'text': 'Income under ₹5L — nil or minimal tax', 'icon': '✅'}],
                'recommendations': [],
            }

        c80 = _safe(self.p.get('tax_80c_investments'))
        c80_ratio = min(c80 / 150000, 1)
        c80_pts = round(c80_ratio * 30)

        parent_count = (self.p.get('dependents') or {}).get('parents', 0) or 0
        d80_max = 25000 + (50000 if parent_count > 0 else 0)
        d80 = _safe(self.p.get('tax_80d_medical'))
        d80_ratio = min(d80 / d80_max, 1) if d80_max > 0 else 0
        d80_pts = round(d80_ratio * 20)

        nps = _safe(self.p.get('tax_nps_80ccd_1b'))
        nps_ratio = min(nps / 50000, 1)
        nps_pts = round(nps_ratio * 15)

        old_tax = self._calc_old_tax()
        new_tax = self._calc_new_tax()
        optimal_regime = 'old' if old_tax <= new_tax else 'new'
        is_optimal = self.p.get('current_tax_regime') == optimal_regime
        regime_pts = 20 if is_optimal else 5

        rent = _safe(self.p.get('tax_rent_paid'))
        hra_r = _safe(self.p.get('tax_hra_received'))
        if rent > 0 and hra_r > 0: hra_pts = 15
        elif rent > 0: hra_pts = 0
        else: hra_pts = 10

        total_score = min(c80_pts + d80_pts + nps_pts + regime_pts + hra_pts, 100)
        findings = []
        recs = []

        if c80_ratio < 1:
            gap = 150000 - c80
            findings.append({'type': 'warning', 'text': f'80C: ₹{round(c80 / 1000)}K of ₹1.5L used ({round(c80_ratio * 100)}%)', 'icon': '📋'})
            recs.append({'priority': 'high' if gap > 100000 else 'medium', 'action': f'Invest ₹{round(gap / 1000)}K in ELSS to fill 80C gap', 'impact': f'Save ₹{round(gap * self._get_marginal_rate() / 1000)}K in tax'})
        else:
            findings.append({'type': 'positive', 'text': '80C fully utilized (₹1.5L)', 'icon': '✅'})

        if not is_optimal:
            saving = abs(old_tax - new_tax)
            findings.append({'type': 'negative', 'text': f'Wrong regime! {optimal_regime.upper()} saves ₹{round(saving / 1000)}K more', 'icon': '🔄'})
            recs.append({'priority': 'high' if saving > 30000 else 'medium', 'action': f'Switch to {optimal_regime} regime', 'impact': f'Annual saving of ₹{round(saving / 1000)}K'})
        else:
            findings.append({'type': 'positive', 'text': f'Optimal regime selected ({optimal_regime})', 'icon': '✅'})

        if nps_ratio < 1:
            gap = 50000 - nps
            recs.append({'priority': 'medium', 'action': f'Add ₹{round(gap / 1000)}K to NPS for 80CCD(1B)', 'impact': f'Extra ₹{round(gap * self._get_marginal_rate() / 1000)}K saving'})

        effective_rate = (min(old_tax, new_tax) / income) * 100 if income > 0 else 0
        findings.append({'type': 'neutral', 'text': f'Effective tax rate: {effective_rate:.1f}%', 'icon': '📊'})

        avg_util = round((c80_ratio + d80_ratio + nps_ratio) / 3 * 100)
        return {
            'id': 'tax', 'name': 'Tax Efficiency', 'emoji': '🏛️',
            'score': total_score, 'grade': get_grade(total_score), 'color': 'amber',
            'description': f'{avg_util}% deductions utilized',
            'sub_scores': [
                {'label': 'Section 80C', 'score': c80_pts, 'max': 30, 'description': f'₹{round(c80 / 1000)}K of ₹1.5L'},
                {'label': 'Section 80D', 'score': d80_pts, 'max': 20, 'description': f'₹{round(d80 / 1000)}K of ₹{round(d80_max / 1000)}K'},
                {'label': 'NPS 80CCD(1B)', 'score': nps_pts, 'max': 15, 'description': f'₹{round(nps / 1000)}K of ₹50K'},
                {'label': 'Regime', 'score': regime_pts, 'max': 20, 'description': 'Optimal' if is_optimal else 'Sub-optimal'},
                {'label': 'HRA', 'score': hra_pts, 'max': 15, 'description': 'Claimed' if hra_pts >= 15 else 'Not optimized'},
            ],
            'findings': findings, 'recommendations': recs,
        }

    # ────────────── 6. RETIREMENT READINESS ──────────────

    def _score_retirement(self):
        years_to_retire = max(60 - self.age, 1)
        annual_expenses = _safe(self.p.get('monthly_expenses')) * 12
        future_expenses = annual_expenses * (1.06 ** years_to_retire)
        retirement_corpus = future_expenses / 0.035

        current_retirement = _safe(self.p.get('retirement_balance')) + _safe(self.p.get('mutual_fund_value')) * 0.5
        corpus_ratio = min(current_retirement / retirement_corpus, 1) if retirement_corpus > 0 else 0

        has_savings_pts = 25 if current_retirement > 0 else 0
        corpus_pts = round(corpus_ratio * 40)
        sip = _safe(self.p.get('monthly_sip'))
        sip_pts = 15 if sip > 0 else 0

        monthly_return = (1.10 ** (1 / 12)) - 1
        months = years_to_retire * 12
        fv_current = current_retirement * ((1 + monthly_return) ** months)
        remaining = max(retirement_corpus - fv_current, 0)
        needed_sip = (remaining * monthly_return) / ((1 + monthly_return) ** months - 1) if remaining > 0 and monthly_return > 0 else 0
        sip_adequacy = min(sip / needed_sip, 1) if needed_sip > 0 else (1 if sip > 0 else 0)
        sip_adequacy_pts = round(sip_adequacy * 20)

        total_score = has_savings_pts + corpus_pts + sip_pts + sip_adequacy_pts
        findings = []
        recs = []

        corpus_cr = round(retirement_corpus / 10000000 * 100) / 100
        findings.append({'type': 'neutral', 'text': f'Retirement corpus needed by 60: ₹{corpus_cr}Cr', 'icon': '🎯'})

        if current_retirement == 0:
            findings.append({'type': 'negative', 'text': 'Zero retirement savings', 'icon': '🚨'})
            recs.append({'priority': 'critical', 'action': f'Start retirement SIP of ₹{round(needed_sip / 1000)}K/month', 'impact': f'You need ₹{corpus_cr}Cr by age 60'})
        else:
            f_type = 'positive' if corpus_ratio >= 0.2 else 'warning'
            findings.append({'type': f_type, 'text': f'{round(corpus_ratio * 100)}% of retirement corpus accumulated', 'icon': '📈' if corpus_ratio >= 0.2 else '⚠️'})

        if sip > 0 and needed_sip > 0:
            if sip_adequacy >= 0.8:
                findings.append({'type': 'positive', 'text': f'SIP of ₹{round(sip / 1000)}K covers {round(sip_adequacy * 100)}% of retirement need', 'icon': '✅'})
            else:
                deficit = max(needed_sip - sip, 0)
                findings.append({'type': 'warning', 'text': f'SIP shortfall: ₹{round(deficit / 1000)}K/month', 'icon': '⚠️'})
                recs.append({'priority': 'high', 'action': f'Increase SIP by ₹{round(deficit / 1000)}K/month', 'impact': 'Bridges gap to retirement corpus'})

        findings.append({'type': 'neutral', 'text': f'{years_to_retire} years to retirement at age 60', 'icon': '⏱️'})

        return {
            'id': 'retirement', 'name': 'Retirement Readiness', 'emoji': '🏖️',
            'score': total_score, 'grade': get_grade(total_score), 'color': 'orange',
            'description': f'{round(corpus_ratio * 100)}% corpus built, {years_to_retire} years to go',
            'sub_scores': [
                {'label': 'Has Retirement Savings', 'score': has_savings_pts, 'max': 25, 'description': f'₹{round(current_retirement / 100000)}L' if current_retirement > 0 else 'Nothing saved'},
                {'label': 'Corpus Progress', 'score': corpus_pts, 'max': 40, 'description': f'{round(corpus_ratio * 100)}% of ₹{corpus_cr}Cr'},
                {'label': 'SIP Active', 'score': sip_pts, 'max': 15, 'description': 'Yes' if sip > 0 else 'No'},
                {'label': 'SIP Adequacy', 'score': sip_adequacy_pts, 'max': 20, 'description': f'{round(sip_adequacy * 100)}% of needed SIP'},
            ],
            'findings': findings, 'recommendations': recs,
        }

    # ────────────── TAX HELPERS ──────────────

    def _get_marginal_rate(self):
        g = _safe(self.p.get('gross_annual_income'))
        if g > 1500000: return 0.30
        if g > 1200000: return 0.20
        if g > 900000: return 0.15
        if g > 600000: return 0.10
        return 0.05

    def _calc_old_tax(self):
        g = _safe(self.p.get('gross_annual_income'))
        sd = 50000
        b = _safe(self.p.get('tax_basic_salary'))
        hra_r = _safe(self.p.get('tax_hra_received'))
        rent_a = _safe(self.p.get('tax_rent_paid')) * 12
        mp = 0.5 if self.p.get('tax_is_metro_city') else 0.4
        hra = min(hra_r, b * mp, max(rent_a - 0.1 * b, 0)) if hra_r > 0 and rent_a > 0 else 0
        c80 = min(_safe(self.p.get('tax_80c_investments')), 150000)
        parent_count = (self.p.get('dependents') or {}).get('parents', 0) or 0
        pl = 50000 if parent_count > 0 else 0
        d80 = min(_safe(self.p.get('tax_80d_medical')), 25000 + pl)
        nps = min(_safe(self.p.get('tax_nps_80ccd_1b')), 50000)
        hl = min(_safe(self.p.get('tax_home_loan_interest')), 200000)
        taxable = max(g - sd - hra - c80 - d80 - nps - hl, 0)
        tax = 0
        if taxable > 1000000: tax += (taxable - 1000000) * 0.3
        if taxable > 500000: tax += min(taxable - 500000, 500000) * 0.2
        if taxable > 250000: tax += min(taxable - 250000, 250000) * 0.05
        if taxable <= 500000: tax = 0
        return round(tax * 1.04)

    def _calc_new_tax(self):
        taxable = max(_safe(self.p.get('gross_annual_income')) - 75000, 0)
        slabs = [(400000, 0), (800000, 0.05), (1200000, 0.10), (1600000, 0.15), (2000000, 0.20), (2400000, 0.25), (float('inf'), 0.30)]
        tax = 0
        prev = 0
        for limit, rate in slabs:
            if taxable <= prev:
                break
            tax += (min(taxable, limit) - prev) * rate
            prev = limit
        if taxable <= 1200000: tax = 0
        if 1200000 < taxable <= 1275000: tax = min(tax, taxable - 1200000)
        return round(tax * 1.04)

    def _generate_score_history(self, current):
        import random
        now = datetime.utcnow()
        history = []
        for i in range(6):
            month_offset = 5 - i
            m = now.month - month_offset
            y = now.year
            while m <= 0:
                m += 12
                y -= 1
            d = datetime(y, m, 1)
            variation = round((random.random() - 0.6) * 40)
            score = max(min(current + variation - month_offset * 8, 900), 100)
            history.append({
                'month': d.strftime('%b') + " '" + d.strftime('%y'),
                'score': score,
            })
        return history
