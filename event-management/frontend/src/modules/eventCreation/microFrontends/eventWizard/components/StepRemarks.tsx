import React from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';

export const StepRemarks: React.FC<WizardStepProps> = ({ data, updateData }) => {
  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Remarks and Notes</h2>
      <p className="text-gray-500 text-sm mb-6">Any additional details or remarks strictly for the planning process.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Notes</label>
          <textarea
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
            placeholder="e.g. bring laptop and pre-install required software... these notes are visible only to the event management team."
            value={data.notes}
            onChange={(e) => updateData({ notes: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};
