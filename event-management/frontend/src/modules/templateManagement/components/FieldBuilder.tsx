import React, { useEffect, useMemo, useState } from 'react';
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
  isSystemField: boolean;
  isNew?: boolean;
  readOnly?: boolean;
  isSessionTemplate?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

const FieldRow: React.FC<FieldRowProps> = ({
  field, index, onUpdate, onRemove, isSystemField, isNew, readOnly, isSessionTemplate, dragHandleProps,
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
        {/* Drag handle */}
        <button
          type="button"
          {...dragHandleProps}
          className={`flex-shrink-0 rounded-lg p-1.5 border transition ${
            readOnly ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100 cursor-grab'
          }`}
          aria-label={readOnly ? 'Reorder disabled' : 'Drag to reorder'}
          title={readOnly ? undefined : 'Drag to reorder'}
          disabled={readOnly}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01" />
          </svg>
        </button>

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
        {(!isSystemField || isSessionTemplate) && !readOnly && (
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
  isSessionTemplate?: boolean;
}

export const FieldBuilder: React.FC<FieldBuilderProps> = ({ fields, onChange, layout, onLayoutChange, extraFormContent, extraCategoryContent, systemFieldKeys = [], readOnly, isSessionTemplate }) => {
  const [newKeys, setNewKeys] = useState<Record<string, true>>({});
  const [activeForm, setActiveForm] = useState<string>(''); // set lazily from computed forms
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});
  const [movePicker, setMovePicker] = useState<{ openFor: string | null }>({ openFor: null });

  // Track drag start/target for stable reordering (works even when clicking inputs).
  const [dragState, setDragState] = useState<{
    type: 'field' | 'category' | 'form' | null;
    fromForm?: string;
    fromCategory?: string;
    fromIndex?: number;
  }>({ type: null });

  const [nameDialog, setNameDialog] = useState<{
    open: boolean;
    title: string;
    initial: string;
    value: string;
    onSubmit?: (value: string) => void;
  }>({ open: false, title: '', initial: '', value: '' });

  const openNameDialog = (title: string, initial: string, onSubmit: (value: string) => void) =>
    setNameDialog({ open: true, title, initial, value: initial, onSubmit });

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

  const resolvedActiveForm = useMemo(() => {
    if (activeForm && forms.some((f) => f.name === activeForm)) return activeForm;
    return forms[0]?.name ?? 'Basic Info';
  }, [activeForm, forms]);

  useEffect(() => {
    // Avoid setState during render: keep active form in sync with layout changes.
    if (!activeForm || !forms.some((f) => f.name === activeForm)) {
      setActiveForm(forms[0]?.name ?? 'Basic Info');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forms.map((f) => f.name).join('|')]);

  useEffect(() => {
    const close = () => setMovePicker({ openFor: null });
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

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
    // Reassign sequential order for the whole group to avoid duplicates/gaps.
    const reordered = group.slice();
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    reordered.forEach((it, newOrder) => {
      next[it.idx] = { ...next[it.idx], order: newOrder };
    });
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

  const deleteForm = (formName: string) => {
    if (!onLayoutChange) return;
    const nextForms = forms.filter((f) => f.name !== formName).map((f, idx) => ({ ...f, order: idx }));
    setLayout({ forms: nextForms });
    onChange(fields.map((f) => {
      const nf = withDefaultLayout(f);
      if ((nf.form ?? 'Basic Info') === formName) return { ...f, form: 'Basic Info', category: 'General' };
      return f;
    }));
    if (activeForm === formName) setActiveForm('');
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

  const deleteCategory = (formName: string, catName: string) => {
    if (!onLayoutChange) return;
    const nextForms = forms.map((f) => ({ ...f, categories: (f.categories ?? []).slice() }));
    const form = nextForms.find((f) => f.name === formName);
    if (!form) return;

    form.categories = (form.categories ?? []).filter((c) => c.name !== catName).map((c, idx) => ({ ...c, order: idx }));
    setLayout({ forms: nextForms.map((f, idx) => ({ ...f, order: idx })) });

    // Move any fields in this category to General
    onChange(fields.map((f) => {
      const nf = withDefaultLayout(f);
      if ((nf.form ?? 'Basic Info') === formName && (nf.category ?? 'General') === catName) return { ...f, category: 'General' };
      return f;
    }));
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
                const selected = resolvedActiveForm === f.name;
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
                      <div className="flex gap-1 ml-1 border-l border-gray-200 pl-1">
                        <button type="button" onClick={() => renameForm(f.name)} className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-white" title="Rename form">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => deleteForm(f.name)} className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-white" title="Delete form">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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
            {extraFormContent?.[resolvedActiveForm] ?? null}

            {/* Categories */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Categories</p>
                <p className="text-xs text-gray-400">Reorder by dragging category cards</p>
              </div>
              {!readOnly && !!onLayoutChange && (
                <button type="button" onClick={() => addCategory(resolvedActiveForm)} className="px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                  + Category
                </button>
              )}
            </div>

            <div className="space-y-3">
              {(categoriesByForm.get(resolvedActiveForm) ?? []).map((cat, catIdx) => {
                const group = normalized
                  .map((f, idx) => ({ f, idx }))
                  .filter(({ f }) => (f.form ?? 'Basic Info') === resolvedActiveForm && (f.category ?? 'General') === cat.name)
                  .sort((a, b) => (a.f.order ?? 0) - (b.f.order ?? 0));
                const catKey = `${resolvedActiveForm}::${cat.name}`;
                const collapsed = !!collapsedCats[catKey];
                const categoryExtra = extraCategoryContent?.[catKey];

                return (
                  <div
                    key={`${resolvedActiveForm}::${cat.name}`}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white"
                    draggable={!readOnly && !!onLayoutChange}
                    onDragStart={(e) => { if (!onLayoutChange) return; e.dataTransfer.setData('text/plain', String(catIdx)); }}
                    onDragOver={(e) => { if (!readOnly && onLayoutChange) e.preventDefault(); }}
                    onDrop={(e) => {
                      if (readOnly || !onLayoutChange) return;
                      e.preventDefault();
                      const from = Number(e.dataTransfer.getData('text/plain'));
                      if (!Number.isFinite(from)) return;
                      reorderCategories(resolvedActiveForm, from, catIdx);
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
                          <button type="button" onClick={() => renameCategory(resolvedActiveForm, cat.name)} className="px-2.5 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50">
                            Rename
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMovePicker((p) => ({ openFor: p.openFor === catKey ? null : catKey }));
                              }}
                              className="px-2.5 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              Move
                            </button>
                            {movePicker.openFor === catKey && (
                              <div
                                className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                  <span>Move to form</span>
                                  <button type="button" onClick={() => { deleteCategory(resolvedActiveForm, cat.name); setMovePicker({ openFor: null }); }} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="p-1">
                                  {forms
                                    .filter((f) => f.name !== resolvedActiveForm)
                                    .map((f) => (
                                      <button
                                        key={f.name}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50"
                                        onClick={() => {
                                          moveCategoryToForm(resolvedActiveForm, cat.name, f.name);
                                          setMovePicker({ openFor: null });
                                        }}
                                      >
                                        {f.name}
                                      </button>
                                    ))}
                                  {forms.filter((f) => f.name !== resolvedActiveForm).length === 0 && (
                                    <div className="px-3 py-2 text-sm text-gray-400">No other forms</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <button type="button" onClick={() => addToCategory(resolvedActiveForm, cat.name)} className="px-2.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            + Field
                          </button>
                          <button type="button" onClick={() => deleteCategory(resolvedActiveForm, cat.name)} className="px-2.5 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 ml-auto transition" title="Delete Category">
                            Delete
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
                          >
                            <FieldRow
                              field={f}
                              index={i}
                              onUpdate={(nf) => updateFieldAt(idx, nf)}
                              onRemove={() => removeAt(idx)}
                              isSystemField={systemFieldKeys.includes(f.key)}
                              isNew={!!newKeys[f.key]}
                              readOnly={readOnly}
                              isSessionTemplate={isSessionTemplate}
                              dragHandleProps={{
                                draggable: !readOnly,
                                onDragStart: (e) => {
                                  if (readOnly) return;
                                  e.dataTransfer.setData('application/json', JSON.stringify({
                                    type: 'field',
                                    fromForm: resolvedActiveForm,
                                    fromCategory: cat.name,
                                    fromIndex: i,
                                  }));
                                  e.dataTransfer.effectAllowed = 'move';
                                  setDragState({ type: 'field', fromForm: resolvedActiveForm, fromCategory: cat.name, fromIndex: i });
                                },
                                onDragOver: (e) => {
                                  if (readOnly) return;
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'move';
                                },
                                onDrop: (e) => {
                                  if (readOnly) return;
                                  e.preventDefault();
                                  const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
                                  let payload: any = null;
                                  try { payload = JSON.parse(raw); } catch { payload = null; }
                                  const from = payload?.type === 'field' ? Number(payload.fromIndex) : dragState.type === 'field' ? (dragState.fromIndex ?? NaN) : NaN;
                                  const fromForm = payload?.fromForm ?? dragState.fromForm;
                                  const fromCategory = payload?.fromCategory ?? dragState.fromCategory;
                                  if (!Number.isFinite(from) || fromForm !== resolvedActiveForm || fromCategory !== cat.name) return;
                                  const to = i;
                                  if (from === to) return;
                                  reorderWithinGroup(resolvedActiveForm, cat.name, from, to);
                                  setDragState({ type: null });
                                },
                                onDragEnd: () => setDragState({ type: null }),
                              }}
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
              value={nameDialog.value}
              autoFocus
              onChange={(e) => setNameDialog((p) => ({ ...p, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  nameDialog.onSubmit?.(nameDialog.value);
                  setNameDialog({ open: false, title: '', initial: '', value: '' });
                }
                if (e.key === 'Escape') setNameDialog({ open: false, title: '', initial: '', value: '' });
              }}
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setNameDialog({ open: false, title: '', initial: '', value: '' })}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  nameDialog.onSubmit?.(nameDialog.value);
                  setNameDialog({ open: false, title: '', initial: '', value: '' });
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
