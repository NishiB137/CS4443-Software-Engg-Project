import React from 'react';
import { Link } from 'react-router-dom';
import { EventWizardMFE } from '@/modules/eventCreation/microFrontends/eventWizard';

export const CreateEventPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Page header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Create New Event</h1>
              <p className="text-xs text-gray-500 mt-0.5">Fill in the steps below to launch your event</p>
            </div>
          </div>
        </div>

        {/* Wizard (manages its own draft/publish buttons internally) */}
        <EventWizardMFE />
      </div>
    </div>
  );
};
