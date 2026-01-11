/**
 * Custom hook for mentor data management
 */
import { useState, useEffect, useCallback } from 'react';
import { mentorApi } from '../services/mentorApi';
import type { Mentor, MentorSearchFilters, MentorListResponse } from '../types/mentor';

export const useMentors = (initialFilters?: MentorSearchFilters) => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<MentorSearchFilters>(initialFilters || {});

  const searchMentors = useCallback(async (searchFilters?: MentorSearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters = searchFilters || filters;
      const response: MentorListResponse = await mentorApi.searchMentors(activeFilters);
      setMentors(response.mentors);
      setTotal(response.total);
      setFilters(activeFilters);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to search mentors');
      setMentors([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    searchMentors();
  }, []); // Only run once on mount, use searchMentors with filters for updates

  const updateFilters = useCallback((newFilters: Partial<MentorSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 })); // Reset offset when filters change
  }, []);

  const loadMore = useCallback(() => {
    const newOffset = (filters.offset || 0) + (filters.limit || 20);
    updateFilters({ offset: newOffset });
    searchMentors({ ...filters, offset: newOffset });
  }, [filters, searchMentors, updateFilters]);

  return {
    mentors,
    loading,
    error,
    total,
    filters,
    searchMentors,
    updateFilters,
    loadMore,
    hasMore: mentors.length < total,
  };
};

export const useMentor = (mentorId: string | null) => {
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mentorId) {
      setMentor(null);
      return;
    }

    const fetchMentor = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await mentorApi.getMentorById(mentorId);
        setMentor(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to load mentor');
        setMentor(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMentor();
  }, [mentorId]);

  return { mentor, loading, error };
};

