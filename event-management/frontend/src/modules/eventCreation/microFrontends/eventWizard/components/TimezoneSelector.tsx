import React, { useState, useMemo, useRef, useEffect } from 'react';

import { eventApi } from '@/services/api';

let cachedTimezones: string[] = [];

const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

// Get timezone offset string like "+05:30" or "-07:00"
const getOffset = (tz: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart?.value ?? '';
  } catch {
    return '';
  }
};

interface TimezoneSelectorProps {
  value: string;
  onChange: (tz: string) => void;
  className?: string;
  id?: string;
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  value,
  onChange,
  className = '',
  id,
}) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const userTz = useMemo(() => getUserTimezone(), []);

  const [allTimezones, setAllTimezones] = useState<string[]>(cachedTimezones);
  useEffect(() => {
    if (cachedTimezones.length === 0) {
      eventApi.getTimezones().then(res => {
        cachedTimezones = res.data;
        setAllTimezones(res.data);
      }).catch(err => console.error(err));
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allTimezones;
    return allTimezones.filter(tz => tz.toLowerCase().includes(q));
  }, [search, allTimezones]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = value
    ? `${value} (${getOffset(value)})`
    : 'Select timezone…';

  return (
    <div ref={containerRef} className={`relative ${className}`} id={id}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setOpen(prev => !prev); setSearch(''); }}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition flex items-center justify-between"
      >
        <span className="truncate text-left">{displayValue}</span>
        <svg
          className={`w-4 h-4 text-gray-400 ml-2 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 0Z" />
              </svg>
              <input
                type="text"
                placeholder="Search timezone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* System TZ hint */}
          {!search && userTz && value !== userTz && (
            <div className="px-3 pt-2 pb-1">
              <button
                type="button"
                onClick={() => { onChange(userTz); setOpen(false); }}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                Use my local timezone: {userTz}
              </button>
            </div>
          )}

          {/* List */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">No timezones found</li>
            )}
            {filtered.map(tz => (
              <li key={tz}>
                <button
                  type="button"
                  onClick={() => { onChange(tz); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition flex items-center justify-between gap-2 ${value === tz ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-800'
                    }`}
                >
                  <span className="truncate">{tz}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{getOffset(tz)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
