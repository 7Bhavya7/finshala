import React, { useState } from 'react';
import { ChevronDown, Info, IndianRupee } from 'lucide-react';

// ═══════════════════════════════════════════════
// INDIAN RUPEE FORMATTING
// ═══════════════════════════════════════════════

export function formatINR(num: number): string {
  if (!num && num !== 0) return '';
  if (num === 0) return '0';
  const isNeg = num < 0;
  const abs = Math.abs(Math.round(num));
  const str = abs.toString();
  if (str.length <= 3) return (isNeg ? '-' : '') + str;
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  return (isNeg ? '-' : '') + formatted;
}

export function parseINR(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[₹,\s]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

export function formatCompact(num: number): string {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K`;
  return `₹${num}`;
}

// ═══════════════════════════════════════════════
// SHARED FINSHALA-THEMED CSS CLASSES
// ═══════════════════════════════════════════════

const inputBase =
  'w-full bg-background border border-border/60 rounded-lg py-3 px-4 ' +
  'text-foreground text-sm font-body outline-none placeholder:text-muted-foreground/50 ' +
  'focus:border-[hsl(var(--accent))] focus:ring-1 focus:ring-[hsl(var(--accent))]/20 ' +
  'transition-all hover:border-border';

// ═══════════════════════════════════════════════
// CURRENCY INPUT
// ═══════════════════════════════════════════════

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  hint?: string;
  tooltip?: string;
  placeholder?: string;
  suffix?: string;
}

export function CurrencyInput({
  label, value, onChange, hint, tooltip, placeholder = '0', suffix,
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const [displayVal, setDisplayVal] = useState(value ? formatINR(value) : '');
  const [showTooltip, setShowTooltip] = useState(false);

  const handleFocus = () => { setFocused(true); setDisplayVal(value ? value.toString() : ''); };
  const handleBlur = () => {
    setFocused(false);
    const parsed = parseINR(displayVal);
    onChange(parsed);
    setDisplayVal(parsed ? formatINR(parsed) : '');
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayVal(e.target.value.replace(/[^0-9]/g, ''));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-body font-medium text-foreground">{label}</label>
        {tooltip && (
          <div className="relative">
            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help"
              onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} />
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground text-background text-xs rounded-lg px-3 py-2 w-56 z-50 shadow-xl font-body">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <div className={`flex items-center bg-background rounded-lg border transition-all ${focused ? 'border-[hsl(var(--accent))] ring-1 ring-[hsl(var(--accent))]/20' : 'border-border/60 hover:border-border'}`}>
        <div className="pl-3.5 pr-1 text-muted-foreground"><IndianRupee className="w-4 h-4" /></div>
        <input type="text" inputMode="numeric" value={displayVal} onChange={handleChange}
          onFocus={handleFocus} onBlur={handleBlur} placeholder={placeholder}
          className="flex-1 bg-transparent py-3 px-2 text-foreground text-sm font-body outline-none placeholder:text-muted-foreground/50" />
        {suffix && <span className="pr-3.5 text-xs text-muted-foreground font-body">{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground font-body">{hint}</p>}
      {value > 0 && !focused && <p className="text-[11px] font-body" style={{ color: 'hsl(var(--accent))' }}>{formatCompact(value)}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════
// TEXT INPUT
// ═══════════════════════════════════════════════

interface TextInputProps {
  label: string; value: string; onChange: (val: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}

export function TextInput({ label, value, onChange, placeholder, type = 'text', disabled = false }: TextInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-body font-medium text-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className={`${inputBase} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} />
    </div>
  );
}

// ═══════════════════════════════════════════════
// DATE INPUT
// ═══════════════════════════════════════════════

interface DateInputProps { label: string; value: string; onChange: (val: string) => void; disabled?: boolean; }

export function DateInput({ label, value, onChange, disabled = false }: DateInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-body font-medium text-foreground">{label}</label>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        max={new Date().toISOString().split('T')[0]} disabled={disabled}
        className={`${inputBase} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} />
    </div>
  );
}

// ═══════════════════════════════════════════════
// SELECT INPUT
// ═══════════════════════════════════════════════

interface SelectOption { value: string; label: string; emoji?: string; }
interface SelectInputProps {
  label: string; value: string; onChange: (val: string) => void;
  options: SelectOption[]; tooltip?: string; disabled?: boolean;
}

export function SelectInput({ label, value, onChange, options, tooltip, disabled = false }: SelectInputProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-body font-medium text-foreground">{label}</label>
        {tooltip && (
          <div className="relative">
            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help"
              onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} />
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-foreground text-background text-xs font-body rounded-lg px-3 py-2 w-52 z-50 shadow-xl">{tooltip}</div>
            )}
          </div>
        )}
      </div>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
          className={`${inputBase} appearance-none cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.emoji ? `${opt.emoji} ` : ''}{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// NUMBER INPUT (small integers like dependents)
// ═══════════════════════════════════════════════

interface NumberInputProps {
  label: string; value: number; onChange: (val: number) => void;
  min?: number; max?: number; suffix?: string;
}

export function NumberInput({ label, value, onChange, min = 0, max = 99 }: NumberInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-body font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(min, value - 1))} type="button"
          className="w-10 h-10 bg-muted/50 border border-border/50 rounded-lg flex items-center justify-center text-lg text-foreground hover:bg-muted transition-colors">−</button>
        <div className="flex-1 bg-background border border-border/60 rounded-lg py-2.5 px-4 text-center text-foreground text-sm font-body font-semibold">{value}</div>
        <button onClick={() => onChange(Math.min(max, value + 1))} type="button"
          className="w-10 h-10 bg-muted/50 border border-border/50 rounded-lg flex items-center justify-center text-lg text-foreground hover:bg-muted transition-colors">+</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// TOGGLE / SWITCH
// ═══════════════════════════════════════════════

interface ToggleProps { label: string; value: boolean; onChange: (val: boolean) => void; description?: string; }

export function Toggle({ label, value, onChange, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between bg-muted/30 border border-border/40 rounded-lg p-4 cursor-pointer hover:border-border transition-all"
      onClick={() => onChange(!value)}>
      <div>
        <p className="text-sm text-foreground font-body font-medium">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground font-body mt-0.5">{description}</p>}
      </div>
      <div className={`w-12 h-7 rounded-full transition-colors duration-300 p-0.5 ${value ? 'bg-[hsl(var(--accent))]' : 'bg-border'}`}>
        <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// RADIO CARD SELECTOR
// ═══════════════════════════════════════════════

interface RadioCardsProps {
  label: string; value: string; onChange: (val: string) => void;
  options: Array<{ value: string; label: string; emoji: string; description: string; color: string; }>;
}

export function RadioCards({ label, value, onChange, options }: RadioCardsProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-body font-medium text-foreground">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${isActive ? `${opt.color} shadow-md` : 'border-border/40 bg-card hover:border-border'}`}>
              <span className="text-2xl">{opt.emoji}</span>
              <p className="text-sm font-display font-semibold mt-2 text-foreground">{opt.label}</p>
              <p className="text-[10px] text-muted-foreground font-body mt-0.5">{opt.description}</p>
              {isActive && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--accent))' }}>
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// LOAN ROW — EMI + TENURE pair
// ═══════════════════════════════════════════════

interface LoanRowProps {
  label: string; emoji: string;
  emi: number; tenure: number;
  onEmiChange: (val: number) => void; onTenureChange: (val: number) => void;
}

export function LoanRow({ label, emoji, emi, tenure, onEmiChange, onTenureChange }: LoanRowProps) {
  const [emiDisplay, setEmiDisplay] = useState(emi ? formatINR(emi) : '');
  const [tenureDisplay, setTenureDisplay] = useState(tenure ? tenure.toString() : '');

  return (
    <div className="account-card rounded-xl p-4">
      <p className="text-sm font-display font-medium text-foreground mb-3">{emoji} {label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] text-muted-foreground font-body mb-1 block">Monthly EMI</label>
          <div className="flex items-center bg-background border border-border/60 rounded-lg">
            <span className="pl-2.5 text-muted-foreground text-xs">₹</span>
            <input type="text" inputMode="numeric" value={emiDisplay}
              onChange={(e) => setEmiDisplay(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={() => { const v = parseINR(emiDisplay); onEmiChange(v); setEmiDisplay(v ? formatINR(v) : ''); }}
              onFocus={() => setEmiDisplay(emi ? emi.toString() : '')} placeholder="0"
              className="flex-1 bg-transparent py-2.5 px-2 text-foreground text-sm font-body outline-none placeholder:text-muted-foreground/50" />
          </div>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground font-body mb-1 block">Months Left</label>
          <input type="text" inputMode="numeric" value={tenureDisplay}
            onChange={(e) => setTenureDisplay(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={() => { const v = parseInt(tenureDisplay) || 0; onTenureChange(v); setTenureDisplay(v ? v.toString() : ''); }}
            placeholder="0" className={inputBase} />
        </div>
      </div>
      {emi > 0 && tenure > 0 && (
        <p className="text-[10px] font-body mt-2" style={{ color: 'hsl(var(--accent))' }}>
          Total remaining: {formatCompact(emi * tenure)} ({Math.round(tenure / 12)} yrs {tenure % 12} mo)
        </p>
      )}
    </div>
  );
}
