import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Landmark, ArrowRight, RefreshCw, CheckCircle2,
  XCircle, AlertTriangle, Zap, TrendingUp, ChevronRight,
  PieChart, BarChart3, Target, Lock, Loader2, Sparkles,
  ArrowUpRight, Calculator, Wallet, Info, Send, Bot, User,
  MessageCircle,
} from 'lucide-react';
import {
  TaxWizardEngine, buildForm16FromProfile,
  type TaxWizardResult, type TaxProfile,
} from '@/services/tax-wizard-engine';
import { Form16Parser } from '@/services/form16-parser';
import { finshalaAI, type AIResponse } from '@/services/llm-service';
import { useUserProfile, toTaxProfile } from '@/hooks/useUserProfile';
import ProfileGate from '@/components/ProfileGate';

// ═══════════════════════════════════════════════
// FINSHALA THEME PALETTE
// ═══════════════════════════════════════════════

const T = {
  copper: '#8B6F47',
  gold: '#B8860B',
  olive: '#6B7F3A',
  terracotta: '#c2703e',
  sienna: '#A0522D',
  sage: '#5F8575',
};

// ═══════════════════════════════════════════════
// MOCK PROFILE (used when no real data)
// ═══════════════════════════════════════════════

const MOCK_PROFILE: TaxProfile = {
  full_name: 'Rahul Sharma',
  gross_annual_income: 1550000,
  current_tax_regime: 'new',
  tax_basic_salary: 620000,
  tax_hra_received: 310000,
  tax_rent_paid: 20000,
  tax_is_metro_city: true,
  tax_80c_investments: 110000,
  tax_80d_medical: 25000,
  tax_nps_80ccd_1b: 0,
  tax_home_loan_interest: 0,
  risk_profile: 'moderate',
  dependents: { parents: 2, children: 0 },
};


// ═══════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════

export default function TaxWizardDashboard() {
  const { profile, hasProfile } = useUserProfile();
  const [data, setData] = useState<TaxWizardResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'compare' | 'missed' | 'invest' | 'salary' | 'monthly'>('compare');

  // Password-protected PDF state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [passwordError, setPasswordError] = useState('');

  // Run initial analysis with user profile or mock
  const activeProfile: TaxProfile = hasProfile && profile ? (profile as any) : MOCK_PROFILE;

  useState(() => {
    const form16 = buildForm16FromProfile(activeProfile);
    const engine = new TaxWizardEngine(form16, activeProfile);
    setData(engine.analyze());
  });

  const regenerate = () => {
    setLoading(true);
    setTimeout(() => {
      const form16 = buildForm16FromProfile(activeProfile);
      const engine = new TaxWizardEngine(form16, activeProfile);
      setData(engine.analyze());
      setLoading(false);
    }, 600);
  };

  if (!hasProfile) return <ProfileGate />;

  const parseWithPassword = useCallback(async (file: File, password?: string) => {
    setUploading(true);
    setUploadProgress(10);

    try {
      const buffer = await file.arrayBuffer();
      setUploadProgress(30);

      const parser = new Form16Parser();
      const parsed = await parser.parse(buffer, password);
      setUploadProgress(80);

      const engine = new TaxWizardEngine(parsed, MOCK_PROFILE);
      const result = engine.analyze();
      setData(result);
      setUploadProgress(100);

      // Close password modal on success
      setShowPasswordModal(false);
      setPdfPassword('');
      setPendingFile(null);
      setPasswordError('');
    } catch (err: any) {
      const msg = err?.message || '';
      // Detect password-related errors from pdfjs
      if (msg.includes('password') || msg.includes('Password') || msg.includes('encrypted')) {
        // Show password modal
        setPendingFile(file);
        setShowPasswordModal(true);
        setPasswordError(password ? 'Incorrect password. Please try again.' : '');
      } else {
        console.error('Upload error:', err);
        alert('Failed to parse PDF: ' + msg);
      }
    }
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF file');
      return;
    }
    await parseWithPassword(file);
  }, [parseWithPassword]);

  const handlePasswordSubmit = () => {
    if (pendingFile && pdfPassword) {
      parseWithPassword(pendingFile, pdfPassword);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  if (loading) return <TaxLoadingSkeleton />;

  return (
    <div className="min-h-screen bg-background text-foreground font-body pb-16">
      {/* Password Modal for encrypted PDFs */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border/50 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
              <div className="w-14 h-14 bg-[#B8860B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-[#B8860B]" />
              </div>
              <h3 className="text-lg font-bold font-display text-ink text-center mb-1">Password Protected PDF</h3>
              <p className="text-xs text-ink-light text-center mb-5 font-medium">
                Your Form 16 is encrypted. Enter the password to continue.
              </p>
              <p className="text-[10px] text-ink-light text-center mb-4 font-medium">
                💡 Usually it's your PAN (lowercase) + DOB (DDMMYYYY)
              </p>
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-4 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-xs font-medium text-red-600">{passwordError}</p>
                </div>
              )}
              <input
                type="password"
                value={pdfPassword}
                onChange={(e) => setPdfPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter PDF password"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-ink text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#B8860B]/40 focus:border-[#B8860B] transition-all mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPasswordModal(false); setPdfPassword(''); setPendingFile(null); setPasswordError(''); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold text-ink transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={!pdfPassword}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{ backgroundColor: '#B8860B' }}>
                  Unlock & Parse
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-16 z-40 px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#B8860B]/10 rounded-xl text-[#B8860B]">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-ink">Tax Wizard</h1>
              <p className="text-sm text-ink-light font-body mt-0.5">Upload Form 16 • Compare regimes • Save tax</p>
            </div>
          </div>
          <button onClick={regenerate} className="flex items-center gap-2 px-4 py-2 bg-card border border-border/50 hover:bg-muted rounded-lg text-sm text-ink font-medium shadow-sm transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-8 space-y-8">
        {/* Upload Area */}
        <UploadArea
          dragOver={dragOver} uploading={uploading} uploadProgress={uploadProgress}
          hasData={!!data} confidence={data?.parse_confidence || 0} source={data?.source || 'manual'}
          onDrop={onDrop}
          onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onFileSelect={onFileSelect}
        />

        {data && (
          <>
            <TaxHero data={data} />
            <TaxTabs activeTab={activeTab} setActiveTab={setActiveTab} data={data} />

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                {activeTab === 'compare' && <RegimeCompare data={data} />}
                {activeTab === 'missed' && <MissedDeductions data={data} />}
                {activeTab === 'invest' && <InvestmentRecs data={data} />}
                {activeTab === 'salary' && <SalaryBreakdown data={data} />}
                {activeTab === 'monthly' && <MonthlyView data={data} />}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}


// ═══════════════════════════════════════════════
// UPLOAD AREA
// ═══════════════════════════════════════════════

function UploadArea({ dragOver, uploading, uploadProgress, hasData, confidence, source, onDrop, onDragOver, onDragLeave, onFileSelect }: any) {
  return (
    <div
      onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all
        ${dragOver ? `border-[${T.gold}] bg-[${T.gold}]/5 scale-[1.01]` :
        hasData ? 'border-[#6B7F3A]/30 bg-[#6B7F3A]/5' :
        'border-border bg-card hover:border-border/80'}`}
    >
      {uploading ? (
        <div className="space-y-4">
          <Loader2 className="w-10 h-10 text-[#B8860B] mx-auto animate-spin" />
          <p className="text-sm text-ink font-semibold">Parsing Form 16...</p>
          <div className="w-64 mx-auto h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-[#B8860B] rounded-full" animate={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-xs text-ink-light">Extracting salary, deductions, tax computation...</p>
        </div>
      ) : hasData ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#6B7F3A]/10 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-[#6B7F3A]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-[#6B7F3A]">
                {source === 'form16' ? '✅ Form 16 Analyzed' : '📋 Profile Data Analyzed'}
              </p>
              <p className="text-xs text-ink-light font-medium">
                {source === 'form16' ? `Parse confidence: ${confidence}%` : 'Using your onboarding data. Upload Form 16 for better accuracy.'}
              </p>
            </div>
          </div>
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-card border border-border/50 hover:bg-muted rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Upload className="w-4 h-4" />
            {source === 'form16' ? 'Re-upload Form 16' : 'Upload Form 16'}
            <input type="file" accept=".pdf" onChange={onFileSelect} className="hidden" />
          </label>
        </div>
      ) : (
        <label className="cursor-pointer block space-y-4">
          <div className="w-16 h-16 bg-[#B8860B]/10 rounded-2xl flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8 text-[#B8860B]" />
          </div>
          <div>
            <p className="text-base font-bold text-ink">Drop your Form 16 PDF here</p>
            <p className="text-xs text-ink-light mt-1 font-medium">or click to browse • Max 10MB • PDF only</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-ink-light">
            <Lock className="w-3 h-3" />
            Encrypted • Data never shared • Stored locally
          </div>
          <input type="file" accept=".pdf" onChange={onFileSelect} className="hidden" />
        </label>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════
// TAX HERO — 5-Card Summary
// ═══════════════════════════════════════════════

function TaxHero({ data }: { data: TaxWizardResult }) {
  const savings = data.annual_savings;
  const missedSavings = data.total_potential_saving;
  const totalOpp = savings + missedSavings;

  const cards = [
    { label: 'Old Regime Tax', value: `₹${(data.old_regime.total_tax / 1000).toFixed(0)}K`, sub: `${data.old_regime.effective_rate}% effective`, icon: <FileText className="w-5 h-5" />, color: T.copper, highlight: data.recommended_regime === 'old' },
    { label: 'New Regime Tax', value: `₹${(data.new_regime.total_tax / 1000).toFixed(0)}K`, sub: `${data.new_regime.effective_rate}% effective`, icon: <FileText className="w-5 h-5" />, color: T.sage, highlight: data.recommended_regime === 'new' },
    { label: 'Regime Switch', value: data.is_currently_optimal ? '✓ Optimal' : `₹${(savings / 1000).toFixed(0)}K`, sub: data.is_currently_optimal ? 'Already best regime' : `Switch → ${data.recommended_regime}`, icon: <ArrowRight className="w-5 h-5" />, color: savings > 0 ? T.olive : '#999' },
    { label: 'Missed Deductions', value: `₹${(missedSavings / 1000).toFixed(0)}K`, sub: `${data.missed_deductions.length} found`, icon: <Target className="w-5 h-5" />, color: missedSavings > 0 ? T.terracotta : '#999' },
    { label: 'Total Potential', value: `₹${(totalOpp / 1000).toFixed(0)}K`, sub: 'all savings combined', icon: <Sparkles className="w-5 h-5" />, color: T.gold },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          className={`relative overflow-hidden rounded-2xl p-5 bg-card border shadow-sm transition-all group hover:shadow-md
            ${c.highlight ? 'border-[#6B7F3A]/50 ring-1 ring-[#6B7F3A]/20' : 'border-border/60'}`}
        >
          <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10 group-hover:opacity-20 transition"
            style={{ backgroundColor: c.color }} />
          <div className="inline-flex p-2 rounded-lg mb-3" style={{ backgroundColor: c.color + '15', color: c.color }}>
            {c.icon}
          </div>
          <p className="text-2xl font-black font-display" style={{ color: c.color }}>{c.value}</p>
          <p className="text-xs text-ink-light font-semibold mt-1.5 uppercase tracking-wider">{c.label}</p>
          <p className="text-[10px] text-ink-light/70 mt-0.5">{c.sub}</p>
          {c.highlight && (
            <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded-full font-black text-white" style={{ backgroundColor: T.olive }}>✓ BEST</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════

function TaxTabs({ activeTab, setActiveTab, data }: { activeTab: string; setActiveTab: (t: any) => void; data: TaxWizardResult }) {
  const tabs = [
    { id: 'compare', label: 'Regime Compare', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'missed', label: 'Missed Deductions', icon: <Target className="w-4 h-4" />, badge: data.missed_deductions.length },
    { id: 'invest', label: 'Investments', icon: <TrendingUp className="w-4 h-4" />, badge: data.investment_recommendations.length },
    { id: 'salary', label: 'Salary Structure', icon: <PieChart className="w-4 h-4" /> },
    { id: 'monthly', label: 'Monthly View', icon: <Wallet className="w-4 h-4" /> },
  ];

  return (
    <div className="flex gap-1 bg-card p-1.5 rounded-xl border border-border/50 overflow-x-auto shadow-sm">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => setActiveTab(t.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
            ${activeTab === t.id ? 'bg-foreground text-background shadow-md' : 'text-ink-light hover:text-ink hover:bg-muted/50'}`}>
          {t.icon}
          {t.label}
          {(t as any).badge ? <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-[#c2703e] text-white font-bold">{(t as any).badge}</span> : null}
        </button>
      ))}
    </div>
  );
}


// ═══════════════════════════════════════════════
// REGIME COMPARISON TAB
// ═══════════════════════════════════════════════

function RegimeCompare({ data }: { data: TaxWizardResult }) {
  const regimes = [data.old_regime, data.new_regime];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {regimes.map((r) => {
        const isBest = data.recommended_regime === r.regime;
        const accentColor = r.regime === 'old' ? T.copper : T.sage;
        return (
          <div key={r.regime}
            className={`bg-card border-2 rounded-2xl p-6 shadow-sm transition-all
              ${isBest ? 'border-[#6B7F3A] shadow-md' : 'border-border/60'}`}>
            {isBest && (
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 text-xs font-black rounded-full text-white" style={{ backgroundColor: T.olive }}>✓ RECOMMENDED</span>
                <span className="text-xs font-bold" style={{ color: T.olive }}>Save ₹{(data.annual_savings / 1000).toFixed(0)}K/year</span>
              </div>
            )}
            <h3 className="text-xl font-black font-display text-ink mb-1">{r.label}</h3>
            <p className="text-xs text-ink-light font-semibold mb-5">
              Deductions: ₹{(r.total_deductions / 1000).toFixed(0)}K • Taxable: ₹{(r.taxable_income / 100000).toFixed(1)}L
            </p>

            {/* Slab Breakdown */}
            <div className="space-y-2.5 mb-6">
              {r.slab_breakdown.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-24 text-ink-light font-medium">{s.slab}</span>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      backgroundColor: accentColor,
                      width: `${r.base_tax > 0 ? Math.max((s.tax / r.base_tax) * 100, 2) : 0}%`
                    }} />
                  </div>
                  <span className="w-10 text-right font-bold text-ink-light">{s.rate}%</span>
                  <span className="w-16 text-right font-bold text-ink">₹{(s.tax / 1000).toFixed(1)}K</span>
                </div>
              ))}
            </div>

            {/* Tax Summary */}
            <div className="bg-[#F9F7EF] rounded-xl p-4 space-y-2 text-sm border border-border/30">
              <div className="flex justify-between"><span className="text-ink-light font-medium">Base Tax</span><span className="font-bold">₹{(r.base_tax / 1000).toFixed(1)}K</span></div>
              {r.rebate_87a > 0 && <div className="flex justify-between" style={{ color: T.olive }}><span>Rebate 87A</span><span className="font-bold">-₹{(r.rebate_87a / 1000).toFixed(1)}K</span></div>}
              {r.surcharge > 0 && <div className="flex justify-between"><span className="text-ink-light">Surcharge</span><span className="font-bold">₹{(r.surcharge / 1000).toFixed(1)}K</span></div>}
              <div className="flex justify-between"><span className="text-ink-light font-medium">4% Cess</span><span className="font-bold">₹{(r.cess / 1000).toFixed(1)}K</span></div>
              <div className="flex justify-between border-t border-border/50 pt-2 text-lg font-black">
                <span>Total Tax</span>
                <span style={{ color: isBest ? T.olive : T.sienna }}>₹{(r.total_tax / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between text-xs text-ink-light font-medium">
                <span>Monthly TDS</span><span>₹{(r.monthly_tax / 1000).toFixed(1)}K/mo</span>
              </div>
              <div className="flex justify-between text-xs text-ink-light font-medium">
                <span>Effective Rate</span><span>{r.effective_rate}%</span>
              </div>
            </div>

            {/* Deductions list */}
            {r.deduction_breakdown.length > 1 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest">Deductions Applied</p>
                {r.deduction_breakdown.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border border-border/50" style={{ color: T.gold, backgroundColor: T.gold + '10' }}>{d.section}</span>
                      <span className="text-ink-light truncate max-w-[160px]">{d.description}</span>
                    </div>
                    <span className="font-bold text-ink">₹{(d.amount / 1000).toFixed(0)}K</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ═══════════════════════════════════════════════
// MISSED DEDUCTIONS TAB
// ═══════════════════════════════════════════════

function MissedDeductions({ data }: { data: TaxWizardResult }) {
  const missed = data.missed_deductions;

  if (missed.length === 0) {
    return (
      <div className="bg-[#6B7F3A]/10 border border-[#6B7F3A]/20 rounded-2xl p-12 text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: T.olive }} />
        <h3 className="text-xl font-bold" style={{ color: T.olive }}>All Deductions Claimed!</h3>
        <p className="text-sm text-ink-light mt-2">You're utilizing all available tax-saving sections.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-display text-ink flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: T.terracotta }} />
          {missed.length} Missed Deductions Found
        </h3>
        <div className="bg-[#c2703e]/10 border border-[#c2703e]/20 rounded-lg px-3 py-1.5">
          <p className="text-sm font-black" style={{ color: T.terracotta }}>
            Total Saving: ₹{(data.total_potential_saving / 1000).toFixed(0)}K/year
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {missed.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded-lg text-xs font-bold border" style={{ color: T.gold, backgroundColor: T.gold + '15', borderColor: T.gold + '30' }}>{m.section}</span>
                <div>
                  <p className="font-bold text-sm text-ink">{m.name}</p>
                  <p className="text-[10px] text-ink-light font-medium">
                    {m.eligible_regime === 'old' ? 'Old regime only' : 'Both regimes'} •
                    Risk: {m.risk_level} • Lock: {m.liquidity}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black" style={{ color: T.olive }}>₹{(m.potential_tax_saving / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-ink-light font-medium">potential tax saving</p>
              </div>
            </div>

            {/* Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-ink-light font-semibold mb-1 uppercase tracking-wider">
                <span>₹{(m.currently_claimed / 1000).toFixed(0)}K claimed</span>
                <span>₹{m.max_limit === Infinity ? '∞' : (m.max_limit / 1000).toFixed(0) + 'K'} limit</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  backgroundColor: T.gold,
                  width: `${m.max_limit === Infinity ? 50 : Math.min((m.currently_claimed / m.max_limit) * 100, 100)}%`
                }} />
              </div>
              <p className="text-xs font-bold mt-1" style={{ color: T.terracotta }}>Gap: ₹{(m.gap / 1000).toFixed(0)}K unused</p>
            </div>

            {/* Suggestions */}
            <div className="space-y-1.5">
              {m.suggestions.map((s, j) => (
                <div key={j} className="flex items-start gap-2 text-xs text-ink bg-[#F9F7EF] rounded-lg p-2.5 font-medium border border-border/30">
                  <span className="flex-shrink-0">💡</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════
// INVESTMENT RECOMMENDATIONS TAB
// ═══════════════════════════════════════════════

function InvestmentRecs({ data }: { data: TaxWizardResult }) {
  const recs = data.investment_recommendations;
  const riskColors = { low: T.olive, medium: T.gold, high: T.sienna };
  const riskBg = { low: '#6B7F3A', medium: '#B8860B', high: '#A0522D' };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold font-display text-ink flex items-center gap-2">
        <TrendingUp className="w-5 h-5" style={{ color: T.olive }} />
        Tax-Saving Investments — Ranked by Your Profile
      </h3>

      <div className="space-y-4">
        {recs.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-card border rounded-2xl p-6 shadow-sm" style={{ borderColor: riskBg[r.risk] + '30' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black text-white" style={{ backgroundColor: T.copper }}>
                  #{r.rank}
                </div>
                <div>
                  <h4 className="font-bold text-ink">{r.instrument}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border" style={{ color: T.gold, borderColor: T.gold + '30', backgroundColor: T.gold + '10' }}>{r.section}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: riskBg[r.risk] }}>
                      {r.risk.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black" style={{ color: T.olive }}>₹{(r.tax_saving / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-ink-light font-medium">potential tax saving</p>
              </div>
            </div>

            <p className="text-xs text-ink-light font-medium mb-4">{r.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Invest Up To', value: `₹${(r.recommended_amount / 1000).toFixed(0)}K` },
                { label: 'Expected Return', value: r.expected_return },
                { label: 'Lock-in', value: r.lock_in },
                { label: 'Liquidity', value: r.liquidity },
              ].map((item, j) => (
                <div key={j} className="bg-[#F9F7EF] rounded-lg p-3 text-center border border-border/30">
                  <p className="text-[10px] text-ink-light font-bold uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-bold text-ink mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg p-3 text-xs font-bold border" style={{ backgroundColor: T.sage + '10', borderColor: T.sage + '20', color: T.sage }}>
              💡 {r.why}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════
// SALARY BREAKDOWN TAB
// ═══════════════════════════════════════════════

function SalaryBreakdown({ data }: { data: TaxWizardResult }) {
  const sal = data.salary_structure;
  const total = sal.gross;
  const colors = [T.copper, T.sage, T.gold, T.terracotta, T.olive];
  const components = [
    { label: 'Basic Salary', value: sal.basic, color: colors[0] },
    { label: 'HRA', value: sal.hra, color: colors[1] },
    { label: 'Special Allowance', value: sal.special_allowance, color: colors[2] },
    { label: 'LTA', value: sal.lta, color: colors[3] },
    { label: 'EPF (12%)', value: sal.epf_employee, color: colors[4] },
  ].filter((c) => c.value > 0).map(c => ({ ...c, pct: total > 0 ? (c.value / total * 100) : 0 }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Composition */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold font-display text-ink mb-2">Salary Composition</h3>
        <p className="text-xs text-ink-light font-semibold mb-6">
          Gross: ₹{(total / 100000).toFixed(1)}L/year • ₹{Math.round(total / 12000)}K/month
        </p>

        <div className="flex h-10 rounded-xl overflow-hidden mb-6 shadow-inner">
          {components.map((c, i) => (
            <div key={i} className="flex items-center justify-center text-[9px] font-bold text-white"
              style={{ width: `${c.pct}%`, backgroundColor: c.color }}>
              {c.pct > 10 && `${c.pct.toFixed(0)}%`}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {components.map((c, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-sm text-ink font-medium">{c.label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-ink">₹{(c.value / 1000).toFixed(0)}K</span>
                <span className="text-xs text-ink-light ml-2">{c.pct.toFixed(1)}%</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <span className="text-sm font-bold text-ink">Gross Annual</span>
            <span className="text-lg font-black" style={{ color: T.gold }}>₹{(total / 100000).toFixed(1)}L</span>
          </div>
        </div>
      </div>

      {/* Tax Flow */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold font-display text-ink mb-4">Income → Tax Flow</h3>
        <div className="space-y-3">
          {[
            { label: 'Gross Salary', value: total, color: 'text-ink' },
            ...data.old_regime.deduction_breakdown.filter(d => d.amount > 0).map(d => ({
              label: `− ${d.section}`, value: -d.amount, color: `text-[${T.olive}]`
            })),
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-ink-light font-medium">{row.label}</span>
              <span className="font-bold" style={{ color: row.value < 0 ? T.olive : undefined }}>
                {row.value >= 0 ? '' : '−'}₹{Math.abs(row.value) >= 100000
                  ? `${(Math.abs(row.value) / 100000).toFixed(1)}L`
                  : `${(Math.abs(row.value) / 1000).toFixed(0)}K`}
              </span>
            </div>
          ))}
          <div className="border-t border-border/50 pt-3 flex items-center justify-between">
            <span className="text-sm font-bold text-ink">Taxable Income (Old)</span>
            <span className="text-lg font-black text-ink">₹{(data.old_regime.taxable_income / 100000).toFixed(1)}L</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold" style={{ color: T.sienna }}>= Tax Payable</span>
            <span className="text-lg font-black" style={{ color: T.sienna }}>₹{(data.old_regime.total_tax / 1000).toFixed(0)}K</span>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════
// MONTHLY VIEW TAB
// ═══════════════════════════════════════════════

function MonthlyView({ data }: { data: TaxWizardResult }) {
  const months = data.monthly_breakdown || [];

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-border/40">
        <h3 className="text-lg font-bold font-display text-ink flex items-center gap-2">
          <Wallet className="w-5 h-5" style={{ color: T.copper }} />
          Monthly Salary & TDS Breakdown
        </h3>
      </div>

      {/* Chart */}
      <div className="p-5 border-b border-border/40">
        <div className="flex items-end gap-1.5 h-40">
          {months.map((m, i) => {
            const maxVal = Math.max(...months.map((x) => x.gross_salary));
            const grossH = maxVal > 0 ? (m.gross_salary / maxVal) * 100 : 0;
            const tdsH = maxVal > 0 ? (m.tds / maxVal) * 100 : 0;
            const netH = maxVal > 0 ? (m.net_in_hand / maxVal) * 100 : 0;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                <div className="absolute bottom-full mb-2 bg-card border border-border rounded-lg p-2 text-[10px] hidden group-hover:block z-10 w-36 shadow-lg">
                  <p className="font-bold text-ink">{m.month}</p>
                  <p className="text-ink-light">Gross: ₹{(m.gross_salary / 1000).toFixed(0)}K</p>
                  <p style={{ color: T.sienna }}>TDS: ₹{(m.tds / 1000).toFixed(0)}K</p>
                  <p style={{ color: T.olive }}>In-hand: ₹{(m.net_in_hand / 1000).toFixed(0)}K</p>
                </div>
                <div className="w-full flex gap-px" style={{ height: `${grossH}%` }}>
                  <motion.div className="flex-1 rounded-t-sm" style={{ backgroundColor: T.olive + 'B0', alignSelf: 'flex-end' }}
                    initial={{ height: 0 }} animate={{ height: `${grossH > 0 ? (netH / grossH) * 100 : 0}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4 }} />
                  <motion.div className="flex-1 rounded-t-sm" style={{ backgroundColor: T.sienna + 'B0', alignSelf: 'flex-end' }}
                    initial={{ height: 0 }} animate={{ height: `${grossH > 0 ? (tdsH / grossH) * 100 : 0}%` }}
                    transition={{ delay: i * 0.05 + 0.1, duration: 0.4 }} />
                </div>
                <span className="text-[9px] text-ink-light font-bold uppercase">{m.month}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-ink-light font-semibold">
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: T.olive + 'B0' }} /> Net In-hand</span>
          <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: T.sienna + 'B0' }} /> TDS</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#F9F7EF] text-ink-light font-bold uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Month</th>
              <th className="px-4 py-3 text-right">Gross</th>
              <th className="px-4 py-3 text-right">EPF + PT</th>
              <th className="px-4 py-3 text-right" style={{ color: T.sienna }}>TDS</th>
              <th className="px-4 py-3 text-right" style={{ color: T.olive }}>Net In-hand</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => (
              <tr key={i} className="border-t border-border/30 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5 font-bold text-ink">{m.month}</td>
                <td className="px-4 py-2.5 text-right font-medium">₹{(m.gross_salary / 1000).toFixed(0)}K</td>
                <td className="px-4 py-2.5 text-right text-ink-light">₹{(m.deductions / 1000).toFixed(1)}K</td>
                <td className="px-4 py-2.5 text-right font-bold" style={{ color: T.sienna }}>₹{(m.tds / 1000).toFixed(1)}K</td>
                <td className="px-4 py-2.5 text-right font-bold" style={{ color: T.olive }}>₹{(m.net_in_hand / 1000).toFixed(0)}K</td>
              </tr>
            ))}
            <tr className="border-t-2 border-border font-black">
              <td className="px-4 py-3 text-ink">TOTAL</td>
              <td className="px-4 py-3 text-right">₹{(months.reduce((s, m) => s + m.gross_salary, 0) / 100000).toFixed(1)}L</td>
              <td className="px-4 py-3 text-right text-ink-light">₹{(months.reduce((s, m) => s + m.deductions, 0) / 1000).toFixed(0)}K</td>
              <td className="px-4 py-3 text-right" style={{ color: T.sienna }}>₹{(months.reduce((s, m) => s + m.tds, 0) / 1000).toFixed(0)}K</td>
              <td className="px-4 py-3 text-right" style={{ color: T.olive }}>₹{(months.reduce((s, m) => s + m.net_in_hand, 0) / 100000).toFixed(1)}L</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════════════

function TaxLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="h-10 w-48 bg-muted/50 rounded-lg animate-pulse" />
        <div className="h-28 bg-muted/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-muted/50 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-96 bg-muted/50 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════
// AI CHAT PANEL — Tax Q&A powered by Qwen 2.5
// ═══════════════════════════════════════════════

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  latency?: number;
}

function AIChatPanel({ data }: { data: TaxWizardResult }) {
  const incomeL = (data.old_regime.gross_income / 100000).toFixed(1);
  const totalSav = Math.round((data.annual_savings + data.total_potential_saving) / 1000);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I am your Finshala Tax AI assistant powered by Qwen 2.5.\n\nI can see your tax analysis:\n- Income: Rs ${incomeL}L\n- Recommended: ${data.recommended_regime.toUpperCase()} regime\n- Potential savings: Rs ${totalSav}K\n\nAsk me anything about your taxes! For example:\n- "Why is old regime better for me?"\n- "How to save more tax?"\n- "Explain Section 80C"\n- "Meri salary pe kitna tax lagega?"`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [regimeExplanation, setRegimeExplanation] = useState<string | null>(null);
  const [loadingRegime, setLoadingRegime] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await finshalaAI.askTaxQuestion(userMsg.content, {
        income: data.old_regime.gross_income,
        regime: data.recommended_regime,
        deductions: {
          '80C': data.old_regime.deduction_breakdown.find((d) => d.section === '80C')?.amount || 0,
          '80D': data.old_regime.deduction_breakdown.find((d) => d.section === '80D')?.amount || 0,
          'NPS': data.old_regime.deduction_breakdown.find((d) => d.section === '80CCD(1B)')?.amount || 0,
          'HRA': data.old_regime.deduction_breakdown.find((d) => d.section === 'HRA')?.amount || 0,
        },
      });
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.text,
          model: response.model_used.split('/').pop(),
          latency: response.latency_ms,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Error: ' + err.message + '. Please try again.' },
      ]);
    }
    setIsLoading(false);
  };

  const loadRegimeExplanation = async () => {
    if (regimeExplanation || loadingRegime) return;
    setLoadingRegime(true);
    try {
      const response = await finshalaAI.explainRegimeChoice(
        data.old_regime.total_tax,
        data.new_regime.total_tax,
        data.recommended_regime,
        data.old_regime.deduction_breakdown.map((d) => ({ section: d.section, amount: d.amount, max: d.max })),
        data.old_regime.gross_income,
      );
      setRegimeExplanation(response.text);
    } catch {
      setRegimeExplanation('Unable to generate explanation. Try again later.');
    }
    setLoadingRegime(false);
  };

  const quickQuestions = [
    '80C mein kya kya aata hai?',
    'How to save more tax this year?',
    'Should I invest in NPS?',
    'Explain HRA exemption calculation',
  ];

  return (
    <div className="space-y-6">
      {/* AI Regime Explanation Card */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#B8860B]/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-[#B8860B]" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-ink">AI Regime Analysis</h3>
              <p className="text-xs text-ink-light">Why {data.recommended_regime.toUpperCase()} regime is better for you</p>
            </div>
          </div>
          {!regimeExplanation && (
            <button
              onClick={loadRegimeExplanation}
              disabled={loadingRegime}
              className="flex items-center gap-2 px-4 py-2 bg-[#B8860B] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loadingRegime ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              {loadingRegime ? 'Analyzing...' : 'Explain with AI'}
            </button>
          )}
        </div>
        {regimeExplanation && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#B8860B]/5 border border-[#B8860B]/20 rounded-xl p-4 text-sm text-ink leading-relaxed whitespace-pre-line">
            {regimeExplanation}
          </motion.div>
        )}
      </div>

      {/* Chat Box */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3">
          <div className="p-2 bg-[#6B7F3A]/10 rounded-xl">
            <MessageCircle className="w-5 h-5 text-[#6B7F3A]" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-ink">Ask Tax Questions</h3>
            <p className="text-xs text-ink-light">Powered by Qwen 2.5 — Indian tax expert AI</p>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[380px] overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[#8B6F47]/10' : 'bg-[#6B7F3A]/10'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-[#8B6F47]" /> : <Bot className="w-4 h-4 text-[#6B7F3A]" />}
              </div>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-[#8B6F47] text-white rounded-br-md'
                    : 'bg-muted/60 text-ink rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
                {msg.model && (
                  <p className="text-[10px] text-ink-light mt-1">
                    {msg.model} | {msg.latency}ms
                  </p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#6B7F3A]/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#6B7F3A]" />
              </div>
              <div className="bg-muted/60 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6B7F3A]" />
                  <span className="text-sm text-ink-light">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="px-6 py-3 border-t border-border/30 flex gap-2 flex-wrap">
          {quickQuestions.map((q) => (
            <button key={q} onClick={() => { setInput(q); }}
              className="text-xs px-3 py-1.5 rounded-full border border-border/50 bg-muted/30 text-ink-light hover:bg-muted hover:text-ink transition-colors font-medium">
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border/50 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask anything about your taxes..."
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-ink text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7F3A]/40 focus:border-[#6B7F3A] transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 rounded-xl text-white font-bold transition-all disabled:opacity-40"
            style={{ backgroundColor: '#6B7F3A' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

