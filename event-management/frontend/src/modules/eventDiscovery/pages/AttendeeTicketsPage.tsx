import React, { useState, useEffect } from 'react';
import { supportTicketApi, type ApiSupportTicket } from '@/services/api';
import { LoginRequiredModal } from '@/shared/components/LoginRequiredModal';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const AttendeeTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<ApiSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
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
    supportTicketApi.listByEmail(email)
      .then(res => setTickets(res.data))
      .catch(console.error)
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
          message="Please sign in to view your support tickets."
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Support Tickets</h1>
        <p className="text-gray-500 mt-2 font-medium">View and track the status of complaints or questions you've previously raised.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <p className="font-bold text-gray-800 text-lg">No Tickets Found</p>
          <p className="text-gray-500 mt-1">You haven't raised any support tickets with this email ({email}).</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <div key={ticket._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{ticket.subject}</h3>
                  {/* Since we populated event, ticket.event is actually an object here if populated */}
                  <p className="text-sm font-semibold text-blue-600 mt-0.5">
                    Event: {typeof ticket.event === 'object' ? (ticket.event as any).title : ticket.event}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {ticket.status}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-100 mb-3">
                {ticket.message}
              </div>
              <div className="text-xs text-gray-400 font-medium">
                Raised on {fmtDate(ticket.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
