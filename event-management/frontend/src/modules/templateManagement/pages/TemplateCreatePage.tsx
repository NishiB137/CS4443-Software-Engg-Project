import React from 'react';
import { TemplateEditor } from '../components/TemplateEditor';
import { Header } from '@/shared/components/Header';

export const TemplateCreatePage: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <TemplateEditor />
    </div>
  </div>
);
