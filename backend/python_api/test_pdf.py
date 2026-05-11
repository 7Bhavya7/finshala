import json
from report_generator import generate_fire_pdf

# An empty profile plan simulating TS execution fallback or empty input
plan = {
    "preferred_variant": "regular",
    "variants": {
        "regular": {
            "fire_number": None,
            "fire_age": None,
            "years_to_fire": None,
            "required_monthly_sip": None,
            "savings_rate_needed": 0,
            "feasibility": "unrealistic"
        },
        "lean": {
            "fire_number": None,
            "fire_age": None,
            "years_to_fire": None,
            "required_monthly_sip": None
        },
        "fat": {
            "fire_number": None,
            "fire_age": None,
            "years_to_fire": None,
            "required_monthly_sip": None
        }
    },
    "current_net_worth": 100000
}

pdf_bytes = generate_fire_pdf(plan)
with open("test.pdf", "wb") as f:
    f.write(pdf_bytes)
print("PDF generated successfully.")
