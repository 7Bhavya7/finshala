# ═══════════════════════════════════════════════
# AI SHALA — Orchestrator
# Sequential Multi-Agent Pipeline
# Routes data through specialized agents
# LLM orchestrates, deterministic engines calculate
# ═══════════════════════════════════════════════

import sys
import os
import time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ai_shala.agents.tax_agent import run_tax_agent
from ai_shala.agents.xai_agent import run_xai_agent
from ai_shala.agents.stress_agent import run_stress_agent
from ai_shala.agents.genui_agent import run_genui_agent


def run_full_pipeline(profile: dict) -> dict:
    """
    Execute the full AI Shala agent pipeline.
    
    Pipeline:
    1. Tax Agent → tax optimization analysis
    2. XAI Agent → health score + SHAP decomposition
    3. FIRE Agent → FIRE projections (uses existing engine)
    4. Stress Agent → synthetic scenario stress testing
    5. GenUI Agent → dynamic UI schema assembly
    
    Each agent receives a shared state dict and adds its results.
    LLMs generate advice/narratives, NEVER do math.
    """
    start_time = time.time()

    # ── Initialize shared state ──
    state = {
        "user_profile": profile,
        "tax_result": {},
        "xai_result": {},
        "fire_projections": {},
        "stress_result": {},
        "ui_schema": {},
    }

    pipeline_log = []

    # ── Agent 1: Tax Optimization ──
    try:
        t0 = time.time()
        print("[AI Shala] Running Tax Agent...")
        state["tax_result"] = run_tax_agent(state)
        pipeline_log.append({"agent": "tax", "status": "success", "ms": round((time.time() - t0) * 1000)})
        print(f"[AI Shala] Tax Agent complete ({pipeline_log[-1]['ms']}ms)")
    except Exception as e:
        print(f"[AI Shala] Tax Agent failed: {e}")
        pipeline_log.append({"agent": "tax", "status": "error", "error": str(e)})

    # ── Agent 2: XAI Health Score ──
    try:
        t0 = time.time()
        print("[AI Shala] Running XAI Agent...")
        state["xai_result"] = run_xai_agent(state)
        pipeline_log.append({"agent": "xai", "status": "success", "ms": round((time.time() - t0) * 1000)})
        print(f"[AI Shala] XAI Agent complete ({pipeline_log[-1]['ms']}ms) — Score: {state['xai_result'].get('health_score')}")
    except Exception as e:
        print(f"[AI Shala] XAI Agent failed: {e}")
        pipeline_log.append({"agent": "xai", "status": "error", "error": str(e)})

    # ── Agent 3: FIRE Projections ──
    try:
        t0 = time.time()
        print("[AI Shala] Running FIRE Agent...")
        from fire_engine import FIREEngine
        engine = FIREEngine(profile)
        state["fire_projections"] = engine.generate_plan()
        pipeline_log.append({"agent": "fire", "status": "success", "ms": round((time.time() - t0) * 1000)})
        print(f"[AI Shala] FIRE Agent complete ({pipeline_log[-1]['ms']}ms)")
    except Exception as e:
        print(f"[AI Shala] FIRE Agent failed: {e}")
        pipeline_log.append({"agent": "fire", "status": "error", "error": str(e)})

    # ── Agent 4: Stress Testing ──
    try:
        t0 = time.time()
        print("[AI Shala] Running Stress Agent...")
        state["stress_result"] = run_stress_agent(state)
        pipeline_log.append({"agent": "stress", "status": "success", "ms": round((time.time() - t0) * 1000)})
        print(f"[AI Shala] Stress Agent complete ({pipeline_log[-1]['ms']}ms) — Resilience: {state['stress_result'].get('resilience_score')}%")
    except Exception as e:
        print(f"[AI Shala] Stress Agent failed: {e}")
        pipeline_log.append({"agent": "stress", "status": "error", "error": str(e)})

    # ── Agent 5: GenUI Assembly ──
    try:
        t0 = time.time()
        print("[AI Shala] Running GenUI Agent...")
        state["ui_schema"] = run_genui_agent(state)
        pipeline_log.append({"agent": "genui", "status": "success", "ms": round((time.time() - t0) * 1000)})
        print(f"[AI Shala] GenUI Agent complete — {state['ui_schema'].get('generated_for', {}).get('components_count', 0)} components")
    except Exception as e:
        print(f"[AI Shala] GenUI Agent failed: {e}")
        pipeline_log.append({"agent": "genui", "status": "error", "error": str(e)})

    total_ms = round((time.time() - start_time) * 1000)
    print(f"[AI Shala] Full pipeline complete in {total_ms}ms")

    return {
        "status": "success",
        "ui_schema": state["ui_schema"],
        "insights": {
            "health_score": state["xai_result"].get("health_score"),
            "health_grade": state["xai_result"].get("health_grade"),
            "health_label": state["xai_result"].get("health_label"),
            "shap_explanation": {
                "base_value": state["xai_result"].get("base_value"),
                "features": state["xai_result"].get("shap_features"),
                "narrative": state["xai_result"].get("narrative"),
            },
            "tax_optimization": state["tax_result"],
            "stress_test": state["stress_result"],
            "fire_summary": {
                "preferred_variant": state["fire_projections"].get("preferred_variant"),
                "comparison": state["fire_projections"].get("comparison"),
                "current_net_worth": state["fire_projections"].get("current_net_worth"),
            } if state["fire_projections"] else None,
        },
        "pipeline_log": pipeline_log,
        "total_latency_ms": total_ms,
    }


def run_xai_only(profile: dict) -> dict:
    """Run just the XAI agent for standalone health score explanation."""
    state = {"user_profile": profile}
    return run_xai_agent(state)


def run_stress_only(profile: dict) -> dict:
    """Run just the stress agent for standalone stress testing."""
    state = {"user_profile": profile, "fire_projections": {}}
    return run_stress_agent(state)
