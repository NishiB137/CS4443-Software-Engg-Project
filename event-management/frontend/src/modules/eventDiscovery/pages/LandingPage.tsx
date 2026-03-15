import React from 'react';
import { Header } from '@/shared/components/Header';
import { HeroCarousel } from '@/modules/eventDiscovery/components/HeroCarousel';
import { EventCatalogMFE } from '@/modules/eventDiscovery/microFrontends/EventCatalog';
import { FloatingChatbot } from '@/shared/components/FloatingChatbot';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans relative pb-10">
      <Header />
      <HeroCarousel />
      <main className="flex-grow z-10 relative bg-background">
        <EventCatalogMFE />
      </main>
      
      {/* Global Floating Chatbot */}
      <FloatingChatbot />
    </div>
  );
};