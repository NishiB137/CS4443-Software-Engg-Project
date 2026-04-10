import React from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';

// ─── Read-only field row ──────────────────────────────────────────────────────
const FieldRow: React.FC<{ label: string; value?: string; missing?: boolean }> = ({ label, value, missing }) => (
  <div className="flex flex-col gap-0.5 py-2.5 border-b border-gray-50 last:border-0">
    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{label}</p>
    {value ? (
      <p className="text-[13px] text-gray-800 font-semibold break-words leading-snug">{value}</p>
    ) : (
      <p className={`text-[13px] italic ${missing ? 'text-red-500 font-semibold' : 'text-gray-300'}`}>
        {missing ? '⚠ Required' : '—'}
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
    if (key === 'onlineLink') return data.venue.onlineLink ?? '';
    return (data as unknown as Record<string, unknown>)[key] as string;
  };

  const systemFieldKeys = new Set([
    'title', 'description', 'shortDescription', 'eventType', 'format', 'isFree',
    'startDate', 'startTime', 'endDate', 'endTime', 'timezone', 'maxCapacity',
    'venue_name', 'venue_address', 'venue_city', 'venue_state', 'venue_country',
    'onlineLink', 'shareOnlineLinkLater', 'refundPolicy', 'cancellationPolicy', 'attendeeMinAge',
  ]);

  const forms = data.templateLayout?.forms || [];

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Review &amp; Publish</h2>
        <p className="text-gray-500 mt-2 text-base font-medium">Double-check your event details before going live</p>
      </div>

      {hasMissingRequired && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-2xl p-5 text-sm text-red-800 flex items-start gap-4 shadow-sm mb-8">
          <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <div>
            <p className="text-lg font-bold">Important fields are missing</p>
            <p className="mt-1 font-medium text-red-700">Please go back to fix these issues before publishing.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-8">
        {forms.map(form => {
          const isRegistrationForm = form.name === 'Registration';

          // Skip Registration form card if disabled or nothing selected
          if (isRegistrationForm && !data.requiresRegistration) return null;
          if (isRegistrationForm && data.registrationFields.length === 0) return null;

          const allFormFields = data.templateFields.filter(f => (f.form || 'General') === form.name);
          if (!isRegistrationForm && allFormFields.length === 0) return null;

          return (
            <div key={form.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-black text-gray-800">{form.name}</h3>
              </div>
              <div className="p-6 space-y-6">
                {isRegistrationForm ? (
                  // Registration: show only selected fields grouped by category
                  (() => {
                    const sortedSelected = data.registrationFields
                      .slice()
                      .sort((a, b) => {
                        const cA = (a as any).categoryOrder ?? 0;
                        const cB = (b as any).categoryOrder ?? 0;
                        const oA = (a as any).order ?? 0;
                        const oB = (b as any).order ?? 0;
                        return cA - cB || oA - oB;
                      });
                    const cats = Array.from(new Set(sortedSelected.map(f => (f as any).category || 'Contact Info')));
                    return cats.map(catName => {
                      const catFields = sortedSelected.filter(f => ((f as any).category || 'Contact Info') === catName);
                      return (
                        <div key={catName} className="space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-tight">{catName}</h4>
                          </div>
                          <div className="bg-gray-50 rounded-xl px-4 py-1">
                            {catFields.map(f => (
                              <div key={f.key} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                                <span className="text-[13px] font-medium text-gray-700">{f.label}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  f.required ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400'
                                }`}>
                                  {f.required ? 'Required' : 'Optional'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()
                ) : (
                  // Non-registration: read-only view of form fields with current values
                  form.categories
                    ?.slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map(cat => {
                      const catFields = allFormFields.filter(
                        f => (f.category || 'General') === cat.name && f.key !== 'startTime' && f.key !== 'endTime'
                      );
                      if (catFields.length === 0) return null;
                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-tight">{cat.name}</h4>
                          </div>
                          <div className="bg-gray-50 rounded-xl px-4 py-0.5">
                            {catFields
                              .slice()
                              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                              .map(f => {
                                const isSys = systemFieldKeys.has(f.key);
                                const rawVal = isSys ? getSystemValue(f.key) : data.customFieldValues[f.key];
                                let displayVal = rawVal ?? '';
                                if (f.fieldType === 'toggle') displayVal = rawVal === 'true' ? 'Yes' : rawVal === 'false' ? 'No' : '';
                                else if (f.fieldType === 'date' && rawVal) {
                                  try { displayVal = new Date(rawVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { displayVal = rawVal; }
                                }
                                const label = f.key === 'startDate' ? 'Start Date & Time'
                                  : f.key === 'endDate' ? 'End Date & Time'
                                  : f.label;
                                const pairedTime = f.key === 'startDate' ? getSystemValue('startTime')
                                  : f.key === 'endDate' ? getSystemValue('endTime')
                                  : '';
                                if (pairedTime && displayVal) displayVal = `${displayVal} · ${pairedTime}`;
                                return <FieldRow key={f.key} label={label} value={displayVal} missing={f.required && !displayVal} />;
                              })}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          );
        })}

        {/* Event Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-black text-gray-800">Event Settings</h3>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 rounded-xl px-4 py-0.5">
              <FieldRow label="Visibility & Access" value={visibilityLabels[data.visibility]} />
              <FieldRow label="Registration" value={data.requiresRegistration ? `Enabled · ${data.registrationFields.length} fields selected` : 'Not required'} />
            </div>
          </div>
        </div>

        {data.sessions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-black text-blue-900">Agenda</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{data.sessions.length} sessions</span>
            </div>
            <div className="p-6 space-y-3">
              {data.sessions.map((s, i) => (
                <div key={i} className="flex gap-4 items-start py-3 border-b border-gray-50 last:border-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm">{i + 1}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{s.title || 'Untitled Session'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.startDate ? `${s.startDate} @ ${s.startTime}` : 'TBD'}</p>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wide mt-1 inline-block">{s.sessionType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.faqs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-black text-gray-800">FAQs</h3>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-0.5 rounded-full">{data.faqs.length}</span>
            </div>
            <div className="p-6 space-y-3">
              {data.faqs.map((f, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-sm font-bold text-gray-800 mb-1 flex gap-2"><span className="text-blue-500">Q.</span>{f.question}</p>
                  <p className="text-sm text-gray-600 leading-relaxed pl-6">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Publish hint */}
      <div className="mt-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center gap-6 shadow-xl shadow-blue-900/20">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
        </div>
        <div className="text-center sm:text-left flex-1">
          <p className="font-black text-xl mb-1">Ready to launch?</p>
          <p className="text-blue-100 font-medium">Use <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">Save as Draft</span> to return later, or <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded">Publish Event</span> to go live now.</p>
        </div>
      </div>
    </div>
  );
};
