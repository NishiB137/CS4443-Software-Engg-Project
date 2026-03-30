import React from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';

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

  const getSystemValue = (key: string): string => {
    if (key.startsWith('venue_')) return data.venue[key.replace('venue_', '') as keyof typeof data.venue] ?? '';
    if (key === 'refundPolicy' || key === 'cancellationPolicy' || key === 'attendeeMinAge') return data.policies[key as keyof typeof data.policies] as string;
    if (key === 'shareOnlineLinkLater') return data.venue.shareOnlineLinkLater ?? '';
    return (data as any)[key] as string;
  };

  const systemFieldKeys = new Set([
    'title', 'description', 'shortDescription', 'eventType', 'format', 'isFree',
    'startDate', 'startTime', 'endDate', 'endTime', 'timezone', 'maxCapacity',
    'venue_name', 'venue_address', 'venue_city', 'venue_state', 'venue_country',
    'onlineLink', 'shareOnlineLinkLater', 'refundPolicy', 'cancellationPolicy', 'attendeeMinAge'
  ]);

  const forms = data.templateLayout?.forms || [];

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

      {/* ── Dynamic Form Summary based on Layout ── */}
      {forms.map(form => {
        const formFields = data.templateFields.filter(f => (f.form || 'General') === form.name);
        if (formFields.length === 0) return null;

        return (
          <div key={form.name} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{form.name}</h3>
            {form.categories?.map(cat => {
              const catFields = formFields.filter(f => (f.category || 'General') === cat.name);
              if (catFields.length === 0) return null;

              return (
                <div key={cat.name} className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{cat.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                    {catFields.map(f => {
                      const isSys = systemFieldKeys.has(f.key);
                      const rawVal = isSys ? getSystemValue(f.key) : data.customFieldValues[f.key];
                      const val = f.fieldType === 'toggle' 
                        ? (rawVal === 'true' ? 'Yes' : 'No')
                        : f.fieldType === 'date' && rawVal
                        ? new Date(rawVal).toLocaleDateString()
                        : f.fieldType === 'time' && rawVal
                        ? rawVal
                        : rawVal;
                      return <Row key={f.key} label={f.label} value={val} missing={f.required && !val} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Sessions Summary */}
      {data.sessions.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">Sessions ({data.sessions.length})</h3>
          <div className="space-y-3">
            {data.sessions.map((s, i) => (
              <div key={i} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-semibold text-gray-800">{s.title || 'Untitled Session'}</p>
                  <p className="text-xs text-gray-500">
                    {s.startDate || 'TBD'} {s.startTime || 'TBD'} - {s.endDate || 'TBD'} {s.endTime || 'TBD'}
                  </p>
                </div>
                <span className="capitalize text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-md">{s.sessionType}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visiblity and FAQs Summary */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">Settings</h3>
        <Row label="Visibility" value={visibilityLabels[data.visibility]} />
      </div>

      {data.faqs.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">FAQs ({data.faqs.length})</h3>
          <div className="space-y-3 mt-2">
            {data.faqs.map((f, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-sm font-bold text-gray-900 mb-1">Q: {f.question}</p>
                <p className="text-sm text-gray-700 break-words">A: {f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
