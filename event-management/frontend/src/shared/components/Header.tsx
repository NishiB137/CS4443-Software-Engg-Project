import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LoginRequiredModal } from './LoginRequiredModal';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuIcon?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, showMenuIcon }) => {
  // Mock states for UI testing
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const isOrganizerMode = location.pathname.startsWith('/organizer') || location.pathname.startsWith('/templates') || location.pathname.startsWith('/create-event');
  const logoLink = (isLoggedIn && isOrganizerMode) ? '/organizer/events' : '/';

  useEffect(() => {
    localStorage.setItem('isLoggedIn', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    const handleStorage = () => setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam !== null) {
      setSearchValue(searchParam);
    }
  }, [location.search]);

  const handleSearch = () => {
    if (searchValue.trim()) {
      navigate(`/?search=${encodeURIComponent(searchValue.trim())}`);
    } else {
      navigate(`/`);
    }
  };

  return (
    <header className="bg-surface border-b border-border py-3 px-6 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        <div className="flex items-center gap-4 flex-grow">
          {showMenuIcon && isLoggedIn && (
            <button 
              onClick={onMenuClick}
              className="p-2 -ml-2 text-text-secondary hover:text-primary hover:bg-background rounded-full transition"
              aria-label="Toggle Sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          )}
          <Link to={logoLink} className="text-2xl font-black text-primary tracking-tighter hover:opacity-80 transition-opacity">Eventa</Link>
          <div className="relative w-full max-w-lg ml-8 hidden md:block group">
            <input 
              type="text" 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="Search events, organizers, or locations..." 
              className="w-full bg-background border border-border rounded-full py-2.5 pl-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary transition"
            />
            {/* Search Action / Voice Icon */}
            {searchValue.trim() ? (
              <button 
                onClick={handleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 w-8 h-8 flex items-center justify-center text-surface bg-primary hover:bg-primary-hover rounded-full transition shadow flex-shrink-0"
                aria-label="Search"
              >
                <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
              </button>
            ) : (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 text-text-secondary hover:text-primary hover:bg-primary-light rounded-full transition"
                aria-label="Voice Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Action Buttons */}
        <div className="flex items-center gap-4">
          
          {/* Mode Switch Toggle */}
          {isLoggedIn && (
            <div className="hidden md:flex bg-background border border-border rounded-full p-1 shadow-inner">
              <button 
                onClick={() => { navigate('/organizer'); }} 
                className={`px-4 py-1.5 text-sm rounded-full font-semibold transition-all duration-200 ${isOrganizerMode ? 'bg-surface shadow-sm text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Organizer Mode
              </button>
              <button 
                onClick={() => { navigate('/'); }} 
                className={`px-4 py-1.5 text-sm rounded-full font-semibold transition-all duration-200 ${!isOrganizerMode ? 'bg-surface shadow-sm text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Attendee Mode
              </button>
            </div>
          )}

          {isLoggedIn && <div className="h-6 w-px bg-border hidden sm:block mx-2"></div>}

          {!isLoggedIn ? (
            <>
              <button 
                onClick={() => setShowLoginModal(true)} 
                className="text-text-primary text-sm font-semibold hover:text-primary transition"
              >
                Log In
              </button>
              <button 
                onClick={() => setShowLoginModal(true)} 
                className="bg-primary hover:bg-primary-hover text-surface px-6 py-2.5 text-sm rounded-full font-bold transition shadow-md hover:shadow-lg"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              {!isOrganizerMode && (
                <Link to="/" className="hidden lg:inline-flex text-text-primary text-sm font-semibold hover:text-primary transition mr-2">
                  Find Events
                </Link>
              )}
              {isOrganizerMode && (
                <Link
                  to="/create-event"
                  className="hidden lg:inline-flex bg-primary hover:bg-primary-hover text-surface px-5 py-2 text-sm rounded-full font-bold transition shadow-md hover:shadow-lg mr-2"
                >
                  + Create Event
                </Link>
              )}

              {/* Notifications & Profile */}
              <button className="relative p-2 text-text-secondary hover:text-primary transition rounded-full hover:bg-background">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface"></span>
              </button>
              
              <button className="flex items-center gap-2 hover:bg-background p-1 pr-3 rounded-full transition border border-transparent hover:border-border">
                <img src="https://ui-avatars.com/api/?name=Sam+Student&background=2563EB&color=fff" alt="User" className="w-8 h-8 rounded-full shadow-sm" />
                <span className="text-sm font-bold text-text-primary hidden lg:block">Sam</span>
              </button>

              <button onClick={() => setIsLoggedIn(false)} className="text-xs text-text-secondary underline ml-2">Logout</button>
            </>
          )}
        </div>
      </div>

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
        message="Please sign in or create an account."
      />
    </header>
  );
};