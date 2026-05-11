from health_score_engine import HealthScoreEngine
import json

profile = {
    'dob': '1993-06-15',
    'marital_status': 'married',
    'dependents': {'children': 1, 'parents': 2},
    'gross_annual_income': 1800000,
    'monthly_expenses': 50000,
    'emergency_fund': 300000,
    'retirement_balance': 250000,
    'mutual_fund_value': 800000,
    'stock_value': 400000,
    'savings_fd_balance': 600000,
    'gold_real_estate': 500000,
    'monthly_sip': 30000,
    'loans': {'home': {'emi': 15000, 'tenure': 180}},
    'missed_emi': False,
    'missed_emi_amount': 0,
    'life_insurance_cover': 5000000,
    'health_insurance_cover': 500000,
    'critical_illness_cover': False,
    'tax_basic_salary': 720000,
    'tax_hra_received': 360000,
    'tax_80c_investments': 110000,
    'tax_80d_medical': 25000,
    'current_tax_regime': 'new',
    'tax_rent_paid': 20000,
    'tax_is_metro_city': True,
    'tax_home_loan_interest': 180000,
    'tax_nps_80ccd_1b': 0,
    'risk_profile': 'moderate',
}

engine = HealthScoreEngine(profile)
result = engine.calculate()
print('Overall Score:', result['overall_score'])
print('Grade:', result['overall_grade'])
print('Label:', result['overall_label'])
print('Dimensions:')
for d in result['dimension_list']:
    print(f"  {d['name']}: {d['score']}/100 ({d['grade']})")
print('\nTop Actions:')
for a in result['top_actions'][:3]:
    print(f"  [{a['priority']}] {a['action']}")
print('\nJSON output length:', len(json.dumps(result)))
