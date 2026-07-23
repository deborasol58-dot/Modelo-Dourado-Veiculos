import { useState, useEffect, useCallback } from 'react';
import { leadService } from '../services/lead.service';
import { LeadMessage } from '../types';

export function useLeads() {
  const [leads, setLeads] = useState<LeadMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await leadService.getLeads();
      setLeads(data);
    } catch (err: any) {
      console.error('useLeads error:', err);
      setError(err.message || 'Erro ao carregar propostas do Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const addLead = async (lead: Omit<LeadMessage, 'id' | 'createdAt' | 'status'>) => {
    const newLead = await leadService.createLead(lead);
    setLeads(prev => [newLead, ...prev]);
    return newLead;
  };

  const updateLeadStatus = async (id: string, status: LeadMessage['status']) => {
    await leadService.updateLeadStatus(id, status);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const deleteLead = async (id: string) => {
    await leadService.deleteLead(id);
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
    addLead,
    updateLeadStatus,
    deleteLead
  };
}
