import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EventWizardMFE } from '@/modules/eventCreation/microFrontends/eventWizard';
import { eventApi } from '@/services/api';
import type { ApiEvent } from '@/services/api';

export const CreateEventPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventId    = searchParams.get('id');        // Edit existing event
  const duplicateId = searchParams.get('duplicateId'); // Duplicate an event

  // Resolve the actual ID we need to load data for
  const loadId = eventId || duplicateId;

  const [initialData, setInitialData] = useState<ApiEvent | null>(null);
  const [isLoading, setIsLoading] = useState(!!loadId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loadId) return;
    setIsLoading(true);
    eventApi.getById(loadId)
      .then((res) => {
        let data = res.data;
        // If duplicating: clear out ID-specific fields so the wizard creates a NEW event
        if (duplicateId && !eventId) {
          data = {
            ...data,
            _id:    '',
            slug:   '',
            title:  `Copy of ${data.title}`,
            status: 'draft' as const,
            // Reset analytics
            analytics: { likes: 0, bookmarks: 0, views: 0, registrations: 0 },
            createdAt: '',
            updatedAt: '',
          };
        }
        setInitialData(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load event data');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [loadId, eventId, duplicateId]);

  const isEditing   = !!eventId;
  const isDuplicate = !!duplicateId && !eventId;

  const pageTitle = isEditing ? 'Edit Event' : isDuplicate ? 'Duplicate Event' : 'Create New Event';
  const pageSubtitle = isEditing
    ? 'Update your event details'
    : isDuplicate
    ? 'Creating a copy of an existing event'
    : 'Fill in the steps below to launch your event';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Page header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link to={isEditing ? '/organizer/events' : isDuplicate ? '/organizer/events' : '/'} className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{pageSubtitle}</p>
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
          // When duplicating: pass initialData but NO eventId so the wizard creates a new event
          <EventWizardMFE initialEventData={initialData} eventId={isEditing ? eventId! : undefined} />
        )}
      </div>
    </div>
  );
};
