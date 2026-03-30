import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  // Mock states for UI testing
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <header className="bg-surface border-b border-border py-3 px-6 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo and Search Bar */}
        <div className="flex items-center gap-4 flex-grow">
          <h1 className="text-2xl font-black text-primary tracking-tighter">Eventa</h1>
          <div className="relative w-full max-w-lg ml-8 hidden md:block group">
            <input 
              type="text" 
              placeholder="Search events, organizers, or locations..." 
              className="w-full bg-background border border-border rounded-full py-2.5 pl-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary transition"
            />
            {/* Voice Search Icon */}
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-text-secondary hover:text-primary hover:bg-primary-light rounded-full transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
            </button>
          </div>
        </div>

        {/* Dynamic Action Buttons */}
        <div className="flex items-center gap-4">
          {!isLoggedIn ? (
            <>
              <Link to="/" className="text-text-primary text-sm font-semibold hover:text-primary transition hidden lg:block">
                Find Events
              </Link>
              <Link to="/create-event" className="text-text-primary text-sm font-semibold hover:text-primary transition hidden lg:block">
                Create Event
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block mx-2"></div>
              <button onClick={() => setIsLoggedIn(true)} className="text-text-primary text-sm font-semibold hover:text-primary transition">Log In</button>
              <button className="bg-primary hover:bg-primary-hover text-surface px-6 py-2.5 text-sm rounded-full font-bold transition shadow-md hover:shadow-lg">Sign Up</button>
            </>
          ) : (
            <>
              {/* Mode Switch Toggle */}
              <div className="hidden md:flex bg-background border border-border rounded-full p-1 shadow-inner">
                <button 
                  onClick={() => { window.location.href = '/organizer'; }} 
                  className={`px-4 py-1.5 text-sm rounded-full font-semibold transition-all duration-200 ${window.location.pathname.startsWith('/organizer') ? 'bg-surface shadow-sm text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  Organizer Mode
                </button>
                <button 
                  onClick={() => { window.location.href = '/'; }} 
                  className={`px-4 py-1.5 text-sm rounded-full font-semibold transition-all duration-200 ${!window.location.pathname.startsWith('/organizer') ? 'bg-surface shadow-sm text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  Attendee Mode
                </button>
              </div>

              <div className="h-6 w-px bg-border hidden sm:block mx-2"></div>

              {/* Notifications & Profile */}
              <button className="relative p-2 text-text-secondary hover:text-primary transition rounded-full hover:bg-background">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface"></span>
              </button>
              
              <button className="flex items-center gap-2 hover:bg-background p-1 pr-3 rounded-full transition border border-transparent hover:border-border">
                <img src="https://ui-avatars.com/api/?name=Sam+Student&background=2563EB&color=fff" alt="User" className="w-8 h-8 rounded-full shadow-sm" />
                <span className="text-sm font-bold text-text-primary hidden lg:block">Sam</span>
              </button>

              <Link
                to="/create-event"
                className="hidden lg:inline-flex bg-primary hover:bg-primary-hover text-surface px-5 py-2 text-sm rounded-full font-bold transition shadow-md hover:shadow-lg"
              >
                + Create Event
              </Link>
              
              <button onClick={() => setIsLoggedIn(false)} className="text-xs text-text-secondary underline ml-2">Logout</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};