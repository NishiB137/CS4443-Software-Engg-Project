import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { WizardStepProps } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { templateApi } from '@/services/api';
import type { ApiTemplate } from '@/services/api';
import { EMPTY_SESSION } from '@/modules/eventCreation/microFrontends/eventWizard/interface';
import { mergeSystemFields } from '@/shared/template/systemFields';

// ─── Format badge ─────────────────────────────────────────────────────────────
const FormatBadge: React.FC<{ format: string; active: boolean }> = ({ format, active }) => {
  const base = 'text-xs px-2 py-0.5 rounded-full font-medium capitalize';
  if (!active) return <span className={`${base} bg-gray-100 text-gray-500`}>{format}</span>;
  const colours: Record<string, string> = {
    physical: 'bg-green-100 text-green-700',
    virtual:  'bg-purple-100 text-purple-700',
    hybrid:   'bg-blue-100 text-blue-700',
  };
  return <span className={`${base} ${colours[format] ?? 'bg-gray-100 text-gray-500'}`}>{format}</span>;
};

// ─── Single template card ─────────────────────────────────────────────────────
const TemplateCard: React.FC<{
  template: ApiTemplate;
  isSelected: boolean;
  onSelect: () => void;
  hasError: boolean;
}> = ({ template, isSelected, onSelect, hasError }) => (
  <div
    onClick={onSelect}
    className={`relative p-5 border rounded-xl cursor-pointer transition-all flex flex-col h-full ${
      isSelected
        ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/40 shadow-sm'
        : hasError
          ? 'border-red-200 hover:border-red-300 bg-white'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
    }`}
  >
    {/* Colour accent strip */}
    <div
      className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
      style={{ backgroundColor: template.coverColor || '#3B82F6' }}
    />

    <div className="mt-2 flex items-start justify-between gap-2 mb-2">
      <h3 className={`text-sm font-semibold leading-tight ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
        {template.name}
      </h3>
      {template.isDefault && (
        <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-medium flex-shrink-0">
          Default
        </span>
      )}
    </div>

    <p className="text-xs text-gray-500 mb-4 flex-grow leading-relaxed line-clamp-3">
      {template.description || 'No description.'}
    </p>

    <div className="flex items-center justify-between mt-auto">
      <div className="flex items-center gap-2 flex-wrap">
        <FormatBadge format={template.format} active={isSelected} />
        <span className="text-xs text-gray-400 capitalize">{template.eventType}</span>
      </div>
      {isSelected ? (
        <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Selected
        </span>
      ) : (
        <span className="text-xs text-gray-400">{template.fields.length} fields</span>
      )}
    </div>
  </div>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div className="border border-gray-200 rounded-xl p-5 animate-pulse bg-white">
    <div className="h-1 bg-gray-200 rounded-t-xl -mx-5 -mt-5 mb-4" />
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
    <div className="h-3 bg-gray-100 rounded w-full mb-1" />
    <div className="h-3 bg-gray-100 rounded w-2/3 mb-5" />
    <div className="flex items-center justify-between">
      <div className="h-4 bg-gray-100 rounded-full w-16" />
      <div className="h-3 bg-gray-100 rounded w-12" />
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const Step1Template: React.FC<WizardStepProps> = ({ data, updateData, errors }) => {
  const [templates, setTemplates]   = useState<ApiTemplate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    templateApi.list()
      .then((res) => setTemplates(res.data))
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (tpl: ApiTemplate) => {
    const mergedFields = mergeSystemFields(tpl.fields ?? []);

    // Build default values for template custom fields
    const customFieldDefaults = Object.fromEntries(
      mergedFields
        .filter((f) => f.section === 'custom')
        .map((f) => [f.key, f.defaultValue ?? ''])
    );

    updateData({
      template:   tpl._id,
      templateName: tpl.name,
      templateFields: mergedFields,
      sessionTemplates: (tpl.sessionTemplates ?? []).map((s) => ({
        title: s.title,
        sessionType: s.sessionType,
        defaultDurationMinutes: s.defaultDurationMinutes,
        description: s.description,
      })),
      // Prefill sessions list from session templates so the user can edit immediately in Step 4
      sessions: (tpl.sessionTemplates ?? []).map((s) => ({
        ...EMPTY_SESSION,
        title: s.title,
        description: s.description ?? '',
        sessionType: (s.sessionType as typeof EMPTY_SESSION.sessionType) ?? 'other',
      })),
      customFieldValues: customFieldDefaults,
      eventType:  tpl.eventType,
      format:     tpl.format as typeof data.format,
      isFree:     tpl.isFree,
      visibility: (tpl.defaultVisibility as typeof data.visibility) || 'public',
      // Pre-fill policies from template defaults
      policies: {
        refundPolicy:       (tpl.defaultPolicies?.refundPolicy as typeof data.policies.refundPolicy) || '',
        cancellationPolicy: tpl.defaultPolicies?.cancellationPolicy || '',
        attendeeMinAge:     String(tpl.defaultPolicies?.attendeeMinAge ?? 0),
      },
    });
    // Track usage
    templateApi.use(tpl._id).catch(() => {});
  };

  const systemTemplates = templates.filter((t) => t.isDefault);
  const customTemplates  = templates.filter((t) => !t.isDefault);

  const renderGrid = (list: ApiTemplate[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((tpl) => (
        <TemplateCard
          key={tpl._id}
          template={tpl}
          isSelected={data.template === tpl._id}
          onSelect={() => handleSelect(tpl)}
          hasError={!!errors?.['template']}
        />
      ))}
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Select Your Event Template</h2>
          <p className="text-gray-500 mt-1 text-sm">Choose a starting point — templates pre-fill fields and default settings</p>
        </div>
        <Link
          to="/templates"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-2 rounded-lg transition bg-white"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
          </svg>
          Manage Templates
        </Link>
      </div>

      {/* Fetch error */}
      {fetchError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
          </svg>
          Failed to load templates: {fetchError}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && !fetchError && (
        <>
          {/* System templates */}
          {systemTemplates.length > 0 && (
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">System Templates</h3>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              {renderGrid(systemTemplates)}
            </div>
          )}

          {/* Custom templates */}
          {customTemplates.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom Templates</h3>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              {renderGrid(customTemplates)}
            </div>
          )}

          {templates.length === 0 && (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 mb-3">No templates found. Start by creating one.</p>
              <Link to="/templates/new" className="text-sm font-medium text-blue-600 hover:underline">
                Create a template
              </Link>
            </div>
          )}
        </>
      )}

      {/* Validation error */}
      {errors?.['template'] && (
        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-red-600 font-medium">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
          </svg>
          {errors['template']}
        </div>
      )}
    </div>
  );
};
