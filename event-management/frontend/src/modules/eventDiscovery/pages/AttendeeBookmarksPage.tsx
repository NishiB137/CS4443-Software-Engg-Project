import React, { useEffect, useState } from 'react';
import { bookmarkApi, type ApiEvent } from '../../../services/api';
import { EventCard } from '../../../shared/components/EventCard';

export const AttendeeBookmarksPage: React.FC = () => {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookmarkApi.list()
      .then(res => setEvents(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-text-primary mb-6">Bookmarked Events</h1>
      {events.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary text-lg">No bookmarked events yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event._id} className="cursor-pointer" onClick={() => window.location.href = `/event?id=${event._id}`}>
              <EventCard
                id={event._id}
                title={event.title}
                date={new Date(event.startDate).toLocaleDateString()}
                location={event.format === 'physical' ? (event.venue?.city || 'TBA') : 'Online'}
                price={event.isFree ? 'Free' : (event as any).pricing?.basePrice || 0}
                currency={event.currency}
                images={event.coverImage ? [event.coverImage, ...(event.secondaryImages || [])] : []}
                category={event.eventType}
                organization={typeof event.organization === 'object' ? (event.organization as any).name : 'Event Organizer'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
