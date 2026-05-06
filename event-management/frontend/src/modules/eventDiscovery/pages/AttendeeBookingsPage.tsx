import React, { useEffect, useState } from 'react';
import { registrationApi, type ApiRegistration } from '../../../services/api';
import { LoginRequiredModal } from '@/shared/components/LoginRequiredModal';
import { QRCodeSVG } from 'qrcode.react';
export const AttendeeBookingsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<ApiRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [email, setEmail] = useState<string>('');
  const [pendingLogin, setPendingLogin] = useState(false);
  const [selectedQR, setSelectedQR] = useState<{ token: string; title: string, tier: string, scannerType?: string } | null>(null);

  const downloadTicket = () => {
    const svgElement = document.querySelector('#ticket-code-container svg') as SVGSVGElement | null;
    if (!svgElement) return;

    // Convert SVG to PNG using a canvas
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Create base64 encoded SVG safely
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    
    img.onload = () => {
      // Create explicit margin padding so that ZXing never clips the boundary squares
      const padding = 20;
      const baseWidth = svgElement.clientWidth || img.width || 300;
      const baseHeight = svgElement.clientHeight || img.height || 300;
      
      canvas.width = baseWidth + (padding * 2);
      canvas.height = baseHeight + (padding * 2);
      
      if (ctx) {
        // Draw the pure white backdrop spanning the whole padded area
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the QR Code perfectly centered with buffer space around it
        ctx.drawImage(img, padding, padding, baseWidth, baseHeight);
        
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${selectedQR?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ticket.png`;
        downloadLink.click();
      }
    };
  };

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('userEmail');
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
          <div className="flex flex-col gap-2">
            {(reg as any).qrToken && (
              <button 
                onClick={() => setSelectedQR({ 
                  token: (reg as any).qrToken, 
                  title: event.title, 
                  tier: reg.ticketTier,
                  scannerType: (event as any).entrySettings?.scannerType || 'qr'
                })} 
                className="px-4 py-2 bg-primary text-surface font-bold rounded-lg hover:bg-primary-hover shadow-sm transition"
              >
                View Ticket
              </button>
            )}
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

      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 relative flex flex-col items-center">
            <button 
              onClick={() => setSelectedQR(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-1 text-center">{selectedQR.title}</h3>
            <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full uppercase tracking-wider mb-6">
              {selectedQR.tier} TICKET
            </span>
            
            <div id="ticket-code-container" className="p-4 bg-white border-4 border-gray-100 rounded-2xl shadow-sm mb-4 w-full max-w-xs mx-auto flex justify-center">
              <QRCodeSVG value={selectedQR.token} size={240} level="M" includeMargin={true} />
            </div>
            
            <div className="flex flex-col gap-2 w-full mt-2">
              <button 
                onClick={downloadTicket}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download Ticket
              </button>
              <p className="text-sm text-center text-gray-500 font-medium">Have this ready for scanning at entry.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
