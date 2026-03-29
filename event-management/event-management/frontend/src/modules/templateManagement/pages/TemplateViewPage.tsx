import React from 'react';
import { useParams } from 'react-router-dom';
import { TemplateEditor } from '../components/TemplateEditor';
import { Header } from '@/shared/components/Header';

export const TemplateViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <TemplateEditor templateId={id} readOnly />
      </div>
    </div>
  );
};
