import { EventTemplate } from '../models/EventTemplate.js';
import type { IFieldSpec, ISessionTemplate } from '../models/EventTemplate.js';

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_FIELD_TYPES = ['text','textarea','number','date','time','datetime','select','multiselect','toggle','url','email','phone'];
const VALID_SECTIONS    = ['basics','datetime','venue','capacity','policies','media','custom'];
const VALID_FORMATS     = ['physical','virtual','hybrid'];
const VALID_EVENT_TYPES = ['conference','workshop','hackathon','concert','exhibition','summit','festival','competition','webinar','other'];

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
  defaultVisibility?: string;
  defaultStatus?: string;
  defaultPolicies?: Record<string, unknown>;
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
  if (body.eventType && !VALID_EVENT_TYPES.includes(body.eventType)) errors.push(`Invalid event type.`);

  if (body.fields) {
    const keys = new Set<string>();
    body.fields.forEach((f, i) => {
      const fe = validateField(f, i);
      errors.push(...fe);
      if (keys.has(f.key)) errors.push(`Field ${i + 1}: duplicate key "${f.key}".`);
      keys.add(f.key);
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
}) => {
  const query: Record<string, unknown> = {};
  if (filters.isDefault !== undefined) query['isDefault'] = filters.isDefault;
  if (filters.eventType) query['eventType'] = filters.eventType;
  if (filters.organization) query['organization'] = filters.organization;
  if (filters.createdBy) query['createdBy'] = filters.createdBy;

  return EventTemplate.find(query).sort({ isDefault: -1, usageCount: -1, createdAt: -1 });
};

export const getTemplateById = async (id: string) => {
  return EventTemplate.findById(id);
};

export const createTemplate = async (body: TemplateBody) => {
  validateBody(body, true);

  return EventTemplate.create({
    name:              body.name,
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
    defaultVisibility: body.defaultVisibility || 'public',
    defaultStatus:     body.defaultStatus     || 'draft',
    defaultPolicies:   body.defaultPolicies   || {},
    allowsSubEvents:   body.allowsSubEvents   ?? true,
    maxSubEventDepth:  body.maxSubEventDepth  ?? 1,
    createdBy:         body.createdBy   || undefined,
    organization:      body.organization || undefined,
  });
};

export const updateTemplate = async (id: string, body: TemplateBody) => {
  const template = await EventTemplate.findById(id);
  if (!template) return null;

  // System templates: only allow editing non-structural fields
  if (template.isSystemTemplate) {
    const allowedSystemEdits = ['description', 'coverColor', 'tags'];
    const attempted = Object.keys(body).filter((k) => !allowedSystemEdits.includes(k));
    if (attempted.length > 0)
      throw new Error(`System templates only allow editing: ${allowedSystemEdits.join(', ')}.`);
  }

  validateBody(body, false);

  const update: Record<string, unknown> = {};
  const allowed = ['name','description','eventType','format','isFree','coverColor','tags','fields','sessionTemplates','defaultVisibility','defaultStatus','defaultPolicies','allowsSubEvents','maxSubEventDepth'];
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
  delete (copy as Record<string, unknown>)['_id'];
  delete (copy as Record<string, unknown>)['createdAt'];
  delete (copy as Record<string, unknown>)['updatedAt'];

  return EventTemplate.create({
    ...copy,
    name:             newName || `${source.name} (Copy)`,
    isDefault:        false,
    isSystemTemplate: false,
    usageCount:       0,
    version:          1,
    createdBy:        createdBy || undefined,
  });
};
