"""Test HF router v1 with Llama 3.1 8B."""
import httpx, json

API_KEY = "hf_PLACEHOLDER_KEY_NOT_IN_REPO"
URL = "https://router.huggingface.co/v1/chat/completions"
MODEL = "meta-llama/Llama-3.1-8B-Instruct:novita"

resp = httpx.post(URL,
    headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
    json={"model": MODEL, "messages": [{"role":"user","content":"Say hello in 5 words"}], "max_tokens": 30, "temperature": 0.3},
    timeout=30.0)

print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    print(f"Model: {data.get('model','?')}")
    print(f"Reply: {data['choices'][0]['message']['content']}")
else:
    print(f"Error: {resp.text[:300]}")

with open("test_llm_result.txt", "w") as f:
    f.write(f"Status: {resp.status_code}\n{resp.text[:500]}\n")
