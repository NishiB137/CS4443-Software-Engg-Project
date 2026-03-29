import React, { useState } from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { LIMITS } from '@/modules/eventCreation/microFrontends/eventWizard/interface';

const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-500 transition bg-white';

export const Step6PoliciesFaq: React.FC<WizardStepProps> = ({ data, updateData }) => {
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const updatePolicy = (fields: Partial<typeof data.policies>) => updateData({ policies: { ...data.policies, ...fields } });
  const policyCustomFields = (data.templateFields ?? [])
    .filter((f) => f.section === 'policies' && !['refundPolicy', 'cancellationPolicy', 'attendeeMinAge'].includes(f.key))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn space-y-5">
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Policies</h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Refund Policy</label>
            <select className={inputCls} value={data.policies.refundPolicy} onChange={(e) => updatePolicy({ refundPolicy: e.target.value as typeof data.policies.refundPolicy })}>
              <option value="">Select refund policy</option>
              <option value="full">Full refund</option>
              <option value="partial">Partial refund</option>
              <option value="no_refund">No refund</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Cancellation Policy</label>
            <textarea rows={3} maxLength={LIMITS.cancellationPolicy.max} className={inputCls} value={data.policies.cancellationPolicy} onChange={(e) => updatePolicy({ cancellationPolicy: e.target.value })} />
          </div>
          <div className="max-w-xs">
            <label className={labelCls}>Minimum Attendee Age</label>
            <input type="number" min={0} max={120} className={inputCls} value={data.policies.attendeeMinAge} onChange={(e) => updatePolicy({ attendeeMinAge: e.target.value })} />
          </div>
          {policyCustomFields.map((f) => (
            <div key={f.key}>
              <label className={labelCls}>{f.label}</label>
              <input className={inputCls} value={data.customFieldValues?.[f.key] ?? ''} placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}`} onChange={(e) => updateData({ customFieldValues: { ...data.customFieldValues, [f.key]: e.target.value } })} />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">FAQs</h3>
        {data.faqs.length > 0 && (
          <div className="space-y-2 mb-4">
            {data.faqs.map((faq, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3.5 border border-gray-200 flex justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{faq.question}</p>
                  <p className="text-sm text-gray-600 mt-1">{faq.answer}</p>
                </div>
                <button type="button" onClick={() => updateData({ faqs: data.faqs.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <input type="text" placeholder="FAQ question" className={inputCls} value={newFaq.question} onChange={(e) => setNewFaq((p) => ({ ...p, question: e.target.value }))} />
          <textarea rows={2} placeholder="FAQ answer" className={inputCls} value={newFaq.answer} onChange={(e) => setNewFaq((p) => ({ ...p, answer: e.target.value }))} />
          <div className="flex gap-2">
            <button type="button" onClick={() => {
              if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
              updateData({ faqs: [...data.faqs, { ...newFaq }] });
              setNewFaq({ question: '', answer: '' });
            }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition">+ Add FAQ</button>
            <button type="button" onClick={() => {
              if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
              updateData({ faqs: [...data.faqs, { ...newFaq }] });
              setNewFaq({ question: '', answer: '' });
            }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">Save & Add Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
