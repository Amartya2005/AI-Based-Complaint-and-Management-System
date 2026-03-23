/**
 * useComplaintFilters Hook
 * Handles filtering complaints by status, category, and search term
 * 
 * Usage:
 * const { filters, filteredComplaints, updateFilter, clearFilters } = useComplaintFilters(complaints);
 */

import { useState, useMemo, useCallback } from 'react';

export const useComplaintFilters = (complaints = []) => {
  const [filters, setFilters] = useState({
    status: null,
    category: null,
    searchTerm: '',
    sortBy: 'newest', // 'newest', 'oldest', 'priority'
  });

  const filteredAndSortedComplaints = useMemo(() => {
    let result = complaints;

    // Apply filters
    if (filters.status) {
      result = result.filter(complaint => complaint.status === filters.status);
    }

    if (filters.category) {
      result = result.filter(complaint => complaint.category === filters.category);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(complaint =>
        complaint.title.toLowerCase().includes(term) ||
        complaint.description.toLowerCase().includes(term) ||
        (complaint.id && complaint.id.toString().includes(term))
      );
    }

    // Apply sorting
    if (filters.sortBy === 'newest') {
      result = [...result].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );
    } else if (filters.sortBy === 'oldest') {
      result = [...result].sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
      );
    }

    return result;
  }, [complaints, filters]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      status: null,
      category: null,
      searchTerm: '',
      sortBy: 'newest',
    });
  }, []);

  const resetSearch = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      searchTerm: '',
    }));
  }, []);

  return {
    filters,
    filteredComplaints: filteredAndSortedComplaints,
    updateFilter,
    clearFilters,
    resetSearch,
    activeFilterCount: Object.values(filters).filter(v => v && v !== 'newest').length,
  };
};
