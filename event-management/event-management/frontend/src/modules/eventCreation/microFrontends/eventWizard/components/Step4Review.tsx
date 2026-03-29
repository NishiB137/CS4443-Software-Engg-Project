import React, { useState } from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { LIMITS } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { formatLocalDatetime } from '@/modules/eventCreation/microFrontends/eventWizard/hooks/useEventWizard';
import { SessionManager } from './SessionManager';

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
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [faqErrors, setFaqErrors] = useState<{ question?: string; answer?: string }>({});

  const validateFaq = () => {
    const e: typeof faqErrors = {};
    if (!newFaq.question.trim()) e.question = 'Question is required.';
    else if (newFaq.question.trim().length < LIMITS.faqQuestion.min) e.question = `Must be at least ${LIMITS.faqQuestion.min} characters.`;
    else if (newFaq.question.trim().length > LIMITS.faqQuestion.max) e.question = `Cannot exceed ${LIMITS.faqQuestion.max} characters.`;
    if (!newFaq.answer.trim()) e.answer = 'Answer is required.';
    else if (newFaq.answer.trim().length < LIMITS.faqAnswer.min) e.answer = `Must be at least ${LIMITS.faqAnswer.min} characters.`;
    else if (newFaq.answer.trim().length > LIMITS.faqAnswer.max) e.answer = `Cannot exceed ${LIMITS.faqAnswer.max} characters.`;
    return e;
  };

  const addFaq = () => {
    const e = validateFaq();
    if (Object.keys(e).length > 0) { setFaqErrors(e); return; }
    updateData({ faqs: [...data.faqs, { ...newFaq }] });
    setNewFaq({ question: '', answer: '' });
    setFaqErrors({});
  };

  const removeFaq = (idx: number) => {
    updateData({ faqs: data.faqs.filter((_, i) => i !== idx) });
  };

  const updatePolicy = (fields: Partial<typeof data.policies>) => {
    updateData({ policies: { ...data.policies, ...fields } });
  };

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

      {/* ── Sessions ── */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Sessions / Agenda</h3>
            <p className="text-xs text-gray-500 mt-0.5">Add sessions that make up your event's schedule</p>
          </div>
          {data.sessions.length > 0 && (
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
              {data.sessions.length} session{data.sessions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <SessionManager
          sessions={data.sessions}
          onChange={(sessions) => updateData({ sessions })}
        />
      </div>

      {/* ── Policies ── */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">
          Policies
          <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
        </h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Refund Policy</label>
            <select
              className={inputCls}
              value={data.policies.refundPolicy}
              onChange={(e) => updatePolicy({ refundPolicy: e.target.value as typeof data.policies.refundPolicy })}
            >
              <option value="">Select refund policy</option>
              <option value="full">Full refund</option>
              <option value="partial">Partial refund</option>
              <option value="no_refund">No refund</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>
              Cancellation Policy
              <span className="text-gray-400 font-normal ml-1">(max {LIMITS.cancellationPolicy.max} chars)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Describe your cancellation terms..."
              maxLength={LIMITS.cancellationPolicy.max}
              className={`${inputCls} ${errors['cancellationPolicy'] ? 'border-red-400' : ''}`}
              value={data.policies.cancellationPolicy}
              onChange={(e) => updatePolicy({ cancellationPolicy: e.target.value })}
            />
            <div className="flex items-start justify-between">
              <FieldError msg={errors['cancellationPolicy']} />
              <p className="text-xs text-gray-400 mt-1 text-right">{data.policies.cancellationPolicy.length}/{LIMITS.cancellationPolicy.max}</p>
            </div>
          </div>

          <div className="max-w-xs">
            <label className={labelCls}>
              Minimum Attendee Age
              <span className="text-gray-400 font-normal ml-1">(0 – {LIMITS.attendeeMinAge.max})</span>
            </label>
            <input
              type="number"
              min={LIMITS.attendeeMinAge.min}
              max={LIMITS.attendeeMinAge.max}
              step={1}
              placeholder="0 (no restriction)"
              className={`${inputCls} ${errors['attendeeMinAge'] ? 'border-red-400 bg-red-50' : ''}`}
              value={data.policies.attendeeMinAge}
              onChange={(e) => updatePolicy({ attendeeMinAge: e.target.value })}
            />
            <FieldError msg={errors['attendeeMinAge']} />
          </div>
        </div>
      </div>

      {/* ── FAQs ── */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">
          FAQs
          <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
        </h3>

        {data.faqs.length > 0 && (
          <div className="space-y-2 mb-4">
            {data.faqs.map((faq, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3.5 border border-gray-200">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{faq.question}</p>
                    <p className="text-sm text-gray-600 mt-1">{faq.answer}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFaq(i)}
                    className="text-red-400 hover:text-red-600 text-xs font-medium flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add a FAQ</p>
          <div>
            <input
              type="text"
              placeholder={`Question (${LIMITS.faqQuestion.min}–${LIMITS.faqQuestion.max} chars)`}
              maxLength={LIMITS.faqQuestion.max}
              className={`${inputCls} ${faqErrors.question ? 'border-red-400 bg-red-50' : ''}`}
              value={newFaq.question}
              onChange={(e) => { setNewFaq((p) => ({ ...p, question: e.target.value })); setFaqErrors((p) => ({ ...p, question: undefined })); }}
            />
            <FieldError msg={faqErrors.question} />
          </div>
          <div>
            <textarea
              rows={2}
              placeholder={`Answer (${LIMITS.faqAnswer.min}–${LIMITS.faqAnswer.max} chars)`}
              maxLength={LIMITS.faqAnswer.max}
              className={`${inputCls} ${faqErrors.answer ? 'border-red-400 bg-red-50' : ''}`}
              value={newFaq.answer}
              onChange={(e) => { setNewFaq((p) => ({ ...p, answer: e.target.value })); setFaqErrors((p) => ({ ...p, answer: undefined })); }}
            />
            <FieldError msg={faqErrors.answer} />
          </div>
          <button
            type="button"
            onClick={addFaq}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
          >
            + Add FAQ
          </button>
        </div>
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
