import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventApi } from '@/services/api';
import type { ApiEvent } from '@/services/api';

const DEFAULT_SLIDES = [
  {
    id: '1',
    slug: 'tech-innovation',
    title: "Tech Innovation Summit 2026",
    subtitle: "Join industry leaders to shape the future of technology.",
    date: "July 20, 2026",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: '2',
    slug: 'global-music',
    title: "Global Music Festival",
    subtitle: "Experience the ultimate sound of summer.",
    date: "August 15, 2026",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: '3',
    slug: 'creative-arts',
    title: "Creative Arts Expo",
    subtitle: "Discover groundbreaking artwork and installations.",
    date: "September 10, 2026",
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1600&q=80",
  }
];

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const HeroCarousel: React.FC = () => {
  const [slides, setSlides] = useState<typeof DEFAULT_SLIDES>([]);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    eventApi.list({ limit: '5', visibility: 'public', status: 'published' })
      .then(res => {
        if (res.events && res.events.length > 0) {
          const dynamicSlides = res.events.map((e: ApiEvent) => ({
            id: e._id,
            slug: e.slug,
            title: e.title,
            subtitle: e.shortDescription || 'Join us for this exciting event.',
            date: formatDate(e.startDate),
            image: e.coverImage || e.bannerImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80",
          }));
          setSlides(dynamicSlides);
        } else {
          setSlides(DEFAULT_SLIDES);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch events for carousel', err);
        setSlides(DEFAULT_SLIDES);
      });
  }, []);

  // Auto-play interval
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000); 
    return () => clearInterval(timer);
  }, [current, slides.length]); // Reset timer when slide changes manually

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full h-[75vh] min-h-[600px] max-h-[900px] overflow-hidden bg-gray-900 group">
      {slides.map((slide, index) => (
        <div 
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {slide.image.match(/\.(mp4|webm|ogg)$/i) ? (
            <video src={slide.image} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <img src={slide.image} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
          )}
          {/* Premium Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
          
          <div className="absolute inset-0 flex flex-col justify-center items-start text-white px-8 md:px-24 max-w-7xl mx-auto w-full">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 text-blue-300 font-bold tracking-widest mb-6 uppercase text-xs backdrop-blur-sm border border-blue-500/30">
              Featured Event
            </span>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.1] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-50 to-gray-400 drop-shadow-sm max-w-4xl">
              {slide.title}
            </h2>
            <p className="text-xl md:text-3xl mb-4 font-light text-gray-200 max-w-2xl leading-snug drop-shadow-md">
              {slide.subtitle}
            </p>
            <div className="flex items-center gap-4 text-lg font-medium text-blue-100 mb-10 bg-black/20 p-3 pr-5 rounded-full backdrop-blur-sm border border-white/10 w-fit">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/30 text-blue-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </span>
              {slide.date}
            </div>
            
            <button 
              onClick={() => navigate(`/event?id=${slide.id}&slug=${slide.slug}`)}
              className="group/btn relative px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-lg rounded-full overflow-hidden shadow-2xl hover:shadow-blue-500/50 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 transform scale-x-0 origin-left group-hover/btn:scale-x-100 transition-transform duration-300 ease-out"></div>
              <span className="relative flex items-center gap-3">
                View Event Details 
                <svg className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </span>
            </button>
          </div>
        </div>
      ))}

      {/* Navigation Arrows (Visible on Hover) */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
      </button>

      {/* Carousel Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
        {slides.map((_, idx) => (
          <button 
            key={idx} 
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all duration-500 shadow-lg ${idx === current ? 'bg-white w-12' : 'bg-white/40 hover:bg-white/70 w-2'}`}
          />
        ))}
      </div>
    </div>
  );
};