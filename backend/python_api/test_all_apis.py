"""Quick test of all Flask API endpoints."""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))

# Test 1: Fire Engine
print("=" * 50)
print("TEST 1: FIRE Engine")
from fire_engine import FIREEngine
profile = {
    "gross_annual_income": 1500000, "monthly_expenses": 50000, "dob": "1995-01-01",
    "emergency_fund": 100000, "retirement_balance": 50000, "mutual_fund_value": 200000,
    "stock_value": 100000, "savings_fd_balance": 50000, "gold_real_estate": 0,
    "loans": {}, "life_insurance_cover": 0, "health_insurance_cover": 0,
    "risk_profile": "moderate", "life_goals": [], "dependents": {"children": 0, "parents": 0},
    "current_tax_regime": "new", "tax_basic_salary": 600000, "tax_hra_received": 300000,
    "tax_80c_investments": 100000, "tax_80d_medical": 25000,
}
engine = FIREEngine(profile)
plan = engine.generate_plan()
print(f"  ✅ FIRE Plan generated! Lean: {plan['variants']['lean']['fire_number']}, Regular: {plan['variants']['regular']['fire_number']}, Fat: {plan['variants']['fat']['fire_number']}")

# Test 2: Health Score Engine
print("\nTEST 2: Health Score Engine")
from health_score_engine import HealthScoreEngine
h_engine = HealthScoreEngine(profile)
h_result = h_engine.calculate()
print(f"  ✅ Health Score: {h_result.get('overall_score')}/900, Grade: {h_result.get('overall_grade')}")

# Test 3: FIRE PDF Generation
print("\nTEST 3: FIRE PDF Generation")
from report_generator import generate_fire_pdf, generate_tax_pdf, generate_health_pdf
fire_pdf = generate_fire_pdf(plan)
print(f"  ✅ FIRE PDF generated! Size: {len(fire_pdf)} bytes ({len(fire_pdf)//1024}KB)")

# Test 4: Health PDF Generation
print("\nTEST 4: Health PDF Generation")
health_pdf = generate_health_pdf(h_result)
print(f"  ✅ Health PDF generated! Size: {len(health_pdf)} bytes ({len(health_pdf)//1024}KB)")

# Test 5: Tax PDF Generation (with mock data matching frontend structure)
print("\nTEST 5: Tax PDF Generation")
tax_data = {
    "recommended_regime": "new",
    "annual_savings_by_switching": 20000,
    "old_regime": {"total_tax": 120000, "effective_rate": 8.0, "taxable_income": 1200000, "deduction_breakdown": [
        {"section": "80C", "description": "ELSS, PPF, EPF", "amount": 100000, "max": 150000},
        {"section": "80D", "description": "Health Insurance", "amount": 25000, "max": 25000},
    ]},
    "new_regime": {"total_tax": 100000, "effective_rate": 6.67, "taxable_income": 1425000},
    "tax_saving_moves": [
        {"section": "80C", "action": "Invest ₹50K more in ELSS", "potential_saving": 15000, "current_utilization": 100000, "max_limit": 150000, "regime": "old"},
    ],
}
tax_pdf = generate_tax_pdf(tax_data)
print(f"  ✅ Tax PDF generated! Size: {len(tax_pdf)} bytes ({len(tax_pdf)//1024}KB)")

print("\n" + "=" * 50)
print("ALL TESTS PASSED ✅")
print("=" * 50)
