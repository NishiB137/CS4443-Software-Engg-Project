import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTemplates } from '../hooks/useTemplates';
import type { ApiTemplate } from '@/services/api';

const FormatBadge: React.FC<{ format: string }> = ({ format }) => {
  const styles: Record<string, string> = {
    physical: 'bg-green-50 text-green-700 border-green-200',
    virtual:  'bg-purple-50 text-purple-700 border-purple-200',
    hybrid:   'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${styles[format] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {format}
    </span>
  );
};

const TemplateCard: React.FC<{
  template: ApiTemplate;
  onDelete: (id: string) => void;
  onDuplicate: (id: string, name: string) => Promise<void>;
}> = ({ template, onDelete, onDuplicate }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dupName, setDupName]   = useState('');
  const [dupMode, setDupMode]   = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);
  const [dupError, setDupError] = useState<string | null>(null);
  const [dupLoading, setDupLoading] = useState(false);

  const handleDuplicate = async () => {
    const name = dupName.trim() || `${template.name} (Copy)`;
    setDupError(null);
    setDupLoading(true);
    try {
      await onDuplicate(template._id, name);
      setDupMode(false);
      setDupName('');
      setMenuOpen(false);
    } catch (e) {
      setDupError(e instanceof Error ? e.message : 'Could not duplicate template');
    } finally {
      setDupLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
      {/* Colour bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: template.coverColor || '#3B82F6' }} />

      <div className="p-5 flex flex-col flex-1">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900 truncate">{template.name}</h3>
              {template.isDefault && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium flex-shrink-0">
                  Default
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{template.eventType}</p>
          </div>

          {/* Menu */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
              </svg>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-20 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 text-sm"
                onMouseDown={(e) => e.preventDefault()}
              >
                <button
                  type="button"
                  onClick={() => {
                    navigate(template.isDefault ? `/templates/${template._id}` : `/templates/${template._id}/edit`);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  {template.isDefault ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                      View
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                      Edit
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setDupMode(true); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>
                  Duplicate
                </button>
                {!template.isDefault && (
                  <button
                    type="button"
                    onClick={() => { setDelConfirm(true); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1 line-clamp-2">
          {template.description || 'No description provided.'}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <FormatBadge format={template.format} />
          <span className="text-xs text-gray-400">{template.fields.length} fields</span>
          <span className="text-xs text-gray-400">{template.sessionTemplates.length} session types</span>
          {template.usageCount > 0 && (
            <span className="text-xs text-gray-400">Used {template.usageCount}×</span>
          )}
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {template.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{tag}</span>
            ))}
            {template.tags.length > 4 && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">+{template.tags.length - 4}</span>
            )}
          </div>
        )}

        {/* Action */}
        <Link
          to={template.isDefault ? `/templates/${template._id}` : `/templates/${template._id}/edit`}
          className="w-full py-2 text-center text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition mt-auto"
        >
          {template.isDefault ? 'View' : 'View / Edit'}
        </Link>
      </div>

      {/* Duplicate modal */}
      {dupMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-1">Duplicate Template</h3>
            <p className="text-xs text-gray-500 mb-4">Give the copy a new name</p>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none mb-2"
              value={dupName}
              placeholder={`${template.name} (Copy)`}
              onChange={(e) => setDupName(e.target.value)}
              autoFocus
            />
            {dupError && (
              <p className="text-xs text-red-600 mb-2">{dupError}</p>
            )}
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => { setDupMode(false); setDupError(null); }} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" disabled={dupLoading} onClick={() => void handleDuplicate()} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{dupLoading ? '…' : 'Duplicate'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-1">Delete Template?</h3>
            <p className="text-sm text-gray-500 mb-5">
              <strong>"{template.name}"</strong> will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDelConfirm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => { onDelete(template._id); setDelConfirm(false); }}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TemplateListPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch]         = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [kind, setKind]             = useState<'all' | 'default' | 'custom'>('all');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const queryParams = useMemo(() => ({
    q: debouncedSearch.trim() || undefined,
    eventType: typeFilter || undefined,
    kind,
  }), [debouncedSearch, typeFilter, kind]);

  const { templates, loading, error, filters, reload, deleteTemplate, duplicateTemplate } = useTemplates(queryParams);

  const showSplit = kind === 'all';
  const systemTemplates = templates.filter((t) => t.isDefault);
  const customTemplates = templates.filter((t) => !t.isDefault);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-400 hover:text-gray-600 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Templates</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage reusable templates for event creation</p>
            </div>
          </div>
          <Link
            to="/templates/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Template
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none bg-white"
            />
          </div>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as 'all' | 'default' | 'custom')}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none"
          >
            {(filters?.kinds ?? [
              { value: 'all', label: 'All', count: 0 },
              { value: 'default', label: 'Default', count: 0 },
              { value: 'custom', label: 'Custom', count: 0 },
            ]).map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Types</option>
            {(filters?.eventTypes ?? []).map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
            </svg>
            {error}
            <button onClick={reload} className="ml-auto text-xs underline">Retry</button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
                <div className="h-1.5 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                  <div className="h-8 bg-gray-100 rounded-lg mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* System templates */}
            {showSplit && systemTemplates.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-semibold text-gray-700">System Templates</h2>
                  <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full">{systemTemplates.length}</span>
                  <p className="text-xs text-gray-400 ml-1">Built-in defaults — duplicate to customise</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {systemTemplates.map((t) => (
                    <TemplateCard key={t._id} template={t} onDelete={deleteTemplate} onDuplicate={duplicateTemplate} />
                  ))}
                </div>
              </div>
            )}

            {/* Custom templates */}
            {showSplit && customTemplates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-semibold text-gray-700">Custom Templates</h2>
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full">{customTemplates.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {customTemplates.map((t) => (
                    <TemplateCard key={t._id} template={t} onDelete={deleteTemplate} onDuplicate={duplicateTemplate} />
                  ))}
                </div>
              </div>
            )}

            {!showSplit && templates.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {templates.map((t) => (
                  <TemplateCard key={t._id} template={t} onDelete={deleteTemplate} onDuplicate={duplicateTemplate} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {templates.length === 0 && !loading && (
              <div className="text-center py-20">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium mb-1">No templates found</p>
                <p className="text-sm text-gray-400 mb-5">
                  {search || typeFilter ? 'Try adjusting your filters' : 'Create your first custom template'}
                </p>
                {!search && !typeFilter && kind !== 'default' && (
                  <Link to="/templates/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    New Template
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
