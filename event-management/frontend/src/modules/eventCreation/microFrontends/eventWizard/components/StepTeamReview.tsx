import React, { useState, useCallback } from 'react';
import { authApi } from '@/services/api';
import type { WizardStepProps, TeamMember } from '@/modules/eventCreation/microFrontends/eventWizard/interface';

const ROLE_LABELS: Record<TeamMember['role'], string> = {
  event_manager: 'Event Manager',
  co_organizer:  'Co-Organizer',
  viewer:        'Viewer',
  reviewer:      'Reviewer',
};

// ─── Username lookup + add ─────────────────────────────────────────────────────
const MemberSearch: React.FC<{
  team: TeamMember[];
  onAdd: (member: TeamMember) => void;
}> = ({ team, onAdd }) => {
  const [input, setInput] = useState('');
  const [resolved, setResolved] = useState<{ _id: string; username: string; name: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<TeamMember['role']>('event_manager');

  const lookup = useCallback(async () => {
    const u = input.trim().toLowerCase();
    if (!u) return;
    setLoading(true); setError(null); setResolved(null);
    try {
      const res = await authApi.getUserByUsername(u);
      if (team.some(m => m._id === res.data._id)) {
        setError('This user is already on the team.');
        return;
      }
      const currentUserId = localStorage.getItem('userId');
      if (res.data._id === currentUserId) {
        setError('You are already managing this event.');
        return;
      }
      setResolved(res.data);
    } catch {
      setError('No user found with that username.');
    } finally {
      setLoading(false);
    }
  }, [input, team]);

  const handleAdd = () => {
    if (!resolved) return;
    onAdd({ _id: resolved._id, username: resolved.username, name: resolved.name, email: resolved.email, role });
    setInput(''); setResolved(null); setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setResolved(null); setError(null); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookup(); } }}
          placeholder="Search by username…"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
        />
        <button
          type="button"
          onClick={lookup}
          disabled={!input.trim() || loading}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition flex items-center gap-2 shrink-0"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          )}
          Search
        </button>
      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      {resolved && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">{resolved.name}</p>
            <p className="text-xs text-gray-500">@{resolved.username} · {resolved.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={role}
              onChange={e => setRole(e.target.value as TeamMember['role'])}
              className="text-sm border border-indigo-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {(['event_manager', 'co_organizer', 'viewer'] as TeamMember['role'][]).map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Team member chip ─────────────────────────────────────────────────────────
const MemberChip: React.FC<{ member: TeamMember; isReviewer: boolean; onRemove: () => void }> = ({ member, isReviewer, onRemove }) => (
  <div className={`flex items-center gap-3 p-3 rounded-xl border ${isReviewer ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
      {member.name?.[0]?.toUpperCase() || member.username[0]?.toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 truncate">
        {member.name || member.username}
        {isReviewer && (
          <span className="ml-2 text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase">Reviewer</span>
        )}
      </p>
      <p className="text-xs text-gray-500 truncate">@{member.username} · {ROLE_LABELS[member.role]}</p>
    </div>
    <button
      type="button"
      onClick={onRemove}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

// ─── Main StepTeamReview ──────────────────────────────────────────────────────
export const StepTeamReview: React.FC<WizardStepProps> = ({ data, updateData }) => {
  const handleAddMember = (member: TeamMember) => {
    updateData({ team: [...data.team, member] });
  };

  const handleRemoveMember = (id: string) => {
    const newTeam = data.team.filter(m => m._id !== id);
    // If the removed member was the reviewer, clear reviewerId
    const newReviewerId = data.reviewerId === id ? '' : data.reviewerId;
    updateData({ team: newTeam, reviewerId: newReviewerId });
  };

  const handleToggleReview = (val: boolean) => {
    updateData({
      requiresReview: val,
      reviewerId: val ? data.reviewerId : '',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">Team &amp; Review Settings</h2>
        <p className="text-gray-500 text-sm">Add team members who can manage this event, and optionally assign a reviewer before the event goes live.</p>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-black text-indigo-900">Team Members</h3>
          <p className="text-xs text-gray-500 mt-0.5">Search for users by their username to add them to this event's team.</p>
        </div>
        <div className="p-6 space-y-4">
          <MemberSearch team={data.team} onAdd={handleAddMember} />

          {data.team.length > 0 ? (
            <div className="space-y-2 mt-2">
              {data.team.map(member => (
                <MemberChip
                  key={member._id}
                  member={member}
                  isReviewer={data.reviewerId === member._id}
                  onRemove={() => handleRemoveMember(member._id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
              No team members added yet. Search above to invite people.
            </p>
          )}
        </div>
      </div>

      {/* Review Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-white px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-black text-amber-900">Review Before Publishing</h3>
          <p className="text-xs text-gray-500 mt-0.5">Require a team member to review and approve this event before it goes live.</p>
        </div>
        <div className="p-6 space-y-5">
          {/* Toggle */}
          <label className="flex items-center justify-between gap-4 cursor-pointer group">
            <div>
              <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">Require review before publishing</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {data.requiresReview
                  ? 'The event will be submitted for review. It will only go live after the reviewer approves it.'
                  : 'The event will go live immediately after you submit it.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleReview(!data.requiresReview)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${data.requiresReview ? 'bg-amber-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.requiresReview ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </label>

          {/* Reviewer picker — only show if review is enabled */}
          {data.requiresReview && (
            <div>
              {data.team.filter(m => m.role !== 'viewer').length === 0 ? (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-sm text-amber-800 font-medium">Please add at least one non-viewer team member above before picking a reviewer.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Select Reviewer <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Pick one of your team members who will review and approve this event.</p>
                  <div className="space-y-2">
                    {data.team.filter(m => m.role !== 'viewer').map(member => (
                      <label
                        key={member._id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          data.reviewerId === member._id
                            ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
                            : 'bg-white border-gray-200 hover:border-amber-200 hover:bg-amber-50/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reviewer"
                          value={member._id}
                          checked={data.reviewerId === member._id}
                          onChange={() => updateData({ reviewerId: member._id })}
                          className="accent-amber-500"
                        />
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {member.name?.[0]?.toUpperCase() || member.username[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{member.name || member.username}</p>
                          <p className="text-xs text-gray-500 truncate">@{member.username} · {ROLE_LABELS[member.role]}</p>
                        </div>
                        {data.reviewerId === member._id && (
                          <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase shrink-0">Selected</span>
                        )}
                      </label>
                    ))}
                  </div>
                  {data.requiresReview && !data.reviewerId && (
                    <p className="text-xs text-red-600 mt-2 font-medium">Please select a reviewer.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Summary pill */}
          <div className={`rounded-xl p-4 text-sm font-medium flex items-center gap-3 ${
            data.requiresReview
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}>
            {data.requiresReview ? (
              <>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Event will be submitted for review. It goes live only after
                {data.reviewerId
                  ? ` ${data.team.find(m => m._id === data.reviewerId)?.name || 'the reviewer'} approves it.`
                  : ' the selected reviewer approves it.'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 12l4.5-4.5m0 0l4.5 4.5M12 7.5v13.5" />
                </svg>
                Event will be published immediately when you submit.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
