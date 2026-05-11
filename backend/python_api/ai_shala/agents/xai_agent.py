# ═══════════════════════════════════════════════
# AI SHALA — XAI (Explainable AI) Agent
# Pseudo-SHAP decomposition of Health Score
# Uses existing HealthScoreEngine sub-scores as feature attributions
# ═══════════════════════════════════════════════

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from health_score_engine import HealthScoreEngine
from ai_shala.llm_client import get_llm_client, MODELS


def run_xai_agent(state: dict) -> dict:
    """
    Generate SHAP-style explainable breakdown of health score.
    
    1. Runs deterministic HealthScoreEngine
    2. Decomposes score into per-dimension attributions
    3. LLM generates human-readable explanation
    
    Returns SHAP-style waterfall data + narrative.
    """
    profile = state.get("user_profile", {})

    # ── Run deterministic health score engine ──
    try:
        engine = HealthScoreEngine(profile)
        health_result = engine.calculate()
    except Exception as e:
        return {
            "health_score": 0,
            "health_grade": "F",
            "health_label": "Error",
            "shap_features": [],
            "narrative": f"Could not calculate health score: {str(e)}",
            "health_result": {},
        }

    overall_score = health_result["overall_score"]
    dimensions = health_result["dimensions"]

    # ── Build pseudo-SHAP waterfall ──
    # Base value = average expected score (population average)
    base_value = 480  # Average score across Indian users

    # Weight each dimension's contribution
    weights = {
        "emergency": 0.20,
        "insurance": 0.20,
        "investment": 0.15,
        "debt": 0.15,
        "tax": 0.15,
        "retirement": 0.15,
    }

    # Average expected per-dimension score
    avg_dimension_score = 53  # ~480/9 weighted

    shap_features = []
    running_total = base_value

    for dim_id, weight in weights.items():
        dim = dimensions.get(dim_id, {})
        dim_score = dim.get("score", 0)
        # Impact = how much this dimension pushes score above/below average
        impact = round((dim_score - avg_dimension_score) * weight * 9)
        running_total += impact

        shap_features.append({
            "name": dim.get("name", dim_id.title()),
            "dimension_id": dim_id,
            "raw_score": dim_score,
            "grade": dim.get("grade", ""),
            "impact": impact,
            "direction": "positive" if impact >= 0 else "negative",
            "magnitude": abs(impact),
            "description": dim.get("description", ""),
            "emoji": dim.get("emoji", ""),
        })

    # Sort by magnitude (largest impact first)
    shap_features.sort(key=lambda x: x["magnitude"], reverse=True)

    # ── LLM generates empathetic narrative ──
    feature_summary = "\n".join([
        f"- {f['name']}: {'+' if f['impact'] >= 0 else ''}{f['impact']} points ({f['grade']}, {f['description']})"
        for f in shap_features
    ])

    llm = get_llm_client()
    narrative_result = llm.chat(
        messages=[
            {
                "role": "system",
                "content": "You are a financial wellness coach. Explain health scores in a warm, motivational yet honest tone. Use Indian financial context. Keep to 4-5 sentences maximum."
            },
            {
                "role": "user",
                "content": f"""Explain this financial health score breakdown to the user:

Overall Score: {overall_score}/900 ({health_result['overall_label']})
Base Expected Score: {base_value} (population average)

Feature Attributions (what pushes your score up/down):
{feature_summary}

Write 4-5 sentences. Start with the score, highlight the strongest positive factor, then the biggest drag, and end with one specific actionable suggestion."""
            }
        ],
        model=MODELS["PRIMARY"],
        max_tokens=250,
        temperature=0.5,
    )

    return {
        "health_score": overall_score,
        "health_grade": health_result["overall_grade"],
        "health_label": health_result["overall_label"],
        "health_color": health_result["overall_color"],
        "base_value": base_value,
        "shap_features": shap_features,
        "narrative": narrative_result["text"],
        "narrative_model": narrative_result["model_used"],
        "dimensions": health_result["dimension_list"],
        "top_actions": health_result["top_actions"],
        "peer_comparison": health_result["peer_comparison"],
        "meta": health_result["meta"],
        "health_result": health_result,
    }
