import React, { useMemo, useState } from 'react';
import type { FieldSpec, FieldType, FieldSection, TemplateLayout } from '@/services/api';
import { withDefaultLayout } from '@/shared/template/systemFields';

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
  isNew?: boolean;
  readOnly?: boolean;
}

const FieldRow: React.FC<FieldRowProps> = ({
  field, index, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast, isSystemField, isNew, readOnly,
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
    <div className={`border rounded-xl overflow-hidden ${
      isSystemField ? 'bg-slate-50 border-slate-200' : isNew ? 'bg-white border-blue-200 ring-1 ring-blue-100' : 'bg-white border-gray-200'
    }`}>
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

        {/* Section badge */}
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium flex-shrink-0 hidden md:block">
          {SECTIONS.find((s) => s.value === field.section)?.label ?? field.section}
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
  layout?: TemplateLayout;
  onLayoutChange?: (layout: TemplateLayout) => void;
  extraFormContent?: Record<string, React.ReactNode>;
  extraCategoryContent?: Record<string, React.ReactNode>; // key: `${form}::${category}`
  systemFieldKeys?: string[];   // keys that are locked
  readOnly?: boolean;
}

export const FieldBuilder: React.FC<FieldBuilderProps> = ({ fields, onChange, layout, onLayoutChange, extraFormContent, extraCategoryContent, systemFieldKeys = [], readOnly }) => {
  const [newKeys, setNewKeys] = useState<Record<string, true>>({});
  const [activeForm, setActiveForm] = useState<string>(''); // set lazily from computed forms
  const [collapsedCats, setCollapsedCats] = useState<Record<string, true>>({});

  const [nameDialog, setNameDialog] = useState<{
    open: boolean;
    title: string;
    initial: string;
    onSubmit?: (value: string) => void;
  }>({ open: false, title: '', initial: '' });

  const openNameDialog = (title: string, initial: string, onSubmit: (value: string) => void) =>
    setNameDialog({ open: true, title, initial, onSubmit });

  const normalized = useMemo(() => fields.map(withDefaultLayout), [fields]);

  const computedLayout = useMemo<TemplateLayout>(() => {
    const fromLayout = layout?.forms ? { forms: layout.forms.slice() } : { forms: [] as TemplateLayout['forms'] };

    // Ensure any form/category referenced by fields exists in layout
    const ensureForm = (name: string, order = 0) => {
      if (!fromLayout.forms.some((f) => f.name === name)) {
        fromLayout.forms.push({ name, order, categories: [] });
      }
    };
    const ensureCategory = (formName: string, catName: string, order = 0) => {
      const form = fromLayout.forms.find((f) => f.name === formName);
      if (!form) return;
      if (!form.categories.some((c) => c.name === catName)) form.categories.push({ name: catName, order });
    };

    for (const f of normalized) {
      const formName = f.form ?? 'Basic Info';
      const catName  = f.category ?? 'General';
      ensureForm(formName, f.formOrder ?? 0);
      ensureCategory(formName, catName, f.categoryOrder ?? 0);
    }

    // Ensure extraFormContent forms exist (for empty containers like Policies)
    if (extraFormContent) {
      for (const name of Object.keys(extraFormContent)) ensureForm(name, 999);
    }
    if (extraCategoryContent) {
      for (const key of Object.keys(extraCategoryContent)) {
        const [formName, catName] = key.split('::');
        if (!formName || !catName) continue;
        ensureForm(formName, 999);
        ensureCategory(formName, catName, 999);
      }
    }

    // Sort
    fromLayout.forms = fromLayout.forms
      .map((f) => ({
        ...f,
        categories: (f.categories ?? []).slice().sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

    return fromLayout;
  }, [layout, normalized, extraFormContent, extraCategoryContent]);

  const forms = computedLayout.forms;

  const categoriesByForm = useMemo(() => {
    const out = new Map<string, Array<{ name: string; order: number }>>();
    for (const f of forms) out.set(f.name, f.categories ?? []);
    return out;
  }, [forms]);

  const ensureActiveForm = () => {
    if (activeForm && forms.some((f) => f.name === activeForm)) return activeForm;
    const first = forms[0]?.name ?? 'Basic Info';
    setActiveForm(first);
    return first;
  };

  const updateFieldAt = (idx: number, f: FieldSpec) => {
    const next = [...fields];
    next[idx] = f;
    onChange(next);
  };

  const removeAt = (idx: number) => onChange(fields.filter((_, i) => i !== idx));

  const reorderWithinGroup = (form: string, category: string, fromIdx: number, toIdx: number) => {
    const group = fields
      .map(withDefaultLayout)
      .map((f, idx) => ({ f, idx }))
      .filter(({ f }) => (f.form ?? 'Basic Info') === form && (f.category ?? 'General') === category)
      .sort((a, b) => (a.f.order ?? 0) - (b.f.order ?? 0));

    const from = group[fromIdx];
    const to = group[toIdx];
    if (!from || !to) return;

    const next = [...fields];
    const tmpOrder = next[from.idx].order;
    next[from.idx] = { ...next[from.idx], order: next[to.idx].order };
    next[to.idx]   = { ...next[to.idx],   order: tmpOrder };
    onChange(next);
  };

  const setLayout = (next: TemplateLayout) => {
    onLayoutChange?.(next);
  };

  const reorderForms = (from: number, to: number) => {
    if (!onLayoutChange) return;
    const nextForms = forms.slice();
    const [moved] = nextForms.splice(from, 1);
    nextForms.splice(to, 0, moved);
    const normalizedForms = nextForms.map((f, idx) => ({ ...f, order: idx }));
    setLayout({ forms: normalizedForms });
  };

  const reorderCategories = (formName: string, from: number, to: number) => {
    if (!onLayoutChange) return;
    const nextForms = forms.map((f) => ({ ...f, categories: (f.categories ?? []).slice() }));
    const form = nextForms.find((f) => f.name === formName);
    if (!form) return;
    const cats = form.categories ?? [];
    const [moved] = cats.splice(from, 1);
    cats.splice(to, 0, moved);
    form.categories = cats.map((c, idx) => ({ ...c, order: idx }));
    setLayout({ forms: nextForms.map((f, idx) => ({ ...f, order: idx })) });
  };

  const addForm = () => {
    if (!onLayoutChange) return;
    openNameDialog('New form', '', (value) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      if (forms.some((f) => f.name === trimmed)) return;
      const next = { forms: [...forms, { name: trimmed, order: forms.length, categories: [] }] };
      setLayout(next);
      setActiveForm(trimmed);
    });
  };

  const renameForm = (oldName: string) => {
    if (!onLayoutChange) return;
    openNameDialog('Rename form', oldName, (value) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      if (trimmed === oldName) return;
      if (forms.some((f) => f.name === trimmed)) return;
      const nextForms = forms.map((f) => (f.name === oldName ? { ...f, name: trimmed } : f));
      setLayout({ forms: nextForms });
      onChange(fields.map((f) => ((withDefaultLayout(f).form ?? 'Basic Info') === oldName ? { ...f, form: trimmed } : f)));
      if (activeForm === oldName) setActiveForm(trimmed);
    });
  };

  const addCategory = (formName: string) => {
    if (!onLayoutChange) return;
    openNameDialog('New category', '', (value) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const nextForms = forms.map((f) => {
        if (f.name !== formName) return f;
        const cats = (f.categories ?? []).slice();
        if (cats.some((c) => c.name === trimmed)) return f;
        cats.push({ name: trimmed, order: cats.length });
        return { ...f, categories: cats };
      });
      setLayout({ forms: nextForms });
    });
  };

  const renameCategory = (formName: string, oldCat: string) => {
    if (!onLayoutChange) return;
    openNameDialog('Rename category', oldCat, (value) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      if (trimmed === oldCat) return;
      const nextForms = forms.map((f) => {
        if (f.name !== formName) return f;
        if ((f.categories ?? []).some((c) => c.name === trimmed)) return f;
        return {
          ...f,
          categories: (f.categories ?? []).map((c) => (c.name === oldCat ? { ...c, name: trimmed } : c)),
        };
      });
      setLayout({ forms: nextForms });
      onChange(fields.map((f) => {
        const nf = withDefaultLayout(f);
        if ((nf.form ?? 'Basic Info') === formName && (nf.category ?? 'General') === oldCat) return { ...f, category: trimmed };
        return f;
      }));
    });
  };

  const moveCategoryToForm = (fromForm: string, categoryName: string, toForm: string) => {
    if (!onLayoutChange) return;
    if (fromForm === toForm) return;

    const nextForms = forms.map((f) => ({ ...f, categories: (f.categories ?? []).slice() }));
    const from = nextForms.find((f) => f.name === fromForm);
    const to = nextForms.find((f) => f.name === toForm);
    if (!from || !to) return;

    const cat = (from.categories ?? []).find((c) => c.name === categoryName);
    from.categories = (from.categories ?? []).filter((c) => c.name !== categoryName).map((c, idx) => ({ ...c, order: idx }));
    if (cat && !(to.categories ?? []).some((c) => c.name === categoryName)) {
      (to.categories ?? []).push({ ...cat, order: (to.categories ?? []).length });
      to.categories = (to.categories ?? []).map((c, idx) => ({ ...c, order: idx }));
    }
    setLayout({ forms: nextForms.map((f, idx) => ({ ...f, order: idx })) });

    // Update fields referencing fromForm/categoryName
    onChange(fields.map((f) => {
      const nf = withDefaultLayout(f);
      if ((nf.form ?? 'Basic Info') === fromForm && (nf.category ?? 'General') === categoryName) return { ...f, form: toForm };
      return f;
    }));
  };

  const add = () => {
    const newField: FieldSpec = withDefaultLayout({
      ...EMPTY_FIELD,
      key:   nextCustomFieldKey(fields),
      order: fields.length,
    });
    setNewKeys((p) => ({ ...p, [newField.key]: true }));
    onChange([...fields, newField]);
  };

  const addToCategory = (formName: string, categoryName: string) => {
    const existing = normalized.filter((f) => (f.form ?? 'Basic Info') === formName && (f.category ?? 'General') === categoryName);
    const maxOrder = existing.reduce((m, f) => Math.max(m, f.order ?? 0), 0);
    const newField: FieldSpec = withDefaultLayout({
      ...EMPTY_FIELD,
      key: nextCustomFieldKey(fields),
      order: maxOrder + 1,
      form: formName,
      category: categoryName,
      formOrder: forms.find((x) => x.name === formName)?.order ?? 0,
      categoryOrder: (categoriesByForm.get(formName)?.find((x) => x.name === categoryName)?.order) ?? 0,
    });
    setNewKeys((p) => ({ ...p, [newField.key]: true }));
    onChange([...fields, newField]);
  };

  return (
    <div className="space-y-4">
      {fields.length === 0 && forms.length === 0 ? (
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
          {/* Form tabs (draggable) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
              {forms.map((f, idx) => {
                const selected = ensureActiveForm() === f.name;
                return (
                  <div key={f.name} className="flex items-center gap-1">
                    <button
                      type="button"
                      draggable={!readOnly && !!onLayoutChange}
                      onDragStart={(e) => { if (!onLayoutChange) return; e.dataTransfer.setData('text/plain', String(idx)); }}
                      onDragOver={(e) => { if (!readOnly && onLayoutChange) e.preventDefault(); }}
                      onDrop={(e) => {
                        if (readOnly || !onLayoutChange) return;
                        e.preventDefault();
                        const from = Number(e.dataTransfer.getData('text/plain'));
                        if (!Number.isFinite(from)) return;
                        reorderForms(from, idx);
                      }}
                      onClick={() => setActiveForm(f.name)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                        selected ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                      title={!readOnly && onLayoutChange ? 'Drag to reorder' : undefined}
                    >
                      {f.name}
                    </button>
                    {!readOnly && onLayoutChange && selected && (
                      <button type="button" onClick={() => renameForm(f.name)} className="px-2 py-2 text-gray-400 hover:text-gray-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {!readOnly && !!onLayoutChange && (
              <button type="button" onClick={addForm} className="px-3 py-2 text-sm font-semibold border border-gray-300 rounded-xl hover:bg-gray-50">
                + Form
              </button>
            )}
          </div>

          {/* Active form content */}
          <div className="space-y-4">
            {extraFormContent?.[ensureActiveForm()] ?? null}

            {/* Categories */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Categories</p>
                <p className="text-xs text-gray-400">Reorder by dragging category cards</p>
              </div>
              {!readOnly && !!onLayoutChange && (
                <button type="button" onClick={() => addCategory(ensureActiveForm())} className="px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                  + Category
                </button>
              )}
            </div>

            <div className="space-y-3">
              {(categoriesByForm.get(ensureActiveForm()) ?? []).map((cat, catIdx) => {
                const group = normalized
                  .map((f, idx) => ({ f, idx }))
                  .filter(({ f }) => (f.form ?? 'Basic Info') === ensureActiveForm() && (f.category ?? 'General') === cat.name)
                  .sort((a, b) => (a.f.order ?? 0) - (b.f.order ?? 0));
                const catKey = `${ensureActiveForm()}::${cat.name}`;
                const collapsed = !!collapsedCats[catKey];
                const categoryExtra = extraCategoryContent?.[catKey];

                return (
                  <div
                    key={`${ensureActiveForm()}::${cat.name}`}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white"
                    draggable={!readOnly && !!onLayoutChange}
                    onDragStart={(e) => { if (!onLayoutChange) return; e.dataTransfer.setData('text/plain', String(catIdx)); }}
                    onDragOver={(e) => { if (!readOnly && onLayoutChange) e.preventDefault(); }}
                    onDrop={(e) => {
                      if (readOnly || !onLayoutChange) return;
                      e.preventDefault();
                      const from = Number(e.dataTransfer.getData('text/plain'));
                      if (!Number.isFinite(from)) return;
                      reorderCategories(ensureActiveForm(), from, catIdx);
                    }}
                    title={!readOnly && onLayoutChange ? 'Drag to reorder category' : undefined}
                  >
                    <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCollapsedCats((p) => ({ ...p, [catKey]: !p[catKey] }))}
                        className="text-gray-400 hover:text-gray-700"
                      >
                        <svg className={`w-4 h-4 transition-transform ${collapsed ? '-rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{cat.name}</p>
                        <p className="text-xs text-gray-400">Category</p>
                      </div>

                      {!readOnly && !!onLayoutChange && (
                        <>
                          <button type="button" onClick={() => renameCategory(ensureActiveForm(), cat.name)} className="px-2.5 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50">
                            Rename
                          </button>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400">Move</span>
                            <select
                              className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white"
                              value={ensureActiveForm()}
                              onChange={(e) => moveCategoryToForm(ensureActiveForm(), cat.name, e.target.value)}
                            >
                              {forms.map((f) => <option key={f.name} value={f.name}>{f.name}</option>)}
                            </select>
                          </div>
                          <button type="button" onClick={() => addToCategory(ensureActiveForm(), cat.name)} className="px-2.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            + Field
                          </button>
                        </>
                      )}
                    </div>

                    {!collapsed && (
                      <div className="p-3 space-y-2 bg-gray-50/30">
                        {categoryExtra ? (
                          <div className="mb-3">
                            {categoryExtra}
                          </div>
                        ) : null}

                        {group.map(({ f, idx }, i) => (
                          <div
                            key={`${f.key}-${idx}`}
                            draggable={!readOnly}
                            onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(i)); }}
                            onDragOver={(e) => { if (!readOnly) e.preventDefault(); }}
                            onDrop={(e) => {
                              if (readOnly) return;
                              e.preventDefault();
                              const from = Number(e.dataTransfer.getData('text/plain'));
                              if (!Number.isFinite(from)) return;
                              const to = i;
                              if (from === to) return;

                              const groupItems = fields
                                .map(withDefaultLayout)
                                .map((ff, fidx) => ({ ff, fidx }))
                                .filter(({ ff }) => (ff.form ?? 'Basic Info') === ensureActiveForm() && (ff.category ?? 'General') === cat.name)
                                .sort((a, b) => (a.ff.order ?? 0) - (b.ff.order ?? 0));

                              const reordered = groupItems.slice();
                              const [moved] = reordered.splice(from, 1);
                              reordered.splice(to, 0, moved);

                              const next = [...fields];
                              reordered.forEach((it, newOrder) => {
                                next[it.fidx] = { ...next[it.fidx], order: newOrder };
                              });
                              onChange(next);
                            }}
                            title={readOnly ? undefined : 'Drag to reorder'}
                          >
                            <FieldRow
                              field={f}
                              index={i}
                              onUpdate={(nf) => updateFieldAt(idx, nf)}
                              onRemove={() => removeAt(idx)}
                              onMoveUp={() => reorderWithinGroup(ensureActiveForm(), cat.name, i, i - 1)}
                              onMoveDown={() => reorderWithinGroup(ensureActiveForm(), cat.name, i, i + 1)}
                              isFirst={i === 0}
                              isLast={i === group.length - 1}
                              isSystemField={systemFieldKeys.includes(f.key)}
                              isNew={!!newKeys[f.key]}
                              readOnly={readOnly}
                            />
                          </div>
                        ))}
                        {group.length === 0 && !categoryExtra && (
                          <p className="text-xs text-gray-400 px-1">No fields in this category yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Removed "+ Add Custom Field" */}
        </>
      )}

      {nameDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-1">{nameDialog.title}</h3>
            <p className="text-xs text-gray-500 mb-3">Enter a name</p>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none"
              defaultValue={nameDialog.initial}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (e.target as HTMLInputElement).value;
                  nameDialog.onSubmit?.(v);
                  setNameDialog({ open: false, title: '', initial: '' });
                }
                if (e.key === 'Escape') setNameDialog({ open: false, title: '', initial: '' });
              }}
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setNameDialog({ open: false, title: '', initial: '' })}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.activeElement?.tagName === 'INPUT'
                    ? (document.activeElement as HTMLInputElement).value
                    : nameDialog.initial;
                  nameDialog.onSubmit?.(input);
                  setNameDialog({ open: false, title: '', initial: '' });
                }}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
