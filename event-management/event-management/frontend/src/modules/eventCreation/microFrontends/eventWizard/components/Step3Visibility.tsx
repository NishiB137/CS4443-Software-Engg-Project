import React from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';

type VisibilityOption = {
  value: 'public' | 'restricted' | 'hidden_link' | 'hidden_authenticated';
  label: string;
  tagline: string;
  bullets: string[];
  activeRing: string;
  activeIconBg: string;
  iconColor: string;
};

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value:        'public',
    label:        'Public',
    tagline:      'Open to everyone · Searchable · SEO Indexed',
    bullets:      ['Maximum reach', 'Easy discovery', 'Social sharing enabled'],
    activeRing:   'border-blue-500 ring-1 ring-blue-500',
    activeIconBg: 'bg-blue-50',
    iconColor:    'text-blue-600',
  },
  {
    value:        'restricted',
    label:        'Restricted',
    tagline:      'Login required · Searchable · Member-only access',
    bullets:      ['Controlled access', 'Attendee approval', 'Organisation-gated'],
    activeRing:   'border-orange-500 ring-1 ring-orange-500',
    activeIconBg: 'bg-orange-50',
    iconColor:    'text-orange-600',
  },
  {
    value:        'hidden_link',
    label:        'Hidden (Link only)',
    tagline:      'Not searchable · Accessible via direct link only',
    bullets:      ['Private invite URL', 'Not in discovery', 'No login required'],
    activeRing:   'border-purple-500 ring-1 ring-purple-500',
    activeIconBg: 'bg-purple-50',
    iconColor:    'text-purple-600',
  },
  {
    value:        'hidden_authenticated',
    label:        'Hidden (Auth + Link)',
    tagline:      'Not searchable · Link + login required',
    bullets:      ['Most private option', 'Must be invited', 'Login enforced'],
    activeRing:   'border-gray-700 ring-1 ring-gray-700',
    activeIconBg: 'bg-gray-100',
    iconColor:    'text-gray-700',
  },
];

const VisibilityIcon: React.FC<{ value: string; className?: string }> = ({ value, className = 'w-5 h-5' }) => {
  switch (value) {
    case 'public':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      );
    case 'restricted':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      );
    case 'hidden_link':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      );
  }
};

export const Step3Visibility: React.FC<WizardStepProps> = ({ data, updateData }) => (
  <div className="max-w-2xl mx-auto animate-fadeIn">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-gray-900">Visibility & Access Control</h2>
      <p className="text-gray-500 mt-2 text-sm">Choose who can discover and register for your event</p>
    </div>

    <div className="space-y-3">
      {VISIBILITY_OPTIONS.map((opt) => {
        const isSelected = data.visibility === opt.value;
        return (
          <div
            key={opt.value}
            onClick={() => updateData({ visibility: opt.value })}
            className={`p-5 border rounded-xl cursor-pointer transition-all ${
              isSelected ? opt.activeRing : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-lg flex-shrink-0 ${isSelected ? opt.activeIconBg : 'bg-gray-50'}`}>
                <VisibilityIcon value={opt.value} className={`w-5 h-5 ${isSelected ? opt.iconColor : 'text-gray-400'}`} />
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">{opt.label}</h3>
                  {isSelected && (
                    <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{opt.tagline}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {opt.bullets.map((b) => (
                    <span key={b} className="text-xs text-gray-600 flex items-center gap-1">
                      <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    <p className="text-xs text-gray-400 mt-6 text-center">
      Visibility settings can be changed later from your event dashboard.
    </p>
  </div>
);
