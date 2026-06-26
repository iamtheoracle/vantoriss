import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { TrendingUp } from 'lucide-react';

export default function ExecutiveReports() {
  return (
    <OperationsPageLayout title="Executive Reports" description="High-level summaries for institutional leadership" icon={TrendingUp}>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="vantoris-card p-5">
          <p className="text-[#AAB4C3] text-xs mb-1">Platform Growth</p>
          <p className="text-white font-bold text-2xl">Q2 2026</p>
        </div>
        <div className="vantoris-card p-5">
          <p className="text-[#AAB4C3] text-xs mb-1">Report Status</p>
          <p className="text-brass font-semibold text-lg">Ready to Generate</p>
        </div>
        <div className="vantoris-card p-5">
          <p className="text-[#AAB4C3] text-xs mb-1">Period</p>
          <p className="text-white font-semibold text-lg">Jan – Jun 2026</p>
        </div>
      </div>
      <div className="vantoris-card p-12 text-center">
        <TrendingUp size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
        <p className="text-white font-medium mb-1">Executive reports are generated on demand</p>
        <p className="text-[#AAB4C3] text-sm">Configure reporting periods and generate comprehensive executive summaries.</p>
      </div>
    </OperationsPageLayout>
  );
}