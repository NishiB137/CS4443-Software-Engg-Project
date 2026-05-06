import { EventTemplate } from '../models/EventTemplate.js';
import type { IFieldSpec, ISessionTemplate } from '../models/EventTemplate.js';
import mongoose from 'mongoose';

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_FIELD_TYPES = ['text','textarea','number','date','time','datetime','select','multiselect','toggle','url','email','phone', 'file_image', 'file_video', 'file_image_multiple', 'speakers'];
const VALID_SECTIONS    = ['basics','datetime','venue','capacity','policies','media','custom'];
const VALID_FORMATS     = ['physical','virtual','hybrid'];

const validateField = (f: Partial<IFieldSpec>, idx: number): string[] => {
  const e: string[] = [];
  if (!f.key?.trim())   e.push(`Field ${idx + 1}: key is required.`);
  if (!f.label?.trim()) e.push(`Field ${idx + 1}: label is required.`);
  if (!f.fieldType || !VALID_FIELD_TYPES.includes(f.fieldType))
    e.push(`Field ${idx + 1}: invalid fieldType "${f.fieldType}".`);
  if (!VALID_SECTIONS.includes(f.section!))
    e.push(`Field ${idx + 1}: invalid section "${f.section}".`);
  if (['select','multiselect'].includes(f.fieldType!) && (!f.options || f.options.length === 0))
    e.push(`Field ${idx + 1}: select/multiselect fields require at least one option.`);
  if (f.maxLength !== undefined && (f.maxLength < 1 || f.maxLength > 50000))
    e.push(`Field ${idx + 1}: maxLength must be 1–50000.`);
  if (f.form !== undefined && typeof f.form !== 'string')
    e.push(`Field ${idx + 1}: form must be a string.`);
  if (f.category !== undefined && typeof f.category !== 'string')
    e.push(`Field ${idx + 1}: category must be a string.`);
  if (f.formOrder !== undefined && (typeof f.formOrder !== 'number' || !Number.isFinite(f.formOrder)))
    e.push(`Field ${idx + 1}: formOrder must be a number.`);
  if (f.categoryOrder !== undefined && (typeof f.categoryOrder !== 'number' || !Number.isFinite(f.categoryOrder)))
    e.push(`Field ${idx + 1}: categoryOrder must be a number.`);
  return e;
};

interface TemplateBody {
  name?: string;
  description?: string;
  eventType?: string;
  format?: string;
  isFree?: boolean;
  coverColor?: string;
  tags?: string[];
  fields?: IFieldSpec[];
  sessionTemplates?: ISessionTemplate[];
  layout?: {
    forms: Array<{
      name: string;
      order: number;
      categories: Array<{ name: string; order: number }>;
    }>;
  };
  defaultVisibility?: string;
  defaultStatus?: string;
  defaultPolicies?: Record<string, unknown>;
  defaultCurrency?: string;
  defaultTicketingTiers?: Array<{ name: string; price: number; capacity: number; duration?: string; description?: string }>;
  requiresRegistration?: boolean;
  defaultRegistrationFields?: Array<{ key: string; label: string; fieldType: 'text' | 'email' | 'phone' | 'textarea' | 'select'; required: boolean; options?: string[]; category?: string; categoryOrder?: number; order?: number; }>;
  defaultEntrySettings?: { enableAttendanceManagement: boolean; scannerType: 'qr' | 'none'; allowMultipleScans: boolean; requireSpecificTime: boolean; entryStartTime?: Date; entryEndTime?: Date; };
  allowsSubEvents?: boolean;
  maxSubEventDepth?: number;
  createdBy?: string;
  organization?: string;
}

const validateBody = (body: TemplateBody, isCreate = true): void => {
  const errors: string[] = [];

  if (isCreate && !body.name?.trim()) errors.push('Template name is required.');
  if (body.name && body.name.trim().length > 100) errors.push('Template name cannot exceed 100 characters.');
  if (body.description && body.description.length > 500) errors.push('Description cannot exceed 500 characters.');
  if (body.format && !VALID_FORMATS.includes(body.format)) errors.push(`Format must be one of: ${VALID_FORMATS.join(', ')}.`);

  if (body.fields) {
    const keys = new Set<string>();
    body.fields.forEach((f, i) => {
      const fe = validateField(f, i);
      errors.push(...fe);
      if (keys.has(f.key)) errors.push(`Field ${i + 1}: duplicate key "${f.key}".`);
      keys.add(f.key);
    });
  }

  if (body.layout) {
    if (!Array.isArray(body.layout.forms)) errors.push('layout.forms must be an array.');
    const formNames = new Set<string>();
    body.layout.forms?.forEach((f, i) => {
      if (!f?.name?.trim()) errors.push(`layout.forms[${i}].name is required.`);
      if (f?.name && formNames.has(f.name)) errors.push(`layout.forms[${i}].name is duplicate.`);
      if (f?.name) formNames.add(f.name);
      if (typeof f.order !== 'number' || !Number.isFinite(f.order)) errors.push(`layout.forms[${i}].order must be a number.`);
      if (!Array.isArray(f.categories)) errors.push(`layout.forms[${i}].categories must be an array.`);
      const catNames = new Set<string>();
      f.categories?.forEach((c, j) => {
        if (!c?.name?.trim()) errors.push(`layout.forms[${i}].categories[${j}].name is required.`);
        if (c?.name && catNames.has(c.name)) errors.push(`layout.forms[${i}].categories[${j}].name is duplicate.`);
        if (c?.name) catNames.add(c.name);
        if (typeof c.order !== 'number' || !Number.isFinite(c.order)) errors.push(`layout.forms[${i}].categories[${j}].order must be a number.`);
      });
    });
  }

  if (body.maxSubEventDepth !== undefined && (body.maxSubEventDepth < 1 || body.maxSubEventDepth > 3))
    errors.push('maxSubEventDepth must be 1–3.');

  if (errors.length > 0) throw new Error(errors.join(' | '));
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const listTemplates = async (filters: {
  isDefault?: boolean;
  eventType?: string;
  organization?: string;
  createdBy?: string;
  q?: string;
  kind?: string;   // all | default | custom
  format?: string;
  tag?: string;
}) => {
  const query: Record<string, unknown> = {};
  // Back-compat filter
  if (filters.isDefault !== undefined) query['isDefault'] = filters.isDefault;

  // Higher-level "kind" filter (preferred)
  if (filters.kind === 'default') {
    query['isDefault'] = true;
  } else if (filters.kind === 'custom') {
    query['isDefault'] = false;
    query['isSystemTemplate'] = false;
  }

  if (filters.eventType) query['eventType'] = filters.eventType;
  if (filters.format) query['format'] = filters.format;
  if (filters.tag) query['tags'] = filters.tag;
  if (filters.organization && mongoose.Types.ObjectId.isValid(filters.organization)) {
    query['organization'] = filters.organization;
  }
  if (filters.createdBy) {
    if (mongoose.Types.ObjectId.isValid(filters.createdBy)) {
      query['createdBy'] = filters.createdBy;
    } else {
      query['createdBy'] = new mongoose.Types.ObjectId();
    }
  }

  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim();
    query['$or'] = [
      { name:        { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags:        { $regex: q, $options: 'i' } },
    ];
  }

  return EventTemplate.find(query).sort({ isDefault: -1, usageCount: -1, createdAt: -1 });
};

export const getTemplateFilters = async (): Promise<{
  kinds: Array<{ value: 'all' | 'default' | 'custom'; label: string; count: number }>;
  eventTypes: Array<{ value: string; label: string; count: number }>;
  formats: Array<{ value: string; label: string; count: number }>;
  tags: Array<{ value: string; label: string; count: number }>;
}> => {
  const [kindAgg, eventTypeAgg, formatAgg, tagAgg] = await Promise.all([
    EventTemplate.aggregate([
      { $group: { _id: '$isDefault', count: { $sum: 1 } } },
    ]),
    EventTemplate.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    EventTemplate.aggregate([
      { $group: { _id: '$format', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]),
    EventTemplate.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 50 },
    ]),
  ]);

  const defaultCount = kindAgg.find((x: { _id: boolean; count: number }) => x._id === true)?.count ?? 0;
  const allCount = kindAgg.reduce((acc: number, x: { count: number }) => acc + x.count, 0);
  const customCount = Math.max(0, allCount - defaultCount);

  const titleize = (s: string) =>
    s
      .split(/[_\s-]+/g)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  return {
    kinds: [
      { value: 'all',     label: 'All templates',     count: allCount },
      { value: 'default', label: 'Default templates', count: defaultCount },
      { value: 'custom',  label: 'Custom templates',  count: customCount },
    ],
    eventTypes: eventTypeAgg
      .filter((x: { _id: string | null }) => !!x._id)
      .map((x: { _id: string; count: number }) => ({ value: x._id, label: titleize(x._id), count: x.count })),
    formats: formatAgg
      .filter((x: { _id: string | null }) => !!x._id)
      .map((x: { _id: string; count: number }) => ({ value: x._id, label: titleize(x._id), count: x.count })),
    tags: tagAgg
      .filter((x: { _id: string | null }) => !!x._id)
      .map((x: { _id: string; count: number }) => ({ value: x._id, label: x._id, count: x.count })),
  };
};

export const getTemplateById = async (id: string) => {
  return EventTemplate.findById(id);
};

export const createTemplate = async (body: TemplateBody) => {
  validateBody(body, true);

  return EventTemplate.create({
    name:              body.name!,
    description:       body.description || '',
    eventType:         body.eventType   || 'other',
    format:            body.format      || 'physical',
    isFree:            body.isFree      ?? true,
    isDefault:         false,
    isSystemTemplate:  false,
    coverColor:        body.coverColor  || '#3B82F6',
    tags:              body.tags        || [],
    fields:            body.fields      || [],
    sessionTemplates:  body.sessionTemplates || [],
    ...(body.layout ? { layout: body.layout } : {}),
    defaultVisibility: body.defaultVisibility || 'public',
    defaultStatus:     body.defaultStatus     || 'draft',
    defaultPolicies:   body.defaultPolicies   || {},
    defaultCurrency:   body.defaultCurrency   || 'INR',
    defaultTicketingTiers: body.defaultTicketingTiers || [],
    requiresRegistration: body.requiresRegistration ?? false,
    defaultRegistrationFields: body.defaultRegistrationFields || [],
    ...(body.defaultEntrySettings ? { defaultEntrySettings: body.defaultEntrySettings } : {}),
    allowsSubEvents:   body.allowsSubEvents   ?? true,
    maxSubEventDepth:  body.maxSubEventDepth  ?? 1,
    ...(body.createdBy ? { createdBy: body.createdBy } : {}),
    ...(body.organization ? { organization: body.organization } : {}),
  });
};

export const updateTemplate = async (id: string, body: TemplateBody) => {
  const template = await EventTemplate.findById(id);
  if (!template) return null;

  // Default / system templates are view-only via API — duplicate to customize
  if (template.isDefault || template.isSystemTemplate) {
    throw new Error(
      'Default templates cannot be modified. Duplicate this template to create an editable copy.',
    );
  }

  validateBody(body, false);

  const update: Record<string, unknown> = {};
  const allowed = ['name','description','eventType','format','isFree','coverColor','tags','fields','sessionTemplates','layout','defaultVisibility','defaultStatus','defaultPolicies','defaultCurrency','defaultTicketingTiers','requiresRegistration','defaultRegistrationFields','defaultEntrySettings','allowsSubEvents','maxSubEventDepth'];
  for (const key of allowed) {
    if (body[key as keyof TemplateBody] !== undefined) update[key] = body[key as keyof TemplateBody];
  }
  update['version'] = (template.version || 1) + 1;

  return EventTemplate.findByIdAndUpdate(id, update, { new: true, runValidators: true });
};

export const deleteTemplate = async (id: string) => {
  const template = await EventTemplate.findById(id);
  if (!template) return null;
  if (template.isSystemTemplate) throw new Error('System default templates cannot be deleted.');
  return EventTemplate.findByIdAndDelete(id);
};

export const incrementUsage = async (id: string) => {
  return EventTemplate.findByIdAndUpdate(id, { $inc: { usageCount: 1 } });
};

// Duplicate a template as a new custom one
export const duplicateTemplate = async (id: string, newName: string, createdBy?: string) => {
  const source = await EventTemplate.findById(id);
  if (!source) return null;

  const copy = source.toObject();
  delete (copy as unknown as Record<string, unknown>)['_id'];
  delete (copy as unknown as Record<string, unknown>)['createdAt'];
  delete (copy as unknown as Record<string, unknown>)['updatedAt'];

  return EventTemplate.create({
    ...copy,
    name:             newName || `${source.name} (Copy)`,
    isDefault:        false,
    isSystemTemplate: false,
    usageCount:       0,
    version:          1,
    ...(createdBy ? { createdBy } : {}),
  });
};
