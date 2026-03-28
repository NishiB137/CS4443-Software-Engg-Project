import type { FieldSpec, TemplateLayout } from '@/services/api';
import { withDefaultLayout } from '@/shared/template/systemFields';

const uniq = <T>(arr: T[]) => Array.from(new Set(arr));

export function deriveLayoutFromFields(fields: FieldSpec[]): TemplateLayout {
  const normalized = fields.map(withDefaultLayout);
  const forms = uniq(normalized.map((f) => f.form ?? 'Basic Info'));

  const formObjs = forms.map((formName) => {
    const formFields = normalized.filter((f) => (f.form ?? 'Basic Info') === formName);
    const formOrder = Math.min(...formFields.map((f) => f.formOrder ?? 0), 0);
    const cats = uniq(formFields.map((f) => f.category ?? 'General'));
    const categories = cats.map((catName) => {
      const catFields = formFields.filter((f) => (f.category ?? 'General') === catName);
      const catOrder = Math.min(...catFields.map((f) => f.categoryOrder ?? 0), 0);
      return { name: catName, order: catOrder };
    }).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    return { name: formName, order: formOrder, categories };
  }).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  return { forms: formObjs };
}

export function ensurePoliciesCategory(layout: TemplateLayout, options?: { formName?: string }): TemplateLayout {
  const formName = options?.formName ?? 'About this event';
  const next = { forms: layout.forms.map((f) => ({ ...f, categories: (f.categories ?? []).slice() })) };
  const form = next.forms.find((f) => f.name === formName);
  if (!form) {
    next.forms.push({ name: formName, order: next.forms.length, categories: [{ name: 'Policies', order: 0 }] });
  } else if (!(form.categories ?? []).some((c) => c.name === 'Policies')) {
    const cats = form.categories ?? [];
    cats.push({ name: 'Policies', order: cats.length });
    form.categories = cats;
  }
  return {
    forms: next.forms
      .map((f) => ({ ...f, categories: (f.categories ?? []).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)) }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
  };
}

