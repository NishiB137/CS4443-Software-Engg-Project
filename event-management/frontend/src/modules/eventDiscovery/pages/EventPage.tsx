import React from 'react';
import { Header } from '@/shared/components/Header';
import { EventDetailsMFE } from '../microFrontends/EventDetails';
import { FloatingChatbot } from '@/shared/components/FloatingChatbot';

export const EventPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-grow">
        <EventDetailsMFE />
      </main>
      <FloatingChatbot />
    </div>
  );
};