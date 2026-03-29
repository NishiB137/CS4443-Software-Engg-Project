import React, { useState } from 'react';
import type { SessionTemplate, FieldSpec } from '@/services/api';
import { FieldBuilder } from './FieldBuilder';

const SESSION_TYPES = [
  { value: 'keynote',           label: 'Keynote' },
  { value: 'panel',             label: 'Panel Discussion' },
  { value: 'workshop',          label: 'Workshop' },
  { value: 'networking',        label: 'Networking' },
  { value: 'performance',       label: 'Performance' },
  { value: 'competition_round', label: 'Competition Round' },
  { value: 'break',             label: 'Break / Intermission' },
  { value: 'other',             label: 'Other' },
];

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none bg-white transition';
const lbl = 'block text-xs font-medium text-gray-600 mb-1';

const EMPTY: SessionTemplate = {
  title: '', sessionType: 'other', defaultDurationMinutes: 60, description: '', defaultFields: [],
};

interface Props {
  sessions: SessionTemplate[];
  onChange: (sessions: SessionTemplate[]) => void;
  readOnly?: boolean;
}

export const SessionTemplateBuilder: React.FC<Props> = ({ sessions, onChange, readOnly }) => {
  const [expanded, setExpanded] = useState<number | null>(null);

  const add = () => {
    onChange([...sessions, { ...EMPTY }]);
    setExpanded(sessions.length);
  };

  const update = (idx: number, s: SessionTemplate) => {
    const next = [...sessions];
    next[idx] = s;
    onChange(next);
  };

  const remove = (idx: number) => {
    onChange(sessions.filter((_, i) => i !== idx));
    if (expanded === idx) setExpanded(null);
  };

  return (
    <div className="space-y-3">
      {sessions.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
          <p className="text-xs text-gray-400 mb-3">
            Session templates pre-populate the session creator when an organizer uses this template.
          </p>
          {!readOnly && (
            <button type="button" onClick={add}
              className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition">
              + Add Session Template
            </button>
          )}
        </div>
      ) : (
        <>
          {sessions.map((s, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              {/* Header */}
              <div
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer select-none"
                onClick={() => setExpanded(expanded === idx ? null : idx)}
              >
                <span className="w-6 h-6 bg-gray-200 text-gray-600 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.title || 'Untitled Session'}</p>
                  <p className="text-xs text-gray-400 capitalize">{s.sessionType} · {s.defaultDurationMinutes} min · {s.defaultFields.length} fields</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); remove(idx); }}
                  disabled={readOnly}
                  className="text-red-300 hover:text-red-500 p-1 transition flex-shrink-0 disabled:opacity-30 disabled:pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
                <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded === idx ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>

              {expanded === idx && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className={lbl}>Session Title <span className="text-red-500">*</span></label>
                      <input type="text" className={inp} value={s.title} placeholder="e.g. Opening Keynote"
                        disabled={readOnly}
                        onChange={(e) => update(idx, { ...s, title: e.target.value })} />
                    </div>
                    <div>
                      <label className={lbl}>Session Type</label>
                      <select className={inp} value={s.sessionType} disabled={readOnly}
                        onChange={(e) => update(idx, { ...s, sessionType: e.target.value })}>
                        {SESSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Default Duration (minutes)</label>
                      <input type="number" className={inp} min={5} max={1440} value={s.defaultDurationMinutes}
                        disabled={readOnly}
                        onChange={(e) => update(idx, { ...s, defaultDurationMinutes: Number(e.target.value) })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={lbl}>Description</label>
                      <input type="text" className={inp} value={s.description || ''} placeholder="Brief description of this session type"
                        disabled={readOnly}
                        onChange={(e) => update(idx, { ...s, description: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Custom Fields for this Session Type</p>
                    <FieldBuilder
                      fields={s.defaultFields as FieldSpec[]}
                      onChange={(fields) => update(idx, { ...s, defaultFields: fields as FieldSpec[] })}
                      // Session template fields should not expose form/category layout controls
                      onLayoutChange={undefined}
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {!readOnly && (
            <button type="button" onClick={add}
              className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition font-medium">
              + Add Another Session Template
            </button>
          )}
        </>
      )}
    </div>
  );
};
