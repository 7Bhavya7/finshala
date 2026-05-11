# ═══════════════════════════════════════════════
# AI SHALA — Flask Routes
# /api/v2/ai-shala/* endpoints
# ═══════════════════════════════════════════════

from flask import Blueprint, request, jsonify
from ai_shala.orchestrator import run_full_pipeline, run_xai_only, run_stress_only

ai_shala_bp = Blueprint('ai_shala', __name__, url_prefix='/api/v2/ai-shala')


@ai_shala_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for AI Shala subsystem."""
    from ai_shala.llm_client import get_llm_client
    client = get_llm_client()
    has_key = bool(client.api_key)
    return jsonify({
        "status": "ok",
        "service": "AI Shala — Agentic Financial Intelligence",
        "llm_configured": has_key,
        "agents": ["tax", "xai", "fire", "stress", "genui"],
        "features": [
            "Multi-Agent Orchestration",
            "Explainable AI (SHAP-style)",
            "Synthetic Stress Testing (Monte Carlo)",
            "Generative UI (Dynamic Dashboard)",
        ]
    })


@ai_shala_bp.route('/analyze', methods=['POST'])
def analyze():
    """
    Main AI Shala endpoint.
    Runs the full multi-agent pipeline:
    Tax → XAI → FIRE → Stress → GenUI
    
    Accepts user profile JSON, returns GenUI schema + insights.
    """
    try:
        profile = request.get_json(force=True)
        if not profile:
            return jsonify({"error": "No profile data provided"}), 400

        print(f"[AI Shala] Starting full analysis pipeline...")
        result = run_full_pipeline(profile)
        return jsonify(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "status": "error"}), 500


@ai_shala_bp.route('/explain-score', methods=['POST'])
def explain_score():
    """
    Standalone XAI endpoint.
    Returns SHAP-style health score decomposition.
    """
    try:
        profile = request.get_json(force=True)
        if not profile:
            return jsonify({"error": "No profile data provided"}), 400

        result = run_xai_only(profile)
        return jsonify({"status": "success", **result})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@ai_shala_bp.route('/stress-test', methods=['POST'])
def stress_test():
    """
    Standalone stress testing endpoint.
    Runs Monte Carlo simulations against AI-generated scenarios.
    """
    try:
        profile = request.get_json(force=True)
        if not profile:
            return jsonify({"error": "No profile data provided"}), 400

        result = run_stress_only(profile)
        return jsonify({"status": "success", **result})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
