// ═══════════════════════════════════════════════
// PROFILE GATE — Shown when user hasn't completed onboarding
// ═══════════════════════════════════════════════

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowRight, Shield, Sparkles } from 'lucide-react';

export default function ProfileGate() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-lg w-full text-center space-y-8"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'rgba(184,134,11,0.1)' }}
        >
          <ClipboardList className="w-12 h-12 text-[#B8860B]" />
        </motion.div>

        {/* Text */}
        <div className="space-y-3">
          <h2 className="font-display text-3xl text-foreground">Complete Your Profile First</h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto leading-relaxed">
            We need your financial details to generate personalized analysis. 
            Fill in your income, expenses, investments, and goals — it takes just 5 minutes.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            { icon: <Sparkles className="w-5 h-5 text-[#6B7F3A]" />, title: 'AI-Powered', desc: 'Personalized insights from your real data' },
            { icon: <Shield className="w-5 h-5 text-[#5F8575]" />, title: '100% Private', desc: 'Data stays on your device, never shared' },
            { icon: <ClipboardList className="w-5 h-5 text-[#B8860B]" />, title: '5 min setup', desc: '8 simple steps to financial clarity' },
          ].map((f) => (
            <div key={f.title} className="bg-card border border-border/40 rounded-xl p-4">
              <div className="mb-2">{f.icon}</div>
              <p className="text-sm font-body font-semibold text-foreground">{f.title}</p>
              <p className="text-xs font-body text-muted-foreground mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/fire-onboarding')}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-body font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
          style={{ backgroundColor: '#B8860B' }}
        >
          Start Financial Profile <ArrowRight className="w-4 h-4" />
        </button>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground font-body">
          ⚠️ This is for educational purposes only. Not financial advice.
        </p>
      </motion.div>
    </div>
  );
}
