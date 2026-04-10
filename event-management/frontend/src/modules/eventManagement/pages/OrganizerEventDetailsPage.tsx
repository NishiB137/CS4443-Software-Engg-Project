import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { eventApi, registrationApi, supportTicketApi, type ApiRegistration, type ApiSupportTicket } from '@/services/api';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const OrganizerEventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [eventTitle, setEventTitle] = useState(location.state?.eventTitle || 'Loading...');

  const [tab, setTab]         = useState<'regs' | 'complaints'>('regs');
  const [regs, setRegs]       = useState<ApiRegistration[]>([]);
  const [tickets, setTickets] = useState<ApiSupportTicket[]>([]);
  const [count, setCount]     = useState(0);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const [expandedReg, setExpandedReg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    if (!id) return;
    
    // If we didn't receive the title via state, fetch the event details to get the title
    if (!location.state?.eventTitle) {
      eventApi.getById(id).then((res: any) => setEventTitle(res.data?.title || res.data?.event?.title || 'Event Details')).catch(console.error);
    }
  }, [id, location.state]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        if (tab === 'regs') {
          const r = await registrationApi.list(id);
          setRegs(r.data);
          setCount(r.count);
          setCapacity(r.capacity);
        } else {
          const r = await supportTicketApi.listByEvent(id);
          setTickets(r.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, tab]);

  const handleCancel = async (regId: string) => {
    if (!id) return;
    if (!confirm('Cancel this registration?')) return;
    setCancelling(regId);
    try {
      await registrationApi.cancel(id, regId);
      setRegs(prev => prev.filter(r => r._id !== regId));
      setCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel');
    } finally {
      setCancelling(null);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await supportTicketApi.resolve(ticketId);
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: 'resolved' } : t));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resolve ticket');
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Phone', 'Ticket', 'Status', 'Date'],
      ...regs.map(r => [
        r.attendeeName, r.attendeeEmail, r.attendeePhone ?? '',
        r.ticketTier, r.status, fmtDate(r.registrationDate),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `registrations-${id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleBack = () => navigate('/organizer');

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <button onClick={handleBack} className="text-sm font-semibold text-text-secondary hover:text-primary mb-6 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Events
        </button>

        <div className="bg-surface rounded-2xl shadow-sm border border-border flex flex-col h-[80vh]">
          {/* Header */}
          <div className="px-6 pt-5 border-b border-border flex flex-col">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-text-primary">Event Registration Hub</h2>
              <p className="text-sm text-text-secondary mt-1">{eventTitle}</p>
            </div>
            <div className="flex gap-6 -mb-px">
              <button
                onClick={() => setTab('regs')}
                className={`pb-3 text-sm font-bold tracking-wide border-b-2 transition ${tab === 'regs' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
              >
                REGISTRATIONS
              </button>
              <button
                onClick={() => setTab('complaints')}
                className={`pb-3 text-sm font-bold tracking-wide border-b-2 transition ${tab === 'complaints' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
              >
                SUPPORT TICKETS {tickets.length > 0 && `(${tickets.length})`}
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-background/50">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tab === 'regs' ? (
              <div className="p-6">
                {capacity && (
                  <div className="mb-6 bg-surface p-5 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center justify-between text-sm font-bold text-text-primary mb-3">
                      <span className="text-xl">{count} <span className="text-text-secondary font-medium text-sm">Registered</span></span>
                      <span className="text-xl">{capacity} <span className="text-text-secondary font-medium text-sm">Total Capacity</span></span>
                    </div>
                    <div className="h-3 bg-background rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${Math.min(100, (count / capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search name or email..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="px-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
                    />
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value as any)}
                      className="px-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                    >
                      <option value="all">All Status</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-surface bg-primary rounded-lg hover:bg-primary-hover transition shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export CSV
                  </button>
                </div>
                {regs.length === 0 ? (
                  <div className="text-center py-20 text-text-secondary bg-surface rounded-2xl border border-dashed border-border">
                    <p className="font-bold text-lg">No registrations yet</p>
                    <p className="text-sm mt-1">Attendees who register will appear here.</p>
                  </div>
                ) : (
                  <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden text-sm">
                    <table className="w-full">
                      <thead className="bg-background border-b border-border">
                        <tr>
                          {['Name', 'Email', 'Ticket', 'Status', 'Date', 'Details', ''].map(h => (
                            <th key={h} className="text-left px-5 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {regs.filter(r => {
                          const matchesSearch = r.attendeeName.toLowerCase().includes(searchTerm.toLowerCase()) || r.attendeeEmail.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
                          return matchesSearch && matchesStatus;
                        }).map(r => (
                          <React.Fragment key={r._id}>
                          <tr className="hover:bg-background transition group">
                            <td className="px-5 py-4 font-bold text-text-primary">{r.attendeeName}</td>
                            <td className="px-5 py-4 text-text-secondary truncate max-w-[150px]">{r.attendeeEmail}</td>
                            <td className="px-5 py-4 font-medium text-text-secondary">{r.ticketTier}</td>
                            <td className="px-5 py-4">
                              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                                r.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                r.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>{r.status}</span>
                            </td>
                            <td className="px-5 py-4 text-text-secondary font-medium">{fmtDate(r.registrationDate)}</td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => setExpandedReg(expandedReg === r._id ? null : r._id)}
                                className="text-xs font-bold text-primary hover:text-primary-hover px-3 py-1.5 bg-primary/10 rounded-lg transition"
                              >
                                {expandedReg === r._id ? 'Hide' : 'Show More'}
                              </button>
                            </td>
                            <td className="px-5 py-4 text-right">
                              {r.status !== 'cancelled' && (
                                <button
                                  disabled={cancelling === r._id}
                                  onClick={() => handleCancel(r._id)}
                                  className="text-xs text-red-500 hover:text-red-700 font-bold disabled:opacity-40 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                >
                                  {cancelling === r._id ? 'Cancelling...' : 'Cancel'}
                                </button>
                              )}
                            </td>
                          </tr>
                          {expandedReg === r._id && (
                            <tr className="bg-background border-t-0">
                              <td colSpan={7} className="px-5 py-6">
                                <div className="bg-surface rounded-xl p-5 border border-border shadow-sm">
                                  <h4 className="text-sm font-bold text-text-primary mb-3">Registration Form Details</h4>
                                  {r.formResponses && Object.keys(r.formResponses).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {Object.entries(r.formResponses).map(([key, val]) => (
                                        <div key={key}>
                                          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">{key}</p>
                                          <p className="text-sm font-medium text-text-primary break-words">{String(val)}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-text-secondary italic">No additional details recorded.</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6">
                {tickets.length === 0 ? (
                  <div className="text-center py-20 text-text-secondary bg-surface rounded-2xl border border-dashed border-border">
                    <p className="font-bold text-lg">No support tickets</p>
                    <p className="text-sm mt-1">If attendees raise issues, they'll show up here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map(t => (
                      <div key={t._id} className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col gap-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="font-bold text-text-primary text-xl mb-1">{t.subject}</h4>
                            <p className="text-sm font-medium text-text-secondary">From: <span className="text-text-primary">{t.raisedBy}</span> • {fmtDate(t.createdAt)}</p>
                          </div>
                          <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider ${t.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {t.status}
                          </span>
                        </div>
                        <p className="text-sm text-text-primary bg-background p-4 rounded-xl border border-border leading-relaxed">{t.message}</p>
                        {t.status === 'open' && (
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleResolveTicket(t._id)}
                              className="text-sm px-5 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 font-bold rounded-xl transition shadow-sm"
                            >
                              Mark as Resolved
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
