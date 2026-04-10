import React from 'react';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';

// ─── Visibility option config ─────────────────────────────────────────────────

type VisibilityOption = {
  value: 'public' | 'hidden_link' | 'hidden_authenticated';
  label: string;
  tagline: string;
  description: string;
  bullets: string[];
  activeRing: string;
  activeIconBg: string;
  iconColor: string;
};

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value:        'public',
    label:        'Public',
    tagline:      'Anyone can find and join',
    description:  'Your event shows up in search results and can be shared freely. Best choice for open events like conferences, concerts, or community meetups.',
    bullets:      ['Searchable on the platform', 'Anyone can register', 'Easy to share on social media'],
    activeRing:   'border-blue-500 ring-2 ring-blue-200',
    activeIconBg: 'bg-blue-50',
    iconColor:    'text-blue-600',
  },
  {
    value:        'hidden_link',
    label:        'Link Only',
    tagline:      'Only people with the link can see it',
    description:  'Your event won\'t appear in search results. Perfect for semi-private events — just share the link with your intended audience.',
    bullets:      ['Not searchable', 'Sharable via direct link', 'No login required to view'],
    activeRing:   'border-purple-500 ring-2 ring-purple-200',
    activeIconBg: 'bg-purple-50',
    iconColor:    'text-purple-600',
  },
  {
    value:        'hidden_authenticated',
    label:        'Invite Only',
    tagline:      'Private — attendees must be personally invited',
    description:  'Completely private. Only people you invite can access the event. Best for internal team events, VIP experiences, or exclusive gatherings.',
    bullets:      ['Not searchable or linkable', 'Requires invitation to join', 'Most secure option'],
    activeRing:   'border-gray-700 ring-2 ring-gray-300',
    activeIconBg: 'bg-gray-100',
    iconColor:    'text-gray-700',
  },
];

const VisibilityIcon: React.FC<{ value: string; className?: string }> = ({ value, className = 'w-6 h-6' }) => {
  switch (value) {
    case 'public':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      );
  }
};

// ─── Step component ───────────────────────────────────────────────────────────
export const Step3Visibility: React.FC<WizardStepProps> = ({ data, updateData }) => {
  return (
    <div className="max-w-2xl mx-auto animate-fadeIn space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Visibility & Access</h2>
        <p className="text-gray-500 mt-2 text-sm">Choose who can discover and access your event</p>
      </div>

      <div className="space-y-4">
        {VISIBILITY_OPTIONS.map((opt) => {
          const isSelected = data.visibility === opt.value;
          return (
            <div
              key={opt.value}
              onClick={() => updateData({ visibility: opt.value })}
              className={`p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                isSelected
                  ? `${opt.activeRing} bg-white`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl flex-shrink-0 ${isSelected ? opt.activeIconBg : 'bg-gray-50'}`}>
                  <VisibilityIcon value={opt.value} className={`w-6 h-6 ${isSelected ? opt.iconColor : 'text-gray-400'}`} />
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{opt.label}</h3>
                      <p className={`text-xs font-semibold mt-0.5 ${isSelected ? opt.iconColor : 'text-gray-500'}`}>{opt.tagline}</p>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full flex-shrink-0">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{opt.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {opt.bullets.map((b) => (
                      <span key={b} className="text-xs text-gray-500 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

      <p className="text-xs text-gray-400 text-center pt-2">
        You can change visibility settings anytime from your event dashboard.
      </p>
    </div>
  );
};
