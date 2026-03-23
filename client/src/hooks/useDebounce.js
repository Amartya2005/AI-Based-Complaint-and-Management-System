/**
 * useDebounce Hook
 * Debounces a value to reduce expensive operations
 * 
 * Usage:
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 */

import { useState, useEffect } from 'react';

export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup the timeout if value changes before delay expires
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
