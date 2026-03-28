import { useState, useEffect, useCallback } from 'react';
import { templateApi } from '@/services/api';
import type { ApiTemplate, TemplateFiltersResponse } from '@/services/api';

export const useTemplates = (params?: Parameters<typeof templateApi.list>[0]) => {
  const [templates, setTemplates]   = useState<ApiTemplate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [filters, setFilters]       = useState<TemplateFiltersResponse['data'] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await templateApi.list(params);
      setTemplates(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    templateApi.filters()
      .then((res) => setFilters(res.data))
      .catch(() => setFilters(null));
  }, []);

  const deleteTemplate = async (id: string) => {
    await templateApi.delete(id);
    setTemplates((prev) => prev.filter((t) => t._id !== id));
  };

  const duplicateTemplate = async (id: string, name: string): Promise<void> => {
    try {
      const res = await templateApi.duplicate(id, name);
      setTemplates((prev) => [res.data, ...prev]);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : 'Duplicate failed');
    }
  };

  return { templates, loading, error, filters, reload: load, deleteTemplate, duplicateTemplate };
};
