import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateApi } from '@/services/api';
import type { ApiTemplate, FieldSpec, SessionTemplate, TemplateLayout } from '@/services/api';
import { FieldBuilder } from './FieldBuilder';
import { SessionTemplateBuilder } from './SessionTemplateBuilder';
import { mergeSystemFields, SYSTEM_FIELD_KEYS } from '@/shared/template/systemFields';
import { deriveLayoutFromFields, ensurePoliciesCategory } from '@/shared/template/layout';

const EVENT_TYPES = [
  { value: 'conference', label: 'Conference' }, { value: 'workshop', label: 'Workshop' },
  { value: 'hackathon', label: 'Hackathon' },   { value: 'concert', label: 'Concert' },
  { value: 'exhibition', label: 'Exhibition' }, { value: 'summit', label: 'Summit' },
  { value: 'festival', label: 'Festival' },     { value: 'competition', label: 'Competition' },
  { value: 'webinar', label: 'Webinar' },       { value: 'other', label: 'Other' },
];

const TABS = ['Basic Info', 'Fields', 'Session Templates'] as const;
type Tab = typeof TABS[number];

const inp = (err?: boolean) =>
  `w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:outline-none transition bg-white
   ${err ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`;
const lbl = 'block text-sm font-medium text-gray-700 mb-1';

// ─── Registration form is now handled directly by standard FieldBuilder ───



interface Props {
  templateId?: string;   // undefined = create mode
  /** When true (view route), all fields are read-only. Default templates opened on /edit redirect to the view route. */
  readOnly?: boolean;
}

export const TemplateEditor: React.FC<Props> = ({ templateId, readOnly = false }) => {
  const navigate  = useNavigate();
  const isEdit    = !!templateId;
  const viewOnly  = readOnly;

  const [tab, setTab]                 = useState<Tab>('Basic Info');
  const [saving, setSaving]           = useState(false);
  const [loadError, setLoadError]     = useState<string | null>(null);
  const [saveError, setSaveError]     = useState<string | null>(null);

  const [form, setForm] = useState<Partial<ApiTemplate>>({
    name: '', description: '', eventType: 'other', format: 'physical',
    isFree: true, coverColor: '#2563EB', tags: [],
    fields: [
      { key: 'attendeeName', label: 'Full Name', fieldType: 'text', required: true, section: 'custom', order: 60, form: 'Registration', category: 'Contact Info', formOrder: 2, categoryOrder: 0 },
      { key: 'attendeeEmail', label: 'Email Address', fieldType: 'email', required: true, section: 'custom', order: 61, form: 'Registration', category: 'Contact Info', formOrder: 2, categoryOrder: 0 },
    ] as FieldSpec[],
    sessionTemplates: [], defaultVisibility: 'public', defaultStatus: 'draft',
    defaultPolicies: {
      refundPolicy: 'no_refund',
      attendeeMinAge: 0,
      cancellationPolicy: 'Cancellations are handled by the organizer. Please contact the organizer for changes or refunds.',
    },
    requiresRegistration: false,
    defaultEntrySettings: {
      enableAttendanceManagement: false,
      scannerType: 'none',
      allowMultipleScans: false,
      requireSpecificTime: false,
    },
    allowsSubEvents: true,
    maxSubEventDepth: 1,
    layout: undefined,
  });

  // Load existing template — default templates cannot use /edit (redirect to view-only route)
  useEffect(() => {
    if (!templateId) return;
    templateApi.getById(templateId).then((res) => {
      if (!readOnly && res.data.isDefault) {
        navigate(`/templates/${templateId}`, { replace: true });
        return;
      }
      const rawFields = (res.data.fields || []) as FieldSpec[];
      const safeFields = rawFields.filter(f => f.form !== 'Registration');
      const mergedFields = mergeSystemFields(safeFields);
      
      const regFieldsFromApi = (res.data.defaultRegistrationFields || []).map(f => ({
          ...f, section: 'custom', form: 'Registration', formOrder: 2
      })) as FieldSpec[];
      const combinedFields = [...mergedFields, ...regFieldsFromApi];

      const derivedLayout = ensurePoliciesCategory(res.data.layout ?? deriveLayoutFromFields(combinedFields));
      setForm({ ...res.data, fields: combinedFields, layout: derivedLayout });
    }).catch((e) => setLoadError(e.message));
  }, [templateId, readOnly, navigate]);

  const upd = (patch: Partial<ApiTemplate>) => setForm((p) => ({ ...p, ...patch }));

  const fields = useMemo(
    () => mergeSystemFields((form.fields || []) as FieldSpec[]),
    [form.fields]
  );
  const layout: TemplateLayout = useMemo(
    () => ensurePoliciesCategory(form.layout ?? deriveLayoutFromFields(fields)),
    [form.layout, fields]
  );

  const [tagInput, setTagInput] = useState('');
  const addTag = () => {
    if (!tagInput.trim()) return;
    upd({ tags: [...(form.tags || []), tagInput.trim()] });
    setTagInput('');
  };
  const removeTag = (i: number) => upd({ tags: (form.tags || []).filter((_, j) => j !== i) });

  const handleSave = async () => {
    if (viewOnly) return;
    if (!form.name?.trim()) { setSaveError('Template name is required.'); return; }
    setSaving(true); setSaveError(null);
    try {
      const policyDefaults = {
        refundPolicy: fields.find((f) => f.key === 'refundPolicy')?.defaultValue || form.defaultPolicies?.refundPolicy || 'no_refund',
        cancellationPolicy: fields.find((f) => f.key === 'cancellationPolicy')?.defaultValue || form.defaultPolicies?.cancellationPolicy || '',
        attendeeMinAge: Number(fields.find((f) => f.key === 'attendeeMinAge')?.defaultValue ?? form.defaultPolicies?.attendeeMinAge ?? 0),
      };

      const normalFields = fields.filter(f => f.form !== 'Registration');
      const regFields = fields.filter(f => f.form === 'Registration').map(f => ({
         key: f.key, label: f.label, fieldType: f.fieldType as any, required: !!f.required,
         options: f.options, category: f.category, categoryOrder: f.categoryOrder, order: f.order
      }));

      const payload = { 
        ...form, 
        defaultPolicies: policyDefaults,
        fields: normalFields,
        defaultRegistrationFields: regFields 
      };
      
      if (isEdit) {
        await templateApi.update(templateId!, payload);
      } else {
        await templateApi.create(payload);
      }
      navigate('/templates');
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return (
    <div className="p-8 text-center text-red-600">
      <p className="font-semibold">Failed to load template</p>
      <p className="text-sm mt-1">{loadError}</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/templates')} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEdit ? (viewOnly ? `View: ${form.name || 'Template'}` : `Edit: ${form.name || 'Template'}`) : 'Create New Template'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {isEdit ? `v${form.version ?? 1}${form.isDefault ? ' · Default template' : ''}` : 'Define fields and session structure for this event type'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/templates')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
            {viewOnly ? 'Back' : 'Cancel'}
          </button>
          {!viewOnly && (
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
              {saving && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Template'}
            </button>
          )}
        </div>
      </div>

      {saveError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
          </svg>
          {saveError}
        </div>
      )}

      {viewOnly && (
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          View only. Default templates cannot be edited — duplicate from the list to create a customizable copy.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t}
            {t === 'Fields' && form.fields && form.fields.length > 0 && (
              <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{form.fields.length}</span>
            )}
            {t === 'Session Templates' && form.sessionTemplates && form.sessionTemplates.length > 0 && (
              <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{form.sessionTemplates.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Basic Info ── */}
      {tab === 'Basic Info' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={lbl}>Template Name <span className="text-red-500">*</span></label>
              <input type="text" className={inp(!form.name?.trim())} value={form.name || ''} maxLength={100}
                disabled={viewOnly} placeholder="e.g. Tech Conference 2026"
                onChange={(e) => upd({ name: e.target.value })} />
            </div>

            <div className="md:col-span-2">
              <label className={lbl}>Description</label>
              <textarea rows={3} className={inp()} value={form.description || ''} maxLength={500}
                disabled={viewOnly}
                placeholder="Describe what this template is best suited for..."
                onChange={(e) => upd({ description: e.target.value })} />
              <p className="text-xs text-gray-400 mt-1 text-right">{(form.description || '').length}/500</p>
            </div>

            <div>
              <label className={lbl}>Event Type</label>
              <select className={inp()} value={form.eventType || 'other'} disabled={viewOnly}
                onChange={(e) => upd({ eventType: e.target.value })}>
                {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className={lbl}>Default Format</label>
              <select className={inp()} value={form.format || 'physical'} disabled={viewOnly}
                onChange={(e) => upd({ format: e.target.value as ApiTemplate['format'] })}>
                <option value="physical">Physical (in-person)</option>
                <option value="virtual">Virtual (online)</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className={lbl}>Default Pricing</label>
              <div className="flex gap-2">
                {[{ v: true, l: 'Free' }, { v: false, l: 'Paid' }].map(({ v, l }) => (
                  <button key={l} type="button" onClick={() => upd({ isFree: v })} disabled={viewOnly}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                      form.isFree === v
                        ? v ? 'bg-green-50 border-green-500 text-green-700' : 'bg-orange-50 border-orange-500 text-orange-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}>{l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={lbl}>Requires Registration?</label>
              <div className="flex items-center mt-2">
                <input type="checkbox" id="requiresRegistration" className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                  checked={form.requiresRegistration || false} disabled={viewOnly || !form.isFree} 
                  onChange={(e) => upd({ requiresRegistration: e.target.checked })} />
                <label htmlFor="requiresRegistration" className="ml-2 text-sm text-gray-700 font-medium">Require attendees to register</label>
              </div>
              {!form.isFree && <p className="text-xs text-gray-500 mt-1">Paid events always require registration.</p>}
            </div>

            <div>
              <label className={lbl}>Default Currency</label>
              <select className={inp()} value={form.defaultCurrency || 'USD'} disabled={viewOnly || form.isFree}
                onChange={(e) => upd({ defaultCurrency: e.target.value })}>
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            {!form.isFree && (
              <div className="md:col-span-2">
                <label className={lbl}>Default Ticketing Tiers</label>
                <p className="text-xs text-gray-500 mb-2">Configure default ticketing tiers for this template. Use a price of 0 for free tiers.</p>
                <div className="space-y-3">
                  {(form.defaultTicketingTiers || []).map((tier, i) => (
                    <div key={i} className="flex gap-2 items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <input type="text" className={inp()} placeholder="Tier Name" value={tier.name || ''} disabled={viewOnly}
                        onChange={(e) => { const newTiers = [...(form.defaultTicketingTiers || [])]; newTiers[i].name = e.target.value; upd({ defaultTicketingTiers: newTiers }); }} />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{form.defaultCurrency === 'INR' ? '₹' : form.defaultCurrency === 'EUR' ? '€' : form.defaultCurrency === 'GBP' ? '£' : '$'}</span>
                        <input type="number" min="0" step="1" className={`${inp()} pl-7 w-24`} placeholder="Price" value={tier.price === 0 ? 0 : (tier.price || '')} disabled={viewOnly}
                          onChange={(e) => { const newTiers = [...(form.defaultTicketingTiers || [])]; newTiers[i].price = Number(e.target.value); upd({ defaultTicketingTiers: newTiers }); }} />
                      </div>
                      <input type="number" min="1" className={`${inp()} w-32`} placeholder="Capacity" value={tier.capacity || ''} disabled={viewOnly}
                        onChange={(e) => { const newTiers = [...(form.defaultTicketingTiers || [])]; newTiers[i].capacity = Number(e.target.value); upd({ defaultTicketingTiers: newTiers }); }} />
                      {!viewOnly && (
                        <button type="button" onClick={() => { const newTiers = [...(form.defaultTicketingTiers || [])]; newTiers.splice(i, 1); upd({ defaultTicketingTiers: newTiers }); }} className="p-2 text-red-500 hover:text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition ml-auto">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {!viewOnly && (
                    <button type="button" onClick={() => upd({ defaultTicketingTiers: [...(form.defaultTicketingTiers || []), { name: '', price: 0, capacity: 100 }] })} className="px-4 py-2 border border-blue-200 text-blue-600 bg-white rounded-lg text-sm font-medium hover:bg-blue-50 hover:border-blue-300 transition">
                      + Add Tier
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="md:col-span-2 border-t border-gray-100 pt-5 mt-2">
              <label className="block text-sm font-bold text-gray-800 mb-3">Entry & Attendance Settings</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center mb-1">
                    <input type="checkbox" id="enableAttendance" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                      checked={form.defaultEntrySettings?.enableAttendanceManagement || false} disabled={viewOnly}
                      onChange={(e) => upd({ defaultEntrySettings: { ...form.defaultEntrySettings, enableAttendanceManagement: e.target.checked, scannerType: form.defaultEntrySettings?.scannerType || 'none', allowMultipleScans: form.defaultEntrySettings?.allowMultipleScans || false, requireSpecificTime: form.defaultEntrySettings?.requireSpecificTime || false } })} />
                    <label htmlFor="enableAttendance" className="ml-2 text-sm text-gray-700 font-medium">Enable Attendance Tracking</label>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">Track check-ins and check-outs for attendees.</p>
                </div>

                <div>
                  <label className={lbl}>Scanner Type</label>
                  <select className={inp()} disabled={viewOnly || !form.defaultEntrySettings?.enableAttendanceManagement}
                    value={form.defaultEntrySettings?.scannerType || 'none'}
                    onChange={(e) => upd({ defaultEntrySettings: { ...form.defaultEntrySettings, enableAttendanceManagement: form.defaultEntrySettings?.enableAttendanceManagement || false, allowMultipleScans: form.defaultEntrySettings?.allowMultipleScans || false, requireSpecificTime: form.defaultEntrySettings?.requireSpecificTime || false, scannerType: e.target.value as 'none'|'qr' } })}>
                    <option value="none">Manual Check-in Only</option>
                    <option value="qr">QR Code Scanner (Tickets)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 border-t border-gray-100 pt-5 mt-2">
              <label className={lbl}>Default Visibility</label>
              <select className={inp()} value={form.defaultVisibility || 'public'} disabled={viewOnly}
                onChange={(e) => upd({ defaultVisibility: e.target.value })}>
                <option value="public">Public — Anyone can find and join</option>
                <option value="hidden_link">Link Only — Only people with the link can access</option>
                <option value="hidden_authenticated">Invite Only — Private, requires invitation</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">The default selected visibility when an organizer uses this template.</p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={lbl}>Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.tags || []).map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-100">
                  {tag}
                  <button type="button" onClick={() => removeTag(i)} disabled={viewOnly} className="text-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:pointer-events-none">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" className={`${inp()} flex-1`} value={tagInput} placeholder="Add tag..."
                disabled={viewOnly}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}} />
              <button type="button" onClick={addTag} disabled={!tagInput.trim() || viewOnly}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition disabled:opacity-40">
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Fields ── */}
      {tab === 'Fields' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Event Fields</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Define which fields appear in the event creation form when this template is selected.
                The <span className="font-semibold text-indigo-600">Registration</span> tab controls what info is collected from attendees.
              </p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 font-medium">
              {(form.fields || []).filter(f => (f as FieldSpec & { form?: string }).form !== 'Registration').length} event fields
            </span>
          </div>
          <FieldBuilder
            fields={fields}
            layout={layout}
            onLayoutChange={(nextLayout) => upd({ layout: nextLayout })}
            onChange={(nextFields) => upd({ fields: nextFields as ApiTemplate['fields'] })}
            systemFieldKeys={SYSTEM_FIELD_KEYS}
            extraCategoryContent={undefined}
            readOnly={viewOnly}
          />
        </div>
      )}

      {/* ── Tab: Session Templates ── */}
      {tab === 'Session Templates' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Session Templates</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Pre-define session types and their fields. Organizers can pick from these when building their agenda.
              </p>
            </div>
          </div>
          <SessionTemplateBuilder
            sessions={(form.sessionTemplates || []) as SessionTemplate[]}
            onChange={(sessions) => upd({ sessionTemplates: sessions as ApiTemplate['sessionTemplates'] })}
            readOnly={viewOnly}
          />
        </div>
      )}

    </div>
  );
};
