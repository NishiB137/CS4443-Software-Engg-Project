import React, { useEffect, useState } from 'react';
import { registrationApi, type ApiRegistration } from '../../../services/api';
import { LoginRequiredModal } from '@/shared/components/LoginRequiredModal';

export const AttendeeBookingsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<ApiRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [email, setEmail] = useState<string>('');
  const [pendingLogin, setPendingLogin] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('user_email');
      if (saved) {
        setEmail(saved);
        setPendingLogin(false);
      } else {
        setEmail('');
        setPendingLogin(true);
        setLoading(false);
      }
    };
    handleStorage();

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!email) return;
    setLoading(true);
    registrationApi.getMyRegistrations(email)
      .then(res => setRegistrations(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [email]);

  if (pendingLogin) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <LoginRequiredModal
          isOpen={true}
          onClose={() => {}}
          onSuccess={(newEmail) => {
            setEmail(newEmail);
            setPendingLogin(false);
          }}
          message="Please sign in to view your bookings."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const now = new Date();
  const upcoming = registrations.filter(r => {
    const end = (r as any).eventId?.endDate || (r as any).eventId?.startDate;
    return end ? new Date(end) >= now : true;
  });
  const past = registrations.filter(r => {
    const end = (r as any).eventId?.endDate || (r as any).eventId?.startDate;
    return end ? new Date(end) < now : false;
  });

  const renderBookingCard = (reg: ApiRegistration) => {
    const event = (reg as any).eventId;
    if (!event) return null;

    return (
      <div key={reg._id} className="bg-surface p-6 rounded-xl border border-border flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition">
        {event.coverImage && (
          <img src={event.coverImage} alt={event.title} className="w-full md:w-48 h-32 object-cover rounded-lg" />
        )}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-text-primary">{event.title}</h3>
          <p className="text-text-secondary mt-1">{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</p>
          <div className="mt-4 flex gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase">{reg.ticketTier} Ticket</span>
            <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-bold uppercase">{reg.status}</span>
          </div>
        </div>
        <div className="flex items-center">
          <button onClick={() => window.location.href = `/event?id=${event._id}`} className="px-4 py-2 border border-primary text-primary hover:bg-primary-light rounded-lg font-bold transition">
            View Event
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-text-primary mb-8">My Bookings</h1>

      <div className="flex gap-4 border-b border-border mb-8">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 px-4 font-bold transition-colors ${activeTab === 'upcoming' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 px-4 font-bold transition-colors ${activeTab === 'past' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'}`}
        >
          Past ({past.length})
        </button>
      </div>

      {activeTab === 'upcoming' && (
        <section className="mb-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {upcoming.length === 0 ? (
            <div className="text-center py-16 bg-surface border border-border rounded-xl">
              <p className="text-text-secondary italic text-lg mb-2">No upcoming events.</p>
              <button 
                onClick={() => window.location.href = '/'} 
                className="text-primary font-bold hover:underline"
              >
                Find events to attend!
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map(renderBookingCard)}
            </div>
          )}
        </section>
      )}

      {activeTab === 'past' && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {past.length === 0 ? (
            <div className="text-center py-16 bg-surface border border-border rounded-xl">
              <p className="text-text-secondary italic text-lg">No past events yet.</p>
            </div>
          ) : (
            <div className="space-y-4 opacity-80">
              {past.map(renderBookingCard)}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
