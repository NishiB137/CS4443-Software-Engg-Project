import React from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';

interface GenericFormStepProps extends WizardStepProps {
  formName: string;
}

const inputCls = (hasError?: boolean) =>
  `w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:outline-none transition ${
    hasError
      ? 'border-red-400 focus:ring-red-200 focus:border-red-400 bg-red-50'
      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500 bg-white'
  }`;

const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      {msg}
    </p>
  ) : null;

const CharCount: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const near = current > max * 0.85;
  const over = current > max;
  return (
    <p className={`text-xs mt-1 text-right ${over ? 'text-red-500 font-medium' : near ? 'text-amber-500' : 'text-gray-400'}`}>
      {current}/{max}
    </p>
  );
};

export const GenericFormStep: React.FC<GenericFormStepProps> = ({ formName, data, updateData, errors = {} }) => {
  const fields = data.templateFields.filter(f => f.form === formName);

  const getSystemValue = (key: string): string => {
    if (key.startsWith('venue_')) return data.venue[key.replace('venue_', '') as keyof typeof data.venue];
    if (key === 'refundPolicy' || key === 'cancellationPolicy' || key === 'attendeeMinAge') return data.policies[key as keyof typeof data.policies] as string;
    return (data as any)[key] as string;
  };

  const setSystemValue = (key: string, value: string) => {
    if (key.startsWith('venue_')) {
      updateData({ venue: { ...data.venue, [key.replace('venue_', '')]: value } });
      return;
    }
    if (key === 'refundPolicy' || key === 'cancellationPolicy' || key === 'attendeeMinAge') {
      updateData({ policies: { ...data.policies, [key]: value } });
      return;
    }
    updateData({ [key]: value } as Partial<typeof data>);
  };

  const getCustomValue = (key: string): string => data.customFieldValues[key] ?? '';
  const setCustomValue = (key: string, value: string) => updateData({ customFieldValues: { ...data.customFieldValues, [key]: value } });

  const systemFieldKeys = new Set([
    'title', 'description', 'shortDescription', 'eventType', 'format', 'isFree',
    'startDate', 'startTime', 'endDate', 'endTime', 'timezone', 'maxCapacity',
    'venue_name', 'venue_address', 'venue_city', 'venue_state', 'venue_country',
    'onlineLink', 'refundPolicy', 'cancellationPolicy', 'attendeeMinAge'
  ]);

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{formName}</h2>
      
      <div className="space-y-5">
        {fields.map(f => {
          const isSystem = systemFieldKeys.has(f.key);
          const val = isSystem ? getSystemValue(f.key) : getCustomValue(f.key);
          const setVal = (v: string) => isSystem ? setSystemValue(f.key, v) : setCustomValue(f.key, v);
          const hasError = !!errors[f.key];

          const common = {
            className: inputCls(hasError),
            value: val,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setVal(e.target.value),
          };

          return (
            <div key={f.key}>
              <label className={labelCls}>
                {f.label}
                {f.required && <span className="text-red-500"> *</span>}
                {f.maxLength && <span className="text-gray-400 font-normal ml-1">(max {f.maxLength})</span>}
              </label>

              {f.helpText && <p className="text-xs text-gray-400 mb-1">{f.helpText}</p>}

              {/* Special rendering for certain UI hints */}
              {f.fieldType === 'textarea' ? (
                <div>
                  <textarea rows={5} placeholder={f.placeholder} maxLength={f.maxLength} {...common} />
                  <div className="flex items-start justify-between">
                    <FieldError msg={errors[f.key]} />
                    {f.maxLength && <CharCount current={val.length} max={f.maxLength} />}
                  </div>
                </div>
              ) : f.fieldType === 'select' ? (
                <div>
                  <select {...common}>
                    <option value="">Select</option>
                    {(f.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <FieldError msg={errors[f.key]} />
                </div>
              ) : f.fieldType === 'toggle' ? (
                <div>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="checkbox"
                      checked={val === 'true'}
                      onChange={(e) => setVal(e.target.checked ? 'true' : 'false')}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">{val === 'true' ? 'Yes' : 'No'}</span>
                  </div>
                  <FieldError msg={errors[f.key]} />
                </div>
              ) : (
                <div>
                  <input
                    type={
                      f.fieldType === 'number' ? 'number'
                        : f.fieldType === 'url' ? 'url'
                          : f.fieldType === 'email' ? 'email'
                            : f.fieldType === 'phone' ? 'tel'
                              : f.fieldType === 'date' ? 'date'
                                : f.fieldType === 'time' ? 'time'
                                  : 'text'
                    }
                    placeholder={f.placeholder}
                    maxLength={f.maxLength}
                    min={f.fieldType === 'number' || f.fieldType === 'date' ? f.min : undefined}
                    max={f.fieldType === 'number' || f.fieldType === 'date' ? f.max : undefined}
                    {...common}
                  />
                  <div className="flex items-start justify-between">
                    <FieldError msg={errors[f.key]} />
                    {f.maxLength && f.fieldType !== 'date' && f.fieldType !== 'time' && <CharCount current={val.length} max={f.maxLength} />}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
