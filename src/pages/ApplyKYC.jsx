import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Check, FileText, ShieldCheck } from 'lucide-react';
import { clearMutationIdempotencyKey, fingerprintMutationScope, getMutationIdempotencyKey } from '@/lib/mutationIdempotency';

export default function ApplyKYC() {
  const [application, setApplication] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        const apps = await base44.entities.Application.filter({ user_id: me.id });
        if (apps[0]) {
          setApplication(apps[0]);
          setDocuments(apps[0].kyc_documents || []);
        } else {
          navigate('/apply', { replace: true });
          return;
        }
      } catch (e) {
        console.error(e);
        setError('Unable to load your application. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
    if (!allowedTypes.has(file.type) || file.size <= 0 || file.size > 25 * 1024 * 1024) {
      setError('Choose a PDF, JPG, or PNG file no larger than 25MB.');
      return;
    }
    if (documents.length >= 10) {
      setError('You can submit no more than 10 documents.');
      return;
    }
    if (!application || !['not_started', 'rejected'].includes(application.kyc_status) || !application.updated_date) {
      setError('Documents cannot be changed while verification is pending, approved, or the application revision is unavailable.');
      return;
    }

    setUploading(true);
    setError('');
    let operationScope = '';
    let uploadWindow = null;
    try {
      operationScope = `kyc-upload:${await fingerprintMutationScope(JSON.stringify({
        applicationId: application.id,
        expectedUpdatedDate: application.updated_date,
        expectedKycStatus: application.kyc_status,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      }))}`;
      const idempotencyKey = await getMutationIdempotencyKey(operationScope);
      const response = await base44.functions.invoke('createKYCUpload', {
        application_id: application.id,
        expected_updated_date: application.updated_date,
        expected_kyc_status: application.kyc_status,
        file_name: file.name,
        content_type: file.type,
        size_bytes: file.size,
        idempotency_key: idempotencyKey,
      });
      const result = response?.data || response;
      let uploadUrl;
      try { uploadUrl = new URL(result?.upload_url); } catch { uploadUrl = null; }
      if (
        result?.success !== true ||
        result?.operation_id !== idempotencyKey ||
        result?.audit_recorded !== true ||
        typeof result?.document_ref !== 'string' ||
        typeof result?.expires_at !== 'string' ||
        Date.parse(result.expires_at) <= Date.now() ||
        result?.content_type !== file.type ||
        result?.method !== 'PUT' ||
        !uploadUrl ||
        uploadUrl.protocol !== 'https:' ||
        uploadUrl.username ||
        uploadUrl.password ||
        uploadUrl.hash
      ) {
        throw new Error(result?.error || 'The private upload provider did not authorize a valid, short-lived upload.');
      }

      const uploadResponse = await fetch(uploadUrl.href, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error('The private document upload failed. Retry the same upload operation; do not use a public upload link.');
      }
      await clearMutationIdempotencyKey(operationScope);
      setDocuments(prev => prev.includes(result.document_ref) ? prev : [...prev, result.document_ref]);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || err.message || 'Private document upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!application) return;
    if (!application.updated_date || !['not_started', 'rejected'].includes(application.kyc_status)) {
      setError('Your application revision or KYC state is no longer eligible for submission. Refresh and try again.');
      return;
    }
    if (documents.length === 0 || documents.length > 10) {
      setError('Upload between 1 and 10 valid documents before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    let operationScope = '';
    try {
      operationScope = `kyc-submit:${await fingerprintMutationScope(JSON.stringify({
        applicationId: application.id,
        expectedUpdatedDate: application.updated_date,
        expectedKycStatus: application.kyc_status,
        documents,
      }))}`;
      const idempotencyKey = await getMutationIdempotencyKey(operationScope);
      const response = await base44.functions.invoke('submitKYCApplication', {
        application_id: application.id,
        expected_updated_date: application.updated_date,
        expected_kyc_status: application.kyc_status,
        document_refs: documents,
        idempotency_key: idempotencyKey,
      });
      const result = response?.data || response;
      const savedApplication = result?.application;
      if (
        result?.success !== true ||
        result?.operation_id !== idempotencyKey ||
        result?.audit_recorded !== true ||
        savedApplication?.id !== application.id ||
        savedApplication?.user_id !== application.user_id ||
        savedApplication?.kyc_status !== 'pending' ||
        typeof savedApplication?.updated_date !== 'string' ||
        savedApplication.updated_date === application.updated_date ||
        !Array.isArray(savedApplication.kyc_documents) ||
        savedApplication.kyc_documents.length !== documents.length ||
        documents.some((document, index) => savedApplication.kyc_documents[index] !== document)
      ) {
        throw new Error(result?.error || 'The server did not confirm your audited KYC submission. Retry only with the same operation.');
      }
      await clearMutationIdempotencyKey(operationScope);
      setApplication(savedApplication);
      setDone(true);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || err.message || 'Failed to submit documents. Retry only with the same operation.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="px-5 pt-6 min-h-screen flex flex-col items-center justify-center">
        <div className="vantoris-card p-8 text-center w-full max-w-sm">
          <div className="w-16 h-16 rounded-full bg-olive/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Documents Submitted</h2>
          <p className="text-[#AAB4C3] text-sm mb-6">Your identity verification is under review. We'll notify you once it's processed.</p>
          <button onClick={() => navigate('/')} className="w-full py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const canSubmit = !!application && ['not_started', 'rejected'].includes(application.kyc_status);

  return (
    <div className="px-5 pt-6 min-h-screen">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[#AAB4C3] text-sm mb-6">
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">Identity Verification</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">Upload the required documents to verify your identity.</p>
      {error && (
        <div className="vantoris-card p-3 mb-4 border-crimson/30 bg-crimson/5">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}
      {application?.kyc_status === 'pending' && (
        <div className="vantoris-card p-3 mb-4 border-brass/30 bg-brass/5">
          <p className="text-brass text-xs">Your documents are already under review. Wait for the review decision before changing your submission.</p>
        </div>
      )}
      {application?.kyc_status === 'approved' && (
        <div className="vantoris-card p-3 mb-4 border-olive/30 bg-olive/5">
          <p className="text-emerald-400 text-xs">Your identity verification is approved. Contact support if your details need updating.</p>
        </div>
      )}
      {application?.kyc_status === 'rejected' && (
        <div className="vantoris-card p-3 mb-4 border-crimson/30 bg-crimson/5">
          <p className="text-red-400 text-xs">Your previous submission was rejected. Please re-upload valid documents to continue.</p>
        </div>
      )}

      <div className="vantoris-card p-5 mb-4">
        <h3 className="text-white font-medium text-sm mb-3">Required Documents</h3>
        <ul className="space-y-2 text-[#AAB4C3] text-xs">
          <li className="flex items-center gap-2"><FileText size={14} /> Government-issued photo ID (Driver's License or State ID)</li>
          <li className="flex items-center gap-2"><FileText size={14} /> Social Security Number (SSN) or ITIN</li>
          <li className="flex items-center gap-2"><FileText size={14} /> Proof of address (utility bill, bank statement)</li>
          <li className="flex items-center gap-2"><FileText size={14} /> Selfie verification</li>
        </ul>
      </div>

      {/* Upload area */}
      <div className="vantoris-card p-5 mb-4">
        <label className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-[#242D38] rounded-xl cursor-pointer hover:border-brass/30 transition-all">
          <Upload size={28} className="text-[#AAB4C3] mb-2" />
          <p className="text-white text-sm font-medium">{uploading ? 'Uploading...' : 'Upload Document'}</p>
          <p className="text-[#AAB4C3] text-xs mt-1">PDF, JPG, or PNG up to 25MB</p>
          <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={handleUpload} disabled={uploading || !application || !["not_started", "rejected"].includes(application.kyc_status) || documents.length >= 10} />
        </label>
      </div>

      {documents.length > 0 && (
        <div className="vantoris-card p-4 mb-4">
          <h3 className="text-white font-medium text-sm mb-3">Uploaded ({documents.length})</h3>
          {documents.map((doc, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-[#242D38]/40 last:border-0">
              <Check size={14} className="text-emerald-400" />
              <span className="text-[#AAB4C3] text-xs truncate flex-1">Document {i + 1}</span>
              <button
                disabled={!application || !['not_started', 'rejected'].includes(application.kyc_status) || submitting}
                onClick={() => setDocuments(prev => prev.filter((_, idx) => idx !== i))}
                className="text-red-400/70 hover:text-red-400 text-xs"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        disabled={documents.length === 0 || submitting || uploading || !canSubmit}
        onClick={handleSubmit}
        className="w-full py-3.5 bg-brass text-[#0E1A2B] font-semibold rounded-xl hover:bg-brass/90 transition-all disabled:opacity-40"
      >
        {submitting ? 'Submitting...' : 'Submit for Verification'}
      </button>
    </div>
  );
}