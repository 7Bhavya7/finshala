import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { User, Lock, Bell, FileText, CreditCard, LogOut, Pencil, Check, X, Download, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useUserProfile } from "@/hooks/useUserProfile";

type TabId = "personal" | "notifications" | "reports";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "reports", label: "My Reports", icon: FileText },
];

/* ─── Editable Field ─────────────────────────────────────────── */
const EditableField = ({ label, value, type = "text", masked = false }: { label: string; value: string; type?: string; masked?: boolean }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const { toast } = useToast();

  const displayVal = masked ? "XXXXX" + value.slice(-5) : val;

  const save = () => {
    setEditing(false);
    toast({ title: "Updated", description: `${label} has been saved.` });
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-border/30">
      <div className="flex-1">
        <p className="text-xs font-body text-muted-foreground mb-1">{label}</p>
        {editing ? (
          <input
            type={type}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="text-sm font-body text-foreground bg-muted/50 border border-border/50 rounded-lg px-3 py-1.5 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-accent/30"
            autoFocus
          />
        ) : (
          <p className="text-sm font-body text-foreground flex items-center gap-2">
            {displayVal}
            {label === "Email Address" && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">✅ Verified</span>}
          </p>
        )}
      </div>
      {editing ? (
        <div className="flex gap-2 ml-4">
          <button onClick={save} className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"><Check size={14} /></button>
          <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"><X size={14} /></button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground ml-4">
          <Pencil size={14} />
        </button>
      )}
    </div>
  );
};

/* ─── Toggle Row ─────────────────────────────────────────────── */
const ToggleRow = ({ label, description, defaultOn = false }: { label: string; description: string; defaultOn?: boolean }) => {
  const [on, setOn] = useState(defaultOn);
  const { toast } = useToast();

  return (
    <div className="flex items-center justify-between py-4 border-b border-border/30">
      <div>
        <p className="text-sm font-body text-foreground">{label}</p>
        <p className="text-xs font-body text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => { setOn(!on); toast({ title: `${label} ${!on ? "enabled" : "disabled"}` }); }}
        className={`w-11 h-6 rounded-full transition-colors duration-300 relative ${on ? "bg-accent" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${on ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
};

/* ─── Personal Info Tab ──────────────────────────────────────── */
const PersonalInfoTab = ({ user }: { user: ReturnType<typeof useAuth>["user"] }) => {
  const navigate = useNavigate();
  let profileDetails = {} as any;
  try {
    const raw = localStorage.getItem('finshala_user_profile');
    if (raw) profileDetails = JSON.parse(raw);
  } catch {}

  return (
    <div className="space-y-6">
      <div className="account-card p-6 rounded-xl">
        <h3 className="font-display text-lg font-normal mb-1">Personal Information</h3>
        <p className="text-xs font-body text-muted-foreground mb-4">Manage your personal details</p>
        <EditableField label="Full Name" value={profileDetails.full_name || user?.user_metadata?.full_name || ""} />
        <EditableField label="Email Address" value={user?.email || ""} type="email" />
        <EditableField label="Phone Number" value={profileDetails.phone || ""} type="tel" />
        <EditableField label="Date of Birth" value={profileDetails.dob || user?.user_metadata?.date_of_birth || ""} type="date" />
        <EditableField label="PAN Number" value={profileDetails.pan || ""} masked={!!profileDetails.pan} />
        <EditableField label="City / State" value={profileDetails.city || ""} />
      </div>

      <div className="account-card p-6 rounded-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-normal mb-1 text-foreground">Complete Financial Profile</h3>
            <p className="text-xs font-body text-muted-foreground">Manage your 8-step financial data for the FIRE Planner and Money Health Score.</p>
          </div>
          <button 
            onClick={() => navigate('/fire-onboarding')}
            className="px-5 py-2 whitespace-nowrap bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/20 rounded-lg text-sm font-medium text-[hsl(var(--accent))] font-body hover:bg-[hsl(var(--accent))] hover:text-white transition-all shadow-sm"
          >
            Edit Profile Data
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Notifications Tab ──────────────────────────────────────── */
const NotificationsTab = () => (
  <div className="account-card p-6 rounded-xl">
    <h3 className="font-display text-lg font-normal mb-1">Notification Preferences</h3>
    <p className="text-xs font-body text-muted-foreground mb-4">Control how you receive updates</p>
    <ToggleRow label="Email Notifications" description="SIP reminders, portfolio alerts, and reports" defaultOn />
    <ToggleRow label="SMS Alerts" description="Transaction alerts and OTPs" defaultOn />
    <ToggleRow label="Monthly Report Email" description="Receive a monthly financial summary" defaultOn />
    <ToggleRow label="Promotional Updates" description="Product updates, offers, and newsletters" />
  </div>
);

/* ─── Reports Tab ────────────────────────────────────────────── */
const ReportsTab = () => {
  const [generating, setGenerating] = useState<string | null>(null);
  const { toast } = useToast();
  const { hasProfile } = useUserProfile();
  const navigate = useNavigate();

  const generateReport = async (type: 'fire' | 'tax' | 'health') => {
    if (!hasProfile) {
      toast({ title: '⚠️ Profile Incomplete', description: 'Please complete your onboarding profile to generate accurate personalized reports.', variant: 'destructive' });
      navigate('/fire-onboarding');
      return;
    }
    setGenerating(type);
    try {
      // Dynamically import to avoid loading engines on page load
      const { generateFirePDF, generateTaxPDF, generateHealthPDF } = await import('@/services/pdf-generator');

      if (type === 'fire') {
        const { FIREEngine, DEFAULT_FIRE_PROFILE } = await import('@/services/fire-engine');
        // Try to use user profile
        let profile = DEFAULT_FIRE_PROFILE;
        try {
          const raw = localStorage.getItem('finshala_user_profile');
          if (raw) {
            const { toFireProfile } = await import('@/hooks/useUserProfile');
            profile = toFireProfile(JSON.parse(raw)) as any;
          }
        } catch {}
        const engine = new FIREEngine(profile);
        const plan = await engine.generatePlanAsync();
        await generateFirePDF(plan);
        toast({ title: '✅ FIRE Report Downloaded', description: 'Finshala_FIRE_Report.pdf saved' });
      } else if (type === 'tax') {
        const { TaxWizardEngine, buildForm16FromProfile } = await import('@/services/tax-wizard-engine');
        let taxProfile: any = { full_name: 'User', gross_annual_income: 1500000, current_tax_regime: 'new', tax_basic_salary: 600000, tax_hra_received: 300000, tax_rent_paid: 20000, tax_is_metro_city: true, tax_80c_investments: 100000, tax_80d_medical: 25000, tax_nps_80ccd_1b: 0, tax_home_loan_interest: 0, risk_profile: 'moderate', dependents: { parents: 2, children: 0 } };
        try {
          const raw = localStorage.getItem('finshala_user_profile');
          if (raw) {
            const { toTaxProfile } = await import('@/hooks/useUserProfile');
            taxProfile = toTaxProfile(JSON.parse(raw));
          }
        } catch {}
        const form16 = buildForm16FromProfile(taxProfile);
        const engine = new TaxWizardEngine(form16, taxProfile);
        const data = engine.analyze();
        await generateTaxPDF(data);
        toast({ title: '✅ Tax Report Downloaded', description: 'Finshala_Tax_Report.pdf saved' });
      } else {
        const { generateHealthPDF } = await import('@/services/pdf-generator');
        let healthData: any;
        try {
          const raw = localStorage.getItem('finshala_user_profile');
          const profileData = raw ? JSON.parse(raw) : (await import('@/services/health-score-engine')).DEFAULT_HEALTH_PROFILE;
          const resp = await fetch('/api/calculate-health-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
          });
          if (resp.ok) {
            healthData = await resp.json();
          } else {
            throw new Error('API error');
          }
        } catch {
          // Fallback to local engine
          const { HealthScoreEngine, DEFAULT_HEALTH_PROFILE } = await import('@/services/health-score-engine');
          let healthProfile = DEFAULT_HEALTH_PROFILE;
          try {
            const raw = localStorage.getItem('finshala_user_profile');
            if (raw) {
              const { toHealthProfile } = await import('@/hooks/useUserProfile');
              healthProfile = toHealthProfile(JSON.parse(raw)) as any;
            }
          } catch {}
          const engine = new HealthScoreEngine(healthProfile);
          healthData = engine.calculate();
        }
        await generateHealthPDF(healthData);
        toast({ title: '✅ Health Report Downloaded', description: 'Finshala_Health_Score_Report.pdf saved' });
      }
    } catch (err: any) {
      toast({ title: '❌ Error', description: err.message || 'Failed to generate report' });
    }
    setGenerating(null);
  };

  const reports = [
    { id: 'fire' as const, name: 'FIRE Planner Report', desc: 'Lean, Regular & Fat FIRE analysis + milestones', icon: '🔥' },
    { id: 'tax' as const, name: 'Tax Wizard Report', desc: 'Regime comparison, deductions & optimization', icon: '🏛️' },
    { id: 'health' as const, name: 'Money Health Score Report', desc: '6-dimension financial wellness analysis', icon: '💚' },
  ];

  return (
    <div className="account-card p-6 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-display text-lg font-normal">My Reports</h3>
          <p className="text-xs font-body text-muted-foreground">Generate & download your financial reports as PDF</p>
        </div>
      </div>
      {reports.map((r) => (
        <div key={r.id} className="flex items-center justify-between py-4 border-b border-border/20 last:border-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">{r.icon}</span>
            <div>
              <p className="text-sm font-body font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.desc}</p>
            </div>
          </div>
          <button
            onClick={() => generateReport(r.id)}
            disabled={generating !== null}
            className="flex items-center gap-1.5 text-xs font-body font-semibold text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50"
            style={{ backgroundColor: '#8B6F47' }}
          >
            {generating === r.id ? (
              <><span className="animate-spin">⏳</span> Generating...</>
            ) : (
              <><Download size={12} /> Generate PDF</>
            )}
          </button>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground mt-4 text-center">
        ⚠️ Reports are for educational purposes only. Not financial advice.
      </p>
    </div>
  );
};


/* ─── Main Account Page ──────────────────────────────────────── */
const Account = () => {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [healthScore, setHealthScore] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('finshala_user_profile');
      if (raw) {
        import('@/services/health-score-engine').then(({ HealthScoreEngine }) => {
          const profile = JSON.parse(raw);
          const engine = new HealthScoreEngine(profile as any);
          const result = engine.calculate();
          setHealthScore(Math.round(result.overall_score / 9));
        }).catch(() => {});
      }
    } catch {}
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "personal": return <PersonalInfoTab user={user} />;
      case "notifications": return <NotificationsTab />;
      case "reports": return <ReportsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-24 pb-16">
        {/* Mobile tab bar */}
        <div className="md:hidden flex overflow-x-auto gap-1 mb-6 pb-2 -mx-4 px-4 scrollbar-hide">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body whitespace-nowrap transition-all ${
                  activeTab === t.id ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon size={12} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-8">
          {/* ─── Sidebar (desktop) ─── */}
          <div className="hidden md:block w-[280px] shrink-0">
            <div className="account-card p-6 rounded-xl mb-4">
              {/* Avatar */}
              <div className="relative w-20 h-20 mx-auto mb-4 group cursor-pointer">
                <div className="w-full h-full rounded-full bg-accent/10 flex items-center justify-center text-accent text-2xl font-display">
                  {(user?.user_metadata?.full_name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil size={16} className="text-white" />
                </div>
              </div>
              <h2 className="text-center font-display text-lg font-normal">{user?.user_metadata?.full_name || "User"}</h2>
              <p className="text-center text-xs font-body text-muted-foreground">{user?.email}</p>
              <p className="text-center text-[10px] font-body text-muted-foreground mt-1">Member since {new Date(user?.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>

              {/* Mini gauge */}
              <div className="mt-4 text-center">
                <p className="text-[10px] font-body text-muted-foreground uppercase tracking-wider mb-1">Health Score</p>
                <div className="relative w-16 h-16 mx-auto">
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--border))" strokeWidth="4" opacity="0.3" />
                    <circle
                      cx="32" cy="32" r="28" fill="none" stroke={healthScore >= 75 ? "#10b981" : healthScore >= 60 ? "#f59e0b" : "#ef4444"} strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${(healthScore / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
                      transform="rotate(-90 32 32)"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-display">{healthScore}</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="account-card rounded-xl overflow-hidden">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-body transition-all ${
                      activeTab === t.id
                        ? "bg-accent/10 text-accent border-l-2 border-accent"
                        : "text-foreground/70 hover:bg-muted/50 border-l-2 border-transparent"
                    }`}
                  >
                    <Icon size={16} /> {t.label}
                    {activeTab === t.id && <ChevronRight size={14} className="ml-auto" />}
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-body text-red-500 hover:bg-red-500/5 transition-colors border-l-2 border-transparent"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>

          {/* ─── Content Area ─── */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
