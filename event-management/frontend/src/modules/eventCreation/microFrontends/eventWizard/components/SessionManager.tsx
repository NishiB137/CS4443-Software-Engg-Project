import React, { useState } from 'react';
import type { SessionFormData, SessionSpeaker } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { EMPTY_SESSION, LIMITS } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import type { SessionTemplate, FieldSpec } from '@/services/api';
import { SESSION_SYSTEM_FIELDS, SESSION_SYSTEM_FIELD_KEYS } from '@/shared/template/sessionSystemFields';
import { DateTimePicker } from '@/modules/eventCreation/microFrontends/eventWizard/components/DateTimePicker';
import { TimezoneSelector } from '@/modules/eventCreation/microFrontends/eventWizard/components/TimezoneSelector';

const SESSION_TYPES = [
  { value: 'keynote', label: 'Keynote' },
  { value: 'panel', label: 'Panel Discussion' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'networking', label: 'Networking' },
  { value: 'performance', label: 'Performance' },
  { value: 'competition_round', label: 'Competition Round' },
  { value: 'break', label: 'Break' },
  { value: 'other', label: 'Other' },
];

const inputCls = (hasError?: boolean) =>
  `w-full border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:outline-none transition ${hasError
    ? 'border-red-400 focus:ring-red-200 focus:border-red-400 bg-red-50'
    : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500 bg-white'
  }`;

const labelCls = 'block text-xs font-medium text-gray-700 mb-1';

const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      {msg}
    </p>
  ) : null;

const CharCount: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const over = current > max;
  return (
    <p className={`text-[11px] mt-1 text-right ${over ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
      {current}/{max}
    </p>
  );
};

// ─── Validation ───────────────────────────────────────────────────────────────

type SessionErrors = Record<string, string>;

const validateSession = (s: SessionFormData, fields: FieldSpec[]): SessionErrors => {
  const errors: SessionErrors = {};

  for (const f of fields) {
    const isSys = SESSION_SYSTEM_FIELD_KEYS.includes(f.key);
    const val = String((isSys ? (s as unknown as Record<string, unknown>)[f.key] : s.customFieldValues[f.key]) ?? '').trim();
    if (f.required && !val) {
      errors[f.key] = `${f.label} is required.`;
    }
    if (f.maxLength && val.length > f.maxLength) {
      errors[f.key] = `${f.label} cannot exceed ${f.maxLength} characters.`;
    }
  }

  if (s.startDate && s.startTime && s.endDate && s.endTime) {
    const start = new Date(`${s.startDate}T${s.startTime}`);
    const end = new Date(`${s.endDate}T${s.endTime}`);
    if (end <= start) errors.endDate = 'End must be after start.';
  }

  if (s.maxAttendees) {
    const n = Number(s.maxAttendees);
    if (!Number.isInteger(n) || n < 1) errors.maxAttendees = 'Must be a whole number ≥ 1.';
  }

  if (s.streamUrl && !/^https?:\/\/.+/.test(s.streamUrl)) {
    errors.streamUrl = 'Stream URL must start with http:// or https://';
  }

  return errors;
};

// ─── Speaker sub-form ─────────────────────────────────────────────────────────

interface SpeakerFormProps {
  speakers: SessionSpeaker[];
  onChange: (speakers: SessionSpeaker[]) => void;
}

const SpeakerForm: React.FC<SpeakerFormProps> = ({ speakers, onChange }) => {
  const [draft, setDraft] = useState<SessionSpeaker>({ name: '', designation: '', organization: '', bio: '', topic: '' });

  const add = () => {
    if (!draft.name.trim()) return;
    onChange([...speakers, { ...draft }]);
    setDraft({ name: '', designation: '', organization: '', bio: '', topic: '' });
  };

  return (
    <div>
      {speakers.length > 0 && (
        <div className="space-y-2 mb-3">
          {speakers.map((sp, i) => (
            <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex-grow min-w-0">
                <p className="text-xs font-semibold text-gray-800">{sp.name}</p>
                {sp.designation && <p className="text-xs text-gray-500">{sp.designation}{sp.organization ? `, ${sp.organization}` : ''}</p>}
                {sp.topic && <p className="text-xs text-gray-400 mt-0.5">Topic: {sp.topic}</p>}
              </div>
              <button type="button" onClick={() => onChange(speakers.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-[11px] font-medium flex-shrink-0">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="border border-dashed border-gray-300 rounded-lg p-3 space-y-2 bg-gray-50/50">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Add Speaker</p>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" placeholder="Name *" maxLength={LIMITS.speakerName.max} className={inputCls()} value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
          <input type="text" placeholder="Designation" className={inputCls()} value={draft.designation} onChange={(e) => setDraft((p) => ({ ...p, designation: e.target.value }))} />
          <input type="text" placeholder="Organization" className={inputCls()} value={draft.organization} onChange={(e) => setDraft((p) => ({ ...p, organization: e.target.value }))} />
          <input type="text" placeholder="Topic / Talk title" maxLength={LIMITS.speakerTopic.max} className={inputCls()} value={draft.topic} onChange={(e) => setDraft((p) => ({ ...p, topic: e.target.value }))} />
          <div className="col-span-2">
            <textarea rows={2} placeholder="Short bio (optional)" maxLength={LIMITS.speakerBio.max} className={inputCls()} value={draft.bio} onChange={(e) => setDraft((p) => ({ ...p, bio: e.target.value }))} />
          </div>
        </div>
        <button type="button" onClick={add} disabled={!draft.name.trim()} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg transition disabled:opacity-40">
          + Add Speaker
        </button>
      </div>
    </div>
  );
};

// ─── Single session form ──────────────────────────────────────────────────────

interface SessionFormProps {
  session: SessionFormData;
  index: number;
  onUpdate: (s: SessionFormData) => void;
  onRemove: () => void;
}

const SessionFormRow: React.FC<SessionFormProps> = ({ session, index, onUpdate, onRemove }) => {
  const [expanded, setExpanded] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<SessionErrors>({});

  const forms = session.templateLayout?.forms?.length ? session.templateLayout.forms : [{ name: 'Session Details', order: 0, categories: [] }];
  const [activeTab, setActiveTab] = useState(forms[0].name);

  const fields = (session.templateFields && session.templateFields.length > 0) ? session.templateFields : SESSION_SYSTEM_FIELDS;

  const update = (fields: Partial<SessionFormData>) => {
    const updated = { ...session, ...fields };
    onUpdate(updated);
    setErrors((prev) => {
      const e = { ...prev };
      Object.keys(fields).forEach((k) => delete e[k]);
      return e;
    });
  };

  const handleBlur = () => setErrors(validateSession(session, fields));

  // Render fields grouped by category for the active tab
  const activeFields = fields.filter((f) => (f.form ?? 'Session Details') === activeTab);
  const categories = activeFields.reduce<Record<string, FieldSpec[]>>((acc, f) => {
    const cat = f.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  const sortedCatNames = Object.keys(categories).sort((a, b) => {
    const activeFormLayout = forms.find(x => x.name === activeTab);
    const orderA = activeFormLayout?.categories?.find(c => c.name === a)?.order ?? categories[a]?.[0]?.categoryOrder ?? 999;
    const orderB = activeFormLayout?.categories?.find(c => c.name === b)?.order ?? categories[b]?.[0]?.categoryOrder ?? 999;
    return orderA - orderB || a.localeCompare(b);
  });

  return (
    <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
      {/* Header row */}
      <div className="mb-5 pb-3 border-b border-gray-100 flex items-center justify-between cursor-pointer select-none" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{index + 1}</span>
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">{session.title || <span className="text-gray-400 font-normal italic">Untitled Session</span>}</h3>
          {session.sessionType !== 'other' && (
            <span className="text-[11px] px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-full text-gray-500 capitalize flex-shrink-0">
              {SESSION_TYPES.find((t) => t.value === session.sessionType)?.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-xs text-red-500 hover:text-red-700 font-medium transition">Delete</button>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="space-y-6" onBlur={handleBlur}>
          {forms.length > 1 && (
            <div className="flex border-b border-gray-200 gap-4 mt-2 mb-4 px-4">
              {forms.map(form => (
                <button
                  key={form.name}
                  type="button"
                  onClick={() => setActiveTab(form.name)}
                  className={`py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${activeTab === form.name ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                  {form.name}
                </button>
              ))}
            </div>
          )}

          {sortedCatNames.map((catName) => {
            const fds = categories[catName];
            const isCatExpanded = expandedCats[catName] !== false;
            return (
              <div key={catName} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div
                  className="flex items-center justify-between cursor-pointer mb-4 select-none"
                  onClick={() => setExpandedCats(prev => ({ ...prev, [catName]: prev[catName] === false ? true : false }))}
                >
                  <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{catName}</h4>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${isCatExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
                {isCatExpanded && (
                  <div className="space-y-4">
                    {fds.map((f) => {
                      const isSys = SESSION_SYSTEM_FIELD_KEYS.includes(f.key);
                      const val = String((isSys ? (session as unknown as Record<string, unknown>)[f.key] : session.customFieldValues[f.key]) ?? '');
                      const err = !!errors[f.key];

                      const setVal = (v: string) => {
                        if (isSys) {
                          update({ [f.key]: v });
                        } else {
                          update({ customFieldValues: { ...session.customFieldValues, [f.key]: v } });
                        }
                      };

                      const common = {
                        className: inputCls(err),
                        value: val,
                        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setVal(e.target.value),
                      };

                      return (
                        <div key={f.key}>
                          <label className={labelCls}>
                            {f.label}
                            {f.required && <span className="text-red-500 text-lg leading-3 ml-0.5">*</span>}
                          </label>
                          {f.helpText && <p className="text-[11px] text-gray-400 mb-1.5">{f.helpText}</p>}
                          {(f.fieldType === 'text' || f.fieldType === 'textarea') && f.maxLength && (
                            <p className="text-[11px] text-gray-400 mb-2 italic">
                              {f.min ? `Min: ${f.min} chars, ` : ''}Max: {f.maxLength} chars
                            </p>
                          )}

                          {f.fieldType === 'speakers' ? (
                            <div className="mt-2">
                              <SpeakerForm speakers={session.speakers || []} onChange={(speakers) => update({ speakers })} />
                            </div>
                          ) : f.fieldType === 'textarea' ? (
                            <div>
                              <textarea rows={3} placeholder={f.placeholder} maxLength={f.maxLength} {...common} />
                              <div className="flex justify-between">
                                <FieldError msg={errors[f.key]} />
                                {f.maxLength && <CharCount current={val.length} max={f.maxLength} />}
                              </div>
                            </div>
                          ) : f.key === 'timezone' ? (
                            <div>
                              <TimezoneSelector
                                id={f.key}
                                value={val as string}
                                onChange={(tz) => setVal(tz)}
                              />
                              <FieldError msg={errors[f.key]} />
                            </div>
                          ) : f.fieldType === 'select' ? (
                            <div>
                              <select {...common}>
                                <option value="">Select...</option>
                                {f.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                              <FieldError msg={errors[f.key]} />
                            </div>
                          ) : f.fieldType === 'toggle' ? (
                            <div>
                              <div className="flex items-center mt-1">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={val === 'true'}
                                  onClick={() => setVal(val === 'true' ? 'false' : 'true')}
                                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${val === 'true' ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                  <span className="sr-only">Toggle {f.label}</span>
                                  <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${val === 'true' ? 'translate-x-5' : 'translate-x-0'}`}
                                  />
                                </button>
                                <span className="ml-3 text-sm font-medium text-gray-900">{val === 'true' ? 'Yes' : 'No'}</span>
                              </div>
                              <FieldError msg={errors[f.key]} />
                            </div>
                          ) : (f.key === 'startDate' || f.key === 'endDate') ? (
                            <div>
                              <DateTimePicker
                                id={f.key}
                                dateValue={String((session as unknown as Record<string, unknown>)[f.key] ?? '')}
                                timeValue={String((session as unknown as Record<string, unknown>)[f.key === 'startDate' ? 'startTime' : 'endTime'] ?? '')}
                                onChange={(d, t) => {
                                  update({ [f.key]: d, [f.key === 'startDate' ? 'startTime' : 'endTime']: t });
                                }}
                                className={err ? 'border-red-400 focus:ring-red-200 focus:border-red-400 bg-red-50' : ''}
                              />
                              <FieldError msg={errors[f.key] || errors[f.key === 'startDate' ? 'startTime' : 'endTime']} />
                            </div>
                          ) : (f.key === 'startTime' || f.key === 'endTime') ? null : (
                            <div>
                              <input
                                type={
                                  f.fieldType === 'number' ? 'number'
                                    : f.fieldType === 'url' ? 'url'
                                      : f.fieldType === 'email' ? 'email'
                                        : f.fieldType === 'date' ? 'date'
                                          : f.fieldType === 'time' ? 'time' : 'text'
                                }
                                placeholder={f.placeholder}
                                maxLength={f.maxLength}
                                min={f.min}
                                max={f.max}
                                {...common}
                              />
                              <div className="flex justify-between">
                                <FieldError msg={errors[f.key]} />
                                {f.maxLength && <CharCount current={val.length} max={f.maxLength} />}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};

// ─── Exported SessionManager ──────────────────────────────────────────────────

interface SessionManagerProps {
  sessions: SessionFormData[];
  sessionTemplates?: Array<SessionTemplate>;
  onChange: (sessions: SessionFormData[]) => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ sessions, sessionTemplates = [], onChange }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('Blank Session');

  const addSession = () => {
    if (selectedTemplate === 'Blank Session') {
      onChange([...sessions, { ...EMPTY_SESSION, title: `Session ${sessions.length + 1}` }]);
      return;
    }
    const tpl = sessionTemplates.find((t) => t.title === selectedTemplate);
    if (!tpl) return;
    onChange([
      ...sessions,
      {
        ...EMPTY_SESSION,
        title: `${tpl.title} ${sessions.filter(s => s.sessionType === tpl.sessionType).length + 1}`,
        description: tpl.description ?? '',
        sessionType: (tpl.sessionType as SessionFormData['sessionType']) ?? 'other',
        templateFields: tpl.defaultFields,
        templateLayout: tpl.layout,
      },
    ]);
  };


  const updateSession = (idx: number, s: SessionFormData) => {
    const next = [...sessions];
    next[idx] = s;
    onChange(next);
  };

  const removeSession = (idx: number) => onChange(sessions.filter((_, i) => i !== idx));

  return (
    <div>
      {sessions.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50/50">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-4">No sessions added yet</p>
          <div className="flex gap-2 items-center justify-center mt-6">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[200px]" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
              <option value="Blank Session">Blank Session</option>
              {sessionTemplates.length > 0 && <optgroup label="Templates">
                {sessionTemplates.map((tpl, idx) => <option key={`${tpl.title}-${idx}`} value={tpl.title}>{tpl.title}</option>)}
              </optgroup>}
            </select>
            <button type="button" onClick={addSession} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm">+ Add</button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {sessions.map((session, idx) => (
            <SessionFormRow key={idx} session={session} index={idx} onUpdate={(s) => updateSession(idx, s)} onRemove={() => removeSession(idx)} />
          ))}
          <div className="flex gap-2 items-center bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-300">
            <span className="text-sm font-medium text-gray-700">Add another session:</span>
            <select className="border border-gray-300 rounded-lg px-2 py-2 text-sm flex-1 max-w-xs" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
              <option value="Blank Session">Blank Session</option>
              {sessionTemplates.length > 0 && <optgroup label="Templates">
                {sessionTemplates.map((tpl, idx) => <option key={`${tpl.title}-${idx}`} value={tpl.title}>{tpl.title}</option>)}
              </optgroup>}
            </select>
            <button type="button" onClick={addSession} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm">
              + Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
