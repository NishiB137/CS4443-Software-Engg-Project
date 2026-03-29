import React, { useState } from 'react';
import type { SessionTemplate } from '@/services/api';
import { FieldBuilder } from './FieldBuilder';
import { mergeSessionSystemFields, SESSION_SYSTEM_FIELD_KEYS, DEFAULT_SESSION_LAYOUT } from '@/shared/template/sessionSystemFields';



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
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Session Fields Configuration</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">Configure default values and additional fields for this session type.</p>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <FieldBuilder
                        fields={mergeSessionSystemFields(s.defaultFields)}
                        layout={s.layout || DEFAULT_SESSION_LAYOUT}
                        onLayoutChange={(nextLayout) => update(idx, { ...s, layout: nextLayout })}
                        onChange={(nextFields) => {
                          const titleF = nextFields.find(f => f.key === 'title');
                          const typeF = nextFields.find(f => f.key === 'sessionType');
                          const descF = nextFields.find(f => f.key === 'description');
                          const durF = nextFields.find(f => f.key === 'defaultDurationMinutes');

                          update(idx, {
                            ...s,
                            defaultFields: nextFields,
                            title: titleF?.defaultValue || titleF?.placeholder || s.title,
                            sessionType: typeF?.defaultValue || s.sessionType,
                            description: descF?.defaultValue || s.description,
                            defaultDurationMinutes: Number(durF?.defaultValue || s.defaultDurationMinutes),
                          });
                        }}
                        systemFieldKeys={SESSION_SYSTEM_FIELD_KEYS}
                        readOnly={readOnly}
                        isSessionTemplate={true}
                      />
                    </div>
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
