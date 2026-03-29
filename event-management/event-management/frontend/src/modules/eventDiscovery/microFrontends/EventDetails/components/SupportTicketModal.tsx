import React, { useState } from 'react';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizerName: string;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({ isOpen, onClose, organizerName }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-border animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text-primary">Raise a Support Ticket</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-red-500 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        {submitted ? (
          <div className="text-center py-10">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 className="text-xl font-bold text-text-primary">Ticket Submitted!</h3>
            <p className="text-text-secondary mt-2">The organizer will get back to you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary mb-2">Sending inquiry to: <span className="font-bold text-text-primary">{organizerName}</span></p>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Subject</label>
              <input type="text" required value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-border bg-background rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="E.g., Ticketing issue, Accessibility..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Message</label>
              <textarea required rows={4} value={message} onChange={e => setMessage(e.target.value)} className="w-full border border-border bg-background rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Describe your issue or question..."></textarea>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-text-secondary font-semibold hover:bg-background transition">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-surface font-semibold hover:bg-primary-hover shadow-md transition">Submit Ticket</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};