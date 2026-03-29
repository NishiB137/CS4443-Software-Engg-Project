import React, { useState } from 'react';
import type { SessionFormData, SessionSpeaker } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { EMPTY_SESSION, LIMITS, todayDate } from '@/modules/eventCreation/microFrontends/eventWizard/interface';

const SESSION_TYPES = [
  { value: 'keynote',           label: 'Keynote' },
  { value: 'panel',             label: 'Panel Discussion' },
  { value: 'workshop',          label: 'Workshop' },
  { value: 'networking',        label: 'Networking' },
  { value: 'performance',       label: 'Performance' },
  { value: 'competition_round', label: 'Competition Round' },
  { value: 'break',             label: 'Break' },
  { value: 'other',             label: 'Other' },
];

const inputCls = (hasError?: boolean) =>
  `w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:outline-none transition ${
    hasError
      ? 'border-red-400 focus:ring-red-200 bg-red-50'
      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500 bg-white'
  }`;

const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

interface SessionErrors {
  title?: string;
  startDate?: string;
  endDate?: string;
  maxAttendees?: string;
  streamUrl?: string;
}

const validateSession = (s: SessionFormData): SessionErrors => {
  const errors: SessionErrors = {};
  if (!s.title.trim())
    errors.title = 'Session title is required.';
  else if (s.title.trim().length < LIMITS.sessionTitle.min)
    errors.title = `Title must be at least ${LIMITS.sessionTitle.min} characters.`;
  else if (s.title.trim().length > LIMITS.sessionTitle.max)
    errors.title = `Title cannot exceed ${LIMITS.sessionTitle.max} characters.`;

  if (!s.startDate || !s.startTime)
    errors.startDate = 'Start date and time are required.';
  if (!s.endDate || !s.endTime)
    errors.endDate = 'End date and time are required.';

  if (s.startDate && s.startTime && s.endDate && s.endTime) {
    const start = new Date(`${s.startDate}T${s.startTime}`);
    const end   = new Date(`${s.endDate}T${s.endTime}`);
    if (end <= start) errors.endDate = 'End must be after start.';
  }

  if (s.maxAttendees) {
    const n = Number(s.maxAttendees);
    if (!Number.isInteger(n) || n < 1) errors.maxAttendees = 'Must be a whole number ≥ 1.';
    else if (n > LIMITS.sessionMaxAttendees.max) errors.maxAttendees = `Cannot exceed ${LIMITS.sessionMaxAttendees.max.toLocaleString()}.`;
  }

  if (s.streamUrl && !/^https?:\/\/.+/.test(s.streamUrl))
    errors.streamUrl = 'Stream URL must start with http:// or https://';

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
              <button
                type="button"
                onClick={() => onChange(speakers.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600 text-xs flex-shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="border border-dashed border-gray-300 rounded-lg p-3 space-y-2 bg-gray-50/50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Speaker</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Name *"
            maxLength={LIMITS.speakerName.max}
            className={inputCls()}
            value={draft.name}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Designation"
            className={inputCls()}
            value={draft.designation}
            onChange={(e) => setDraft((p) => ({ ...p, designation: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Organization"
            className={inputCls()}
            value={draft.organization}
            onChange={(e) => setDraft((p) => ({ ...p, organization: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Topic / Talk title"
            maxLength={LIMITS.speakerTopic.max}
            className={inputCls()}
            value={draft.topic}
            onChange={(e) => setDraft((p) => ({ ...p, topic: e.target.value }))}
          />
          <div className="col-span-2">
            <textarea
              rows={2}
              placeholder="Short bio (optional)"
              maxLength={LIMITS.speakerBio.max}
              className={inputCls()}
              value={draft.bio}
              onChange={(e) => setDraft((p) => ({ ...p, bio: e.target.value }))}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!draft.name.trim()}
          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
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
  const [expanded, setExpanded]         = useState(true);
  const [showSpeakers, setShowSpeakers] = useState(false);
  const [errors, setErrors]             = useState<SessionErrors>({});

  const update = (fields: Partial<SessionFormData>) => {
    const updated = { ...session, ...fields };
    onUpdate(updated);
    // Re-validate touched fields on change
    setErrors((prev) => {
      const e = { ...prev };
      Object.keys(fields).forEach((k) => delete e[k as keyof SessionErrors]);
      return e;
    });
  };

  const handleBlur = () => {
    setErrors(validateSession(session));
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-gray-800 truncate">
            {session.title || <span className="text-gray-400 font-normal italic">Untitled Session</span>}
          </span>
          {session.sessionType !== 'other' && (
            <span className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-500 capitalize flex-shrink-0">
              {SESSION_TYPES.find((t) => t.value === session.sessionType)?.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded transition"
          >
            Remove
          </button>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4" onBlur={handleBlur}>
          {/* Title + Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Session Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. Opening Keynote"
                maxLength={LIMITS.sessionTitle.max}
                className={inputCls(!!errors.title)}
                value={session.title}
                onChange={(e) => update({ title: e.target.value })}
              />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className={labelCls}>Session Type</label>
              <select
                className={inputCls()}
                value={session.sessionType}
                onChange={(e) => update({ sessionType: e.target.value as SessionFormData['sessionType'] })}
              >
                {SESSION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>
              Description
              <span className="text-gray-400 ml-1">(max {LIMITS.sessionDescription.max} chars)</span>
            </label>
            <textarea
              rows={2}
              placeholder="What this session covers..."
              maxLength={LIMITS.sessionDescription.max}
              className={inputCls()}
              value={session.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Remarks / Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. ask attendees to install required tools before coming"
              className={inputCls()}
              value={session.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
          </div>

          {/* Start Date/Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date & Time <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className={inputCls(!!errors.startDate)}
                  value={session.startDate}
                  min={todayDate()}
                  onChange={(e) => update({ startDate: e.target.value })}
                />
                <input
                  type="time"
                  className={`w-32 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:outline-none transition ${errors.startDate ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                  value={session.startTime}
                  onChange={(e) => update({ startTime: e.target.value })}
                />
              </div>
              {errors.startDate && <p className="text-xs text-red-600 mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className={labelCls}>End Date & Time <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className={inputCls(!!errors.endDate)}
                  value={session.endDate}
                  min={session.startDate || todayDate()}
                  onChange={(e) => update({ endDate: e.target.value })}
                />
                <input
                  type="time"
                  className={`w-32 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:outline-none transition ${errors.endDate ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                  value={session.endTime}
                  onChange={(e) => update({ endTime: e.target.value })}
                />
              </div>
              {errors.endDate && <p className="text-xs text-red-600 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Room + Stream URL + Max Attendees */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Room / Hall</label>
              <input
                type="text"
                placeholder="e.g. Hall A"
                className={inputCls()}
                value={session.room}
                onChange={(e) => update({ room: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Stream URL</label>
              <input
                type="url"
                placeholder="https://..."
                className={inputCls(!!errors.streamUrl)}
                value={session.streamUrl}
                onChange={(e) => update({ streamUrl: e.target.value })}
              />
              {errors.streamUrl && <p className="text-xs text-red-600 mt-1">{errors.streamUrl}</p>}
            </div>
            <div>
              <label className={labelCls}>
                Max Attendees
                <span className="text-gray-400 ml-1">(≤ {LIMITS.sessionMaxAttendees.max.toLocaleString()})</span>
              </label>
              <input
                type="number"
                min={1}
                max={LIMITS.sessionMaxAttendees.max}
                step={1}
                placeholder="Unlimited"
                className={inputCls(!!errors.maxAttendees)}
                value={session.maxAttendees}
                onChange={(e) => update({ maxAttendees: e.target.value })}
              />
              {errors.maxAttendees && <p className="text-xs text-red-600 mt-1">{errors.maxAttendees}</p>}
            </div>
          </div>
          <div>
            <label className={labelCls}>Tags (comma separated)</label>
            <input
              type="text"
              placeholder="ai-ml, hands-on, beginner"
              className={inputCls()}
              value={session.tags.join(', ')}
              onChange={(e) => update({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
            />
          </div>

          {/* Speakers toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowSpeakers((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition"
            >
              <svg className={`w-3.5 h-3.5 transition-transform ${showSpeakers ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
              {showSpeakers ? 'Hide' : 'Manage'} Speakers
              {session.speakers.length > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                  {session.speakers.length}
                </span>
              )}
            </button>
            {showSpeakers && (
              <div className="mt-3">
                <SpeakerForm
                  speakers={session.speakers}
                  onChange={(speakers) => update({ speakers })}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Exported SessionManager ──────────────────────────────────────────────────

interface SessionManagerProps {
  sessions: SessionFormData[];
  sessionTemplates?: Array<{ title: string; sessionType: string; defaultDurationMinutes: number; description?: string }>;
  onChange: (sessions: SessionFormData[]) => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({ sessions, sessionTemplates = [], onChange }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const addSession = () => {
    onChange([...sessions, { ...EMPTY_SESSION }]);
  };
  const addFromTemplate = () => {
    const tpl = sessionTemplates.find((t) => t.title === selectedTemplate);
    if (!tpl) return;
    onChange([
      ...sessions,
      {
        ...EMPTY_SESSION,
        title: tpl.title,
        description: tpl.description ?? '',
        sessionType: (tpl.sessionType as SessionFormData['sessionType']) ?? 'other',
      },
    ]);
  };

  const updateSession = (idx: number, s: SessionFormData) => {
    const next = [...sessions];
    next[idx] = s;
    onChange(next);
  };

  const removeSession = (idx: number) => {
    onChange(sessions.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {sessions.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50/50">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No sessions added yet</p>
          <p className="text-xs text-gray-500 mb-4">Sessions are the individual agenda items — keynotes, panels, workshops, etc.</p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={addSession}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition shadow-sm"
            >
              + Add First Session
            </button>
            {sessionTemplates.length > 0 && (
              <>
                <select className="border border-gray-300 rounded-lg px-2 py-2 text-sm" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                  <option value="">Choose default type</option>
                  {sessionTemplates.map((tpl, idx) => <option key={`${tpl.title}-${idx}`} value={tpl.title}>{tpl.title}</option>)}
                </select>
                <button type="button" onClick={addFromTemplate} disabled={!selectedTemplate} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-40">
                  Add from default
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, idx) => (
            <SessionFormRow
              key={idx}
              session={session}
              index={idx}
              onUpdate={(s) => updateSession(idx, s)}
              onRemove={() => removeSession(idx)}
            />
          ))}
          <button
            type="button"
            onClick={addSession}
            className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition"
          >
            + Add Another Session
          </button>
          {sessionTemplates.length > 0 && (
            <div className="flex gap-2 items-center">
              <select className="border border-gray-300 rounded-lg px-2 py-2 text-sm flex-1" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                <option value="">Choose default session type</option>
                {sessionTemplates.map((tpl, idx) => <option key={`${tpl.title}-${idx}`} value={tpl.title}>{tpl.title}</option>)}
              </select>
              <button type="button" onClick={addFromTemplate} disabled={!selectedTemplate} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-40">
                Add Default Type
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
