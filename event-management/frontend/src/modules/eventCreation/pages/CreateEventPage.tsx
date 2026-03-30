import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EventWizardMFE } from '@/modules/eventCreation/microFrontends/eventWizard';
import { eventApi } from '@/services/api';
import type { ApiEvent } from '@/services/api';

export const CreateEventPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  
  const [initialData, setInitialData] = useState<ApiEvent | null>(null);
  const [isLoading, setIsLoading] = useState(!!eventId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      setIsLoading(true);
      eventApi.getById(eventId)
        .then((res) => {
          setInitialData(res.data);
          setError(null);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load event data');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [eventId]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Page header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link to={eventId ? "/organizer/events" : "/"} className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{eventId ? 'Edit Event' : 'Create New Event'}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{eventId ? 'Update your event details' : 'Fill in the steps below to launch your event'}</p>
            </div>
          </div>
        </div>

        {/* Wizard container */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200">
            <h3 className="font-bold mb-2">Error Loading Event</h3>
            <p>{error}</p>
            <Link to="/organizer/events" className="mt-4 inline-block text-sm font-semibold underline hover:text-red-900">Return to Organizer Dashboard</Link>
          </div>
        ) : (
          <EventWizardMFE initialEventData={initialData} eventId={eventId || undefined} />
        )}
      </div>
    </div>
  );
};
