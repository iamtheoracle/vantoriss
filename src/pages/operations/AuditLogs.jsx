import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { ScrollText } from 'lucide-react';

export default function AuditLogs() {
  return (
    <OperationsPageLayout title="Audit Logs" description="Chronological record of all administrative actions" icon={ScrollText}>
      <div className="vantoris-card p-12 text-center">
        <ScrollText size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
        <p className="text-white font-medium mb-1">No audit events recorded</p>
        <p className="text-[#AAB4C3] text-sm">Administrative actions will be logged here for compliance tracking.</p>
      </div>
    </OperationsPageLayout>
  );
}