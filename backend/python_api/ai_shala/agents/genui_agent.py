# ═══════════════════════════════════════════════
# AI SHALA — GenUI Agent
# Dynamically assembles UI component schema
# based on user's financial profile
# ═══════════════════════════════════════════════


def run_genui_agent(state: dict) -> dict:
    """
    Assemble a dynamic UI schema based on all analysis results.
    
    The frontend GenUIRenderer reads this JSON and dynamically
    renders React components — no static layouts.
    """
    health_data = state.get("xai_result", {})
    tax_data = state.get("tax_result", {})
    stress_data = state.get("stress_result", {})
    fire_data = state.get("fire_projections", {})
    profile = state.get("user_profile", {})

    components = []

    # ── 1. Health Score Gauge (always shown) ──
    health_score = health_data.get("health_score", 0)
    components.append({
        "type": "HealthScoreGauge",
        "priority": "high",
        "props": {
            "score": health_score,
            "grade": health_data.get("health_grade", ""),
            "label": health_data.get("health_label", ""),
            "color": health_data.get("health_color", "yellow"),
            "narrative": health_data.get("narrative", ""),
            "peer_comparison": health_data.get("peer_comparison", {}),
        }
    })

    # ── 2. SHAP Waterfall (always shown — KEY differentiator) ──
    shap_features = health_data.get("shap_features", [])
    if shap_features:
        components.append({
            "type": "ShapWaterfall",
            "priority": "high",
            "props": {
                "baseValue": health_data.get("base_value", 480),
                "finalScore": health_score,
                "features": shap_features,
                "narrative": health_data.get("narrative", ""),
            }
        })

    # ── 3. Stress Test Simulator (shown if stress results exist) ──
    stress_scenarios = stress_data.get("stress_scenarios", [])
    if stress_scenarios:
        components.append({
            "type": "StressTestSimulator",
            "priority": "high",
            "props": {
                "scenarios": stress_scenarios,
                "resilience_score": stress_data.get("resilience_score", 0),
                "resilience_label": stress_data.get("resilience_label", ""),
                "portfolio_tested": stress_data.get("portfolio_tested", {}),
                "simulations_per_scenario": stress_data.get("simulations_per_scenario", 5000),
            }
        })

    # ── 4. Tax Optimization Card (shown if there are savings) ──
    if tax_data.get("potential_savings", 0) > 0 or tax_data.get("tax_moves"):
        components.append({
            "type": "TaxOptimizationCard",
            "priority": "medium",
            "props": {
                "regime_recommendation": tax_data.get("regime_recommendation", ""),
                "old_regime_tax": tax_data.get("old_regime_tax", 0),
                "new_regime_tax": tax_data.get("new_regime_tax", 0),
                "potential_savings": tax_data.get("potential_savings", 0),
                "unused_sections": tax_data.get("unused_sections", []),
                "explanation": tax_data.get("explanation", ""),
                "tax_moves": tax_data.get("tax_moves", []),
                "effective_rate": tax_data.get("effective_rate", 0),
            }
        })

    # ── 5. FIRE Trajectory Chart (shown if FIRE data exists) ──
    if fire_data:
        comparison = fire_data.get("comparison", {})
        variants_data = fire_data.get("variants", {})
        components.append({
            "type": "FireTrajectoryChart",
            "priority": "medium",
            "props": {
                "fire_ages": comparison.get("fire_ages", {}),
                "fire_numbers": comparison.get("fire_numbers", {}),
                "years_to_fire": comparison.get("years_to_fire", {}),
                "monthly_sip_needed": comparison.get("monthly_sip_needed", {}),
                "preferred_variant": fire_data.get("preferred_variant", "regular"),
                "current_age": fire_data.get("profile_summary", {}).get("current_age", 30),
                "current_net_worth": fire_data.get("current_net_worth", 0),
                "lean_roadmap": (variants_data.get("lean", {}).get("monthly_roadmap", []) or [])[:20],
                "regular_roadmap": (variants_data.get("regular", {}).get("monthly_roadmap", []) or [])[:20],
                "fat_roadmap": (variants_data.get("fat", {}).get("monthly_roadmap", []) or [])[:20],
            }
        })

    # ── 6. Debt Avalanche Module (shown if high debt) ──
    meta = health_data.get("meta", {})
    monthly_income = meta.get("monthly_income", 0)
    total_emi = meta.get("total_emi", 0)
    emi_ratio = (total_emi / monthly_income * 100) if monthly_income > 0 else 0

    if emi_ratio > 25 or total_emi > 0:
        loans = profile.get("loans", {}) or {}
        active_loans = []
        for loan_type, loan in loans.items():
            if isinstance(loan, dict) and (loan.get("emi", 0) or 0) > 0:
                active_loans.append({
                    "type": loan_type,
                    "emi": loan.get("emi", 0),
                    "tenure": loan.get("tenure", 0),
                    "outstanding": (loan.get("emi", 0) or 0) * (loan.get("tenure", 0) or 0),
                })

        if active_loans:
            components.append({
                "type": "DebtAvalancheModule",
                "priority": "high" if emi_ratio > 40 else "medium",
                "props": {
                    "emi_to_income_ratio": round(emi_ratio, 1),
                    "total_emi": total_emi,
                    "monthly_income": monthly_income,
                    "active_loans": active_loans,
                    "urgency": "critical" if emi_ratio > 50 else ("high" if emi_ratio > 40 else "moderate"),
                }
            })

    # ── 7. Actionable Cards (always shown) ──
    top_actions = health_data.get("top_actions", [])
    # Merge tax moves into actions
    for move in tax_data.get("tax_moves", [])[:2]:
        top_actions.append({
            "priority": "high",
            "action": move.get("action", ""),
            "impact": f"Save Rs {move.get('potential_saving', 0):,} in tax",
            "estimated_benefit": f"Section {move.get('section', '')}",
        })

    if top_actions:
        components.append({
            "type": "ActionableCards",
            "priority": "medium",
            "props": {
                "actions": top_actions[:8],
            }
        })

    return {
        "layout": "adaptive",
        "components": components,
        "generated_for": {
            "health_score": health_score,
            "emi_ratio": round(emi_ratio, 1),
            "has_fire_data": bool(fire_data),
            "has_stress_data": bool(stress_scenarios),
            "components_count": len(components),
        }
    }
