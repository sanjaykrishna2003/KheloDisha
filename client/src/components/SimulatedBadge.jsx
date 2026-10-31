import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function SimulatedBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 shadow-sm ${className}`}
      title="All statistics and localities shown are simulated benchmark data for prototype demonstration"
    >
      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
      <span>Simulated data</span>
    </span>
  );
}
