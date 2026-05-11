// ═══════════════════════════════════════════════
// EDUCATIONAL DISCLAIMER — shown on every page
// ═══════════════════════════════════════════════

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="w-full border-t border-border/40 bg-card/50 py-3 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs font-body text-muted-foreground">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <span>
          <strong>Disclaimer:</strong> This is for <strong>educational purposes only</strong>. Not financial, tax, or investment advice. 
          Consult a SEBI-registered advisor before making financial decisions.
        </span>
      </div>
    </div>
  );
}
