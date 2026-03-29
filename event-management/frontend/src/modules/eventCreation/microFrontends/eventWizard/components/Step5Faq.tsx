import React, { useState } from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-500 transition bg-white';

export const Step5Faq: React.FC<WizardStepProps> = ({ data, updateData }) => {
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn space-y-5">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
      
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
          <textarea rows={3} placeholder="FAQ answer" className={inputCls} value={newFaq.answer} onChange={(e) => setNewFaq((p) => ({ ...p, answer: e.target.value }))} />
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
            }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">Save FAQ</button>
          </div>
        </div>
      </div>
    </div>
  );
};
