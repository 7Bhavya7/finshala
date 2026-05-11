import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Wallet, PiggyBank, CreditCard, Shield, Landmark,
  Target, Flame, ArrowRight, ArrowLeft, CheckCircle2,
  Sparkles, Lock, Loader2, Plus, Trash2, Leaf, Crown,
  AlertTriangle, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  CurrencyInput, TextInput, DateInput, SelectInput,
  NumberInput, Toggle, RadioCards, LoanRow,
  formatINR, formatCompact,
} from './FormFields';

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

interface LifeGoal {
  name: string;
  amount: number;
  years: number;
  priority: 'critical' | 'important' | 'aspirational';
}

interface FormData {
  full_name: string;
  dob: string;
  gender: string;
  marital_status: string;
  employment_type: string;
  dependents: { children: number; parents: number };

  gross_annual_income: number;
  monthly_expenses: number;

  emergency_fund: number;
  retirement_balance: number;
  mutual_fund_value: number;
  stock_value: number;
  savings_fd_balance: number;
  gold_real_estate: number;
  monthly_sip: number;

  loans: {
    home: { emi: number; tenure: number };
    car: { emi: number; tenure: number };
    personal: { emi: number; tenure: number };
    education: { emi: number; tenure: number };
    credit_card: { emi: number; tenure: number };
  };
  missed_emi: boolean;
  missed_emi_amount: number;

  life_insurance_cover: number;
  health_insurance_cover: number;
  critical_illness_cover: boolean;

  tax_basic_salary: number;
  tax_hra_received: number;
  tax_rent_paid: number;
  tax_is_metro_city: boolean;
  tax_80c_investments: number;
  tax_80d_medical: number;
  tax_nps_80ccd_1b: number;
  tax_home_loan_interest: number;
  current_tax_regime: string;

  risk_profile: string;
  life_goals: LifeGoal[];

  fire_variant_preference: string;
  lean_monthly_expenses: number;
  fat_monthly_expenses: number;
  lean_target_retirement_age: number;
  regular_target_retirement_age: number;
  fat_target_retirement_age: number;
  lean_swr: number;
  regular_swr: number;
  fat_swr: number;
}

const INITIAL_DATA: FormData = {
  full_name: '', dob: '', gender: '', marital_status: '', employment_type: '',
  dependents: { children: 0, parents: 0 },
  gross_annual_income: 0, monthly_expenses: 0,
  emergency_fund: 0, retirement_balance: 0, mutual_fund_value: 0,
  stock_value: 0, savings_fd_balance: 0, gold_real_estate: 0, monthly_sip: 0,
  loans: {
    home: { emi: 0, tenure: 0 }, car: { emi: 0, tenure: 0 },
    personal: { emi: 0, tenure: 0 }, education: { emi: 0, tenure: 0 },
    credit_card: { emi: 0, tenure: 0 },
  },
  missed_emi: false, missed_emi_amount: 0,
  life_insurance_cover: 0, health_insurance_cover: 0, critical_illness_cover: false,
  tax_basic_salary: 0, tax_hra_received: 0, tax_rent_paid: 0, tax_is_metro_city: false,
  tax_80c_investments: 0, tax_80d_medical: 0, tax_nps_80ccd_1b: 0,
  tax_home_loan_interest: 0, current_tax_regime: 'new',
  risk_profile: 'moderate', life_goals: [],
  fire_variant_preference: 'regular',
  lean_monthly_expenses: 0, fat_monthly_expenses: 0,
  lean_target_retirement_age: 40, regular_target_retirement_age: 45, fat_target_retirement_age: 50,
  lean_swr: 0.04, regular_swr: 0.035, fat_swr: 0.03,
};

// ═══════════════════════════════════════════════
// STEP CONFIG
// ═══════════════════════════════════════════════

interface StepConfig {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  estimate: string;
}

const STEPS: StepConfig[] = [
  { title: 'About You', subtitle: 'Basic details to personalize your plan', icon: <User className="w-5 h-5" />, accentColor: '#8B6F47', estimate: '1 min' },
  { title: 'Income & Expenses', subtitle: 'The foundation of every financial plan', icon: <Wallet className="w-5 h-5" />, accentColor: '#6B7F3A', estimate: '30 sec' },
  { title: 'Savings & Investments', subtitle: "What you've already built", icon: <PiggyBank className="w-5 h-5" />, accentColor: '#B8860B', estimate: '1 min' },
  { title: 'Loans & Liabilities', subtitle: "What's pulling you back", icon: <CreditCard className="w-5 h-5" />, accentColor: '#A0522D', estimate: '1 min' },
  { title: 'Insurance Coverage', subtitle: 'Your safety net check', icon: <Shield className="w-5 h-5" />, accentColor: '#5F8575', estimate: '30 sec' },
  { title: 'Tax Details', subtitle: 'Help us optimize your taxes', icon: <Landmark className="w-5 h-5" />, accentColor: '#CD853F', estimate: '1.5 min' },
  { title: 'Goals & Risk Profile', subtitle: 'What are you building toward?', icon: <Target className="w-5 h-5" />, accentColor: '#996633', estimate: '1 min' },
  { title: 'FIRE Preferences', subtitle: 'Choose your path to freedom', icon: <Flame className="w-5 h-5" />, accentColor: '#c2703e', estimate: '1 min' },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 400 : -400, opacity: 0, scale: 0.95 }),
  center: { x: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: (dir: number) => ({ x: dir > 0 ? -400 : 400, opacity: 0, scale: 0.95, transition: { duration: 0.2 } }),
};

// ═══════════════════════════════════════════════
// MAIN ONBOARDING COMPONENT
// ═══════════════════════════════════════════════

export default function FIREOnboarding() {
  const [step, setStep] = useState(() => {
    // Restore step if they refreshed
    try {
      const savedStep = localStorage.getItem('fire_onboarding_step');
      return savedStep ? parseInt(savedStep, 10) : 0;
    } catch { return 0; }
  });
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<FormData>(() => {
    try {
      // 1. Try to load partial draft first so they don't lose progress if they refresh
      const draft = localStorage.getItem('fire_onboarding_draft');
      if (draft) return JSON.parse(draft);

      // 2. Try to load their completed profile if they are trying to edit existing data
      const profile = localStorage.getItem('finshala_user_profile');
      if (profile) {
        const p = JSON.parse(profile);
        return {
          ...INITIAL_DATA,
          ...p,
          // ensure nested objects don't get lost
          dependents: { ...INITIAL_DATA.dependents, ...(p.dependents || {}) },
          loans: { ...INITIAL_DATA.loans, ...(p.loans || {}) },
          life_goals: p.life_goals || INITIAL_DATA.life_goals,
        };
      }
    } catch { /* ignore parsing errors */ }
    
    // 3. Fallback to clean slate
    return INITIAL_DATA;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);

  const { user } = useAuth();
  const { saveProfile: saveToStorage } = useUserProfile();
  const navigate = useNavigate();

  // Auto-save draft on every change
  useEffect(() => {
    localStorage.setItem('fire_onboarding_draft', JSON.stringify(data));
  }, [data]);

  // Keep track of current step so refresh puts them back where they were
  useEffect(() => {
    localStorage.setItem('fire_onboarding_step', step.toString());
  }, [step]);

  // Auto-fill from Supabase user_metadata (signup fields) ONLY if the fields are empty
  useEffect(() => {
    if (user?.user_metadata) {
      const meta = user.user_metadata;
      setData((prev) => ({
        ...prev,
        full_name: prev.full_name || meta.full_name || '',
        dob: prev.dob || meta.date_of_birth || '',
        gender: prev.gender || meta.gender || '',
        marital_status: prev.marital_status || meta.marital_status || '',
        employment_type: prev.employment_type || meta.employment_type || '',
      }));
    }
  }, [user]);

  const update = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setData((prev) => ({ ...prev, [field]: value }));
    }, []
  );

  const updateNested = useCallback(
    (path: string, value: unknown) => {
      setData((prev) => {
        const newData = { ...prev };
        const keys = path.split('.');
        let obj: Record<string, unknown> = newData as unknown as Record<string, unknown>;
        for (let i = 0; i < keys.length - 1; i++) {
          obj[keys[i]] = { ...(obj[keys[i]] as Record<string, unknown>) };
          obj = obj[keys[i]] as Record<string, unknown>;
        }
        obj[keys[keys.length - 1]] = value;
        return newData;
      });
    }, []
  );

  const validate = (): string | null => {
    switch (step) {
      case 0:
        if (!data.full_name.trim()) return 'Please enter your name';
        if (!data.dob) return 'Please enter your date of birth';
        if (!data.gender) return 'Please select your gender';
        if (!data.marital_status) return 'Please select marital status';
        if (!data.employment_type) return 'Please select employment type';
        return null;
      case 1:
        if (data.gross_annual_income <= 0) return 'Please enter your annual income';
        if (data.monthly_expenses <= 0) return 'Please enter your monthly expenses';
        return null;
      default:
        return null;
    }
  };

  const next = () => {
    const err = validate();
    if (err) { setError(err); setTimeout(() => setError(''), 3000); return; }
    setError('');
    if (step < STEPS.length - 1) { setDirection(1); setStep((s) => s + 1); }
  };

  const back = () => {
    if (step > 0) { setDirection(-1); setStep((s) => s - 1); }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');

    try {
      const finalData = { ...data };
      if (!finalData.lean_monthly_expenses) finalData.lean_monthly_expenses = Math.round(data.monthly_expenses * 0.6);
      if (!finalData.fat_monthly_expenses) finalData.fat_monthly_expenses = Math.round(data.monthly_expenses * 1.5);

      // Save via useUserProfile hook (used by all dashboards)
      saveToStorage(finalData as any);
      // Also keep legacy key for backward compat
      localStorage.setItem('fire_onboarding_data', JSON.stringify(finalData));
      
      // Clear drafts on success
      localStorage.removeItem('fire_onboarding_draft');
      localStorage.removeItem('fire_onboarding_step');
      
      setComplete(true);
      setTimeout(() => navigate('/fire-dashboard'), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    }
    setSaving(false);
  };

  // ── COMPLETION SCREEN ──
  if (complete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <CheckCircle2 className="w-12 h-12" style={{ color: '#10b981' }} />
          </motion.div>
          <h2 className="font-display text-3xl text-foreground">You're All Set! 🎉</h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            Your financial profile is saved. We're generating your personalized Lean, Regular & Fat FIRE roadmaps now...
          </p>
          <div className="flex items-center justify-center gap-2" style={{ color: '#c2703e' }}>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-body">Redirecting to your dashboard...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ═══ HEADER ═══ */}
      <header className="border-b border-border/40 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl flex items-center justify-center" style={{ background: `${currentStep.accentColor}15` }}>
                <span style={{ color: currentStep.accentColor }}>{currentStep.icon}</span>
              </div>
              <div>
                <h1 className="font-display text-lg text-foreground">{currentStep.title}</h1>
                <p className="text-xs font-body text-muted-foreground">{currentStep.subtitle}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-body text-foreground font-medium">
                {step + 1}<span className="text-muted-foreground"> / {STEPS.length}</span>
              </p>
              <p className="text-[10px] font-body text-muted-foreground">~{currentStep.estimate}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" initial={{ width: 0 }}
              animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ background: currentStep.accentColor }} />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <div key={i} onClick={() => { if (i < step) { setDirection(-1); setStep(i); } }}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-body transition-all cursor-pointer
                  ${i < step ? 'text-white' : i === step ? 'text-white scale-110' : 'bg-muted/50 text-muted-foreground'}`}
                style={i < step ? { background: '#8B6F47' } : i === step ? { background: currentStep.accentColor } : {}}>
                {i < step ? '✓' : i + 1}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ═══ CARD CONTENT ═══ */}
      <main className="flex-1 flex items-start justify-center px-4 py-8 overflow-y-auto">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={step} custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              className="account-card rounded-2xl p-6 sm:p-8">
              {step === 0 && <Step1 data={data} update={update} updateNested={updateNested} hasAutoFill={!!user?.user_metadata?.full_name} />}
              {step === 1 && <Step2 data={data} update={update} />}
              {step === 2 && <Step3 data={data} update={update} />}
              {step === 3 && <Step4 data={data} update={update} updateNested={updateNested} />}
              {step === 4 && <Step5 data={data} update={update} />}
              {step === 5 && <Step6 data={data} update={update} />}
              {step === 6 && <Step7 data={data} update={update} />}
              {step === 7 && <Step8 data={data} update={update} />}
            </motion.div>
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-body border"
                style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={back} disabled={step === 0}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-body font-medium transition-all
                ${step === 0 ? 'text-muted-foreground/40 cursor-not-allowed' : 'text-foreground bg-muted/50 border border-border/40 hover:bg-muted'}`}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button onClick={next}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-body font-semibold text-white hover:opacity-90 transition-opacity shadow-lg"
                style={{ background: currentStep.accentColor }}>
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSaveProfile} disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-body font-semibold text-white hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
                style={{ background: '#c2703e' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Generate My FIRE Plan'}
              </button>
            )}
          </div>

          <p className="text-center text-[10px] text-muted-foreground font-body mt-4 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Your data is encrypted and never shared. Only you can see it.
          </p>
        </div>
      </main>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// STEP 1: ABOUT YOU
// ═══════════════════════════════════════════════════════════════

function Step1({ data, update, updateNested, hasAutoFill }: {
  data: FormData; update: (field: keyof FormData, val: unknown) => void;
  updateNested: (path: string, val: unknown) => void; hasAutoFill: boolean;
}) {
  return (
    <div className="space-y-5">
      {hasAutoFill && (
        <div className="rounded-lg p-3 text-xs font-body flex items-center gap-2"
          style={{ background: 'rgba(139,111,71,0.08)', color: '#8B6F47', border: '1px solid rgba(139,111,71,0.2)' }}>
          <CheckCircle2 className="w-4 h-4" /> Some fields have been auto-filled from your signup. Feel free to edit them.
        </div>
      )}

      <TextInput label="Full Name" value={data.full_name} onChange={(v) => update('full_name', v)} placeholder="Rahul Sharma" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateInput label="Date of Birth" value={data.dob} onChange={(v) => update('dob', v)} />
        <SelectInput label="Gender" value={data.gender} onChange={(v) => update('gender', v)}
          options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectInput label="Marital Status" value={data.marital_status} onChange={(v) => update('marital_status', v)}
          options={[
            { value: 'single', label: 'Single', emoji: '👤' }, { value: 'married', label: 'Married', emoji: '👫' },
            { value: 'divorced', label: 'Divorced', emoji: '👤' }, { value: 'widowed', label: 'Widowed', emoji: '👤' },
          ]} />
        <SelectInput label="Employment Type" value={data.employment_type} onChange={(v) => update('employment_type', v)}
          options={[
            { value: 'salaried', label: 'Salaried', emoji: '🏢' }, { value: 'self_employed', label: 'Self Employed', emoji: '💼' },
            { value: 'business', label: 'Business Owner', emoji: '🏭' }, { value: 'freelance', label: 'Freelancer', emoji: '💻' },
            { value: 'retired', label: 'Retired', emoji: '🏖️' },
          ]} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberInput label="Dependent Children" value={data.dependents.children}
          onChange={(v) => updateNested('dependents.children', v)} max={10} />
        <NumberInput label="Dependent Parents" value={data.dependents.parents}
          onChange={(v) => updateNested('dependents.parents', v)} max={4} />
      </div>

      {data.dob && (
        <div className="rounded-lg p-3 text-sm font-body" style={{ background: 'rgba(139,111,71,0.08)', color: '#8B6F47', border: '1px solid rgba(139,111,71,0.2)' }}>
          🎂 You are <span className="font-bold">{Math.floor((Date.now() - new Date(data.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}</span> years old
          {Math.floor((Date.now() - new Date(data.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) < 35 ? " — plenty of time to build wealth!" : ""}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// STEP 2: INCOME & EXPENSES
// ═══════════════════════════════════════════════════════════════

function Step2({ data, update }: { data: FormData; update: (field: keyof FormData, val: unknown) => void }) {
  const monthlyIncome = data.gross_annual_income / 12;
  const surplus = monthlyIncome - data.monthly_expenses;
  const savingsRate = monthlyIncome > 0 ? (surplus / monthlyIncome) * 100 : 0;

  return (
    <div className="space-y-6">
      <CurrencyInput label="Gross Annual Income" value={data.gross_annual_income}
        onChange={(v) => update('gross_annual_income', v)} hint="Total income before tax (salary + bonuses + other)" suffix="/year" />

      <CurrencyInput label="Monthly Living Expenses" value={data.monthly_expenses}
        onChange={(v) => update('monthly_expenses', v)}
        hint="Rent, food, transport, utilities, subscriptions — everything except EMIs" suffix="/month"
        tooltip="Don't include loan EMIs here — we'll capture those separately in Step 4" />

      {data.gross_annual_income > 0 && data.monthly_expenses > 0 && (
        <div className="account-card rounded-xl p-5 space-y-3">
          <p className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wider">Quick Math</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-display text-foreground">₹{formatINR(Math.round(monthlyIncome))}</p>
              <p className="text-[10px] text-muted-foreground font-body">Monthly Income</p>
            </div>
            <div>
              <p className="text-lg font-display" style={{ color: surplus > 0 ? '#10b981' : '#ef4444' }}>₹{formatINR(Math.round(Math.abs(surplus)))}</p>
              <p className="text-[10px] text-muted-foreground font-body">{surplus >= 0 ? 'Surplus' : 'Deficit'} (pre-EMI)</p>
            </div>
            <div>
              <p className="text-lg font-display" style={{ color: savingsRate >= 50 ? '#10b981' : savingsRate >= 30 ? '#f59e0b' : '#ef4444' }}>{savingsRate.toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground font-body">Savings Rate</p>
            </div>
          </div>
          {savingsRate >= 50 && <p className="text-xs font-body text-center" style={{ color: '#10b981' }}>🔥 50%+ savings rate — you're on the fast track to FIRE!</p>}
          {savingsRate >= 20 && savingsRate < 50 && <p className="text-xs font-body text-center" style={{ color: '#f59e0b' }}>👍 Decent start. FIRE typically needs 30-50% to retire early.</p>}
          {savingsRate >= 0 && savingsRate < 20 && <p className="text-xs font-body text-center" style={{ color: '#ef4444' }}>⚠️ Low savings rate. We'll help you find ways to increase this.</p>}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// STEP 3: SAVINGS & INVESTMENTS
// ═══════════════════════════════════════════════════════════════

function Step3({ data, update }: { data: FormData; update: (field: keyof FormData, val: unknown) => void }) {
  const totalAssets = data.emergency_fund + data.retirement_balance + data.mutual_fund_value + data.stock_value + data.savings_fd_balance + data.gold_real_estate;

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground font-body">Enter current values. Leave as 0 if you don't have any.</p>

      <CurrencyInput label="Emergency Fund" value={data.emergency_fund} onChange={(v) => update('emergency_fund', v)}
        tooltip="Cash reserves for unexpected events — savings account, liquid funds, FDs you can break" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CurrencyInput label="Retirement Corpus" value={data.retirement_balance} onChange={(v) => update('retirement_balance', v)}
          tooltip="Combined EPF + PPF + NPS balances" hint="EPF + PPF + NPS" />
        <CurrencyInput label="Mutual Fund Portfolio" value={data.mutual_fund_value} onChange={(v) => update('mutual_fund_value', v)} hint="All MF folios total value" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CurrencyInput label="Stock Portfolio" value={data.stock_value} onChange={(v) => update('stock_value', v)} hint="Direct equity holdings" />
        <CurrencyInput label="Savings + FDs" value={data.savings_fd_balance} onChange={(v) => update('savings_fd_balance', v)} hint="Bank savings + fixed deposits" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CurrencyInput label="Gold + Real Estate" value={data.gold_real_estate} onChange={(v) => update('gold_real_estate', v)}
          hint="Physical gold, SGBs, property value" tooltip="For property, use current market value minus any outstanding home loan" />
        <CurrencyInput label="Current Monthly SIP" value={data.monthly_sip} onChange={(v) => update('monthly_sip', v)} suffix="/month" hint="Total SIP across all funds" />
      </div>

      {totalAssets > 0 && (
        <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <p className="text-xs text-muted-foreground font-body">Total Assets</p>
          <p className="text-2xl font-display" style={{ color: '#10b981' }}>{formatCompact(totalAssets)}</p>
          <p className="text-[10px] text-muted-foreground font-body">This becomes your starting point on the FIRE journey</p>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// STEP 4: LOANS & LIABILITIES
// ═══════════════════════════════════════════════════════════════

function Step4({ data, update, updateNested }: {
  data: FormData; update: (field: keyof FormData, val: unknown) => void;
  updateNested: (path: string, val: unknown) => void;
}) {
  const totalEMI = Object.values(data.loans).reduce((s, l) => s + (l.emi || 0), 0);
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground font-body">Enter details for each active loan. Leave at 0 if you don't have one.</p>

      <LoanRow label="Home Loan" emoji="🏠" emi={data.loans.home.emi} tenure={data.loans.home.tenure}
        onEmiChange={(v) => updateNested('loans.home.emi', v)} onTenureChange={(v) => updateNested('loans.home.tenure', v)} />
      <LoanRow label="Car Loan" emoji="🚗" emi={data.loans.car.emi} tenure={data.loans.car.tenure}
        onEmiChange={(v) => updateNested('loans.car.emi', v)} onTenureChange={(v) => updateNested('loans.car.tenure', v)} />
      <LoanRow label="Personal Loan" emoji="💳" emi={data.loans.personal.emi} tenure={data.loans.personal.tenure}
        onEmiChange={(v) => updateNested('loans.personal.emi', v)} onTenureChange={(v) => updateNested('loans.personal.tenure', v)} />
      <LoanRow label="Education Loan" emoji="🎓" emi={data.loans.education.emi} tenure={data.loans.education.tenure}
        onEmiChange={(v) => updateNested('loans.education.emi', v)} onTenureChange={(v) => updateNested('loans.education.tenure', v)} />
      <LoanRow label="Credit Card Debt" emoji="💳" emi={data.loans.credit_card.emi} tenure={data.loans.credit_card.tenure}
        onEmiChange={(v) => updateNested('loans.credit_card.emi', v)} onTenureChange={(v) => updateNested('loans.credit_card.tenure', v)} />

      <Toggle label="Have you missed any EMI recently?" value={data.missed_emi} onChange={(v) => update('missed_emi', v)} description="Late/missed payments in the last 6 months" />
      {data.missed_emi && <CurrencyInput label="Missed EMI Amount" value={data.missed_emi_amount} onChange={(v) => update('missed_emi_amount', v)} />}

      {totalEMI > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground font-body">Total Monthly EMI</p>
              <p className="text-xl font-display" style={{ color: '#ef4444' }}>₹{formatINR(totalEMI)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-body">EMI-to-Income</p>
              <p className="text-lg font-display" style={{ color: data.gross_annual_income > 0 && (totalEMI / (data.gross_annual_income / 12)) * 100 > 50 ? '#ef4444' : '#f59e0b' }}>
                {data.gross_annual_income > 0 ? `${((totalEMI / (data.gross_annual_income / 12)) * 100).toFixed(0)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
      {totalEMI === 0 && (
        <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <p className="text-sm font-body font-medium" style={{ color: '#10b981' }}>🎉 Debt Free!</p>
          <p className="text-[10px] text-muted-foreground font-body">No EMIs means more money for investments</p>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// STEP 5: INSURANCE
// ═══════════════════════════════════════════════════════════════

function Step5({ data, update }: { data: FormData; update: (field: keyof FormData, val: unknown) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground font-body">We'll analyze if your coverage is adequate for your family.</p>

      <CurrencyInput label="Life Insurance Cover" value={data.life_insurance_cover} onChange={(v) => update('life_insurance_cover', v)}
        hint="Total sum assured across all term/life policies"
        tooltip="Include only term insurance and traditional plans. Not ULIPs counted as investments." />
      <CurrencyInput label="Health Insurance Cover" value={data.health_insurance_cover} onChange={(v) => update('health_insurance_cover', v)}
        hint="Sum insured — personal + employer + top-up/super top-up"
        tooltip="Include employer group cover, but remember it vanishes when you change jobs" />
      <Toggle label="Do you have Critical Illness Cover?" value={data.critical_illness_cover} onChange={(v) => update('critical_illness_cover', v)}
        description="Fixed lump-sum payout on diagnosis of specified critical illnesses, independent of actual hospital bills." />

      <div className="account-card rounded-xl p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wider">Quick Assessment</p>
        <div className="space-y-2">
          <AssessmentRow label="Life Cover" current={data.life_insurance_cover} recommended={data.gross_annual_income * 12} suffix="(~12× income)" />
          <AssessmentRow label="Health Cover" current={data.health_insurance_cover} recommended={1000000} suffix="(min ₹10L)" />
        </div>
      </div>
    </div>
  );
}

function AssessmentRow({ label, current, recommended, suffix }: { label: string; current: number; recommended: number; suffix: string }) {
  const adequate = current >= recommended;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: adequate ? '#10b981' : '#ef4444' }} />
        <span className="text-xs font-body text-foreground">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-xs font-body font-medium" style={{ color: adequate ? '#10b981' : '#ef4444' }}>{formatCompact(current)}</span>
        <span className="text-[10px] text-muted-foreground font-body ml-1">{suffix}</span>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// STEP 6: TAX DETAILS
// ═══════════════════════════════════════════════════════════════

function Step6({ data, update }: { data: FormData; update: (field: keyof FormData, val: unknown) => void }) {
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground font-body">These details help us calculate old vs new regime and find missed deductions. Approximate values are fine.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CurrencyInput label="Basic Salary (Annual)" value={data.tax_basic_salary} onChange={(v) => update('tax_basic_salary', v)} suffix="/year"
          tooltip="Found on your payslip as 'Basic Pay'. Usually 40-50% of CTC." />
        <CurrencyInput label="HRA Received (Annual)" value={data.tax_hra_received} onChange={(v) => update('tax_hra_received', v)} suffix="/year"
          tooltip="House Rent Allowance from your employer. Check your payslip." />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CurrencyInput label="Monthly Rent Paid" value={data.tax_rent_paid} onChange={(v) => update('tax_rent_paid', v)} suffix="/month" hint="Set to 0 if you own your home" />
        <div className="flex items-end">
          <Toggle label="Metro City?" value={data.tax_is_metro_city} onChange={(v) => update('tax_is_metro_city', v)} description="Delhi, Mumbai, Chennai, Kolkata" />
        </div>
      </div>

      <div className="border-t border-border/30 pt-4">
        <p className="text-xs text-muted-foreground font-body font-medium mb-3">💼 Tax-Saving Investments (Annual)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput label="80C Investments" value={data.tax_80c_investments} onChange={(v) => update('tax_80c_investments', Math.min(v, 150000))}
            tooltip="ELSS, PPF, EPF (employee share), LIC premium, tuition fees, NSC, Sukanya" hint="Max limit: ₹1,50,000" />
          <CurrencyInput label="80D Medical Premiums" value={data.tax_80d_medical} onChange={(v) => update('tax_80d_medical', Math.min(v, 75000))}
            tooltip="Health insurance premiums paid for self, spouse, children & parents" hint="Self: ₹25K + Parents: ₹50K max" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CurrencyInput label="NPS — 80CCD(1B)" value={data.tax_nps_80ccd_1b} onChange={(v) => update('tax_nps_80ccd_1b', Math.min(v, 50000))}
          tooltip="Additional NPS contribution ABOVE 80C limit. Extra ₹50K deduction." hint="Max: ₹50,000 (above 80C)" />
        <CurrencyInput label="Home Loan Interest" value={data.tax_home_loan_interest} onChange={(v) => update('tax_home_loan_interest', Math.min(v, 200000))} suffix="/year"
          tooltip="Section 24(b): Interest paid on home loan. Max ₹2L deduction." hint="Max: ₹2,00,000" />
      </div>

      <SelectInput label="Current Tax Regime" value={data.current_tax_regime} onChange={(v) => update('current_tax_regime', v)}
        options={[{ value: 'old', label: 'Old Regime', emoji: '📋' }, { value: 'new', label: 'New Regime (Default)', emoji: '🆕' }]}
        tooltip="Not sure? New regime is default from FY 2023-24. We'll compare both and recommend." />

      {data.tax_80c_investments > 0 && (
        <div className="rounded-xl p-3 text-xs font-body" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <p className="font-medium mb-1" style={{ color: '#f59e0b' }}>80C Utilization: ₹{formatINR(data.tax_80c_investments)} / ₹1,50,000</p>
          <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ background: '#f59e0b', width: `${Math.min((data.tax_80c_investments / 150000) * 100, 100)}%` }} />
          </div>
          {data.tax_80c_investments < 150000 && (
            <p className="text-muted-foreground mt-1">Gap: ₹{formatINR(150000 - data.tax_80c_investments)} — we'll suggest ELSS funds to fill this</p>
          )}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// STEP 7: RISK PROFILE & LIFE GOALS
// ═══════════════════════════════════════════════════════════════

function Step7({ data, update }: { data: FormData; update: (field: keyof FormData, val: unknown) => void }) {
  const addGoal = () => update('life_goals', [...data.life_goals, { name: '', amount: 0, years: 5, priority: 'important' as const }]);
  const updateGoal = (index: number, field: keyof LifeGoal, value: unknown) => {
    const newGoals = [...data.life_goals];
    newGoals[index] = { ...newGoals[index], [field]: value };
    update('life_goals', newGoals);
  };
  const removeGoal = (index: number) => update('life_goals', data.life_goals.filter((_, i) => i !== index));

  const PRESET_GOALS = [
    { label: '🏠 Buy a House', name: 'House Down Payment' }, { label: '🎓 Child Education', name: 'Child Education' },
    { label: '💍 Wedding', name: 'Wedding' }, { label: '🚗 Buy a Car', name: 'New Car' },
    { label: '✈️ World Trip', name: 'World Trip' }, { label: '🏥 Parents Healthcare', name: 'Parents Healthcare' },
    { label: '💼 Start a Business', name: 'Start Business' }, { label: '🏖️ Vacation Home', name: 'Vacation Home' },
  ];

  return (
    <div className="space-y-6">
      <RadioCards label="What's your risk appetite?" value={data.risk_profile} onChange={(v) => update('risk_profile', v)}
        options={[
          { value: 'conservative', label: 'Conservative', emoji: '🛡️', description: 'Safety first. OK with lower returns.', color: 'border-blue-500 bg-blue-500/10' },
          { value: 'moderate', label: 'Moderate', emoji: '⚖️', description: 'Balanced growth. Can handle some dips.', color: 'border-emerald-500 bg-emerald-500/10' },
          { value: 'aggressive', label: 'Aggressive', emoji: '🚀', description: 'Max growth. Comfortable with 30%+ drops.', color: 'border-orange-500 bg-orange-500/10' },
        ]} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-body font-medium text-foreground">Life Goals</label>
          <span className="text-[10px] text-muted-foreground font-body">{data.life_goals.length} goal{data.life_goals.length !== 1 ? 's' : ''}</span>
        </div>

        {data.life_goals.length === 0 && (
          <div className="account-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground font-body mb-3">Quick add a goal:</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_GOALS.map((preset) => (
                <button key={preset.name} type="button" onClick={() => update('life_goals', [...data.life_goals, { name: preset.name, amount: 0, years: 5, priority: 'important' as const }])}
                  className="px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border/40 rounded-lg text-xs font-body text-foreground transition-colors">{preset.label}</button>
              ))}
            </div>
          </div>
        )}

        {data.life_goals.map((goal, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="account-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-display font-medium text-foreground">Goal {i + 1}</p>
              <button type="button" onClick={() => removeGoal(i)} className="text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground font-body mb-1 block">Goal Name</label>
                <input type="text" value={goal.name} onChange={(e) => updateGoal(i, 'name', e.target.value)} placeholder="e.g., Buy a House"
                  className="w-full bg-background border border-border/60 rounded-lg py-2.5 px-3 text-foreground text-sm font-body outline-none focus:border-[hsl(var(--accent))] transition-all placeholder:text-muted-foreground/50" />
              </div>
              <CurrencyInput label="Target Amount (today's cost)" value={goal.amount} onChange={(v) => updateGoal(i, 'amount', v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground font-body mb-1 block">Timeline</label>
                <div className="flex items-center bg-background border border-border/60 rounded-lg">
                  <input type="number" value={goal.years} onChange={(e) => updateGoal(i, 'years', parseInt(e.target.value) || 1)} min={1} max={40}
                    className="flex-1 bg-transparent py-2.5 px-3 text-foreground text-sm font-body outline-none" />
                  <span className="pr-3 text-xs text-muted-foreground font-body">years</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-body mb-1 block">Priority</label>
                <select value={goal.priority} onChange={(e) => updateGoal(i, 'priority', e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-lg py-2.5 px-3 text-foreground text-sm font-body outline-none appearance-none cursor-pointer focus:border-[hsl(var(--accent))] transition-all">
                  <option value="critical">🔴 Critical</option>
                  <option value="important">🟡 Important</option>
                  <option value="aspirational">🟢 Aspirational</option>
                </select>
              </div>
            </div>
          </motion.div>
        ))}

        <button type="button" onClick={addGoal}
          className="w-full py-3 border-2 border-dashed border-border/50 rounded-xl text-sm font-body text-muted-foreground hover:text-foreground hover:border-border transition-all flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// STEP 8: FIRE PREFERENCES
// ═══════════════════════════════════════════════════════════════

function Step8({ data, update }: { data: FormData; update: (field: keyof FormData, val: unknown) => void }) {
  const autoLean = Math.round(data.monthly_expenses * 0.6);
  const autoFat = Math.round(data.monthly_expenses * 1.5);

  useEffect(() => {
    if (!data.lean_monthly_expenses) update('lean_monthly_expenses', autoLean);
    if (!data.fat_monthly_expenses) update('fat_monthly_expenses', autoFat);
  }, []);

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground font-body">Choose your primary FIRE variant. We'll generate roadmaps for all three but optimize the dashboard for your preference.</p>

      <RadioCards label="Preferred FIRE Path" value={data.fire_variant_preference}
        onChange={(v) => update('fire_variant_preference', v)}
        options={[
          { value: 'lean', label: 'Lean FIRE', emoji: '🌿', description: 'Minimalist. Retire earliest on essentials.', color: 'border-emerald-500 bg-emerald-500/10' },
          { value: 'regular', label: 'Regular FIRE', emoji: '🔥', description: 'Current lifestyle. Most popular choice.', color: 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10' },
          { value: 'fat', label: 'Fat FIRE', emoji: '👑', description: 'Premium living. Takes longer, lives larger.', color: 'border-amber-500 bg-amber-500/10' },
        ]} />

      {/* Expense customization */}
      <div className="account-card rounded-xl p-5 space-y-4">
        <p className="text-sm font-display font-medium text-foreground">Monthly Expenses by Variant</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-body font-medium flex items-center gap-1" style={{ color: '#10b981' }}>
              <Leaf className="w-3 h-3" /> Lean
            </label>
            <div className="flex items-center bg-background border border-border/60 rounded-lg">
              <span className="pl-2.5 text-muted-foreground text-[10px]">₹</span>
              <input type="text" inputMode="numeric" value={data.lean_monthly_expenses || ''}
                onChange={(e) => update('lean_monthly_expenses', parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                placeholder={autoLean.toString()}
                className="flex-1 bg-transparent py-2.5 px-1.5 text-foreground text-sm font-body outline-none placeholder:text-muted-foreground/50 w-full" />
            </div>
            <p className="text-[9px] text-muted-foreground font-body">Default: 60% of current</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-body font-medium flex items-center gap-1" style={{ color: '#c2703e' }}>
              <Flame className="w-3 h-3" /> Regular
            </label>
            <div className="flex items-center bg-muted/30 border rounded-lg" style={{ borderColor: 'rgba(194,112,62,0.3)' }}>
              <span className="pl-2.5 text-muted-foreground text-[10px]">₹</span>
              <input type="text" value={formatINR(data.monthly_expenses)} disabled
                className="flex-1 bg-transparent py-2.5 px-1.5 text-muted-foreground text-sm font-body outline-none w-full" />
            </div>
            <p className="text-[9px] text-muted-foreground font-body">Same as Step 2</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-body font-medium flex items-center gap-1" style={{ color: '#b8860b' }}>
              <Crown className="w-3 h-3" /> Fat
            </label>
            <div className="flex items-center bg-background border border-border/60 rounded-lg">
              <span className="pl-2.5 text-muted-foreground text-[10px]">₹</span>
              <input type="text" inputMode="numeric" value={data.fat_monthly_expenses || ''}
                onChange={(e) => update('fat_monthly_expenses', parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                placeholder={autoFat.toString()}
                className="flex-1 bg-transparent py-2.5 px-1.5 text-foreground text-sm font-body outline-none placeholder:text-muted-foreground/50 w-full" />
            </div>
            <p className="text-[9px] text-muted-foreground font-body">Default: 150% of current</p>
          </div>
        </div>
      </div>

      {/* Retirement ages */}
      <div className="account-card rounded-xl p-5 space-y-4">
        <p className="text-sm font-display font-medium text-foreground text-center">Target Retirement Age</p>
        <div className="max-w-xs mx-auto text-center space-y-2">
          <span className="text-3xl">🎯</span>
          <input type="number" value={data.regular_target_retirement_age as number}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 40;
              update('lean_target_retirement_age', val);
              update('regular_target_retirement_age', val);
              update('fat_target_retirement_age', val);
            }} min={25} max={70}
            className="w-full bg-background border border-border/60 rounded-lg py-3 px-4 text-center text-foreground text-lg font-body outline-none transition-all"
            style={{ borderColor: 'rgba(194,112,62,0.3)' }} />
          <p className="text-[10px] text-muted-foreground font-body">Age you want to achieve Financial Independence</p>
        </div>
      </div>

      {/* Advanced: SWR */}
      <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-xs text-muted-foreground font-body hover:text-foreground transition-colors">
        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
        Advanced: Safe Withdrawal Rates
      </button>

      {showAdvanced && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="account-card rounded-xl p-4 space-y-3">
          <p className="text-[11px] text-muted-foreground font-body">SWR = % of corpus you withdraw annually. Lower = safer but needs bigger corpus.</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'lean_swr' as const, label: '🌿 Lean', default: 0.04 },
              { key: 'regular_swr' as const, label: '🔥 Regular', default: 0.035 },
              { key: 'fat_swr' as const, label: '👑 Fat', default: 0.03 },
            ].map((item) => (
              <div key={item.key} className="text-center">
                <label className="text-[10px] text-muted-foreground font-body">{item.label} SWR</label>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <input type="number" step="0.1" value={((data[item.key] as number) * 100).toFixed(1)}
                    onChange={(e) => update(item.key, (parseFloat(e.target.value) || item.default * 100) / 100)}
                    className="w-16 bg-background border border-border/60 rounded-lg py-1.5 px-2 text-center text-foreground text-sm font-body outline-none" />
                  <span className="text-xs text-muted-foreground font-body">%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <div className="rounded-xl p-5 text-center space-y-2" style={{ background: 'rgba(194,112,62,0.06)', border: '1px solid rgba(194,112,62,0.15)' }}>
        <Sparkles className="w-6 h-6 mx-auto" style={{ color: '#c2703e' }} />
        <p className="text-sm font-display font-semibold text-foreground">Ready to see your FIRE roadmap!</p>
        <p className="text-xs text-muted-foreground font-body">Click "Generate My FIRE Plan" below to build your personalized month-by-month journey to financial independence.</p>
      </div>
    </div>
  );
}
