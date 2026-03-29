import React, { useState } from 'react';

export const FloatingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 h-96 bg-surface border border-border rounded-2xl shadow-2xl mb-4 flex flex-col overflow-hidden animate-fade-in-up">
          <div className="bg-primary p-4 flex justify-between items-center text-surface">
            <div>
              <h3 className="font-bold">Eventa AI Assistant</h3>
              <p className="text-xs opacity-80">Online</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-primary-hover p-1 rounded transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="flex-grow p-4 bg-background/50 overflow-y-auto">
            <div className="bg-surface p-3 rounded-lg rounded-tl-none shadow-sm text-sm text-text-primary border border-border inline-block max-w-[85%]">
              Hello! 👋 I'm here to help you find the perfect event or answer any ticketing questions. What are you looking for today?
            </div>
          </div>
          <div className="p-3 border-t border-border bg-surface">
            <input type="text" placeholder="Type your message..." className="w-full bg-background border border-border rounded-full py-2 px-4 text-sm focus:outline-none focus:border-primary" />
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-secondary hover:bg-secondary-hover text-surface rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
        )}
      </button>
    </div>
  );
};