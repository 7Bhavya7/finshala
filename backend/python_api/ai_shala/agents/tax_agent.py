# ═══════════════════════════════════════════════
# AI SHALA — Tax Optimization Agent
# Analyzes deductions + recommends regime
# LLM generates advice, NEVER does math
# ═══════════════════════════════════════════════

import json
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from ai_shala.llm_client import get_llm_client, MODELS


def run_tax_agent(state: dict) -> dict:
    """
    Analyze tax profile using deterministic engines + LLM advice.
    
    Expects state with 'user_profile' containing tax-relevant fields.
    Returns tax optimization dict.
    """
    profile = state.get("user_profile", {})
    income = profile.get("gross_annual_income", 0) or 0

    if income <= 0:
        return {
            "regime_recommendation": "new",
            "old_regime_tax": 0,
            "new_regime_tax": 0,
            "potential_savings": 0,
            "unused_sections": [],
            "explanation": "Income data not available for tax analysis.",
            "tax_moves": [],
        }

    # ── Deterministic tax calculations (from existing engines) ──
    old_tax = _calc_old_regime(profile)
    new_tax = _calc_new_regime(profile)
    recommended = "old" if old_tax <= new_tax else "new"
    savings = abs(old_tax - new_tax)

    # ── Find unused deduction gaps ──
    tax_moves = []
    unused_sections = []

    sec_80c = profile.get("tax_80c_investments", 0) or 0
    if sec_80c < 150000:
        gap = 150000 - sec_80c
        marginal_rate = _get_marginal_rate(income)
        tax_moves.append({
            "section": "80C",
            "current": sec_80c,
            "limit": 150000,
            "gap": gap,
            "potential_saving": round(gap * marginal_rate),
            "action": f"Invest Rs {round(gap/1000)}K in ELSS/PPF to max 80C",
        })
        unused_sections.append(f"80C gap: Rs {round(gap/1000)}K")

    nps = profile.get("tax_nps_80ccd_1b", 0) or 0
    if nps < 50000:
        gap = 50000 - nps
        marginal_rate = _get_marginal_rate(income)
        tax_moves.append({
            "section": "80CCD(1B)",
            "current": nps,
            "limit": 50000,
            "gap": gap,
            "potential_saving": round(gap * marginal_rate),
            "action": f"Rs {round(gap/1000)}K in NPS for extra deduction",
        })
        unused_sections.append(f"80CCD(1B) gap: Rs {round(gap/1000)}K")

    deps = profile.get("dependents", {}) or {}
    parent_count = deps.get("parents", 0) or 0
    d80_max = 25000 + (50000 if parent_count > 0 else 0)
    sec_80d = profile.get("tax_80d_medical", 0) or 0
    if sec_80d < d80_max:
        gap = d80_max - sec_80d
        marginal_rate = _get_marginal_rate(income)
        tax_moves.append({
            "section": "80D",
            "current": sec_80d,
            "limit": d80_max,
            "gap": gap,
            "potential_saving": round(gap * marginal_rate),
            "action": f"Increase health insurance premium by Rs {round(gap/1000)}K",
        })
        unused_sections.append(f"80D gap: Rs {round(gap/1000)}K")

    # ── LLM generates natural language explanation ──
    llm = get_llm_client()
    explanation_result = llm.chat(
        messages=[
            {
                "role": "system",
                "content": "You are a Chartered Accountant AI specializing in Indian Income Tax (FY 2024-25). Explain tax recommendations clearly in 3-4 sentences. Use INR amounts. Be specific."
            },
            {
                "role": "user",
                "content": f"""Explain this tax analysis for a person earning Rs {income/100000:.1f}L:
Old Regime Tax: Rs {old_tax}
New Regime Tax: Rs {new_tax}
Recommended: {recommended.upper()} regime (saves Rs {savings})
Unused deductions: {', '.join(unused_sections) if unused_sections else 'None'}
Total potential savings: Rs {sum(m['potential_saving'] for m in tax_moves)}

Write 3-4 sentences explaining the recommendation. Be specific with numbers."""
            }
        ],
        model=MODELS["PRIMARY"],
        max_tokens=300,
        temperature=0.3,
    )

    return {
        "regime_recommendation": recommended,
        "old_regime_tax": old_tax,
        "new_regime_tax": new_tax,
        "potential_savings": savings,
        "unused_sections": unused_sections,
        "explanation": explanation_result["text"],
        "tax_moves": tax_moves,
        "effective_rate": round((min(old_tax, new_tax) / income) * 100, 1) if income > 0 else 0,
        "llm_model": explanation_result["model_used"],
    }


# ── Deterministic Tax Calculators (copied from existing engines) ──

def _calc_old_regime(profile: dict) -> int:
    g = profile.get("gross_annual_income", 0) or 0
    sd = 50000
    basic = profile.get("tax_basic_salary", 0) or 0
    hra_recv = profile.get("tax_hra_received", 0) or 0
    rent_ann = (profile.get("tax_rent_paid", 0) or 0) * 12
    mp = 0.5 if profile.get("tax_is_metro_city", False) else 0.4

    hra = 0
    if hra_recv > 0 and rent_ann > 0:
        hra = min(hra_recv, basic * mp, max(rent_ann - 0.1 * basic, 0))

    s80c = min(profile.get("tax_80c_investments", 0) or 0, 150000)
    deps = profile.get("dependents", {}) or {}
    p_lim = 50000 if (deps.get("parents", 0) or 0) > 0 else 0
    s80d = min(profile.get("tax_80d_medical", 0) or 0, 25000 + p_lim)
    s80ccd = min(profile.get("tax_nps_80ccd_1b", 0) or 0, 50000)
    s24b = min(profile.get("tax_home_loan_interest", 0) or 0, 200000)

    taxable = max(g - sd - hra - s80c - s80d - s80ccd - s24b, 0)

    tax = 0
    if taxable > 1000000:
        tax += (taxable - 1000000) * 0.3
    if taxable > 500000:
        tax += min(taxable - 500000, 500000) * 0.2
    if taxable > 250000:
        tax += min(taxable - 250000, 250000) * 0.05
    if taxable <= 500000:
        tax = 0
    return round(tax * 1.04)


def _calc_new_regime(profile: dict) -> int:
    taxable = max((profile.get("gross_annual_income", 0) or 0) - 75000, 0)
    slabs = [
        (400000, 0), (800000, 0.05), (1200000, 0.1),
        (1600000, 0.15), (2000000, 0.2), (2400000, 0.25),
        (float("inf"), 0.3),
    ]
    tax = 0
    prev = 0
    for limit, rate in slabs:
        if taxable <= prev:
            break
        tax += (min(taxable, limit) - prev) * rate
        prev = limit

    if taxable <= 1200000:
        tax = 0
    elif taxable <= 1275000:
        tax = min(tax, taxable - 1200000)

    return round(tax * 1.04)


def _get_marginal_rate(income: float) -> float:
    if income > 1500000: return 0.30
    if income > 1200000: return 0.20
    if income > 900000: return 0.15
    if income > 600000: return 0.10
    return 0.05
