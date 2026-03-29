import React, { useMemo } from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { mergeSystemFields } from '@/shared/template/systemFields';

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-500 transition bg-white';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

export const Step3TemplateForms: React.FC<WizardStepProps> = ({ data, updateData }) => {
  const grouped = useMemo(() => {
    const fields = mergeSystemFields(data.templateFields ?? []);
    const forms = new Map<string, Map<string, typeof fields>>();
    fields
      .slice()
      .sort((a, b) => (a.formOrder ?? 0) - (b.formOrder ?? 0) || (a.categoryOrder ?? 0) - (b.categoryOrder ?? 0) || (a.order ?? 0) - (b.order ?? 0))
      .forEach((f) => {
        const form = f.form ?? 'Basic Info';
        const cat = f.category ?? 'General';
        if (!forms.has(form)) forms.set(form, new Map());
        const byCat = forms.get(form)!;
        if (!byCat.has(cat)) byCat.set(cat, []);
        byCat.get(cat)!.push(f);
      });
    return forms;
  }, [data.templateFields]);

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Template Forms</h2>
        <p className="text-gray-500 mt-1 text-sm">Fields are shown in the same form/category order as template configuration.</p>
      </div>
      {[...grouped.entries()].map(([formName, categories]) => (
        <div key={formName} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-3">{formName}</h3>
          <div className="space-y-4">
            {[...categories.entries()].map(([catName, fields]) => (
              <div key={`${formName}-${catName}`} className="border border-gray-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">{catName}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {fields.map((f) => {
                    const value = data.customFieldValues?.[f.key] ?? '';
                    if (['title', 'description', 'shortDescription', 'eventType', 'format', 'isFree', 'startDate', 'startTime', 'endDate', 'endTime', 'timezone', 'maxCapacity', 'venue_name', 'venue_address', 'venue_city', 'venue_state', 'venue_country', 'onlineLink', 'refundPolicy', 'cancellationPolicy', 'attendeeMinAge'].includes(f.key)) {
                      return null;
                    }
                    return (
                      <div key={f.key} className={f.fieldType === 'textarea' ? 'md:col-span-2' : ''}>
                        <label className={labelCls}>{f.label}</label>
                        {f.fieldType === 'textarea' ? (
                          <textarea rows={3} className={inputCls} value={value} onChange={(e) => updateData({ customFieldValues: { ...data.customFieldValues, [f.key]: e.target.value } })} />
                        ) : (
                          <input className={inputCls} value={value} onChange={(e) => updateData({ customFieldValues: { ...data.customFieldValues, [f.key]: e.target.value } })} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
