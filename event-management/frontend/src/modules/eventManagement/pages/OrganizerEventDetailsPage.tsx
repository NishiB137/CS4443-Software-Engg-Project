import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { eventApi, registrationApi, supportTicketApi, type ApiRegistration, type ApiSupportTicket, type ApiEvent } from '@/services/api';
import { Html5Qrcode } from 'html5-qrcode';
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// ─── Attendance Tab Component ─────────────────────────────────────────────────
const AttendanceTab: React.FC<{
  regs: ApiRegistration[];
  eventId: string;
  scannerMode: 'checkIn' | 'checkOut';
  setScannerMode: (m: 'checkIn' | 'checkOut') => void;
  scannerOpen: boolean;
  setScannerOpen: (v: boolean) => void;
  scanResult: { success: boolean; message: string } | null;
  isProcessingFile: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onManualCheckIn: (email: string) => void;
  onCheckOut: (regId: string) => void;
}> = ({ regs, setScannerMode, setScannerOpen, onManualCheckIn, onCheckOut }) => {
  const [search, setSearch] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  const confirmed = regs.filter(r => r.status === 'confirmed');
  const checkedIn  = confirmed.filter(r => r.checkedIn);
  const pending    = confirmed.filter(r => !r.checkedIn);

  const filtered = confirmed.filter(r =>
    r.attendeeName.toLowerCase().includes(search.toLowerCase()) ||
    r.attendeeEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Confirmed', value: confirmed.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Checked In', value: checkedIn.length, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Pending', value: pending.length, color: 'bg-orange-50 text-orange-700' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-4 text-center`}>
            <p className="text-3xl font-extrabold">{s.value}</p>
            <p className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex">
        <button
          onClick={() => { setScannerMode('checkIn'); setScannerOpen(true); }}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6z" />
          </svg>
          Scan QR – Check In
        </button>
      </div>

      {/* Manual check-in by email */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex gap-3">
        <input
          type="email"
          placeholder="Manual check-in: enter attendee email"
          value={manualEmail}
          onChange={e => setManualEmail(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && manualEmail.trim()) { onManualCheckIn(manualEmail.trim()); setManualEmail(''); } }}
          className="flex-1 border border-border rounded-lg px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          onClick={() => { if (manualEmail.trim()) { onManualCheckIn(manualEmail.trim()); setManualEmail(''); } }}
          className="px-5 py-2 bg-primary text-surface font-bold rounded-lg text-sm hover:bg-primary-hover transition"
        >
          Check In
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
      />

      {/* Registrant attendance list */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <p className="text-center py-10 text-text-secondary text-sm">No confirmed registrants found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border">
              <tr>
                {['Attendee', 'Ticket', 'Status', 'Check-In Time', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => (
                <tr key={r._id} className="hover:bg-background/60 transition">
                  <td className="px-5 py-3">
                    <p className="font-bold text-text-primary">{r.attendeeName}</p>
                    <p className="text-xs text-text-secondary">{r.attendeeEmail}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-indigo-50 text-indigo-700">{r.ticketTier}</span>
                  </td>
                  <td className="px-5 py-3">
                    {r.checkedOut ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800">Checked Out</span>
                    ) : r.checkedIn ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">✓ Checked In</span>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700">Pending</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-text-secondary">
                    {r.checkedIn && r.checkedInAt?.length
                      ? new Date(r.checkedInAt[r.checkedInAt.length - 1]).toLocaleTimeString()
                      : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {r.checkedIn && !r.checkedOut && (
                      <button
                        onClick={() => onCheckOut(r._id)}
                        className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                      >
                        Check Out
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export const OrganizerEventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [eventTitle, setEventTitle] = useState(location.state?.eventTitle || 'Loading...');
  const [event, setEvent] = useState<ApiEvent | null>(null);

  const [tab, setTab] = useState<'regs' | 'complaints' | 'analytics' | 'attendance'>('regs');
  const [regs, setRegs] = useState<ApiRegistration[]>([]);
  const [tickets, setTickets] = useState<ApiSupportTicket[]>([]);
  const [count, setCount] = useState(0);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const [expandedReg, setExpandedReg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'checked-in' | 'pending'>('all');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const processScannedToken = async (decodedText: string) => {
    try {
      const endpoint = scannerMode === 'checkOut' ? `/events/${id}/checkout` : `/events/${id}/validate-qr`;
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: decodedText })
      });
      const data = await response.json();

      if (data.success) {
        setScanResult({ success: true, message: data.message || (scannerMode === 'checkOut' ? 'Check-out' : 'Check-in') + ' successful: ' + data.data.attendeeName });
        // Refresh the full registrations list so attendance status is up to date
        if (id) {
          registrationApi.list(id).then(r => { setRegs(r.data); setCount(r.count); }).catch(() => {});
        }
      } else {
        setScanResult({ success: false, message: data.message || 'Validation failed.' });
      }
    } catch (err) {
      setScanResult({ success: false, message: 'Network error.' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScanResult({ success: true, message: 'Analyzing image...' });

    // FIX 3: create the object URL once and revoke it in finally to prevent memory leaks.
    const objectUrl = URL.createObjectURL(file);

    try {
      // FIX 4: Try native BarcodeDetector first — it handles both QR and Code 128.
      // Assign onload BEFORE setting src to avoid a race condition where a cached
      // image fires onload before the handler is attached.
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code']
          });
          const img = document.createElement('img');
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Image failed to load'));
            img.src = objectUrl; // src assigned AFTER onload is set
          });
          const barcodes = await barcodeDetector.detect(img);
          if (barcodes.length > 0) {
            await processScannedToken(barcodes[0].rawValue);
            return; // success — finally handles cleanup
          }
        } catch (err) {
          console.warn('Native BarcodeDetector failed, falling back:', err);
        }
      }

      // Universal fallback using Html5Qrcode for both scanner types since they both emit QR format now
      const tempScanner = new Html5Qrcode('qr-reader-file', { verbose: false });
      const decodedText = await tempScanner.scanFile(file, false);
      await processScannedToken(decodedText);
      await tempScanner.clear();
    } catch (err) {
      console.error('[Scanner] File scan error:', err);
      setScanResult({ success: false, message: 'No valid code found in image.' });
    } finally {
      // FIX 2: Always revoke the object URL and reset processing state,
      // regardless of scanner type or whether an error occurred.
      URL.revokeObjectURL(objectUrl);
      setIsProcessingFile(false);
      setTimeout(() => setScanResult(null), 4000);
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (!id) return;

    eventApi.getById(id).then((res: any) => {
      setEvent(res.data);
      if (!location.state?.eventTitle) {
        setEventTitle(res.data?.title || res.data?.event?.title || 'Event Details');
      }
    }).catch(console.error);
  }, [id, location.state]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        if (tab === 'regs' || tab === 'analytics') {
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `registrations-${id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleBack = () => navigate('/organizer');

  // Scanning handling
  useEffect(() => {
    if (!scannerOpen) return;
    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;
    let isProcessing = false;

    const initScanner = async () => {
      await new Promise(r => setTimeout(r, 100)); // wait for DOM render
      if (!isMounted) return;

      try {
        html5QrCode = new Html5Qrcode('qr-reader', { verbose: false });
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (isProcessing) return;
            isProcessing = true;

            await processScannedToken(decodedText);

            setTimeout(() => {
              if (isMounted) setScanResult(null);
              isProcessing = false;
            }, 3000);
          },
          () => { /* ignore */ }
        );
      } catch (err) {
        console.error('Failed to start scanner:', err);
        if (isMounted) {
          setScanResult({ success: false, message: 'Failed to access camera. Please check permissions.' });
        }
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
      }
    };
  }, [scannerOpen, id, event]);

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
              {event?.entrySettings?.enableAttendanceManagement && event.entrySettings.scannerType !== 'none' && (
                <button
                  onClick={() => setTab('attendance')}
                  className={`pb-3 text-sm font-bold tracking-wide border-b-2 transition ${tab === 'attendance' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                  ATTENDANCE
                </button>
              )}
              {event && !event.isFree && (
                <button
                  onClick={() => setTab('analytics')}
                  className={`pb-3 text-sm font-bold tracking-wide border-b-2 transition ${tab === 'analytics' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                  SALES ANALYTICS
                </button>
              )}
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
                    <select
                      value={attendanceFilter}
                      onChange={e => setAttendanceFilter(e.target.value as any)}
                      className="px-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                    >
                      <option value="all">All Attendance</option>
                      <option value="checked-in">Checked In</option>
                      <option value="pending">Not Checked In</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    {event?.entrySettings?.enableAttendanceManagement && event.entrySettings.scannerType !== 'none' && (
                      <>
                        <button
                          onClick={() => { setScannerMode('checkIn'); setScannerOpen(true); }}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-surface bg-green-600 rounded-lg hover:bg-green-700 transition shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6z" />
                          </svg>
                          Check In
                        </button>
                      </>
                    )}
                    <button
                      onClick={exportCSV}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-surface bg-primary rounded-lg hover:bg-primary-hover transition shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Export CSV
                    </button>
                  </div>
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
                          {['Name', 'Email', 'Ticket', 'Status', 'Attendance', 'Date', 'Details', ''].map(h => (
                            <th key={h} className="text-left px-5 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {regs.filter(r => {
                          const matchesSearch = r.attendeeName.toLowerCase().includes(searchTerm.toLowerCase()) || r.attendeeEmail.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
                          const matchesAttendance = attendanceFilter === 'all' || (attendanceFilter === 'checked-in' ? r.checkedIn : !r.checkedIn);
                          return matchesSearch && matchesStatus && matchesAttendance;
                        }).map(r => (
                          <React.Fragment key={r._id}>
                            <tr className="hover:bg-background transition group">
                              <td className="px-5 py-4 font-bold text-text-primary">{r.attendeeName}</td>
                              <td className="px-5 py-4 text-text-secondary truncate max-w-[150px]">{r.attendeeEmail}</td>
                              <td className="px-5 py-4 font-medium text-text-secondary">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider bg-indigo-50 text-indigo-700">
                                  {r.ticketTier}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${r.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  r.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>{r.status}</span>
                              </td>
                              <td className="px-5 py-4">
                                {r.checkedOut ? (
                                  <div>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-blue-100 text-blue-800">Checked Out</span>
                                    <p className="text-[10px] text-text-secondary mt-1">{r.checkedOutAt?.length ? new Date(r.checkedOutAt[r.checkedOutAt.length - 1]).toLocaleTimeString() : ''}</p>
                                  </div>
                                ) : r.checkedIn ? (
                                  <div>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800">Checked In</span>
                                    <p className="text-[10px] text-text-secondary mt-1">{r.checkedInAt?.length ? new Date(r.checkedInAt[r.checkedInAt.length - 1]).toLocaleTimeString() : ''}</p>
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-gray-100 text-gray-600">Pending</span>
                                )}
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
            ) : tab === 'attendance' ? (
              <AttendanceTab
                regs={regs}
                eventId={id!}
                scannerMode={scannerMode}
                setScannerMode={setScannerMode}
                scannerOpen={scannerOpen}
                setScannerOpen={setScannerOpen}
                scanResult={scanResult}
                isProcessingFile={isProcessingFile}
                handleFileUpload={handleFileUpload}
                onManualCheckIn={async (email: string) => {
                  const reg = regs.find(r => r.attendeeEmail.toLowerCase() === email.toLowerCase() && !r.checkedIn && r.status === 'confirmed');
                  if (!reg || !(reg as any).qrToken) {
                    setScanResult({ success: false, message: !reg ? 'No confirmed registration found for this email.' : 'Already checked in.' });
                    return;
                  }
                  await processScannedToken((reg as any).qrToken);
                }}
                onCheckOut={async (regId: string) => {
                  try {
                    const res = await registrationApi.checkOut(id!, regId);
                    if (res.success) {
                      setScanResult({ success: true, message: res.message });
                      if (id) registrationApi.list(id).then(r => { setRegs(r.data); }).catch(() => {});
                    }
                  } catch (err: any) {
                    setScanResult({ success: false, message: err.message || 'Check-out failed.' });
                  }
                }}
              />
            ) : tab === 'analytics' && event && !event.isFree ? (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
                    <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Total Revenue</h3>
                    <p className="text-4xl font-bold text-text-primary">
                      {event.currency === 'INR' ? '₹' : event.currency === 'EUR' ? '€' : event.currency === 'GBP' ? '£' : '$'}
                      {regs.reduce((acc, r) => acc + (r.amountPaid || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
                    <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Total Paid Registrations</h3>
                    <p className="text-4xl font-bold text-text-primary">{regs.filter(r => (r.amountPaid || 0) > 0).length}</p>
                  </div>
                </div>
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
                  <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Revenue by Ticket Tier</h3>
                  <div className="space-y-4">
                    {Array.from(new Set(regs.map(r => r.ticketTier))).map(tier => {
                      const tierRegs = regs.filter(r => r.ticketTier === tier);
                      const rev = tierRegs.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
                      return (
                        <div key={tier} className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                          <div>
                            <p className="font-bold text-text-primary text-base">{tier}</p>
                            <p className="text-sm text-text-secondary">{tierRegs.length} sold</p>
                          </div>
                          <p className="font-bold text-lg text-text-primary">
                            {event.currency === 'INR' ? '₹' : event.currency === 'EUR' ? '€' : event.currency === 'GBP' ? '£' : '$'}{rev.toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : tab === 'complaints' ? (
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
            ) : null}
          </div>
        </div>
      </div>

      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
            <button
              onClick={() => setScannerOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
              Scan Ticket QR Code ({scannerMode === 'checkIn' ? 'Check-In' : 'Check-Out'})
            </h3>

            {scanResult && (
              <div className={`p-4 mb-4 rounded-xl text-sm font-bold ${scanResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {scanResult.message}
              </div>
            )}

            <div id="qr-reader" className="w-full min-h-[250px] bg-black rounded-xl overflow-hidden mb-4 flex items-center justify-center">
            </div>

            <p className="text-sm text-center text-gray-500 font-medium mb-4">
              Point your camera at the attendee's QR code.
            </p>

            <div className="flex justify-center border-t border-gray-100 pt-4">
              <label className={`cursor-pointer text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-6 py-2.5 rounded-xl transition flex items-center gap-2 ${isProcessingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                {isProcessingFile ? 'Processing...' : 'Upload Image File'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isProcessingFile}
                />
              </label>
            </div>
            {/* The canvas needs dimensions to process the image rendering off-screen correctly */}
            <div id="qr-reader-file" className="fixed top-[-9999px] left-[-9999px] opacity-0 pointer-events-none w-[500px] h-[500px]"></div>
          </div>
        </div>
      )}
    </div>
  );
};
