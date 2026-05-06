import React, { useState, useCallback } from 'react';
import { authApi } from '@/services/api';
import type { TeamMember } from '@/modules/eventCreation/microFrontends/eventWizard/interface';

interface Props {
  team: TeamMember[];
  onChange: (team: TeamMember[]) => void;
}

const ROLE_LABELS: Record<TeamMember['role'], string> = {
  event_manager: 'Manager',
  co_organizer: 'Co-Organiser',
  viewer: 'Viewer',
  reviewer: 'Reviewer',
};

export const CoOrganizerManager: React.FC<Props> = ({ team, onChange }) => {
  const [input, setInput] = useState('');
  const [resolvedUser, setResolvedUser] = useState<{ _id: string; username: string; name: string; email: string; role: string } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<TeamMember['role']>('event_manager');

  const handleLookup = useCallback(async () => {
    const u = input.trim().toLowerCase();
    if (!u) return;
    setLookupLoading(true);
    setLookupError(null);
    setResolvedUser(null);
    try {
      const res = await authApi.getUserByUsername(u);
      if (team.some((m) => m._id === res.data._id)) {
        setLookupError('This user is already in the team.');
        return;
      }
      setResolvedUser(res.data);
    } catch {
      setLookupError('No user found with that username.');
    } finally {
      setLookupLoading(false);
    }
  }, [input, team]);

  const handleAdd = () => {
    if (!resolvedUser) return;
    onChange([
      ...team,
      {
        _id: resolvedUser._id,
        username: resolvedUser.username,
        name: resolvedUser.name,
        email: resolvedUser.email,
        role: selectedRole,
      },
    ]);
    setInput('');
    setResolvedUser(null);
    setLookupError(null);
  };

  const handleRemove = (id: string) => onChange(team.filter((m) => m._id !== id));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setResolvedUser(null);
            setLookupError(null);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLookup(); } }}
          placeholder="Enter username (e.g. alice_dev)"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition"
        />
        <button
          type="button"
          onClick={handleLookup}
          disabled={!input.trim() || lookupLoading}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition flex items-center gap-2 shrink-0"
        >
          {lookupLoading && (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          Search
        </button>
      </div>

      {lookupError && (
        <p className="text-sm text-red-600 font-medium">{lookupError}</p>
      )}

      {resolvedUser && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-sm">{resolvedUser.name}</p>
            <p className="text-xs text-gray-500">@{resolvedUser.username} · {resolvedUser.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as TeamMember['role'])}
              className="text-sm border border-indigo-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              {(Object.keys(ROLE_LABELS) as TeamMember['role'][]).map((r) => (
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

      {team.length > 0 && (
        <div className="space-y-2">
          {team.map((member) => (
            <div key={member._id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {member.name?.[0]?.toUpperCase() || member.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{member.name || member.username}</p>
                <p className="text-xs text-gray-500 truncate">@{member.username}</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                {ROLE_LABELS[member.role]}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(member._id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
