import { useState, useEffect, useCallback } from 'react';
import { settingsService, CompanySettings } from '../services/settings.service';

export function useSettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err: any) {
      console.error('useSettings error:', err);
      setError(err.message || 'Erro ao carregar configurações do Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    const updated = await settingsService.updateSettings(newSettings);
    setSettings(updated);
    return updated;
  };

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings
  };
}
