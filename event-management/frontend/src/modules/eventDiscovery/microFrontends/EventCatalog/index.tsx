import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from './hooks/UseEvents';
import { EventCard } from '@/shared/components/EventCard';

export const EventCatalogMFE: React.FC = () => {
  const navigate = useNavigate();
  const { 
    events, loading, error,
    searchQuery, setSearchQuery,
    filterType, setFilterType,
    category, setCategory,
    currentPage, setCurrentPage, totalPages,
  } = useEvents();

  const handleCardClick = (id: string, slug: string) => {
    navigate(`/event?id=${id}&slug=${slug}`);
  };

  const CATEGORIES = ['All', 'Music', 'Tech', 'Sports', 'Education', 'Art', 'Business', 'General'];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold text-text-primary">Discover Events</h2>
        <p className="text-text-secondary mt-2">Find your next amazing experience</p>
      </div>
      
      {/* Category & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8 justify-between items-center bg-surface p-2 rounded-xl shadow-sm border border-border">
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto p-2 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setCategory(cat)} 
              className={`px-5 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors duration-200 ${category === cat ? 'bg-primary text-surface shadow-md' : 'bg-background text-text-secondary hover:bg-border'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="flex gap-3 w-full lg:w-auto p-2">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="bg-background border border-border text-text-primary text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary flex-1 lg:w-48"
          />
           <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'All' | 'Free' | 'Paid')} 
            className="bg-background border border-border text-text-primary font-medium text-sm rounded-lg focus:ring-primary focus:border-primary block px-4 py-2.5 outline-none cursor-pointer"
          >
            <option value="All">All Prices</option>
            <option value="Free">Free</option>
            <option value="Paid">Paid</option>
          </select>
          <button className="bg-background border border-border text-text-primary px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-border transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
            Filters
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center mb-8">
          <p className="font-semibold mb-1">Could not load events</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-border overflow-hidden animate-pulse">
              <div className="h-52 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-6 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-text-primary mb-2">No events found</h3>
          <p className="text-text-secondary text-sm">
            {searchQuery
              ? `No results for "${searchQuery}". Try different keywords.`
              : 'No events match your current filters. Try adjusting them.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((evt) => (
              <div key={evt.id} onClick={() => handleCardClick(evt.id, evt.slug)} className="cursor-pointer">
                <EventCard
                  id={evt.id}
                  title={evt.title}
                  date={evt.date}
                  location={evt.location}
                  price={evt.price}
                  imageUrl={evt.imageUrl}
                  category={evt.category}
                  organization={evt.organization}
                  isTrending={evt.isTrending}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-16 flex justify-center items-center gap-6">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-6 py-2.5 bg-surface border border-border text-text-primary font-medium rounded-full hover:bg-background disabled:opacity-40 transition shadow-sm"
              >
                Previous
              </button>
              <span className="text-text-secondary font-medium">Page {currentPage} of {totalPages}</span>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-6 py-2.5 bg-surface border border-border text-text-primary font-medium rounded-full hover:bg-background disabled:opacity-40 transition shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};