import React from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { LIMITS } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { formatLocalDatetime } from '@/modules/eventCreation/microFrontends/eventWizard/hooks/useEventWizard';

const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-500 transition bg-white';

const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      {msg}
    </p>
  ) : null;

// ─── Summary row ──────────────────────────────────────────────────────────────

const Row: React.FC<{ label: string; value?: string; missing?: boolean }> = ({ label, value, missing }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium w-24 flex-shrink-0 mt-0.5">{label}</p>
    {value ? (
      <p className="text-sm text-gray-800 font-medium break-words flex-1">{value}</p>
    ) : (
      <p className={`text-sm flex-1 italic ${missing ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
        {missing ? 'Required — go back to Step 2' : 'Not set'}
      </p>
    )}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const Step4Review: React.FC<WizardStepProps & { errors?: Record<string, string> }> = ({ data, updateData, errors = {} }) => {
  void updateData;
  void errors;

  const locationParts = [data.venue.name, data.venue.city, data.venue.country].filter(Boolean);
  const locationDisplay =
    data.format === 'virtual'
      ? data.venue.onlineLink || undefined
      : locationParts.join(', ') || data.venue.onlineLink || undefined;

  const visibilityLabels: Record<string, string> = {
    public:               'Public — open to everyone',
    restricted:           'Restricted — login required',
    hidden_link:          'Hidden — link only',
    hidden_authenticated: 'Hidden — link + login required',
  };

  const missingTitle       = !data.title.trim();
  const missingDescription = !data.description.trim();
  const missingStartDate   = !data.startDate || !data.startTime;
  const missingEndDate     = !data.endDate || !data.endTime;
  const hasMissingRequired = missingTitle || missingDescription || missingStartDate || missingEndDate;

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-gray-900">Review & Publish</h2>
        <p className="text-gray-500 mt-1 text-sm">Double-check everything before going live</p>
      </div>

      {/* Missing required fields warning */}
      {hasMissingRequired && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div>
            <p className="font-semibold">Some required fields are missing</p>
            <p className="mt-0.5">Go back to <strong>Step 2 – Basic Details</strong> to fill them in before publishing.</p>
          </div>
        </div>
      )}

      {/* ── Event Summary ── */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Event Summary</h3>
        <Row label="Name"       value={data.title}                                                 missing={missingTitle} />
        <Row label="Type"       value={`${data.eventType} · ${data.format}`} />
        <Row label="Description" value={data.shortDescription || (data.description ? data.description.slice(0, 120) + (data.description.length > 120 ? '…' : '') : undefined)} missing={missingDescription} />
        <Row label="Start"      value={data.startDate && data.startTime ? formatLocalDatetime(data.startDate, data.startTime) : undefined} missing={missingStartDate} />
        <Row label="End"        value={data.endDate && data.endTime ? formatLocalDatetime(data.endDate, data.endTime) : undefined} missing={missingEndDate} />
        <Row label="Timezone"   value={data.timezone} />
        <Row label="Location"   value={locationDisplay} />
        <Row label="Pricing"    value={data.isFree ? 'Free' : 'Paid'} />
        <Row label="Capacity"   value={data.maxCapacity ? `${Number(data.maxCapacity).toLocaleString()} attendees` : 'Unlimited'} />
        <Row label="Visibility" value={visibilityLabels[data.visibility]} />
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Policies & FAQs Summary</h3>
        <Row label="Refund" value={data.policies.refundPolicy || 'Not set'} />
        <Row label="Min Age" value={data.policies.attendeeMinAge || '0'} />
        <Row label="FAQs" value={`${data.faqs.length} items`} />
      </div>

      {/* Publish hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-3">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
        <div>
          <p className="font-semibold mb-0.5">Ready to go?</p>
          <p>Use <strong>Save as Draft</strong> to save without publishing, or <strong>Publish Event</strong> to go live immediately.</p>
        </div>
      </div>
    </div>
  );
};
