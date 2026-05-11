import React from 'react';
import Navbar from '@/components/Navbar';
import MoneyHealthDashboard from '@/components/health-score/MoneyHealthDashboard';

export default function MoneyHealthPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MoneyHealthDashboard />
    </div>
  );
}
