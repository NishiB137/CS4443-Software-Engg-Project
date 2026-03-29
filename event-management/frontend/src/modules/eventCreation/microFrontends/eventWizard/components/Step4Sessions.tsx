import React from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { SessionManager } from './SessionManager';

export const Step4Sessions: React.FC<WizardStepProps> = ({ data, updateData }) => {
  return (
    <div className="max-w-3xl mx-auto animate-fadeIn space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-gray-900">Sessions & Sub-events Setup</h2>
        <p className="text-gray-500 mt-1 text-sm">Add only the sessions you need. You can add the same session type more than once.</p>
      </div>
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <SessionManager
          sessions={data.sessions}
          sessionTemplates={data.sessionTemplates}
          onChange={(sessions) => updateData({ sessions })}
        />
      </div>
    </div>
  );
};
