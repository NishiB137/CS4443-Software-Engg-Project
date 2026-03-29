import React from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { SessionManager } from './SessionManager';

export const Step4Sessions: React.FC<WizardStepProps> = ({ data, updateData }) => {
  return (
    <div className="max-w-3xl mx-auto animate-fadeIn space-y-5">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Sessions & Sub-events</h2>
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
