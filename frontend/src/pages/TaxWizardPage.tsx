import React from 'react';
import Navbar from '@/components/Navbar';
import TaxWizardDashboard from '@/components/tax-wizard/TaxWizardDashboard';

export default function TaxWizardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <TaxWizardDashboard />
    </div>
  );
}
