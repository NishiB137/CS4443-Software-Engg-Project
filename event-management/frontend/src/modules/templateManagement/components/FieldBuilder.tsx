import React, { useState } from 'react';
import type { FieldSpec, FieldType, FieldSection } from '@/services/api';

const FIELD_TYPES: { value: FieldType; label: string; hint: string }[] = [
  { value: 'text',        label: 'Short Text',   hint: 'Single-line input' },
  { value: 'textarea',    label: 'Long Text',    hint: 'Multi-line textarea' },
  { value: 'number',      label: 'Number',       hint: 'Numeric input with optional min/max' },
  { value: 'date',        label: 'Date',         hint: 'Date picker' },
  { value: 'time',        label: 'Time',         hint: 'Time picker' },
  { value: 'datetime',    label: 'Date & Time',  hint: 'Combined date/time' },
  { value: 'select',      label: 'Dropdown',     hint: 'Single choice from options' },
  { value: 'multiselect', label: 'Multi-select', hint: 'Multiple choices from options' },
  { value: 'toggle',      label: 'Toggle',       hint: 'Boolean on/off' },
  { value: 'url',         label: 'URL',          hint: 'Web link input' },
  { value: 'email',       label: 'Email',        hint: 'Email address' },
  { value: 'phone',       label: 'Phone',        hint: 'Phone number' },
];

const SECTIONS: { value: FieldSection; label: string }[] = [
  { value: 'basics',   label: 'Basic Info' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'venue',    label: 'Venue' },
  { value: 'capacity', label: 'Capacity' },
  { value: 'policies', label: 'Policies' },
  { value: 'media',    label: 'Media' },
  { value: 'custom',   label: 'Custom' },
];

const inp = (err?: boolean) =>
  `w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:outline-none transition bg-white
   ${err ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`;

const lbl = 'block text-xs font-medium text-gray-600 mb-1';

const EMPTY_FIELD: FieldSpec = {
  key: '', label: '', fieldType: 'text', required: false,
  section: 'custom', order: 0,
};

/** Stable internal keys for new fields — not shown in the UI. */
function nextCustomFieldKey(fields: FieldSpec[]): string {
  let max = 0;
  const re = /^customField(\d+)$/i;
  for (const f of fields) {
    const m = (f.key ?? '').match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `customField${max + 1}`;
}

interface FieldRowProps {
  field: FieldSpec;
  index: number;
  onUpdate: (f: FieldSpec) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSystemField: boolean;
  readOnly?: boolean;
}

const FieldRow: React.FC<FieldRowProps> = ({
  field, index, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast, isSystemField, readOnly,
}) => {
  const lockKey = readOnly || isSystemField;
  const [expanded, setExpanded] = useState(false);
  const [optionInput, setOptionInput] = useState('');
  const needsOptions = field.fieldType === 'select' || field.fieldType === 'multiselect';

  const upd = (patch: Partial<FieldSpec>) => onUpdate({ ...field, ...patch });

  const addOption = () => {
    if (!optionInput.trim()) return;
    upd({ options: [...(field.options || []), optionInput.trim()] });
    setOptionInput('');
  };

  const removeOption = (i: number) =>
    upd({ options: (field.options || []).filter((_, j) => j !== i) });

  return (
    <div className={`border rounded-xl overflow-hidden ${isSystemField ? 'bg-slate-50 border-slate-200' : 'bg-white border-gray-200'}`}>
      {/* Row header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Reorder */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <button type="button" onClick={onMoveUp}  disabled={readOnly || isFirst}  className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>
          </button>
          <button type="button" onClick={onMoveDown} disabled={readOnly || isLast}  className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
          </button>
        </div>

        <span className="text-xs font-medium text-gray-500 w-6 flex-shrink-0 text-center tabular-nums">{index + 1}</span>

        {/* Label only — keys are assigned automatically */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Field label *"
            className={`${inp()} text-sm`}
            value={field.label}
            disabled={readOnly}
            onChange={(e) => upd({ label: e.target.value })}
          />
        </div>

        {/* Type badge */}
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium flex-shrink-0 hidden sm:block">
          {FIELD_TYPES.find((t) => t.value === field.fieldType)?.label ?? field.fieldType}
        </span>

        {/* Required toggle */}
        <button
          type="button"
          onClick={() => upd({ required: !field.required })}
          disabled={readOnly}
          className={`text-xs px-2 py-0.5 rounded-full font-medium border transition flex-shrink-0 ${
            field.required
              ? 'bg-red-50 border-red-300 text-red-600'
              : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'
          }`}
        >
          {field.required ? 'Required' : 'Optional'}
        </button>

        {/* Expand */}
        <button type="button" onClick={() => setExpanded((v) => !v)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {/* Remove */}
        {!isSystemField && !readOnly && (
          <button type="button" onClick={onRemove} className="text-red-300 hover:text-red-500 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded options */}
      {expanded && (
        <div className="border-t border-gray-100 p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className={lbl}>Field Type</label>
            <select className={inp()} value={field.fieldType} disabled={lockKey}
              onChange={(e) => upd({ fieldType: e.target.value as FieldType, options: [] })}>
              {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label} — {t.hint}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>Section</label>
            <select className={inp()} value={field.section} disabled={lockKey}
              onChange={(e) => upd({ section: e.target.value as FieldSection })}>
              {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>Placeholder</label>
            <input type="text" className={inp()} value={field.placeholder || ''} placeholder="Hint text inside input"
              disabled={readOnly}
              onChange={(e) => upd({ placeholder: e.target.value })} />
          </div>

          <div>
            <label className={lbl}>Default Value</label>
            <input type="text" className={inp()} value={field.defaultValue || ''} placeholder="Pre-filled value"
              disabled={readOnly}
              onChange={(e) => upd({ defaultValue: e.target.value })} />
          </div>

          <div>
            <label className={lbl}>Help Text</label>
            <input type="text" className={inp()} value={field.helpText || ''} placeholder="Helper text below field"
              disabled={readOnly}
              onChange={(e) => upd({ helpText: e.target.value })} />
          </div>

          {(field.fieldType === 'text' || field.fieldType === 'textarea') && (
            <div>
              <label className={lbl}>Max Length</label>
              <input type="number" className={inp()} value={field.maxLength || ''} min={1} max={50000} placeholder="e.g. 300"
                disabled={readOnly}
                onChange={(e) => upd({ maxLength: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
          )}

          {field.fieldType === 'number' && (
            <>
              <div>
                <label className={lbl}>Min Value</label>
                <input type="number" className={inp()} value={field.min ?? ''} placeholder="Minimum"
                  disabled={readOnly}
                  onChange={(e) => upd({ min: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
              <div>
                <label className={lbl}>Max Value</label>
                <input type="number" className={inp()} value={field.max ?? ''} placeholder="Maximum"
                  disabled={readOnly}
                  onChange={(e) => upd({ max: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </>
          )}

          {needsOptions && (
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={lbl}>Options</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(field.options || []).map((opt, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200">
                    {opt}
                    <button type="button" onClick={() => removeOption(i)} disabled={readOnly} className="text-blue-400 hover:text-blue-600 ml-1 disabled:opacity-40">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" className={`${inp()} flex-1`} value={optionInput} placeholder="Add option..."
                  disabled={readOnly}
                  onChange={(e) => setOptionInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }} />
                <button type="button" onClick={addOption} disabled={!optionInput.trim() || readOnly}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-40 hover:bg-blue-700 transition">
                  Add
                </button>
              </div>
            </div>
          )}

          {isSystemField && !readOnly && (
            <div className="sm:col-span-2 lg:col-span-3">
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                This is a system field. Type and section are locked; you can still edit the label, placeholder, and help text.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── FieldBuilder (the full section) ─────────────────────────────────────────

interface FieldBuilderProps {
  fields: FieldSpec[];
  onChange: (fields: FieldSpec[]) => void;
  systemFieldKeys?: string[];   // keys that are locked
  readOnly?: boolean;
}

export const FieldBuilder: React.FC<FieldBuilderProps> = ({ fields, onChange, systemFieldKeys = [], readOnly }) => {
  const add = () => {
    const newField: FieldSpec = {
      ...EMPTY_FIELD,
      key:   nextCustomFieldKey(fields),
      order: fields.length,
    };
    onChange([...fields, newField]);
  };

  const update = (idx: number, f: FieldSpec) => {
    const next = [...fields];
    next[idx] = f;
    onChange(next);
  };

  const remove = (idx: number) => onChange(fields.filter((_, i) => i !== idx));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...fields];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next.map((f, i) => ({ ...f, order: i })));
  };

  const moveDown = (idx: number) => {
    if (idx === fields.length - 1) return;
    const next = [...fields];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next.map((f, i) => ({ ...f, order: i })));
  };

  // Group by section for display
  const sections = SECTIONS.filter((s) => fields.some((f) => f.section === s.value));

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-400 mb-3">No fields defined yet</p>
          {!readOnly && (
            <button type="button" onClick={add}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
              + Add First Field
            </button>
          )}
        </div>
      ) : (
        <>
          {/* All fields flat list */}
          <div className="space-y-2">
            {fields.map((field, idx) => (
              <FieldRow
                key={`${field.key}-${idx}`}
                field={field}
                index={idx}
                onUpdate={(f) => update(idx, f)}
                onRemove={() => remove(idx)}
                onMoveUp={() => moveUp(idx)}
                onMoveDown={() => moveDown(idx)}
                isFirst={idx === 0}
                isLast={idx === fields.length - 1}
                isSystemField={systemFieldKeys.includes(field.key)}
                readOnly={readOnly}
              />
            ))}
          </div>

          {!readOnly && (
            <button type="button" onClick={add}
              className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition font-medium">
              + Add Custom Field
            </button>
          )}
        </>
      )}

      {/* Section summary */}
      {fields.length > 0 && sections.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">Sections:</span>
          {sections.map((s) => (
            <span key={s.value} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {s.label} ({fields.filter((f) => f.section === s.value).length})
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
