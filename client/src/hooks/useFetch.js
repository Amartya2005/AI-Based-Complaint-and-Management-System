/**
 * useFetch Hook
 * Handles API calls with caching, loading, and error states
 * 
 * Usage:
 * const { data, loading, error, refetch } = useFetch(
 *   () => fetchComplaints(),
 *   { skipCache: false }
 * );
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const requestCache = new Map();

export const useFetch = (fetchFn, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const cacheKey = options.cacheKey || fetchFn.name || 'unknown';

  const refetch = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Clear cache for this key
    requestCache.delete(cacheKey);

    try {
      setLoading(true);
      setError(null);

      const result = await fetchFn();

      if (isMountedRef.current) {
        setData(result);
        requestCache.set(cacheKey, result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
        setData(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, cacheKey]);

  useEffect(() => {
    isMountedRef.current = true;

    const loadData = async () => {
      try {
        // Check cache first (unless explicitly skipped)
        if (!options.skipCache && requestCache.has(cacheKey)) {
          const cachedData = requestCache.get(cacheKey);
          setData(cachedData);
          setLoading(false);
          setError(null);
          return;
        }

        setLoading(true);
        setError(null);

        const result = await fetchFn();

        if (isMountedRef.current) {
          setData(result);
          requestCache.set(cacheKey, result);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err);
          setData(null);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [cacheKey, fetchFn, options]);

  return {
    data,
    loading,
    error,
    refetch,
    isLoading: loading,
  };
};

/**
 * Utility function to clear all cached requests
 */
export const clearFetchCache = () => {
  requestCache.clear();
};

/**
 * Utility function to clear cache for a specific key
 */
export const clearCacheForKey = (cacheKey) => {
  requestCache.delete(cacheKey);
};
