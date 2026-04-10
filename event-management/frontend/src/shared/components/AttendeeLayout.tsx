import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';

export const AttendeeLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  const isFullWidthRoute = location.pathname === '/' || location.pathname.startsWith('/event');

  const navItems = [
    { name: 'Bookmarked Events', path: '/attendee/bookmarks', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' },
    { name: 'My Bookings', path: '/attendee/bookings', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { name: 'Support Tickets', path: '/attendee/tickets', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-text-primary">
      <Header showMenuIcon={true} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex-grow flex w-full relative overflow-hidden">
        {/* Sidebar */}
        {isSidebarOpen && (
        <aside className="w-64 bg-surface border-r border-border flex flex-col shadow-sm z-20 sticky top-0 h-[calc(100vh-73px)] flex-shrink-0 animate-in slide-in-from-left max-md:absolute">
          <div className="p-6">
            <h2 className="text-sm font-black text-text-secondary uppercase tracking-wider mb-4">Attendee Portal</h2>
            <nav className="space-y-1.5">
              {navItems.map(item => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-surface shadow-md cursor-default' 
                        : 'text-text-secondary hover:bg-background hover:text-text-primary'
                    }`
                  }
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon}></path>
                  </svg>
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-grow relative bg-background/50">
          <div className="absolute inset-0 overflow-y-auto">
            <div className={`w-full min-h-full ${isFullWidthRoute ? '' : 'p-6 lg:p-10 max-w-7xl mx-auto'}`}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
