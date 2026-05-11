# ═══════════════════════════════════════════════
# AI SHALA — Synthetic Stress Testing Agent
# LLM generates scenarios + Monte Carlo simulation
# ═══════════════════════════════════════════════

import math
import random
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from ai_shala.llm_client import get_llm_client, MODELS

# Default stress scenarios (used if LLM fails)
DEFAULT_SCENARIOS = [
    {
        "name": "Indian Stagflation 2028",
        "description": "Domestic inflation spikes to 9.5% while equity returns stagnate at 4% for 5 consecutive years due to global supply chain disruptions and rupee depreciation.",
        "inflation": 0.095,
        "equity_return": 0.04,
        "debt_return": 0.065,
        "volatility": 0.25,
        "duration_years": 5,
    },
    {
        "name": "Market Correction 2029",
        "description": "A 35% correction in Indian equity markets triggered by a global tech bubble burst, with slow 3-year recovery period and FII exodus.",
        "inflation": 0.07,
        "equity_return": -0.05,
        "debt_return": 0.06,
        "volatility": 0.35,
        "duration_years": 3,
    },
    {
        "name": "Black Swan Pandemic 2030",
        "description": "A new pandemic disrupts the Indian economy causing 15% salary cuts across sectors, 8% inflation, and extreme market volatility for 2 years.",
        "inflation": 0.08,
        "equity_return": 0.02,
        "debt_return": 0.055,
        "volatility": 0.40,
        "duration_years": 2,
    },
]


def run_stress_agent(state: dict) -> dict:
    """
    Generate synthetic stress scenarios and run Monte Carlo simulations.
    
    1. LLM generates plausible Indian economic crisis scenarios
    2. Monte Carlo simulation (10,000 runs) tests portfolio survival
    3. Returns survival probabilities and depletion analysis
    """
    profile = state.get("user_profile", {})
    fire_data = state.get("fire_projections", {})

    # ── Get current portfolio ──
    current_corpus = (
        (profile.get("emergency_fund", 0) or 0) +
        (profile.get("retirement_balance", 0) or 0) +
        (profile.get("mutual_fund_value", 0) or 0) +
        (profile.get("stock_value", 0) or 0) +
        (profile.get("savings_fd_balance", 0) or 0) +
        (profile.get("gold_real_estate", 0) or 0)
    )

    monthly_expenses = profile.get("monthly_expenses", 50000) or 50000
    monthly_sip = profile.get("monthly_sip", 0) or 0
    current_age = _get_age(profile)
    years_to_retire = max(60 - current_age, 1)

    # ── Get scenarios from LLM ──
    scenarios = _generate_scenarios_llm()

    # ── Run Monte Carlo for each scenario ──
    results = []
    for scenario in scenarios:
        sim = _monte_carlo_simulation(
            current_corpus=current_corpus,
            monthly_expenses=monthly_expenses,
            monthly_sip=monthly_sip,
            years=years_to_retire,
            scenario=scenario,
            num_simulations=5000,
        )
        results.append({
            "scenario_name": scenario["name"],
            "narrative": scenario["description"],
            "parameters": {
                "inflation": scenario["inflation"],
                "equity_return": scenario["equity_return"],
                "debt_return": scenario["debt_return"],
                "volatility": scenario["volatility"],
                "duration_years": scenario["duration_years"],
            },
            "survival_probability": sim["survival_rate"],
            "median_final_corpus": sim["median_final_corpus"],
            "worst_case_corpus": sim["worst_case_corpus"],
            "best_case_corpus": sim["best_case_corpus"],
            "corpus_depletion_risk": sim["depletion_risk"],
            "breakeven_probability": sim["breakeven_probability"],
            "recommended_adjustment": _get_recommendation(sim, scenario),
        })

    # ── Calculate overall resilience score ──
    avg_survival = sum(r["survival_probability"] for r in results) / len(results) if results else 0
    resilience_score = round(avg_survival * 100)

    return {
        "stress_scenarios": results,
        "resilience_score": resilience_score,
        "resilience_label": _get_resilience_label(resilience_score),
        "portfolio_tested": {
            "current_corpus": current_corpus,
            "monthly_expenses": monthly_expenses,
            "monthly_sip": monthly_sip,
            "years_simulated": years_to_retire,
        },
        "simulations_per_scenario": 5000,
    }


def _generate_scenarios_llm() -> list:
    """Use LLM to generate stress scenarios, fallback to defaults."""
    try:
        llm = get_llm_client()
        result = llm.chat_json(
            messages=[
                {
                    "role": "system",
                    "content": "You are a macroeconomic analyst specializing in Indian markets. Generate stress test scenarios as structured JSON."
                },
                {
                    "role": "user",
                    "content": """Generate exactly 3 severe but plausible Indian economic stress scenarios for portfolio testing.
Return as JSON with this exact structure:
{
    "scenarios": [
        {
            "name": "Scenario Name",
            "description": "2-3 sentence description of what causes this crisis",
            "inflation": 0.09,
            "equity_return": 0.03,
            "debt_return": 0.06,
            "volatility": 0.30,
            "duration_years": 4
        }
    ]
}
Include: 1) Stagflation scenario, 2) Market crash scenario, 3) Black swan event.
Use realistic Indian market parameters."""
                }
            ],
            model=MODELS["PRIMARY"],
            max_tokens=600,
            temperature=0.4,
        )

        parsed = result.get("parsed")
        if parsed and "scenarios" in parsed and len(parsed["scenarios"]) >= 3:
            return parsed["scenarios"][:3]
    except Exception as e:
        print(f"[Stress Agent] LLM scenario generation failed: {e}")

    return DEFAULT_SCENARIOS


def _monte_carlo_simulation(
    current_corpus: float,
    monthly_expenses: float,
    monthly_sip: float,
    years: int,
    scenario: dict,
    num_simulations: int = 5000,
) -> dict:
    """
    Run Monte Carlo simulation for portfolio under stress scenario.
    Returns survival statistics.
    """
    stress_inflation = scenario.get("inflation", 0.06)
    stress_equity_return = scenario.get("equity_return", 0.04)
    stress_debt_return = scenario.get("debt_return", 0.06)
    stress_volatility = scenario.get("volatility", 0.25)
    stress_duration = scenario.get("duration_years", 3)

    # Normal parameters (after stress period)
    normal_inflation = 0.06
    normal_equity_return = 0.12
    normal_debt_return = 0.07
    normal_volatility = 0.15

    months = years * 12
    final_corpuses = []
    depleted_count = 0
    breakeven_count = 0

    for _ in range(num_simulations):
        corpus = current_corpus
        expenses = monthly_expenses
        sip = monthly_sip

        for month in range(1, months + 1):
            year_of_sim = month // 12
            in_stress = year_of_sim < stress_duration

            # Parameters based on stress or normal
            if in_stress:
                monthly_return_mean = ((1 + stress_equity_return * 0.6 + stress_debt_return * 0.4) ** (1/12)) - 1
                vol = stress_volatility / (12 ** 0.5)
                monthly_inflation = (1 + stress_inflation) ** (1/12) - 1
            else:
                monthly_return_mean = ((1 + normal_equity_return * 0.6 + normal_debt_return * 0.4) ** (1/12)) - 1
                vol = normal_volatility / (12 ** 0.5)
                monthly_inflation = (1 + normal_inflation) ** (1/12) - 1

            # Random return with volatility
            random_return = random.gauss(monthly_return_mean, vol)

            # Grow corpus
            corpus = corpus * (1 + random_return) + sip

            # Inflate expenses annually
            if month % 12 == 0:
                expenses *= (1 + (stress_inflation if in_stress else normal_inflation))
                sip *= 1.08  # Salary growth

        final_corpuses.append(corpus)
        if corpus <= 0:
            depleted_count += 1
        fire_number = expenses * 12 / 0.035  # 3.5% SWR
        if corpus >= fire_number:
            breakeven_count += 1

    final_corpuses.sort()
    n = len(final_corpuses)

    return {
        "survival_rate": round(1 - (depleted_count / n), 3),
        "depletion_risk": round(depleted_count / n, 3),
        "breakeven_probability": round(breakeven_count / n, 3),
        "median_final_corpus": round(final_corpuses[n // 2]),
        "worst_case_corpus": round(final_corpuses[int(n * 0.05)]),  # 5th percentile
        "best_case_corpus": round(final_corpuses[int(n * 0.95)]),  # 95th percentile
    }


def _get_recommendation(sim: dict, scenario: dict) -> str:
    """Generate recommendation based on simulation results."""
    survival = sim["survival_rate"]
    if survival >= 0.95:
        return f"Your portfolio shows strong resilience against {scenario['name']}. Maintain current strategy."
    elif survival >= 0.80:
        return f"Moderate risk under {scenario['name']}. Consider increasing debt allocation by 10% as a buffer."
    elif survival >= 0.60:
        return f"Significant vulnerability to {scenario['name']}. Increase emergency fund to 9 months and add 20% more to debt instruments."
    else:
        return f"Critical risk under {scenario['name']}. Urgently reduce expenses, increase SIP by 30%, and shift 25% portfolio to debt."


def _get_resilience_label(score: int) -> str:
    if score >= 90: return "Fortress"
    if score >= 75: return "Resilient"
    if score >= 60: return "Moderate"
    if score >= 40: return "Vulnerable"
    return "Critical"


def _get_age(profile: dict) -> int:
    from datetime import datetime, date
    dob_str = profile.get("dob", "1995-01-01")
    try:
        dob = datetime.strptime(str(dob_str), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return 30
    today = date.today()
    age = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        age -= 1
    return max(age, 18)
