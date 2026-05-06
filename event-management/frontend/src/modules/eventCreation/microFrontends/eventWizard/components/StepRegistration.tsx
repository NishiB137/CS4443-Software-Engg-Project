import React from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { REGISTRATION_FIELD_OPTIONS } from '@/modules/eventCreation/microFrontends/eventWizard/interface';

const FieldTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const colors: Record<string, string> = {
    text:     'bg-blue-50 text-blue-600',
    email:    'bg-purple-50 text-purple-600',
    phone:    'bg-green-50 text-green-600',
    textarea: 'bg-orange-50 text-orange-600',
    select:   'bg-indigo-50 text-indigo-600',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold uppercase tracking-wide ${colors[type] ?? 'bg-gray-50 text-gray-500'}`}>
      {type}
    </span>
  );
};

const Toggle: React.FC<{ checked: boolean; onChange: () => void; color?: string }> = ({
  checked, onChange, color = 'bg-indigo-600',
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative w-14 h-7 rounded-full transition-colors duration-300 flex-shrink-0 focus:outline-none ${checked ? color : 'bg-gray-200'}`}
  >
    <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${checked ? 'translate-x-7' : 'translate-x-0'}`} />
  </button>
);

export const StepRegistration: React.FC<WizardStepProps> = ({ data, updateData }) => {
  // ── Registration fields setup ────────────────────────────────────────────────
  const templateRegFields = data.templateFields.filter((f: any) => f.form === 'Registration');

  const catOrderMap: Record<string, number> = {};
  const rawSrc = templateRegFields.length > 0 ? templateRegFields : REGISTRATION_FIELD_OPTIONS;
  (rawSrc as any[]).forEach((f: any) => {
    const cat = f.category || 'Contact Info';
    if (catOrderMap[cat] === undefined) {
      catOrderMap[cat] = f.categoryOrder ?? Object.keys(catOrderMap).length;
    }
  });

  const fieldOptions = templateRegFields.length > 0
    ? templateRegFields.map((f: any, idx: number) => ({
        key: f.key,
        label: f.label,
        fieldType: (f.fieldType ?? 'text') as 'text' | 'email' | 'phone' | 'textarea' | 'select',
        required: f.required ?? false,
        options: f.options as string[] | undefined,
        category: f.category || 'Contact Info',
        categoryOrder: catOrderMap[f.category || 'Contact Info'] ?? 0,
        form: f.form,
        order: f.order ?? idx,
      }))
    : REGISTRATION_FIELD_OPTIONS.map((f, idx) => ({
        ...f,
        category: 'Contact Info',
        categoryOrder: 0,
        order: idx,
      }));

  const toggleField = (key: string) => {
    const alreadySelected = data.registrationFields.some((f: any) => f.key === key);
    if (alreadySelected) {
      updateData({ registrationFields: data.registrationFields.filter((f: any) => f.key !== key) });
    } else {
      const fieldDef = fieldOptions.find(f => f.key === key);
      if (!fieldDef) return;
      updateData({ registrationFields: [...data.registrationFields, { ...fieldDef }] });
    }
  };

  const toggleRequired = (key: string) => {
    updateData({
      registrationFields: data.registrationFields.map(f =>
        f.key === key ? { ...f, required: !f.required } : f
      ),
    });
  };

  const enableRegistration = () => {
    updateData({
      requiresRegistration: true,
      registrationFields: data.registrationFields.length === 0
        ? [
            { key: 'attendeeName',  label: 'Full Name',     fieldType: 'text' as const,  required: true,  category: 'Contact Info', categoryOrder: 0, order: 0 } as any,
            { key: 'attendeeEmail', label: 'Email Address', fieldType: 'email' as const, required: true,  category: 'Contact Info', categoryOrder: 0, order: 1 } as any,
          ]
        : data.registrationFields,
    });
  };

  // ── Entry settings helpers ───────────────────────────────────────────────────
  const es = data.entrySettings;
  const updateES = (patch: Partial<typeof es>) =>
    updateData({ entrySettings: { ...es, ...patch } });
  const scannerType = es?.scannerType ?? 'none';
  const enableAM    = es?.enableAttendanceManagement ?? false;

  const isPaid = data.isPaid === true || String(data.isPaid) === 'true';
  const isRegistrationForced = isPaid || enableAM;

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Registration & Attendance</h2>
        <p className="text-gray-500 mt-2 text-sm">Configure registration, ticket scanning, and attendee check-in</p>
      </div>

      {/* ── Registration Toggle ─────────────────────────────────────────────── */}
      <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
        <div
          className={`flex items-center justify-between px-6 py-5 select-none ${isRegistrationForced ? 'opacity-80 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
          onClick={() => {
            if (isRegistrationForced) return;
            data.requiresRegistration ? updateData({ requiresRegistration: false }) : enableRegistration()
          }}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${data.requiresRegistration || isRegistrationForced ? 'bg-indigo-100' : 'bg-gray-100'}`}>
              <svg className={`w-6 h-6 transition-colors ${data.requiresRegistration || isRegistrationForced ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Registration Required</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {isPaid
                  ? 'Registration is mandatory for paid events'
                  : enableAM
                    ? 'Registration is required when attendance tracking is enabled'
                    : data.requiresRegistration
                      ? 'Attendees must fill out a form to secure their spot'
                      : 'Turn on to collect information from attendees before they join'}
              </p>
            </div>
          </div>
          <Toggle checked={data.requiresRegistration || isRegistrationForced} onChange={() => {}} color={isRegistrationForced ? 'bg-indigo-400' : 'bg-indigo-600'} />
        </div>

        {(data.requiresRegistration || isRegistrationForced) && (
          <div className="border-t border-gray-100 bg-gray-50 px-6 pb-6 pt-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-900">Fields to collect from attendees</p>
              <span className="text-xs text-gray-400 font-medium">{data.registrationFields.length} selected</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {Array.from(new Set(fieldOptions.map(f => (f as any).category || 'Contact Info'))).map(categoryName => {
                const categoryFields = fieldOptions.filter(f => ((f as any).category || 'Contact Info') === categoryName);
                if (categoryFields.length === 0) return null;

                const allEnabled = categoryFields.every(f => data.registrationFields.some(sel => sel.key === f.key));
                const someEnabled = categoryFields.some(f => data.registrationFields.some(sel => sel.key === f.key));

                const toggleCategory = () => {
                  if (allEnabled) {
                    const toRemove = new Set(categoryFields.map(f => f.key));
                    updateData({ registrationFields: data.registrationFields.filter(f => !toRemove.has(f.key)) });
                  } else {
                    const existing = new Set(data.registrationFields.map(f => f.key));
                    const newFields = categoryFields.filter(f => !existing.has(f.key));
                    updateData({ registrationFields: [...data.registrationFields, ...newFields] });
                  }
                };

                return (
                  <div key={categoryName} className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest">{categoryName}</h4>
                      <button
                        type="button"
                        onClick={toggleCategory}
                        className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${allEnabled ? 'bg-indigo-600 border-indigo-600' : someEnabled ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-gray-300'}`}>
                          {allEnabled && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" /></svg>}
                          {!allEnabled && someEnabled && <div className="w-2 h-0.5 bg-indigo-600 rounded-full" />}
                        </div>
                        Select All
                      </button>
                    </div>
                    <div className="p-4 space-y-3 flex-1">
                      {categoryFields.map(field => {
                        const isEnabled = data.registrationFields.some(f => f.key === field.key);
                        const activeField = data.registrationFields.find(f => f.key === field.key);
                        return (
                          <div
                            key={field.key}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all bg-white ml-2 ${isEnabled ? 'border-indigo-200 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (isPaid && (field.key === 'attendeeName' || field.key === 'attendeeEmail')) return;
                                toggleField(field.key);
                              }}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isEnabled ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white hover:border-indigo-400'} ${(isPaid && (field.key === 'attendeeName' || field.key === 'attendeeEmail')) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                              {isEnabled && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" /></svg>}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-semibold ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>{field.label}</span>
                                <FieldTypeBadge type={field.fieldType} />
                              </div>
                            </div>
                            {isEnabled && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isPaid && (field.key === 'attendeeName' || field.key === 'attendeeEmail')) return;
                                  toggleRequired(field.key);
                                }}
                                className={`text-xs px-3 py-1 rounded-full border-2 font-bold transition-all flex-shrink-0 ${activeField?.required ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'} ${(isPaid && (field.key === 'attendeeName' || field.key === 'attendeeEmail')) ? 'cursor-not-allowed opacity-50' : ''}`}
                              >
                                {activeField?.required ? 'Required' : 'Optional'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Attendance Management Section ───────────────────────────────────── */}
      <div className={`border-2 border-gray-200 rounded-2xl overflow-hidden bg-white transition-opacity duration-300 ${!data.requiresRegistration ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Header toggle */}
        <div
          className="flex items-center justify-between px-6 py-5 cursor-pointer select-none"
          onClick={() => updateES({
            enableAttendanceManagement: !enableAM,
            scannerType: !enableAM ? (scannerType === 'none' ? 'qr' : scannerType) : 'none',
          })}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${enableAM ? 'bg-green-100' : 'bg-gray-100'}`}>
              <svg className={`w-6 h-6 transition-colors ${enableAM ? 'text-green-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Attendance Management</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {enableAM
                  ? 'Scan tickets at entry to track and verify attendance'
                  : 'Enable to track attendees with QR codes at entry'}
              </p>
            </div>
          </div>
          <Toggle checked={enableAM} onChange={() => {}} color="bg-green-500" />
        </div>

        {/* ── Attendance Settings ────────────────────────────── */}
        {enableAM && (
          <div className="border-t border-gray-100 bg-gray-50 px-6 pb-6 pt-5 space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {/* Restrict check-in time */}
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Restrict Check-in Window</p>
                  <p className="text-xs text-gray-500 mt-0.5">Only allow scanning within specific start and end times</p>
                </div>
                <Toggle
                  checked={es?.requireSpecificTime ?? false}
                  onChange={() => updateES({ requireSpecificTime: !es?.requireSpecificTime })}
                  color="bg-blue-500"
                />
              </div>

              {/* Time window inputs */}
              {es?.requireSpecificTime && (
                <div className="p-4 bg-blue-50">
                  <p className="text-xs font-bold text-blue-700 mb-3 uppercase tracking-wide">Check-in Window</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Gate Opens</label>
                      <input
                        type="datetime-local"
                        value={es.entryStartTime ? new Date(es.entryStartTime).toISOString().slice(0, 16) : ''}
                        onChange={e => updateES({ entryStartTime: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Gate Closes</label>
                      <input
                        type="datetime-local"
                        value={es.entryEndTime ? new Date(es.entryEndTime).toISOString().slice(0, 16) : ''}
                        onChange={e => updateES({ entryEndTime: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>


          </div>
        )}
      </div>
    </div>
  );
};
