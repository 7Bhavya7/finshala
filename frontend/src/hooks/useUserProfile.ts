// ═══════════════════════════════════════════════
// USER PROFILE HOOK — localStorage + Supabase sync
// Stores onboarding data, syncs to Supabase user_metadata
// ═══════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'finshala_user_profile';

export interface UserProfile {
  // Personal
  full_name: string;
  dob: string;
  gender: string;
  marital_status: string;
  employment_type: string;
  dependents: { children: number; parents: number };

  // Income & Expenses
  gross_annual_income: number;
  monthly_expenses: number;

  // Assets
  emergency_fund: number;
  retirement_balance: number;
  mutual_fund_value: number;
  stock_value: number;
  savings_fd_balance: number;
  gold_real_estate: number;
  monthly_sip: number;

  // Loans
  loans: {
    home: { emi: number; tenure: number };
    car: { emi: number; tenure: number };
    personal: { emi: number; tenure: number };
    education: { emi: number; tenure: number };
    credit_card: { emi: number; tenure: number };
  };
  missed_emi: boolean;
  missed_emi_amount: number;

  // Insurance
  life_insurance_cover: number;
  health_insurance_cover: number;
  critical_illness_cover: boolean;

  // Tax
  tax_basic_salary: number;
  tax_hra_received: number;
  tax_rent_paid: number;
  tax_is_metro_city: boolean;
  tax_80c_investments: number;
  tax_80d_medical: number;
  tax_nps_80ccd_1b: number;
  tax_home_loan_interest: number;
  current_tax_regime: string;

  // FIRE
  risk_profile: string;
  fire_variant_preference: string;
  lean_monthly_expenses: number;
  fat_monthly_expenses: number;
  lean_target_retirement_age: number;
  regular_target_retirement_age: number;
  fat_target_retirement_age: number;
  lean_swr: number;
  regular_swr: number;
  fat_swr: number;

  // Meta
  profile_completed_at?: string;
}

export function useUserProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // On mount, try to load from Supabase if localStorage is empty
  useEffect(() => {
    const loadFromSupabase = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Try dedicated user_profiles table first
        const { data, error } = await supabase
          .from('user_profiles')
          .select('profile')
          .eq('user_id', user.id)
          .single();

        if (!error && data?.profile) {
          const sbProfile = data.profile as UserProfile;
          if (sbProfile.profile_completed_at) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sbProfile));
            setProfileState(sbProfile);
            return;
          }
        }

        // Fallback: try legacy user_metadata
        if (user.user_metadata?.finshala_profile) {
          const sbProfile = user.user_metadata.finshala_profile as UserProfile;
          if (sbProfile.profile_completed_at) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sbProfile));
            setProfileState(sbProfile);
          }
        }
      } catch {
        // Supabase unavailable, localStorage is fine
      }
    };

    if (!profile?.profile_completed_at) {
      loadFromSupabase();
    }
  }, []);

  const hasProfile = profile !== null && !!profile.profile_completed_at;

  const saveProfile = useCallback(async (data: Omit<UserProfile, 'profile_completed_at'>) => {
    const full: UserProfile = { ...data, profile_completed_at: new Date().toISOString() };

    // 1. Always save to localStorage (instant)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
    setProfileState(full);

    // 2. Sync to Supabase user_profiles table (background)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            profile: full,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
      }
    } catch {
      // Supabase sync failed silently — localStorage has the data
    }

    // 3. Also keep legacy user_metadata sync for backward compat
    try {
      await supabase.auth.updateUser({
        data: { finshala_profile: full },
      });
    } catch {
      // Silent fallback
    }
  }, []);

  const clearProfile = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfileState(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', user.id);
      }
    } catch {}
    try {
      await supabase.auth.updateUser({
        data: { finshala_profile: null },
      });
    } catch {}
  }, []);

  return { profile, hasProfile, saveProfile, clearProfile };
}

// ── Helpers to convert UserProfile → Engine Profiles ──

export function toFireProfile(p: UserProfile) {
  const currentAge = p.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 30;
  const totalLoansEmi = Object.values(p.loans).reduce((s, l) => s + l.emi, 0);
  const netWorth = p.emergency_fund + p.retirement_balance + p.mutual_fund_value + p.stock_value + p.savings_fd_balance + p.gold_real_estate;

  return {
    current_age: currentAge,
    retirement_age: p.regular_target_retirement_age || 55,
    monthly_income: Math.round(p.gross_annual_income / 12),
    monthly_expenses: p.monthly_expenses,
    current_net_worth: netWorth,
    monthly_sip: p.monthly_sip,
    risk_profile: (p.risk_profile || 'moderate') as 'conservative' | 'moderate' | 'aggressive',
    life_insurance_cover: p.life_insurance_cover,
    health_insurance_cover: p.health_insurance_cover,
    has_critical_illness_cover: p.critical_illness_cover,
    emergency_fund: p.emergency_fund,
    total_loans_emi: totalLoansEmi,
    dependents: p.dependents,
    lean: {
      monthly_expenses: p.lean_monthly_expenses || Math.round(p.monthly_expenses * 0.6),
      target_retirement_age: p.lean_target_retirement_age || 45,
      swr: p.lean_swr || 0.035,
    },
    regular: {
      monthly_expenses: p.monthly_expenses,
      target_retirement_age: p.regular_target_retirement_age || 50,
      swr: p.regular_swr || 0.04,
    },
    fat: {
      monthly_expenses: p.fat_monthly_expenses || Math.round(p.monthly_expenses * 1.5),
      target_retirement_age: p.fat_target_retirement_age || 55,
      swr: p.fat_swr || 0.035,
    },
  };
}

export function toHealthProfile(p: UserProfile) {
  const currentAge = p.dob ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 30;
  const totalLoansEmi = Object.values(p.loans).reduce((s, l) => s + l.emi, 0);

  return {
    current_age: currentAge,
    monthly_income: Math.round(p.gross_annual_income / 12),
    monthly_expenses: p.monthly_expenses,
    dependents: p.dependents,
    emergency_fund_balance: p.emergency_fund,
    monthly_sip: p.monthly_sip,
    total_investments: p.mutual_fund_value + p.stock_value + p.savings_fd_balance + p.gold_real_estate,
    retirement_balance: p.retirement_balance,
    total_loans_emi: totalLoansEmi,
    has_missed_emi: p.missed_emi,
    life_insurance_cover: p.life_insurance_cover,
    health_insurance_cover: p.health_insurance_cover,
    has_critical_illness_cover: p.critical_illness_cover,
    risk_profile: (p.risk_profile || 'moderate') as 'conservative' | 'moderate' | 'aggressive',
    tax_80c: p.tax_80c_investments,
    tax_80d: p.tax_80d_medical,
    tax_nps: p.tax_nps_80ccd_1b,
  };
}

export function toTaxProfile(p: UserProfile) {
  return {
    full_name: p.full_name,
    gross_annual_income: p.gross_annual_income,
    current_tax_regime: p.current_tax_regime as 'old' | 'new',
    tax_basic_salary: p.tax_basic_salary,
    tax_hra_received: p.tax_hra_received,
    tax_rent_paid: p.tax_rent_paid,
    tax_is_metro_city: p.tax_is_metro_city,
    tax_80c_investments: p.tax_80c_investments,
    tax_80d_medical: p.tax_80d_medical,
    tax_nps_80ccd_1b: p.tax_nps_80ccd_1b,
    tax_home_loan_interest: p.tax_home_loan_interest,
    risk_profile: (p.risk_profile || 'moderate') as 'conservative' | 'moderate' | 'aggressive',
    dependents: p.dependents,
  };
}
