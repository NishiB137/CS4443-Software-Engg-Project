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

export const StepRegistration: React.FC<WizardStepProps> = ({ data, updateData }) => {

  // If the template has a "Registration" form with fields, use those as the field list.
  // Otherwise fall back to REGISTRATION_FIELD_OPTIONS.
  const templateRegFields = data.templateFields.filter((f: any) => f.form === 'Registration');

  // Build sorted unique category → categoryOrder map
  const catOrderMap: Record<string, number> = {};
  const rawSrc = templateRegFields.length > 0 ? templateRegFields : REGISTRATION_FIELD_OPTIONS;
  (rawSrc as any[]).forEach((f: any) => {
    const cat = f.category || 'Contact Info';
    if (catOrderMap[cat] === undefined) {
      catOrderMap[cat] = f.categoryOrder ?? Object.keys(catOrderMap).length;
    }
  });

  const fieldOptions: Array<{
    key: string; label: string;
    fieldType: 'text' | 'email' | 'phone' | 'textarea' | 'select';
    required: boolean; options?: string[];
    category: string; categoryOrder: number; order: number; form?: string;
  }> = templateRegFields.length > 0
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

  const disableRegistration = () => {
    updateData({ requiresRegistration: false });
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Registration</h2>
        <p className="text-gray-500 mt-2 text-sm">Configure whether attendees need to register and what information to collect</p>
      </div>

      {/* Toggle Card */}
      <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
        <div
          className="flex items-center justify-between px-6 py-5 cursor-pointer select-none"
          onClick={() => data.requiresRegistration ? disableRegistration() : enableRegistration()}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${data.requiresRegistration ? 'bg-indigo-100' : 'bg-gray-100'}`}>
              <svg className={`w-6 h-6 transition-colors ${data.requiresRegistration ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Registration Required</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {data.requiresRegistration
                  ? 'Attendees must fill out a form to secure their spot'
                  : 'Turn on to collect information from attendees before they join'}
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <div className={`relative w-14 h-7 rounded-full transition-colors duration-300 flex-shrink-0 ${data.requiresRegistration ? 'bg-indigo-600' : 'bg-gray-200'}`}>
            <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${data.requiresRegistration ? 'translate-x-7' : 'translate-x-0'}`} />
          </div>
        </div>

        {/* Field selector — only when registration is ON */}
        {data.requiresRegistration && (
          <div className="border-t border-gray-100 bg-gray-50 px-6 pb-6 pt-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-gray-900">Fields to collect from attendees</p>
              <span className="text-xs text-gray-400 font-medium">{data.registrationFields.length} selected</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {Array.from(new Set(fieldOptions.map(f => (f as any).category || 'Contact Info'))).map(categoryName => {
                const categoryFields = fieldOptions.filter(f => ((f as any).category || 'Contact Info') === categoryName);
                if (categoryFields.length === 0) return null;
                
                // Check if all fields in this category are enabled
                const unLockedFields = categoryFields;
                const allEnabled = unLockedFields.length > 0 && unLockedFields.every(f => data.registrationFields.some(sel => sel.key === f.key));
                const someEnabled = unLockedFields.some(f => data.registrationFields.some(sel => sel.key === f.key));

                const toggleCategory = () => {
                  if (allEnabled) {
                    // disable all unlocked in this category
                    const toRemove = new Set(unLockedFields.map(f => f.key));
                    updateData({ registrationFields: data.registrationFields.filter(f => !toRemove.has(f.key)) });
                  } else {
                    // enable all unlocked in this category
                    const existing = new Set(data.registrationFields.map(f => f.key));
                    const newFields = unLockedFields.filter(f => !existing.has(f.key));
                    updateData({ registrationFields: [...data.registrationFields, ...newFields] });
                  }
                };

                return (
                  <div key={categoryName} className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest">{categoryName}</h4>
                      {unLockedFields.length > 0 && (
                        <button
                          type="button"
                          onClick={toggleCategory}
                          className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            allEnabled ? 'bg-indigo-600 border-indigo-600' : someEnabled ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-gray-300'
                          }`}>
                            {allEnabled && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" /></svg>}
                            {!allEnabled && someEnabled && <div className="w-2 h-0.5 bg-indigo-600 rounded-full" />}
                          </div>
                          Select All
                        </button>
                      )}
                    </div>

                    <div className="p-4 space-y-3 flex-1">
                      {categoryFields.map(field => {
                        const isEnabled = data.registrationFields.some(f => f.key === field.key);
                        const isLocked  = false; // no fields are locked anymore
                        const activeField = data.registrationFields.find(f => f.key === field.key);

                        return (
                          <div
                            key={field.key}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all bg-white ml-2 ${
                              isEnabled
                                ? 'border-indigo-200 shadow-sm'
                                : 'border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => toggleField(field.key)}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                isEnabled
                                  ? 'bg-indigo-600 border-indigo-600'
                                  : 'border-gray-300 bg-white hover:border-indigo-400'
                              } ${isLocked ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                            >
                              {isEnabled && (
                                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                                </svg>
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-semibold ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>{field.label}</span>
                                <FieldTypeBadge type={field.fieldType} />
                              </div>
                            </div>

                            {isEnabled && !isLocked && (
                              <button
                                type="button"
                                onClick={() => toggleRequired(field.key)}
                                className={`text-xs px-3 py-1 rounded-full border-2 font-bold transition-all flex-shrink-0 ${
                                  activeField?.required
                                    ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                }`}
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
    </div>
  );
};
