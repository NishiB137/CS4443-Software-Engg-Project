import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrationApi, type RegisterPayload } from '@/services/api';

interface RegistrationField {
  key: string;
  label: string;
  fieldType: 'text' | 'email' | 'phone' | 'textarea' | 'select';
  required: boolean;
  options?: string[];
  category?: string;
  categoryOrder?: number;
  order?: number;
}

interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  eventId:   string;
  registrationFields: RegistrationField[]; // From the event's registrationFields
  ticketTier?: string;
  ticketPrice?: number;
  isFree?: boolean;
  onSuccess: (email: string) => void;
}

const DEFAULT_FIELDS: RegistrationField[] = [
  { key: 'attendeeName',  label: 'Full Name',     fieldType: 'text',  required: true,  category: 'Contact Info', categoryOrder: 0, order: 0 },
  { key: 'attendeeEmail', label: 'Email Address',  fieldType: 'email', required: true,  category: 'Contact Info', categoryOrder: 0, order: 1 },
];

// ─── Phone input restrictor ───────────────────────────────────────────────────
const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowed = ['0','1','2','3','4','5','6','7','8','9','-','+',' ','Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Home','End'];
  if (e.ctrlKey || e.metaKey) return; // allow copy/paste/select-all
  if (!allowed.includes(e.key)) {
    e.preventDefault();
  }
};

// ─── Step 1: Registration fields form ─────────────────────────────────────────
const DetailsStep: React.FC<{
  registrationFields: RegistrationField[];
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}> = ({ registrationFields, form, setForm }) => {
  const sortedFields = [...registrationFields].sort((a, b) => {
    const cA = (a.categoryOrder ?? 0);
    const cB = (b.categoryOrder ?? 0);
    return cA - cB || (a.order ?? 0) - (b.order ?? 0);
  });

  const categories = Array.from(new Set(sortedFields.map(f => f.category || 'Contact Info')));

  const inputCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-white hover:border-gray-300';

  return (
    <div className="space-y-6">
      {categories.map(catName => {
        const fields = sortedFields.filter(f => (f.category || 'Contact Info') === catName);
        if (fields.length === 0) return null;
        return (
          <div key={catName} className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-3 mb-5 relative">
              <span className="absolute -bottom-px left-0 w-12 border-b-2 border-blue-500" />
              {catName}
            </h3>
            <div className="flex flex-col gap-5">
              {fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.fieldType === 'textarea' ? (
                    <textarea
                      required={field.required}
                      placeholder={`Enter your ${field.label.toLowerCase()}…`}
                      value={form[field.key] || ''}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      className={`${inputCls} min-h-[100px]`}
                    />
                  ) : field.fieldType === 'select' ? (
                    <select
                      required={field.required}
                      value={form[field.key] || ''}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      className={`${inputCls} appearance-none`}
                    >
                      <option value="">Select an option…</option>
                      {field.options?.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.fieldType === 'phone' ? (
                    <input
                      type="tel"
                      inputMode="numeric"
                      required={field.required}
                      placeholder="e.g. +91-9876543210"
                      value={form[field.key] || ''}
                      onChange={e => {
                        // Strip non-allowed chars on paste too
                        const cleaned = e.target.value.replace(/[^\d\-+\s]/g, '');
                        setForm(f => ({ ...f, [field.key]: cleaned }));
                      }}
                      onKeyDown={handlePhoneKeyDown}
                      className={inputCls}
                    />
                  ) : (
                    <input
                      type={field.fieldType}
                      required={field.required}
                      placeholder={`Enter your ${field.label.toLowerCase()}…`}
                      value={form[field.key] || ''}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      className={inputCls}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Step 2: Mock payment screen ──────────────────────────────────────────────
const PaymentStep: React.FC<{
  tierName?: string;
  price: number;
  onPay: () => void;
  paying: boolean;
}> = ({ tierName, price, onPay, paying }) => {
  const [cardNum, setCardNum] = useState('');
  const [expiry, setExpiry]   = useState('');
  const [cvv, setCvv]         = useState('');
  const [name, setName]       = useState('');

  const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d;
  };

  const inputCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-white hover:border-gray-300';

  return (
    <div className="space-y-5">
      {/* Price summary */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-5">
        <p className="text-sm font-medium opacity-80 mb-1">Ticket: {tierName || 'General Admission'}</p>
        <p className="text-3xl font-extrabold">${price.toFixed(2)}</p>
        <p className="text-xs opacity-70 mt-1">One-time payment · Secure checkout</p>
      </div>

      {/* Mock card form */}
      <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-3">
          Card Details
        </h3>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Card Number</label>
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNum}
            onChange={e => setCardNum(formatCard(e.target.value))}
            onKeyDown={e => {
              if (!['0','1','2','3','4','5','6','7','8','9','Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault();
            }}
            maxLength={19}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Expiry</label>
            <input
              type="text"
              placeholder="MM/YY"
              value={expiry}
              onChange={e => setExpiry(formatExpiry(e.target.value))}
              maxLength={5}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">CVV</label>
            <input
              type="password"
              placeholder="···"
              value={cvv}
              onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,4))}
              maxLength={4}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Name on Card</label>
          <input
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        256-bit SSL encrypted · Demo payment only
      </p>

      <button
        type="button"
        onClick={onPay}
        disabled={paying}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {paying ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 21Z" />
            </svg>
            Pay ${price.toFixed(2)}
          </>
        )}
      </button>
    </div>
  );
};

// ─── Step 3: Result screen ────────────────────────────────────────────────────
const ResultStep: React.FC<{
  success: boolean;
  onRetry: () => void;
  onClose: () => void;
}> = ({ success, onRetry, onClose }) => (
  <div className="text-center py-6">
    {success ? (
      <>
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Registration Confirmed!</h3>
        <p className="text-gray-500 text-sm mb-6">
          Your payment was successful and you're registered for the event. Check your email for confirmation.
        </p>
        <button
          onClick={onClose}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition shadow-md"
        >
          Done
        </button>
      </>
    ) : (
      <>
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-2xl font-black text-gray-900 mb-2">Payment Failed</h3>
        <p className="text-gray-500 text-sm mb-6">
          We couldn't process your payment. Please check your card details and try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-md"
          >
            Try Again
          </button>
        </div>
      </>
    )}
  </div>
);

// ─── Main modal ───────────────────────────────────────────────────────────────
export const RegistrationModal: React.FC<Props> = ({
  isOpen, onClose, eventId, registrationFields, ticketTier, ticketPrice = 0, isFree = true, onSuccess,
}) => {
  const navigate = useNavigate();

  // Use passed fields, or fall back to defaults if none provided
  const effectiveFields: RegistrationField[] = registrationFields.length > 0
    ? registrationFields
    : DEFAULT_FIELDS;

  // Steps: for paid events → 0=details, 1=payment, 2=result; for free → 0=details only
  const isPaid = !isFree && ticketPrice > 0;
  const STEPS = isPaid ? ['Details', 'Payment', 'Result'] : ['Details'];

  const [step, setStep]         = useState(0);
  const [form, setForm]         = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(false);
  const [paying, setPaying]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [payResult, setPayResult] = useState<boolean | null>(null);

  // Initialize form with logged-in user email if available
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('user_email');
    if (savedEmail) {
      setForm(prev => ({ ...prev, attendeeEmail: savedEmail }));
    }
  }, []);

  const handleClose = () => {
    setStep(0);
    setForm({});
    setError(null);
    setPayResult(null);
    onClose();
  };

  // Step 0: submit details
  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isPaid) {
      // Move to payment step
      setStep(1);
      return;
    }

    // Free event — submit registration directly
    setLoading(true);
    try {
      const attendeeName  = (form['attendeeName']  || '').trim();
      const attendeeEmail = (form['attendeeEmail'] || '').trim().toLowerCase();
      const attendeePhone = (form['attendeePhone'] || '').trim();
      const formResponses: Record<string, unknown> = {};
      Object.keys(form).forEach(key => {
        if (!['attendeeName','attendeeEmail','attendeePhone'].includes(key)) {
          formResponses[key] = form[key];
        }
      });
      const payload: RegisterPayload = {
        attendeeName,
        attendeeEmail,
        attendeePhone: attendeePhone || undefined,
        ticketTier: ticketTier || 'General',
        formResponses,
      };
      await registrationApi.register(eventId, payload);
      onSuccess(attendeeEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: simulate payment and submit registration
  const handlePay = async () => {
    setPaying(true);
    // Simulate network delay
    await new Promise(res => setTimeout(res, 1800));

    // 90% success rate simulation
    const success = Math.random() < 0.9;

    if (success) {
      // Submit registration in backend
      try {
        const attendeeName  = (form['attendeeName']  || '').trim();
        const attendeeEmail = (form['attendeeEmail'] || '').trim().toLowerCase();
        const attendeePhone = (form['attendeePhone'] || '').trim();
        const formResponses: Record<string, unknown> = {};
        Object.keys(form).forEach(key => {
          if (!['attendeeName','attendeeEmail','attendeePhone'].includes(key)) {
            formResponses[key] = form[key];
          }
        });
        const payload: RegisterPayload = {
          attendeeName,
          attendeeEmail,
          attendeePhone: attendeePhone || undefined,
          ticketTier: ticketTier || 'General',
          formResponses,
        };
        await registrationApi.register(eventId, payload);
        setPayResult(true);
        setStep(2);
      } catch {
        setPayResult(false);
        setStep(2);
      }
    } else {
      setPayResult(false);
      setStep(2);
    }
    setPaying(false);
  };

  if (!isOpen) return null;

  const stepLabel = isPaid ? `Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}` : 'Registration Details';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Register for Event</h2>
            <p className="text-sm text-gray-400 font-medium mt-0.5">{stepLabel}</p>
            {ticketTier && (
              <p className="text-sm text-blue-600 font-bold mt-1 inline-flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-md">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                </svg>
                {ticketTier}
                {isPaid && ` · $${ticketPrice.toFixed(2)}`}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-800 transition shadow-sm bg-white border border-gray-200 mt-4 sm:mt-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar for paid events */}
        {isPaid && step < 2 && (
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        )}

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-6 bg-gray-50/30 flex-1">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-xl px-4 py-3 flex items-start gap-2 shadow-sm">
              <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {step === 0 && (
            <form id="registration-form" onSubmit={handleDetailsSubmit}>
              <DetailsStep registrationFields={effectiveFields} form={form} setForm={setForm} />
            </form>
          )}

          {step === 1 && isPaid && (
            <PaymentStep
              tierName={ticketTier}
              price={ticketPrice}
              onPay={handlePay}
              paying={paying}
            />
          )}

          {step === 2 && (
            <ResultStep
              success={payResult === true}
              onRetry={() => setStep(1)}
              onClose={() => {
                if (payResult === true) {
                  onSuccess(form['attendeeEmail']?.trim() || '');
                  navigate('/attendee/bookings');
                } else {
                  handleClose();
                }
              }}
            />
          )}
        </div>

        {/* Footer — only for details step */}
        {step === 0 && (
          <div className="px-6 py-6 border-t border-gray-100 shrink-0 bg-gray-50/80">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-3.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-white transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                form="registration-form"
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Registering…
                  </>
                ) : isPaid ? (
                  <>
                    Continue to Payment
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                ) : 'Confirm Registration'}
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-5 leading-relaxed">
              By registering, you agree to the event's terms and attendance policies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
