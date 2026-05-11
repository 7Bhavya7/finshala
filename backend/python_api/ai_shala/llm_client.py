# ═══════════════════════════════════════════════
# AI SHALA — HuggingFace LLM Client
# Uses HF FREE Inference API (Serverless)
# ═══════════════════════════════════════════════

import os
import json
import httpx
import time
from typing import List, Dict, Optional

# ═══════════════════════════════════════════════
# MODEL REGISTRY — HF Free Inference Tier
# These models are available on HF serverless inference
# ═══════════════════════════════════════════════

MODELS = {
    "PRIMARY": "meta-llama/Llama-3.1-8B-Instruct:novita",
    "FAST": "microsoft/Phi-3.5-mini-instruct:novita",
    "BACKUP": "mistralai/Mistral-7B-Instruct-v0.3:novita",
}

# HF Router v1 — unified endpoint
HF_INFERENCE_BASE = "https://router.huggingface.co/v1"


class LLMClient:
    """Client for HuggingFace Free Inference API."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("HF_API_KEY", "")
        self.base_url = HF_INFERENCE_BASE
        self.client = httpx.Client(timeout=60.0)

    def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
        json_mode: bool = False,
    ) -> Dict:
        """
        Send a chat completion request to HF free inference.
        Returns dict with 'text', 'model_used', 'latency_ms', 'fallback_used'.
        """
        start = time.time()
        models_to_try = [
            model or MODELS["PRIMARY"],
            MODELS["FAST"],
            MODELS["BACKUP"],
        ]
        # Deduplicate while preserving order
        seen = set()
        unique_models = []
        for m in models_to_try:
            if m not in seen:
                seen.add(m)
                unique_models.append(m)

        for i, m in enumerate(unique_models):
            try:
                result = self._call(m, messages, max_tokens, temperature, json_mode)
                return {
                    "text": result,
                    "model_used": m,
                    "latency_ms": round((time.time() - start) * 1000),
                    "fallback_used": i > 0,
                }
            except Exception as e:
                print(f"[AI Shala LLM] Model {m} failed: {e}")
                if i == len(unique_models) - 1:
                    # All models failed — return mock
                    return {
                        "text": self._mock_response(messages),
                        "model_used": "mock-fallback",
                        "latency_ms": round((time.time() - start) * 1000),
                        "fallback_used": True,
                    }

        return {"text": "", "model_used": "none", "latency_ms": 0, "fallback_used": True}

    def _call(
        self,
        model: str,
        messages: List[Dict[str, str]],
        max_tokens: int,
        temperature: float,
        json_mode: bool,
    ) -> str:
        """Make the actual API call to HF free inference."""
        if not self.api_key:
            return self._mock_response(messages)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False,
        }

        # HF router v1: single unified endpoint
        url = f"{self.base_url}/chat/completions"

        resp = self.client.post(
            url,
            headers=headers,
            json=payload,
            timeout=45.0,
        )

        if resp.status_code == 503:
            # Model is loading — wait and retry once
            print(f"[AI Shala LLM] Model {model} loading, waiting 10s...")
            time.sleep(10)
            resp = self.client.post(url, headers=headers, json=payload, timeout=45.0)

        if resp.status_code != 200:
            raise Exception(f"HF API {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        choice = data.get("choices", [{}])[0]
        return choice.get("message", {}).get("content", "").strip()

    def chat_json(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.3,
    ) -> Dict:
        """Chat and parse response as JSON."""
        result = self.chat(messages, model, max_tokens, temperature, json_mode=True)
        text = result["text"]
        parsed = self._extract_json(text)
        result["parsed"] = parsed
        return result

    def _extract_json(self, text: str) -> Optional[Dict]:
        """Extract JSON from LLM response."""
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        import re
        match = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

        brace_start = text.find('{')
        brace_end = text.rfind('}')
        if brace_start != -1 and brace_end != -1:
            try:
                return json.loads(text[brace_start:brace_end + 1])
            except json.JSONDecodeError:
                pass

        return None

    def _mock_response(self, messages: List[Dict[str, str]]) -> str:
        """Generate clean natural language mock response when API is unavailable."""
        last_msg = messages[-1].get("content", "") if messages else ""
        low = last_msg.lower()

        if "tax" in low or "regime" in low or "deduction" in low:
            return "Based on your deductions profile, the Old Regime saves you approximately Rs 45,000 more annually. Your 80C investments and HRA exemption provide significant deductions that the New Regime's Rs 75K standard deduction cannot match. Consider investing Rs 40K more in ELSS to maximize 80C benefits and save an additional Rs 12,500 in taxes."

        if "stress" in low or "scenario" in low:
            return json.dumps({
                "scenarios": [
                    {
                        "name": "Indian Stagflation 2028",
                        "description": "Domestic inflation spikes to 9.5% while equity returns stagnate at 4% for 5 consecutive years due to global supply chain disruptions and rupee depreciation.",
                        "inflation": 0.095, "equity_return": 0.04, "debt_return": 0.065,
                        "volatility": 0.25, "duration_years": 5,
                    },
                    {
                        "name": "Market Correction 2029",
                        "description": "A 35% correction in Indian equity markets triggered by a global tech bubble burst, with slow 3-year recovery period and FII exodus.",
                        "inflation": 0.07, "equity_return": -0.05, "debt_return": 0.06,
                        "volatility": 0.35, "duration_years": 3,
                    },
                    {
                        "name": "Black Swan Pandemic 2030",
                        "description": "A new pandemic disrupts the Indian economy causing 15% salary cuts across sectors, 8% inflation, and extreme market volatility for 2 years.",
                        "inflation": 0.08, "equity_return": 0.02, "debt_return": 0.055,
                        "volatility": 0.40, "duration_years": 2,
                    },
                ]
            })

        if "explain" in low or "shap" in low or "health" in low or "score" in low:
            return "Your financial health score of 438 out of 900 places you in the Fair category. Your tax efficiency is your strongest dimension, contributing positively to your overall score. However, your emergency fund covers only 1.4 months of expenses, which is significantly below the recommended 6-month safety net and is the primary factor dragging your score down. Addressing your insurance coverage gap and building your emergency fund to at least 3 months of expenses would have the fastest impact on improving your score."

        return "Based on your financial profile, I recommend focusing on building your emergency fund to 6 months of expenses, maximizing your 80C deductions through ELSS investments, and ensuring adequate term insurance coverage of at least 10x your annual income."


# Singleton
_client = None

def get_llm_client() -> LLMClient:
    global _client
    if _client is None:
        api_key = os.environ.get("HF_API_KEY", "")
        if not api_key:
            env_candidates = [
                os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
                os.path.join(os.path.dirname(__file__), "..", ".env"),
                os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", ".env"),
            ]
            for env_path in env_candidates:
                try:
                    with open(env_path, "r") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("HF_API_KEY="):
                                api_key = line.split("=", 1)[1].strip()
                                break
                            elif line.startswith("VITE_HF_API_KEY="):
                                raw = line.split("=", 1)[1].strip()
                                # Handle doubled keys (frontend .env bug)
                                if len(raw) > 40:
                                    api_key = raw[:37]
                                else:
                                    api_key = raw
                                break
                    if api_key:
                        break
                except Exception:
                    pass
        if api_key:
            print(f"[AI Shala LLM] API key loaded ({api_key[:10]}...)")
        else:
            print("[AI Shala LLM] No API key found -- will use mock responses")
        _client = LLMClient(api_key)
    return _client
