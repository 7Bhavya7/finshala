# ═══════════════════════════════════════════════
# FINSHALA — Form 16 PDF Parser API (Python/Flask)
# Uses pdfplumber for text extraction, pikepdf for passwords
# + AI Shala Agentic Intelligence Layer
# ═══════════════════════════════════════════════

import os
import re
import io
import json
import sys
import tempfile
import requests as py_requests

# Fix Windows cp1252 encoding for emoji output
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    os.environ['PYTHONIOENCODING'] = 'utf-8'

from flask import Flask, request, jsonify
from flask_cors import CORS

import pdfplumber
import pikepdf

app = Flask(__name__)
CORS(app)

# Register AI Shala Blueprint
try:
    from ai_shala.routes import ai_shala_bp
    app.register_blueprint(ai_shala_bp)
    print("[OK] AI Shala blueprint registered")
except Exception as e:
    print(f"[WARN] AI Shala blueprint not loaded: {e}")

# ═══════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Form16 Python API is running"})


# ═══════════════════════════════════════════════
# MAIN PARSE ENDPOINT
# ═══════════════════════════════════════════════

@app.route('/api/parse-form16', methods=['POST'])
def parse_form16():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    password = request.form.get('password', '')

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are supported"}), 400

    try:
        pdf_bytes = file.read()

        # Try to handle password-protected PDFs
        final_pdf_bytes = pdf_bytes
        if password:
            try:
                pdf_pikepdf = pikepdf.open(io.BytesIO(pdf_bytes), password=password)
                output = io.BytesIO()
                pdf_pikepdf.save(output)
                final_pdf_bytes = output.getvalue()
                pdf_pikepdf.close()
            except pikepdf.PasswordError:
                return jsonify({"error": "password_incorrect", "message": "Incorrect password. Please try again."}), 401
            except Exception as e:
                return jsonify({"error": "password_error", "message": str(e)}), 401
        else:
            # Check if file is encrypted without password
            try:
                test_pdf = pikepdf.open(io.BytesIO(pdf_bytes))
                test_pdf.close()
            except pikepdf.PasswordError:
                return jsonify({"error": "password_required", "message": "This PDF is password protected. Please provide the password."}), 401

        # Extract text using pdfplumber
        text = extract_text(final_pdf_bytes)

        if not text.strip():
            return jsonify({"error": "Could not extract text from PDF. File may be scanned/image-based."}), 400

        # Parse the text into structured Form16 data
        result = parse_form16_text(text)

        return jsonify(result)

    except Exception as e:
        error_msg = str(e).lower()
        if 'password' in error_msg or 'encrypted' in error_msg:
            return jsonify({"error": "password_required", "message": "This PDF is password protected."}), 401
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════
# TEXT EXTRACTION
# ═══════════════════════════════════════════════

def extract_text(pdf_bytes):
    """Extract all text from PDF using pdfplumber."""
    text_parts = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return ' '.join(text_parts)


# ═══════════════════════════════════════════════
# AMOUNT EXTRACTION HELPER
# ═══════════════════════════════════════════════

def extract_amount(text, patterns):
    """Try multiple regex patterns and return the first valid amount found."""
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            # Try group 1 first, then group 2
            num_str = match.group(1) if match.group(1) else (match.group(2) if match.lastindex >= 2 else '')
            num_str = num_str.replace(',', '').strip()
            try:
                num = float(num_str)
                if num >= 0:
                    return round(num)
            except (ValueError, TypeError):
                continue
    return 0


# ═══════════════════════════════════════════════
# FORM 16 TEXT PARSER
# ═══════════════════════════════════════════════

def parse_form16_text(text):
    """Parse extracted text into ParsedForm16 structure."""

    # Clean the text
    text_clean = re.sub(r'\s+', ' ', text).strip()

    # ── Basic Info ──
    financial_year = extract_field(text_clean, r'(?:Financial\s*Year|F\.?Y\.?)\s*[:\-]?\s*(20\d{2}\s*[-–]\s*\d{2,4})', '2024-25')
    assessment_year = extract_field(text_clean, r'(?:Assessment\s*Year|A\.?Y\.?)\s*[:\-]?\s*(20\d{2}\s*[-–]\s*\d{2,4})', '2025-26')

    employer_name = extract_field(
        text_clean,
        r'(?:Name\s*(?:and\s*address\s*)?of\s*(?:the\s*)?(?:Employer|Deductor))\s*[:\-]?\s*([A-Z][A-Za-z\s&.,\'()]+?)(?=\s*(?:TAN|PAN|Address|City))',
        'Employer'
    )
    if len(employer_name) > 100:
        employer_name = employer_name[:100]

    employer_tan = extract_field(text_clean, r'(?:TAN)\s*[:\-]?\s*([A-Z]{4}\d{5}[A-Z])', '')
    employee_name = extract_field(
        text_clean,
        r'(?:Name\s*of\s*(?:the\s*)?(?:Employee|Person))\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s*(?:PAN|Address|Designation))',
        ''
    )
    if len(employee_name) > 80:
        employee_name = employee_name[:80]

    employee_pan = extract_field(text_clean, r'(?:PAN\s*(?:of\s*(?:the\s*)?(?:Employee|Deductee))?\s*[:\-]?\s*)([A-Z]{5}\d{4}[A-Z])', '')

    # ── Salary ──
    gross_salary = extract_amount(text_clean, [
        r'(?:Gross\s*Salary|17\s*\(\s*1\s*\))\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
        r'(?:Salary\s*as\s*per\s*(?:provisions|section)\s*17\s*\(\s*1\s*\))\s*[:\-]?\s*([0-9,]+)',
    ])

    perquisites = extract_amount(text_clean, [
        r'(?:Perquisites|17\s*\(\s*2\s*\))\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    profits_in_lieu = extract_amount(text_clean, [
        r'(?:Profits?\s*in\s*lieu|17\s*\(\s*3\s*\))\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    total_gross = gross_salary + perquisites + profits_in_lieu

    basic_salary = extract_amount(text_clean, [
        r'(?:Basic\s*(?:Salary|Pay))\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    hra_received = extract_amount(text_clean, [
        r'(?:House\s*Rent\s*Allowance|HRA)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    special_allowance = extract_amount(text_clean, [
        r'(?:Special\s*Allowance)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    lta = extract_amount(text_clean, [
        r'(?:Leave\s*Travel\s*(?:Allowance|Concession)|LTA|LTC)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    # If basic not found but gross exists, estimate
    if basic_salary == 0 and gross_salary > 0:
        basic_salary = round(gross_salary * 0.40)
        hra_received = hra_received or round(gross_salary * 0.20)
        special_allowance = round(gross_salary - basic_salary - hra_received - lta)

    # ── Exemptions ──
    hra_exemption = extract_amount(text_clean, [
        r'(?:HRA\s*(?:Exemption|exempt)|House\s*Rent\s*Allowance\s*(?:u/s|under\s*section)\s*10)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
        r'(?:Allowance.*?10\s*\(\s*13A\s*\))\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    lta_exemption = extract_amount(text_clean, [
        r'(?:LTA|LTC|Leave\s*Travel)\s*(?:Exemption|exempt)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
        r'(?:10\s*\(\s*5\s*\))\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    standard_deduction = extract_amount(text_clean, [
        r'(?:Standard\s*Deduction)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
        r'(?:16\s*\(\s*ia?\s*\))\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ]) or 50000

    professional_tax = extract_amount(text_clean, [
        r'(?:Professional\s*Tax|Tax\s*on\s*Employment)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
        r'(?:16\s*\(\s*iii\s*\))\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    total_exemptions = hra_exemption + lta_exemption + standard_deduction + professional_tax

    # ── Deductions ──
    sec_80c = extract_amount(text_clean, [
        r'(?:80\s*C(?:\s|[^C])|Section\s*80C\b)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    sec_80ccd_1b = extract_amount(text_clean, [
        r'(?:80\s*CCD\s*\(\s*1B\s*\))\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    sec_80ccd_2 = extract_amount(text_clean, [
        r'(?:80\s*CCD\s*\(\s*2\s*\))\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    sec_80d = extract_amount(text_clean, [
        r'(?:80\s*D|Section\s*80D)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    sec_80e = extract_amount(text_clean, [
        r'(?:80\s*E|Section\s*80E)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    sec_80g = extract_amount(text_clean, [
        r'(?:80\s*G|Section\s*80G)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    sec_80tta = extract_amount(text_clean, [
        r'(?:80\s*TTA|Section\s*80TTA)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    sec_24b = extract_amount(text_clean, [
        r'(?:24\s*\(\s*b\s*\)|Section\s*24|Income\s*from\s*House\s*Property.*?(?:loss|interest))\s*[:\-]?\s*-?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    total_80c_group = min(sec_80c, 150000)

    total_deductions = (
        total_80c_group + sec_80ccd_1b + sec_80ccd_2 +
        sec_80d + sec_80e + sec_80g + sec_80tta + sec_24b
    )

    # ── Tax Computation ──
    gross_total_income = total_gross - total_exemptions

    total_taxable_income = extract_amount(text_clean, [
        r'(?:Total\s*(?:Taxable\s*)?Income|Total\s*Income\s*(?:after|net))\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ]) or max(gross_total_income - total_deductions, 0)

    tax_on_income = extract_amount(text_clean, [
        r'(?:Tax\s*(?:on|payable\s*on)\s*(?:Total\s*)?Income)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    surcharge = extract_amount(text_clean, [
        r'(?:Surcharge)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    cess = extract_amount(text_clean, [
        r'(?:Cess|Health\s*(?:and|&)\s*Education\s*Cess)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    total_tax = tax_on_income + surcharge + cess

    relief_89 = extract_amount(text_clean, [
        r'(?:Relief\s*(?:u/s|under)\s*89)\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    net_tax = max(total_tax - relief_89, 0)

    # Regime detection
    has_new_regime = bool(re.search(r'(?:new\s*(?:tax\s*)?regime|section\s*115BAC|115\s*BAC)', text_clean, re.IGNORECASE))
    regime_used = 'new' if has_new_regime else 'old'

    # ── TDS ──
    tds_deducted = extract_amount(text_clean, [
        r'(?:Tax\s*Deducted\s*at\s*Source|TDS\s*(?:Deducted|Amount))\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
        r'(?:Total\s*(?:Tax\s*)?(?:Deducted|TDS))\s*[:\-]?\s*(?:Rs\.?\s*)?([0-9,]+)',
    ])

    balance_tax = net_tax - tds_deducted

    # ── Confidence Score ──
    confidence = 0
    if gross_salary > 0:
        confidence += 25
    if len(employee_pan) == 10:
        confidence += 15
    if len(employer_tan) == 10:
        confidence += 10
    if total_deductions >= 0:
        confidence += 10
    if total_taxable_income > 0:
        confidence += 15
    if tds_deducted > 0:
        confidence += 15
    if standard_deduction > 0:
        confidence += 10
    confidence = min(confidence, 100)

    # ── Build result matching ParsedForm16 interface ──
    result = {
        "financial_year": financial_year,
        "assessment_year": assessment_year,
        "employer_name": employer_name,
        "employer_tan": employer_tan,
        "employee_name": employee_name,
        "employee_pan": employee_pan,
        "parse_confidence": confidence,
        "total_tds_deposited": tds_deducted,
        "quarter_wise_tds": [],
        "salary": {
            "basic_salary": basic_salary,
            "hra_received": hra_received,
            "special_allowance": special_allowance,
            "lta": lta,
            "other_allowances": 0,
            "gross_salary": gross_salary,
            "perquisites": perquisites,
            "profits_in_lieu": profits_in_lieu,
            "total_gross": total_gross,
        },
        "exemptions": {
            "hra_exemption": hra_exemption,
            "lta_exemption": lta_exemption,
            "standard_deduction": standard_deduction,
            "professional_tax": professional_tax,
            "other_exemptions": 0,
            "total_exemptions": total_exemptions,
        },
        "other_income": {
            "house_property": -sec_24b,
            "other_sources": 0,
        },
        "gross_total_income": gross_total_income,
        "deductions": {
            "sec_80c": sec_80c,
            "sec_80ccc": 0,
            "sec_80ccd_1": 0,
            "sec_80ccd_1b": sec_80ccd_1b,
            "sec_80ccd_2": sec_80ccd_2,
            "total_80c_group": total_80c_group,
            "sec_80d": sec_80d,
            "sec_80e": sec_80e,
            "sec_80g": sec_80g,
            "sec_80tta": sec_80tta,
            "sec_80u": 0,
            "sec_24b": sec_24b,
            "other_deductions": 0,
            "total_deductions": total_deductions,
        },
        "tax_computation": {
            "total_taxable_income": total_taxable_income,
            "tax_on_income": tax_on_income,
            "surcharge": surcharge,
            "cess": cess,
            "total_tax": total_tax,
            "relief_89": relief_89,
            "net_tax": net_tax,
            "tds_deducted": tds_deducted,
            "balance_tax": balance_tax,
            "regime_used": regime_used,
        },
        "raw_text_preview": text_clean[:500],
    }

    return result


def extract_field(text, pattern, default=''):
    """Extract a text field using regex pattern."""
    match = re.search(pattern, text, re.IGNORECASE)
    return match.group(1).strip() if match else default


# ═══════════════════════════════════════════════
# MONEY HEALTH SCORE ENDPOINT
# ═══════════════════════════════════════════════

from health_score_engine import HealthScoreEngine

@app.route('/api/calculate-health-score', methods=['POST'])
def calculate_health_score():
    """Accept a HealthProfile JSON, return full HealthScoreResult."""
    try:
        profile = request.get_json(force=True)
        if not profile:
            return jsonify({"error": "No JSON body provided"}), 400

        print(f"✅ Python Engine is calculating health score for user profile...")
        engine = HealthScoreEngine(profile)
        result = engine.calculate()
        print(f"✅ Calculation complete! Overall Score: {result['overall_score']}")
        return jsonify(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════
# FIRE PLAN ENDPOINT
# ═══════════════════════════════════════════════

from fire_engine import FIREEngine

@app.route('/api/calculate-fire-plan', methods=['POST'])
def calculate_fire_plan():
    """Accept a FIRE profile JSON, return full Lean/Regular/Fat scenarios."""
    try:
        profile = request.get_json(force=True)
        if not profile:
            return jsonify({"error": "No JSON body provided"}), 400

        print(f"🔥 Python Engine is generating FIRE plan for user profile...")
        engine = FIREEngine(profile)
        plan = engine.generate_plan()
        print(f"🔥 FIRE plan generated successfully! Plan preferred variant: {plan.get('preferred_variant')}")
        return jsonify(plan)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════
# REPORT GENERATION ENDPOINTS
# ═══════════════════════════════════════════════

from report_generator import generate_fire_pdf, generate_tax_pdf, generate_health_pdf
from flask import send_file

@app.route('/api/generate-report/<report_type>', methods=['POST'])
def generate_report(report_type):
    """Generate and return structured PDF reports."""
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        print(f"📄 Generating {report_type.upper()} PDF report via Python Engine...")
        
        if report_type == 'fire':
            pdf_bytes = generate_fire_pdf(data)
            filename = "Finshala_FIRE_Report.pdf"
        elif report_type == 'tax':
            pdf_bytes = generate_tax_pdf(data)
            filename = "Finshala_Tax_Report.pdf"
        elif report_type == 'health':
            pdf_bytes = generate_health_pdf(data)
            filename = "Finshala_Health_Score_Report.pdf"
        else:
            return jsonify({"error": "Invalid report type"}), 400

        response = send_file(
            io.BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
        # Add headers to make the download safe and trusted
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ═══════════════════════════════════════════════
# CHATBOT ENDPOINT — Ollama llama3.1:8b
# ═══════════════════════════════════════════════

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
CHAT_MODEL = os.environ.get("CHAT_MODEL", "llama3.1:8b")

FINSHALA_SYSTEM_PROMPT = """You are Finshala AI — a warm, knowledgeable Indian financial advisor assistant.
You help users with:
- Tax planning (Old vs New regime, 80C, 80D, HRA, Section 24b)
- FIRE planning (Financial Independence, Retire Early)
- Money Health Score analysis
- Investment advice (SIP, mutual funds, ELSS, NPS, PPF)
- Insurance guidance (term, health)
- General personal finance questions

Rules:
- Be concise but helpful. Use bullet points when listing.
- Use Indian Rupee (₹) for amounts.
- Reference Indian tax laws and financial products.
- Be friendly and conversational. Use simple language.
- If unsure, say so honestly.
- Keep responses under 200 words unless the user asks for detail."""


@app.route('/api/chat', methods=['POST'])
def chatbot():
    """Chat endpoint using Ollama llama3.1:8b for fast local inference."""
    try:
        body = request.get_json(force=True)
        user_message = body.get("message", "").strip()
        history = body.get("history", [])

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # Build messages array
        messages = [{"role": "system", "content": FINSHALA_SYSTEM_PROMPT}]

        # Add conversation history (last 10 messages to keep context manageable)
        for msg in history[-10:]:
            role = "assistant" if msg.get("role") == "bot" else "user"
            messages.append({"role": role, "content": msg.get("content", "")})

        messages.append({"role": "user", "content": user_message})

        # Call Ollama
        try:
            resp = py_requests.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": CHAT_MODEL,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 512,
                    }
                },
                timeout=60
            )

            if resp.status_code == 200:
                data = resp.json()
                reply = data.get("message", {}).get("content", "").strip()
                if reply:
                    return jsonify({"reply": reply, "model": CHAT_MODEL})

            # If Ollama fails, try with the model name without tag
            print(f"[Chatbot] Ollama returned {resp.status_code}, trying fallback...")
        except Exception as e:
            print(f"[Chatbot] Ollama connection failed: {e}")

        # Fallback: use HF LLM client if available
        try:
            from ai_shala.llm_client import get_llm_client
            client = get_llm_client()
            result = client.chat(messages, max_tokens=512, temperature=0.7)
            return jsonify({"reply": result["text"], "model": result["model_used"]})
        except Exception as e2:
            print(f"[Chatbot] HF fallback also failed: {e2}")

        # Final fallback
        return jsonify({
            "reply": "I'm having trouble connecting to my AI engine right now. Please make sure Ollama is running with llama3.1:8b model. You can start it with: `ollama run llama3.1:8b`",
            "model": "fallback"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════
# RUN
# ═══════════════════════════════════════════════

if __name__ == '__main__':
    print("Finshala Python API running on http://localhost:5000")
    print("Endpoints:")
    print("   GET  /api/health                  - Health check")
    print("   POST /api/parse-form16            - Upload & parse Form 16 PDF")
    print("   POST /api/calculate-health-score  - Money Health Score calculation")
    print("   POST /api/calculate-fire-plan     - FIRE planning engine")
    print("   POST /api/generate-report/<type>  - PDF Report Generation")
    print("   POST /api/chat                    - Chatbot (Ollama llama3.1:8b)")
    print("   --- AI Shala (Agentic AI) ---")
    print("   GET  /api/v2/ai-shala/health      - AI Shala health check")
    print("   POST /api/v2/ai-shala/analyze     - Full AI pipeline")
    print("   POST /api/v2/ai-shala/explain-score - XAI explanation")
    print("   POST /api/v2/ai-shala/stress-test - Stress testing")
    app.run(host='0.0.0.0', port=5000, debug=True)
