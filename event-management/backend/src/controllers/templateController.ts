import type { Request, Response } from 'express';
import * as templateService from '../services/templateService.js';

const DEV_USER_ID = '000000000000000000000001';

const param = (req: Request, key: string): string =>
  (Array.isArray(req.params[key]) ? req.params[key][0] : req.params[key]) ?? '';

// GET /api/templates
export const listTemplates = async (req: Request, res: Response) => {
  try {
    const { isDefault, eventType, organization, createdBy, q, kind, format, tag } = req.query;
    const filter: Parameters<typeof templateService.listTemplates>[0] = {};

    if (isDefault === 'true') filter.isDefault = true;
    if (isDefault === 'false') filter.isDefault = false;
    if (typeof eventType === 'string') filter.eventType = eventType;
    if (typeof organization === 'string') filter.organization = organization;
    if (typeof createdBy === 'string') filter.createdBy = createdBy;
    if (typeof q === 'string') filter.q = q;
    if (typeof kind === 'string') filter.kind = kind;
    if (typeof format === 'string') filter.format = format;
    if (typeof tag === 'string') filter.tag = tag;

    const templates = await templateService.listTemplates(filter);
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Server error' });
  }
};

// GET /api/templates/filters
export const listTemplateFilters = async (_req: Request, res: Response) => {
  try {
    const filters = await templateService.getTemplateFilters();
    res.json({ success: true, data: filters });
  } catch (err) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Server error' });
  }
};

// GET /api/templates/:id
export const getTemplate = async (req: Request, res: Response) => {
  try {
    const template = await templateService.getTemplateById(param(req, 'id'));
    if (!template) { res.status(404).json({ success: false, message: 'Template not found' }); return; }
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Server error' });
  }
};

// POST /api/templates
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const template = await templateService.createTemplate({
      ...req.body,
      createdBy: req.body.createdBy || DEV_USER_ID,
    });
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(400).json({ success: false, message: err instanceof Error ? err.message : 'Server error' });
  }
};

// PUT /api/templates/:id
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const template = await templateService.updateTemplate(param(req, 'id'), req.body);
    if (!template) { res.status(404).json({ success: false, message: 'Template not found' }); return; }
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(400).json({ success: false, message: err instanceof Error ? err.message : 'Server error' });
  }
};

// DELETE /api/templates/:id
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const result = await templateService.deleteTemplate(param(req, 'id'));
    if (!result) { res.status(404).json({ success: false, message: 'Template not found' }); return; }
    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    const status = err instanceof Error && err.message.includes('cannot be deleted') ? 403 : 500;
    res.status(status).json({ success: false, message: err instanceof Error ? err.message : 'Server error' });
  }
};

// POST /api/templates/:id/duplicate
export const duplicateTemplate = async (req: Request, res: Response) => {
  try {
    const template = await templateService.duplicateTemplate(
      param(req, 'id'),
      req.body.name,
      req.body.createdBy || DEV_USER_ID,
    );
    if (!template) { res.status(404).json({ success: false, message: 'Template not found' }); return; }
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(400).json({ success: false, message: err instanceof Error ? err.message : 'Server error' });
  }
};

// POST /api/templates/:id/use  — increments usageCount
export const useTemplate = async (req: Request, res: Response) => {
  try {
    await templateService.incrementUsage(param(req, 'id'));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Server error' });
  }
};
