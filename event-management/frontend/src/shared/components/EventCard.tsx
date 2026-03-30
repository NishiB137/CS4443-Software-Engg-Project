import React, { useState } from 'react';

export interface EventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  price: number | 'Free';
  images: string[];
  category: string;
  organization: string;
  isTrending?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  title, date, location, price, images, category, organization, isTrending
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);

  const nextImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImg((p) => (p + 1) % images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImg((p) => (p - 1 + images.length) % images.length);
  };

  const activeImg = images[currentImg] || 'https://placehold.co/800x600/f3f4f6/a1a1aa.png?text=No+Image';

  return (
    <div className="bg-surface rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-border overflow-hidden group">
      
      {/* Image Container */}
      <div className="relative overflow-hidden h-52 group/slider">
        {activeImg.match(/\.(mp4|webm|ogg)$/i) ? (
          <video src={activeImg} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <img src={activeImg} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
        
        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity z-20 hover:bg-black/60">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity z-20 hover:bg-black/60">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-1 z-20">
              {images.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentImg ? 'bg-white' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}

        {/* Permanent Top Gradient for Text/Icon Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent h-24 pointer-events-none"></div>

        {/* Hover Gradient for the whole image (Optional aesthetic) */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

        {/* Trending Tag */}
        {isTrending && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1 z-10">
            🔥 Trending
          </span>
        )}

        {/* Action Buttons (Like & Bookmark) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className="bg-white p-2 rounded-full shadow-lg text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
          </button>
          <button 
            onClick={() => setIsBookmarked(!isBookmarked)}
            className="bg-white p-2 rounded-full shadow-lg text-gray-400 hover:text-primary transition-colors"
          >
            <svg className={`w-5 h-5 ${isBookmarked ? 'fill-primary text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
          </button>
        </div>
      </div>

      {/* Details Container */}
      <div className="p-5 flex flex-col flex-grow relative bg-surface z-20">
        <div className="flex items-start mb-3">
          <span className="text-xs font-bold text-primary bg-primary-light px-3 py-1.5 rounded-md uppercase tracking-wide">{category}</span>
        </div>
        
        <h3 className="text-xl font-bold text-text-primary leading-tight group-hover:text-primary transition-colors">{title}</h3>
        
        {/* Organization Name */}
        <p className="text-sm font-medium text-text-secondary mt-2 flex items-center gap-1.5">
           <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
           By <span className="text-text-primary hover:underline cursor-pointer">{organization}</span>
        </p>

        <div className="mt-4 text-sm text-text-secondary space-y-2.5">
          <p className="flex items-center gap-2 font-medium">
            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            {date}
          </p>
          <p className="flex items-center gap-2 font-medium">
            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span className="truncate">{location}</span>
          </p>
        </div>
        
        <div className="mt-auto pt-5 mt-5 flex justify-between items-center border-t border-border/60">
          <span className="font-extrabold text-text-primary text-xl tracking-tight">
            {price === 'Free' ? 'Free' : `$${price}`}
          </span>
          <button className="text-sm font-bold text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
            View Details <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
};