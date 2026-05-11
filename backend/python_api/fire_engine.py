# ═══════════════════════════════════════════════════════════════
# FIRE ENGINE — Python Backend (Flask Compatible)
# Generates Lean / Regular / Fat FIRE plans from profile data
# Port of fire-engine.ts
# ═══════════════════════════════════════════════════════════════

import math
import json
import copy
from datetime import datetime, date


# ═══════════════════════════════════════════════════════════════
# ASSUMPTIONS
# ═══════════════════════════════════════════════════════════════

ASSUMPTIONS = {
    "inflation": 0.06,
    "equity_return": 0.12,
    "debt_return": 0.07,
    "gold_return": 0.08,
    "real_estate_return": 0.09,
    "salary_growth": 0.08,
    "expense_growth": 0.06,
    "life_expectancy": 85,
}


# ═══════════════════════════════════════════════════════════════
# FIRE ENGINE CLASS
# ═══════════════════════════════════════════════════════════════

class FIREEngine:
    def __init__(self, profile: dict):
        self.profile = {**profile}
        self.assumptions = {**ASSUMPTIONS}

        # Recursively convert numeric strings to floats/ints
        def _cast_numbers(d):
            if isinstance(d, dict):
                for k, v in d.items():
                    if isinstance(v, str) and v.lstrip('-').replace('.', '', 1).isdigit():
                        d[k] = float(v) if '.' in v else int(v)
                    elif isinstance(v, dict):
                        _cast_numbers(v)
                    elif isinstance(v, list):
                        for item in v:
                            _cast_numbers(item)
            return d
            
        self.profile = _cast_numbers(self.profile)

        # Auto-fill lean/fat if user didn't set them
        monthly = self.profile.get("monthly_expenses", 0) or 0
        if not self.profile.get("lean_monthly_expenses"):
            self.profile["lean_monthly_expenses"] = round(monthly * 0.6)
        if not self.profile.get("fat_monthly_expenses"):
            self.profile["fat_monthly_expenses"] = round(monthly * 1.5)

    # ────────────── MAIN ENTRY ──────────────

    def generate_plan(self) -> dict:
        print("[FIRE Engine] Generating FIRE plan...")
        summary = self._build_profile_summary()
        glide_path = self._build_glide_path(summary["current_age"])
        tax_analysis = self._analyze_taxes()
        insurance_gaps = self._analyze_insurance_gaps(summary)

        variant_configs = self._build_variant_configs()

        lean_result = self._simulate_variant(variant_configs["lean"], summary, glide_path)
        regular_result = self._simulate_variant(variant_configs["regular"], summary, glide_path)
        fat_result = self._simulate_variant(variant_configs["fat"], summary, glide_path)

        print(f"[FIRE Engine] Lean FIRE Number: {lean_result['fire_number']}, Age: {lean_result['fire_age']}")
        print(f"[FIRE Engine] Regular FIRE Number: {regular_result['fire_number']}, Age: {regular_result['fire_age']}")
        print(f"[FIRE Engine] Fat FIRE Number: {fat_result['fire_number']}, Age: {fat_result['fire_age']}")

        return {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "profile_summary": summary,
            "preferred_variant": self.profile.get("fire_variant_preference", "regular"),
            "variants": {
                "lean": lean_result,
                "regular": regular_result,
                "fat": fat_result,
            },
            "comparison": {
                "fire_numbers": {
                    "lean": lean_result["fire_number"],
                    "regular": regular_result["fire_number"],
                    "fat": fat_result["fire_number"],
                },
                "fire_ages": {
                    "lean": lean_result["fire_age"],
                    "regular": regular_result["fire_age"],
                    "fat": fat_result["fire_age"],
                },
                "years_to_fire": {
                    "lean": lean_result["years_to_fire"],
                    "regular": regular_result["years_to_fire"],
                    "fat": fat_result["years_to_fire"],
                },
                "monthly_sip_needed": {
                    "lean": lean_result["required_monthly_sip"],
                    "regular": regular_result["required_monthly_sip"],
                    "fat": fat_result["required_monthly_sip"],
                },
            },
            "insurance_gaps": insurance_gaps,
            "tax_analysis": tax_analysis,
            "glide_path": glide_path,
            "current_net_worth": summary["current_net_worth"],
        }

    # ────────────── VARIANT CONFIGS ──────────────

    def _build_variant_configs(self) -> dict:
        regular = self.profile.get("monthly_expenses", 0) or 0
        lean_exp = self.profile.get("lean_monthly_expenses", round(regular * 0.6))
        fat_exp = self.profile.get("fat_monthly_expenses", round(regular * 1.5))

        return {
            "lean": {
                "variant": "lean",
                "label": "Lean FIRE",
                "emoji": "🌿",
                "description": "Minimalist lifestyle — cover only essentials",
                "monthly_expenses": lean_exp,
                "target_retirement_age": self.profile.get("lean_target_retirement_age", 40),
                "swr": self.profile.get("lean_swr", 0.04),
                "expense_ratio": lean_exp / regular if regular > 0 else 0.6,
                "lifestyle_notes": self.profile.get("lean_lifestyle_notes",
                    "No dining out, no vacations, basic transport, no subscriptions, cook at home"),
                "color": "emerald",
            },
            "regular": {
                "variant": "regular",
                "label": "Regular FIRE",
                "emoji": "🔥",
                "description": "Maintain current lifestyle without working",
                "monthly_expenses": regular,
                "target_retirement_age": self.profile.get("regular_target_retirement_age", 45),
                "swr": self.profile.get("regular_swr", 0.035),
                "expense_ratio": 1.0,
                "lifestyle_notes": "Current lifestyle maintained — same house, same habits, same city",
                "color": "orange",
            },
            "fat": {
                "variant": "fat",
                "label": "Fat FIRE",
                "emoji": "👑",
                "description": "Premium lifestyle with luxuries built in",
                "monthly_expenses": fat_exp,
                "target_retirement_age": self.profile.get("fat_target_retirement_age", 50),
                "swr": self.profile.get("fat_swr", 0.03),
                "expense_ratio": fat_exp / regular if regular > 0 else 1.5,
                "lifestyle_notes": self.profile.get("fat_lifestyle_notes",
                    "Premium housing, international travel 2x/year, fine dining, club memberships, luxury car"),
                "color": "amber",
            },
        }

    # ────────────── PROFILE SUMMARY ──────────────

    def _build_profile_summary(self) -> dict:
        current_age = self._get_age()
        monthly_gross = (self.profile.get("gross_annual_income", 0) or 0) / 12
        monthly_tax = self._get_monthly_tax()
        monthly_net = monthly_gross - monthly_tax
        total_emi = self._get_total_emi()
        monthly_expenses = self.profile.get("monthly_expenses", 0) or 0
        surplus = max(monthly_net - monthly_expenses - total_emi, 0)
        savings_rate = (surplus / monthly_net) * 100 if monthly_net > 0 else 0

        return {
            "current_age": current_age,
            "life_expectancy": self.assumptions["life_expectancy"],
            "monthly_gross": monthly_gross,
            "monthly_net": monthly_net,
            "monthly_expenses_regular": monthly_expenses,
            "monthly_expenses_lean": self.profile.get("lean_monthly_expenses", round(monthly_expenses * 0.6)),
            "monthly_expenses_fat": self.profile.get("fat_monthly_expenses", round(monthly_expenses * 1.5)),
            "monthly_emi": total_emi,
            "current_investable_surplus": surplus,
            "savings_rate": round(savings_rate * 100) / 100,
            "current_net_worth": self._calculate_net_worth(),
        }

    def _get_age(self) -> int:
        dob_str = self.profile.get("dob", "1995-01-01")
        try:
            dob = datetime.strptime(str(dob_str), "%Y-%m-%d").date()
        except (ValueError, TypeError):
            dob = date(1995, 1, 1)
        today = date.today()
        age = today.year - dob.year
        if (today.month, today.day) < (dob.month, dob.day):
            age -= 1
        return max(age, 18)

    def _get_total_emi(self) -> float:
        loans = self.profile.get("loans", {}) or {}
        total = 0
        for loan in loans.values():
            if isinstance(loan, dict):
                total += loan.get("emi", 0) or 0
        return total

    def _calculate_net_worth(self) -> float:
        assets = (
            (self.profile.get("emergency_fund", 0) or 0) +
            (self.profile.get("retirement_balance", 0) or 0) +
            (self.profile.get("mutual_fund_value", 0) or 0) +
            (self.profile.get("stock_value", 0) or 0) +
            (self.profile.get("savings_fd_balance", 0) or 0) +
            (self.profile.get("gold_real_estate", 0) or 0)
        )
        loans = self.profile.get("loans", {}) or {}
        liabilities = 0
        for loan in loans.values():
            if isinstance(loan, dict):
                liabilities += (loan.get("emi", 0) or 0) * (loan.get("tenure", 0) or 0)
        return assets - liabilities

    # ────────────── FIRE NUMBER ──────────────

    def _calculate_fire_number(self, config: dict, current_age: int) -> int:
        years_to_retire = max(config["target_retirement_age"] - current_age, 1)
        future_annual_expenses = config["monthly_expenses"] * 12 * math.pow(1 + self.assumptions["inflation"], years_to_retire)
        return round(future_annual_expenses / config["swr"])

    # ────────────── EMERGENCY FUND ──────────────

    def _calculate_emergency_fund(self, config: dict) -> dict:
        deps = self.profile.get("dependents", {}) or {}
        months = 9 if (deps.get("children", 0) or 0) > 0 else 6
        emi = self._get_total_emi()
        target = (config["monthly_expenses"] + emi) * months
        current = self.profile.get("emergency_fund", 0) or 0
        gap = max(target - current, 0)
        monthly_contrib = math.ceil(gap / 12) if gap > 0 else 0

        return {
            "current_fund": current,
            "target_fund": target,
            "gap": gap,
            "monthly_contribution": monthly_contrib,
            "months_to_fill": math.ceil(gap / monthly_contrib) if monthly_contrib > 0 else 0,
            "where_to_park": "50% Liquid Fund (instant redemption) + 30% Short Duration Debt + 20% Sweep FD",
        }

    # ────────────── VARIANT SIMULATOR ──────────────

    def _simulate_variant(self, config: dict, summary: dict, glide_path: list) -> dict:
        fire_number = self._calculate_fire_number(config, summary["current_age"])
        emergency_plan = self._calculate_emergency_fund(config)
        today = datetime.today()

        max_months = (self.assumptions["life_expectancy"] - summary["current_age"]) * 12

        equity = (self.profile.get("mutual_fund_value", 0) or 0) + (self.profile.get("stock_value", 0) or 0)
        debt = (self.profile.get("savings_fd_balance", 0) or 0) + (self.profile.get("retirement_balance", 0) or 0)
        gold_re = self.profile.get("gold_real_estate", 0) or 0
        gold = gold_re * 0.4
        real_estate = gold_re * 0.6
        emergency_fund = self.profile.get("emergency_fund", 0) or 0
        emergency_complete = emergency_fund >= emergency_plan["target_fund"]

        monthly_income = summary["monthly_net"]
        monthly_expenses = config["monthly_expenses"]
        active_loans = copy.deepcopy(self.profile.get("loans", {}) or {})

        goal_corpuses = {}
        life_goals = self.profile.get("life_goals", []) or []
        for g in life_goals:
            goal_corpuses[g.get("name", "")] = 0

        roadmap = []
        milestones = []
        fire_reached = False
        coast_reached = False
        halfway_reached = False
        quarter_reached = False
        debt_free_reached = False

        m_eq = math.pow(1 + self.assumptions["equity_return"], 1 / 12) - 1
        m_dt = math.pow(1 + self.assumptions["debt_return"], 1 / 12) - 1
        m_gd = math.pow(1 + self.assumptions["gold_return"], 1 / 12) - 1
        m_re = math.pow(1 + self.assumptions["real_estate_return"], 1 / 12) - 1

        for month in range(1, max_months + 1):
            d_year = today.year + (today.month + month - 1) // 12
            d_month = (today.month + month - 1) % 12 + 1
            date_str = f"{d_year}-{str(d_month).zfill(2)}"
            age = summary["current_age"] + month // 12

            if month % 12 == 0:
                monthly_income *= (1 + self.assumptions["salary_growth"])
                monthly_expenses *= (1 + self.assumptions["expense_growth"])

            # Active loans EMI
            total_emi = 0
            for key, loan in list(active_loans.items()):
                if isinstance(loan, dict) and (loan.get("tenure", 0) or 0) > 0:
                    total_emi += loan.get("emi", 0) or 0
                    active_loans[key] = {**loan, "tenure": loan["tenure"] - 1}

            if not debt_free_reached and total_emi == 0 and summary["monthly_emi"] > 0 and month > 1:
                debt_free_reached = True
                milestones.append({
                    "name": "🎉 Debt Free!",
                    "target_date": date_str,
                    "amount": 0,
                    "type": "debt_free",
                    "variant": config["variant"],
                })

            surplus = max(monthly_income - monthly_expenses - total_emi, 0)

            investable = surplus
            if not emergency_complete:
                contrib = min(
                    emergency_plan["monthly_contribution"],
                    investable,
                    emergency_plan["target_fund"] - emergency_fund,
                )
                emergency_fund += contrib
                investable -= contrib
                if emergency_fund >= emergency_plan["target_fund"]:
                    emergency_complete = True
                    milestones.append({
                        "name": "🛡️ Emergency Fund Complete",
                        "target_date": date_str,
                        "amount": emergency_plan["target_fund"],
                        "type": "emergency_fund",
                        "variant": config["variant"],
                    })

            alloc = self._get_allocation_for_age(glide_path, age)

            eq_sip = investable * (alloc["equity_pct"] / 100)
            dt_sip = investable * (alloc["debt_pct"] / 100)
            gd_sip = investable * (alloc["gold_pct"] / 100)

            equity = equity * (1 + m_eq) + eq_sip
            debt = debt * (1 + m_dt) + dt_sip
            gold = gold * (1 + m_gd) + gd_sip
            real_estate = real_estate * (1 + m_re)

            total_nw = equity + debt + gold + real_estate + emergency_fund
            fire_progress = (total_nw / fire_number) * 100 if fire_number > 0 else 0

            # Goal tracking
            goal_snapshots = []
            for goal in life_goals:
                g_name = goal.get("name", "")
                g_amount = goal.get("amount", 0) or 0
                g_years = goal.get("years", 1) or 1
                g_inflation = goal.get("inflation_rate") or self.assumptions["inflation"]
                fv = g_amount * math.pow(1 + g_inflation, g_years)
                m_left = max(g_years * 12 - month, 1)
                goal_corpuses[g_name] = goal_corpuses.get(g_name, 0) * (1 + m_eq) + (investable * 0.1)
                pct = min((goal_corpuses[g_name] / fv) * 100, 100) if fv > 0 else 0
                shortfall = max(fv - goal_corpuses[g_name], 0)
                sip_needed = (shortfall * m_eq) / (math.pow(1 + m_eq, m_left) - 1) if m_left > 0 and m_eq > 0 else shortfall

                goal_snapshots.append({
                    "goal_name": g_name,
                    "target_future_value": round(fv),
                    "current_corpus": round(goal_corpuses[g_name]),
                    "monthly_sip_needed": round(sip_needed),
                    "on_track": pct >= (month / (g_years * 12)) * 100,
                    "shortfall": round(shortfall),
                    "completion_pct": round(pct * 100) / 100,
                })

            # SIP breakdown
            sip_allocations = self._build_sip_allocations(investable, alloc, age)

            # Rebalance check
            total_inv = equity + debt + gold + real_estate
            actual_eq_pct = (equity / total_inv) * 100 if total_inv > 0 else 0
            rebalance_needed = abs(actual_eq_pct - alloc["equity_pct"]) > 5

            # Milestones
            milestone = None

            if not quarter_reached and fire_progress >= 25:
                quarter_reached = True
                milestone = f"📈 25% to {config['label']}"
                milestones.append({
                    "name": milestone, "target_date": date_str,
                    "amount": round(total_nw), "type": "quarter",
                    "variant": config["variant"],
                })

            if not halfway_reached and fire_progress >= 50:
                halfway_reached = True
                milestone = f"🎯 50% to {config['label']} — Halfway!"
                milestones.append({
                    "name": milestone, "target_date": date_str,
                    "amount": round(total_nw), "type": "halfway",
                    "variant": config["variant"],
                })

            years_to_60 = max(60 - age, 0)
            coast_fv = total_nw * math.pow(1 + self.assumptions["equity_return"] * 0.7, years_to_60)
            if not coast_reached and coast_fv >= fire_number and years_to_60 > 0:
                coast_reached = True
                milestone = f"⛵ Coast {config['label']}"
                milestones.append({
                    "name": f"⛵ Coast {config['label']} — Can stop saving, still retire at 60",
                    "target_date": date_str,
                    "amount": round(total_nw),
                    "type": "coast_fire",
                    "variant": config["variant"],
                })

            if not fire_reached and fire_progress >= 100:
                fire_reached = True
                milestone = f"{config['emoji']} {config['label']} Achieved!"
                milestones.append({
                    "name": f"{config['emoji']} {config['label']} Achieved!",
                    "target_date": date_str,
                    "amount": round(total_nw),
                    "type": "fire",
                    "variant": config["variant"],
                })

            # Only store yearly snapshots
            if month == 1 or month % 12 == 0:
                roadmap.append({
                    "month": month,
                    "date": date_str,
                    "age": age,
                    "net_income": round(monthly_income),
                    "total_expenses": round(monthly_expenses),
                    "total_emi": round(total_emi),
                    "investable_surplus": round(surplus),
                    "equity_value": round(equity),
                    "debt_value": round(debt),
                    "gold_value": round(gold),
                    "real_estate_value": round(real_estate),
                    "emergency_fund_value": round(emergency_fund),
                    "total_net_worth": round(total_nw),
                    "fire_number": fire_number,
                    "fire_progress_pct": round(fire_progress * 100) / 100,
                    "months_to_fire": self._estimate_months_to_fire(total_nw, surplus, fire_number, alloc) if not fire_reached else 0,
                    "goal_progress": goal_snapshots,
                    "sip_allocations": sip_allocations,
                    "milestone_reached": milestone,
                    "rebalance_needed": rebalance_needed,
                })

            # Stop 10 years after FIRE achieved
            if fire_reached:
                fire_ms = [m for m in milestones if m["type"] == "fire"]
                if fire_ms:
                    fire_date_parts = fire_ms[0]["target_date"].split("-")
                    fire_y = int(fire_date_parts[0])
                    fire_m = int(fire_date_parts[1])
                    months_since_fire = (d_year - fire_y) * 12 + (d_month - fire_m)
                    if months_since_fire > 120:
                        break

        required_sip = self._calculate_required_sip(
            summary["current_net_worth"],
            fire_number,
            config["target_retirement_age"] - summary["current_age"],
        )
        savings_rate_needed = (required_sip / summary["monthly_net"]) * 100 if summary["monthly_net"] > 0 else 0
        feasibility = self._assess_feasibility(
            required_sip,
            summary["current_investable_surplus"],
            config["target_retirement_age"] - summary["current_age"],
        )

        fire_month_data = next((m for m in roadmap if m["fire_progress_pct"] >= 100), None)
        fire_age = (
            summary["current_age"] + fire_month_data["month"] // 12
            if fire_month_data
            else summary["current_age"] + len(roadmap)
        )
        years_to_fire = fire_age - summary["current_age"]
        monthly_exp_at_fire = config["monthly_expenses"] * math.pow(1 + self.assumptions["expense_growth"], years_to_fire)

        return {
            "variant": config["variant"],
            "config": config,
            "fire_number": fire_number,
            "fire_age": fire_age,
            "years_to_fire": years_to_fire,
            "monthly_expenses_at_fire": round(monthly_exp_at_fire),
            "annual_withdrawal_at_fire": round(monthly_exp_at_fire * 12),
            "monthly_roadmap": roadmap,
            "milestones": sorted(milestones, key=lambda m: m["target_date"]),
            "emergency_fund_plan": emergency_plan,
            "required_monthly_sip": round(required_sip),
            "savings_rate_needed": round(savings_rate_needed * 100) / 100,
            "feasibility": feasibility["status"],
            "feasibility_reason": feasibility["reason"],
        }

    # ────────────── REQUIRED SIP ──────────────

    def _calculate_required_sip(self, current_nw: float, fire_number: float, years: int) -> float:
        if current_nw >= fire_number:
            return 0
        months = max(years * 12, 1)
        avg_return = (
            0.65 * self.assumptions["equity_return"]
            + 0.25 * self.assumptions["debt_return"]
            + 0.10 * self.assumptions["gold_return"]
        )
        r = math.pow(1 + avg_return, 1 / 12) - 1
        fv_current = current_nw * math.pow(1 + r, months)
        remaining = max(fire_number - fv_current, 0)
        if remaining <= 0:
            return 0
        sip = (remaining * r) / (math.pow(1 + r, months) - 1)
        return max(round(sip), 0)

    # ────────────── FEASIBILITY ──────────────

    def _assess_feasibility(self, required_sip: float, current_surplus: float, years: int) -> dict:
        if years <= 0:
            return {"status": "unrealistic", "reason": "Target retirement age already passed"}
        ratio = required_sip / current_surplus if current_surplus > 0 else float("inf")
        if ratio <= 0.8:
            return {"status": "achievable", "reason": f"Needs {round(ratio * 100)}% of your current surplus. Comfortable with room to spare."}
        if ratio <= 1.2:
            return {"status": "stretch", "reason": f"Needs {round(ratio * 100)}% of your surplus. Tight but doable."}
        return {"status": "unrealistic", "reason": f"Needs {round(ratio * 100)}% of your surplus — {round(ratio)}x what you currently save."}

    # ────────────── GLIDE PATH ──────────────

    def _build_glide_path(self, current_age: int) -> list:
        path = []
        risk = self.profile.get("risk_profile", "moderate")
        risk_mul = 1.1 if risk == "aggressive" else (0.85 if risk == "conservative" else 1.0)

        for age in range(current_age, self.assumptions["life_expectancy"] + 1, 5):
            eq = max(100 - age, 20)
            eq = min(round(eq * risk_mul), 85)
            gd = 15 if age >= 50 else 10
            re = 5 if age >= 40 else 0
            dt = max(100 - eq - gd - re, 5)
            path.append({
                "age": age,
                "equity_pct": eq,
                "debt_pct": dt,
                "gold_pct": gd,
                "real_estate_pct": re,
            })
        return path

    def _get_allocation_for_age(self, glide_path: list, age: int) -> dict:
        closest = glide_path[0]
        for g in glide_path:
            if g["age"] <= age:
                closest = g
        return closest

    # ────────────── SIP ALLOCATIONS ──────────────

    def _build_sip_allocations(self, total: float, alloc: dict, age: int) -> list:
        sips = []
        eq_total = total * (alloc["equity_pct"] / 100)
        dt_total = total * (alloc["debt_pct"] / 100)
        gd_total = total * (alloc["gold_pct"] / 100)

        if eq_total > 0:
            if age < 35:
                sips.append({"goal_name": "Core", "fund_type": "flexi_cap", "amount": round(eq_total * 0.35)})
                sips.append({"goal_name": "Growth", "fund_type": "mid_cap", "amount": round(eq_total * 0.30)})
                sips.append({"goal_name": "Growth", "fund_type": "small_cap", "amount": round(eq_total * 0.20)})
                sips.append({"goal_name": "Tax", "fund_type": "elss", "amount": round(eq_total * 0.15)})
            elif age < 50:
                sips.append({"goal_name": "Core", "fund_type": "large_cap", "amount": round(eq_total * 0.40)})
                sips.append({"goal_name": "Core", "fund_type": "flexi_cap", "amount": round(eq_total * 0.30)})
                sips.append({"goal_name": "Growth", "fund_type": "mid_cap", "amount": round(eq_total * 0.20)})
                sips.append({"goal_name": "Tax", "fund_type": "elss", "amount": round(eq_total * 0.10)})
            else:
                sips.append({"goal_name": "Core", "fund_type": "large_cap", "amount": round(eq_total * 0.60)})
                sips.append({"goal_name": "Core", "fund_type": "flexi_cap", "amount": round(eq_total * 0.30)})
                sips.append({"goal_name": "Growth", "fund_type": "mid_cap", "amount": round(eq_total * 0.10)})

        if dt_total > 0:
            sips.append({"goal_name": "Stability", "fund_type": "debt", "amount": round(dt_total * 0.6)})
            sips.append({"goal_name": "Liquidity", "fund_type": "liquid", "amount": round(dt_total * 0.4)})

        if gd_total > 0:
            sips.append({"goal_name": "Hedge", "fund_type": "gold_etf", "amount": round(gd_total)})

        return [s for s in sips if s["amount"] > 0]

    def _estimate_months_to_fire(self, nw: float, sip: float, fire_num: float, alloc: dict):
        if nw >= fire_num:
            return 0
        if sip <= 0:
            return None
        avg = (
            (alloc["equity_pct"] / 100) * self.assumptions["equity_return"]
            + (alloc["debt_pct"] / 100) * self.assumptions["debt_return"]
            + (alloc["gold_pct"] / 100) * self.assumptions["gold_return"]
        )
        r = math.pow(1 + avg, 1 / 12) - 1
        fv = nw
        n = 0
        while fv < fire_num and n < 1200:
            fv = fv * (1 + r) + sip
            n += 1
        return n if n < 1200 else None

    # ────────────── TAX ENGINE ──────────────

    def _analyze_taxes(self) -> dict:
        old_tax = self._calc_old_regime_tax()
        new_tax = self._calc_new_regime_tax()
        rec = "old" if old_tax <= new_tax else "new"
        current_regime = self.profile.get("current_tax_regime", "new")
        income = self.profile.get("gross_annual_income", 0) or 0

        return {
            "old_regime_tax": old_tax,
            "new_regime_tax": new_tax,
            "recommended_regime": rec,
            "annual_savings_by_switching": abs(old_tax - new_tax) if current_regime != rec else 0,
            "tax_saving_moves": self._find_tax_moves(old_tax, new_tax),
            "effective_tax_rate": round((min(old_tax, new_tax) / income) * 10000) / 100 if income > 0 else 0,
        }

    def _get_monthly_tax(self) -> float:
        return min(self._calc_old_regime_tax(), self._calc_new_regime_tax()) / 12

    def _calc_old_regime_tax(self) -> int:
        g = self.profile.get("gross_annual_income", 0) or 0
        sd = 50000
        basic = self.profile.get("tax_basic_salary", 0) or 0
        hra_recv = self.profile.get("tax_hra_received", 0) or 0
        rent_ann = (self.profile.get("tax_rent_paid", 0) or 0) * 12
        mp = 0.5 if self.profile.get("tax_is_metro_city", False) else 0.4

        hra = 0
        if hra_recv > 0 and rent_ann > 0:
            hra = min(hra_recv, basic * mp, max(rent_ann - 0.1 * basic, 0))

        s80c = min(self.profile.get("tax_80c_investments", 0) or 0, 150000)
        deps = self.profile.get("dependents", {}) or {}
        p_lim = 50000 if (deps.get("parents", 0) or 0) > 0 else 0
        s80d = min(self.profile.get("tax_80d_medical", 0) or 0, 25000 + p_lim)
        s80ccd = min(self.profile.get("tax_nps_80ccd_1b", 0) or 0, 50000)
        s24b = min(self.profile.get("tax_home_loan_interest", 0) or 0, 200000)

        taxable = max(g - sd - hra - s80c - s80d - s80ccd - s24b, 0)

        tax = 0
        if taxable > 1000000:
            tax += (taxable - 1000000) * 0.3
        if taxable > 500000:
            tax += min(taxable - 500000, 500000) * 0.2
        if taxable > 250000:
            tax += min(taxable - 250000, 250000) * 0.05
        if taxable <= 500000:
            tax = 0
        tax *= 1.04
        return round(tax)

    def _calc_new_regime_tax(self) -> int:
        taxable = max((self.profile.get("gross_annual_income", 0) or 0) - 75000, 0)
        slabs = [
            (400000, 0), (800000, 0.05), (1200000, 0.1),
            (1600000, 0.15), (2000000, 0.2), (2400000, 0.25),
            (float("inf"), 0.3),
        ]
        tax = 0
        prev = 0
        for limit, rate in slabs:
            if taxable <= prev:
                break
            tax += (min(taxable, limit) - prev) * rate
            prev = limit

        if taxable <= 1200000:
            tax = 0
        elif taxable <= 1275000:
            tax = min(tax, taxable - 1200000)

        tax *= 1.04
        return round(tax)

    def _get_marginal_rate(self) -> float:
        g = self.profile.get("gross_annual_income", 0) or 0
        if g > 1500000:
            return 0.3
        if g > 1200000:
            return 0.2
        if g > 900000:
            return 0.15
        if g > 600000:
            return 0.1
        return 0.05

    def _find_tax_moves(self, old_tax: int, new_tax: int) -> list:
        moves = []
        rate = self._get_marginal_rate()

        inv_80c = self.profile.get("tax_80c_investments", 0) or 0
        if inv_80c < 150000:
            gap = 150000 - inv_80c
            moves.append({
                "section": "80C",
                "description": "ELSS, PPF, EPF, Life Insurance, Tuition Fees",
                "current_utilization": inv_80c,
                "max_limit": 150000,
                "potential_saving": round(gap * rate),
                "action": f"Invest ₹{round(gap / 1000)}K more in ELSS",
                "regime": "old",
            })

        nps = self.profile.get("tax_nps_80ccd_1b", 0) or 0
        if nps < 50000:
            gap = 50000 - nps
            moves.append({
                "section": "80CCD(1B)",
                "description": "Additional NPS Contribution",
                "current_utilization": nps,
                "max_limit": 50000,
                "potential_saving": round(gap * rate),
                "action": f"₹{round(gap / 1000)}K in NPS — extra deduction above 80C",
                "regime": "old",
            })

        deps = self.profile.get("dependents", {}) or {}
        d_max = 25000 + (50000 if (deps.get("parents", 0) or 0) > 0 else 0)
        medical = self.profile.get("tax_80d_medical", 0) or 0
        if medical < d_max:
            gap = d_max - medical
            moves.append({
                "section": "80D",
                "description": "Health Insurance Premiums",
                "current_utilization": medical,
                "max_limit": d_max,
                "potential_saving": round(gap * rate),
                "action": f"Increase health cover — ₹{round(gap / 1000)}K gap",
                "regime": "old",
            })

        if old_tax != new_tax:
            better = "old" if old_tax < new_tax else "new"
            current = self.profile.get("current_tax_regime", "new")
            if current != better:
                moves.append({
                    "section": "Regime Switch",
                    "description": f"Switch to {better.upper()} regime",
                    "current_utilization": 0,
                    "max_limit": 0,
                    "potential_saving": abs(old_tax - new_tax),
                    "action": f"Save ₹{round(abs(old_tax - new_tax) / 1000)}K/year by switching",
                    "regime": "both",
                })

        return moves

    # ────────────── INSURANCE GAPS ──────────────

    def _analyze_insurance_gaps(self, summary: dict) -> list:
        gaps = []
        income = self.profile.get("gross_annual_income", 0) or 0
        deps = self.profile.get("dependents", {}) or {}
        dep_count = (deps.get("children", 0) or 0) + (deps.get("parents", 0) or 0)

        loans = self.profile.get("loans", {}) or {}
        total_loans = 0
        for loan in loans.values():
            if isinstance(loan, dict):
                total_loans += (loan.get("emi", 0) or 0) * (loan.get("tenure", 0) or 0)

        # Life insurance
        life_mul = 15 if dep_count > 2 else (12 if dep_count > 0 else 10)
        rec_life = income * life_mul + total_loans
        current_life = self.profile.get("life_insurance_cover", 0) or 0
        life_gap = max(rec_life - current_life, 0)
        if life_gap > 0:
            gaps.append({
                "type": "life",
                "current_cover": current_life,
                "recommended_cover": rec_life,
                "gap": life_gap,
                "estimated_premium": round(life_gap * 0.003),
                "urgency": "critical" if life_gap > income * 5 else "high",
                "reason": f"Need {life_mul}x income + loan cover. Gap: ₹{round(life_gap / 100000)}L",
            })

        # Health insurance
        is_metro = self.profile.get("tax_is_metro_city", False)
        base_h = 1500000 if is_metro else 1000000
        f_mul = (
            1
            + (deps.get("children", 0) or 0) * 0.3
            + (deps.get("parents", 0) or 0) * 0.5
            + (0.5 if self.profile.get("marital_status") == "married" else 0)
        )
        rec_h = base_h * f_mul
        current_h = self.profile.get("health_insurance_cover", 0) or 0
        h_gap = max(rec_h - current_h, 0)
        if h_gap > 0:
            gaps.append({
                "type": "health",
                "current_cover": current_h,
                "recommended_cover": rec_h,
                "gap": h_gap,
                "estimated_premium": round(rec_h * 0.015),
                "urgency": "critical" if current_h == 0 else "high",
                "reason": f"Recommended ₹{round(rec_h / 100000)}L for family",
            })

        # Critical illness
        if not self.profile.get("critical_illness_cover", False) and summary["current_age"] >= 30:
            ci = income * 3
            gaps.append({
                "type": "critical_illness",
                "current_cover": 0,
                "recommended_cover": ci,
                "gap": ci,
                "estimated_premium": round(ci * 0.008),
                "urgency": "critical" if summary["current_age"] >= 40 else "medium",
                "reason": f"No CI cover. Need ₹{round(ci / 100000)}L lump-sum on diagnosis",
            })

        return gaps
