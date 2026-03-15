import React, { useState, useEffect } from 'react';

const slides = [
  {
    id: 1,
    title: "Tech Innovation Summit 2026",
    subtitle: "Join industry leaders to shape the future of technology.",
    date: "July 20, 2026",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: 2,
    title: "Global Music Festival",
    subtitle: "Experience the ultimate sound of summer.",
    date: "August 15, 2026",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: 3,
    title: "Creative Arts Expo",
    subtitle: "Discover groundbreaking artwork and installations.",
    date: "September 10, 2026",
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1600&q=80",
  }
];

export const HeroCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);

  // Auto-play interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000); 
    return () => clearInterval(timer);
  }, [current]); // Reset timer when slide changes manually

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full h-[500px] overflow-hidden bg-secondary group">
      {slides.map((slide, index) => (
        <div 
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 flex flex-col justify-center items-start text-white px-12 md:px-24 max-w-5xl">
            <span className="text-blue-300 font-semibold tracking-wider mb-2 uppercase text-sm drop-shadow-md">Featured Event</span>
            <h2 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight drop-shadow-lg">{slide.title}</h2>
            <p className="text-xl md:text-2xl mb-2 font-light drop-shadow-md">{slide.subtitle}</p>
            <p className="text-lg font-medium mb-8 opacity-90 drop-shadow-md">{slide.date}</p>
            
            <button className="group/btn relative px-8 py-4 bg-primary text-white font-bold text-lg rounded-full overflow-hidden shadow-xl hover:shadow-primary/50 transition-all">
              <div className="absolute inset-0 w-full h-full bg-white/20 transform scale-x-0 origin-left group-hover/btn:scale-x-100 transition-transform duration-300 ease-out"></div>
              <span className="relative flex items-center gap-2">
                View Event Details 
                <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
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
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, idx) => (
          <button 
            key={idx} 
            onClick={() => setCurrent(idx)}
            className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${idx === current ? 'bg-primary w-10' : 'bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </div>
  );
};