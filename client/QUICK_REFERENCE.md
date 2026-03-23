# Frontend Architecture - Quick Reference Guide

## 🚀 For New Developers

### Import Pattern Cheat Sheet

```jsx
// ✅ Constants (use these instead of hardcoding)
import { 
  COMPLAINT_CATEGORIES, 
  COMPLAINT_STATUSES, 
  USER_ROLES,
  getCategoryLabel,
  getStatusColor,
} from '../constants';

// ✅ Hooks (reusable logic)
import { 
  useFetch, 
  useComplaintFilters, 
  useDebounce 
} from '../hooks';

// ✅ Utils (pure functions)
import { 
  formatDate, 
  calculateResolutionRate,
  truncateText,
} from '../utils/formatters';

import { 
  validateComplaintForm, 
  hasErrors 
} from '../utils/validators';

// ✅ Context with custom hooks (cleaner than useContext)
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
```

---

## Common Tasks

### Task 1: Display a Status Badge

```jsx
// ❌ Old way (hardcoded)
<span style={{ color: status === 'RESOLVED' ? '#4caf50' : '#ffc107' }}>
  {status}
</span>

// ✅ New way (using constants)
import { getStatusLabel, getStatusColor } from '../constants';
import { StatusBadge } from '../components/complaints/StatusBadge';

<StatusBadge status={complaint.status} />
```

---

### Task 2: Fetch Data with Loading/Error Handling

```jsx
// ❌ Old way (manual state management)
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchData()
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);

// ✅ New way (automatic with hook)
import { useFetch } from '../hooks';

const { data, loading, error, refetch } = useFetch(fetchData);
```

---

### Task 3: Filter a List

```jsx
// ❌ Old way (complex state management)
const [status, setStatus] = useState(null);
const [category, setCategory] = useState(null);
const [search, setSearch] = useState('');
const [filtered, setFiltered] = useState(complaints);

useEffect(() => {
  // Complex filtering logic
}, [status, category, search, complaints]);

// ✅ New way (one hook handles it all)
import { useComplaintFilters } from '../hooks';

const { filters, filteredComplaints, updateFilter, clearFilters } = useComplaintFilters(complaints);

// Use like this:
updateFilter('status', 'RESOLVED');
updateFilter('searchTerm', 'urgent');
```

---

### Task 4: Format Dates and Numbers

```jsx
// ❌ Old way (scattered formatting logic)
<span>{new Date(date).toLocaleDateString('en-IN')}</span>
<span>{(resolved / total * 100).toFixed(1)}%</span>

// ✅ New way (consistent formatting)
import { formatDate, calculateResolutionRate } from '../utils/formatters';

<span>{formatDate(date)}</span>
<span>{calculateResolutionRate(complaints)}%</span>
```

---

### Task 5: Validate Form Input

```jsx
// ❌ Old way (validation scattered in component)
const handleSubmit = (e) => {
  const errors = {};
  if (!title || title.length < 5) errors.title = 'Too short';
  // ... 10 more validation checks
};

// ✅ New way (validation in one place)
import { validateComplaintForm, hasErrors } from '../utils/validators';

const handleSubmit = (e) => {
  const errors = validateComplaintForm(formData);
  if (hasErrors(errors)) {
    setErrors(errors);
    return;
  }
  // Submit
};
```

---

### Task 6: Show Toast Notification

```jsx
// Use the custom hook wrapper (cleaner)
import { useToast } from '../context/useToast';

const MyComponent = () => {
  const { addToast } = useToast();

  const handleSuccess = () => {
    addToast('Complaint submitted successfully!', 'success');
  };

  const handleError = (err) => {
    addToast(`Error: ${err.message}`, 'error');
  };
};
```

---

### Task 7: Get User Info

```jsx
// Use the custom hook wrapper (cleaner)
import { useAuth } from '../context/useAuth';

const MyComponent = () => {
  const { user, setUser } = useAuth();

  if (!user) return <Navigate to="/" />;

  return <div>Welcome, {user.id}!</div>;
};
```

---

## Component Naming Guide

When creating new components, follow these patterns:

```
PresentationalComponent.jsx
  ├─ Receives all data via props
  ├─ No hooks (except for animations)
  ├─ Reusable across different contexts
  └─ Easy to test

ContainerComponent.jsx
  ├─ Manages state and side effects
  ├─ Uses custom hooks (useFetch, etc)
  ├─ Passes data to presentational components
  └─ Specific to one use case
```

### Example: Complaint Card

```jsx
// ① Presentational Component (reusable, testable)
// src/components/complaints/ComplaintCard.jsx
export const ComplaintCard = ({ complaint, onStatusChange, onDelete }) => (
  <div className="...">
    <h3>{complaint.title}</h3>
    <p>{complaint.description}</p>
    <StatusBadge status={complaint.status} />
    <button onClick={() => onStatusChange('RESOLVED')}>Mark Resolved</button>
    <button onClick={onDelete}>Delete</button>
  </div>
);

// ② Container Component (manages state)
// src/pages/admin/components/ComplaintsList.jsx
import { useFetch, useComplaintFilters } from '../../../hooks';
import { ComplaintCard } from '../../../components/complaints/ComplaintCard';

export const ComplaintsList = () => {
  const { data: complaints, loading } = useFetch(fetchComplaints);
  const { filteredComplaints, updateFilter } = useComplaintFilters(complaints);

  return (
    <div>
      <Filters onFilterChange={updateFilter} />
      {filteredComplaints.map(complaint => (
        <ComplaintCard
          key={complaint.id}
          complaint={complaint}
          onStatusChange={(status) => updateComplaint(complaint.id, status)}
          onDelete={(id) => deleteComplaint(id)}
        />
      ))}
    </div>
  );
};
```

---

## Performance Tips

### 1. Memoize Components That Render Often

```jsx
import { memo } from 'react';

// Before: Rerenders whenever parent rerenders
export const ComplaintCard = ({ complaint }) => (
  <div>{complaint.title}</div>
);

// After: Only rerenders if props change
export const ComplaintCard = memo(({ complaint }) => (
  <div>{complaint.title}</div>
));
```

### 2. Use useMemo for Expensive Calculations

```jsx
import { useMemo } from 'react';

// Bad: recalculates on every render
const totalResolved = complaints.reduce((sum, c) => 
  sum + (c.status === 'RESOLVED' ? 1 : 0), 0
);

// Good: only recalculates when complaints change
const totalResolved = useMemo(() => 
  complaints.reduce((sum, c) => 
    sum + (c.status === 'RESOLVED' ? 1 : 0), 0
  ), [complaints]
);
```

### 3. Debounce Search Input

```jsx
import { useDebounce } from '../hooks';

const SearchComplaints = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300); // Wait 300ms after typing stops

  useEffect(() => {
    // Only fetch when debounced value changes
    fetchComplaintsBySearch(debouncedSearch);
  }, [debouncedSearch]);

  return <input onChange={e => setSearch(e.target.value)} />;
};
```

---

## File Organization Rules

### ✅ DO:
- Put reusable logic in hooks (`/hooks`)
- Put pure functions in utils (`/utils`)
- Keep constants in one place (`/constants`)
- Extract components when a file gets >300 lines
- Name test files with `.test.js` or `.spec.js`

### ❌ DON'T:
- Hardcode values in components (use constants)
- Duplicate logic across files (use utils/hooks)
- Import from node_modules deeply (use aliases)
- Make components do too many things (extract sub-components)

---

## Debugging Tips

### Problem: Unnecessary Re-renders

```jsx
// Use React DevTools Profiler to identify re-renders
// chrome://extensions → select "React Developer Tools"

// Then:
1. Open DevTools → Profiler tab
2. Record while interacting
3. Look for components flashing (re-rendering)
4. Solution: Wrap in memo() or useCallback()
```

### Problem: Stale Data

```jsx
// Make sure to invalidate cache when data changes
import { clearFetchCache } from '../hooks';

const handleDelete = async (id) => {
  await api.delete(`/complaints/${id}`);
  clearFetchCache(); // Clear all cached data
  refetch(); // Refetch fresh data
};
```

### Problem: Type Errors

```jsx
// Use optional chaining and nullish coalescing
const title = complaint?.title ?? 'Untitled';

// Better yet, validate data from API
import { validateComplaintForm } from '../utils/validators';

const data = await fetchComplaint(id);
if (!validateComplaintForm(data)) {
  console.error('Invalid complaint data:', data);
}
```

---

## API Integration Pattern

All API calls should follow this pattern:

```jsx
// ✅ Correct pattern
import { useFetch } from '../hooks';
import { useToast } from '../context/useToast';

const MyComponent = () => {
  const { addToast } = useToast();
  const { data, loading, error, refetch } = useFetch(fetchComplaints);

  const handleRefresh = async () => {
    try {
      await refetch();
      addToast('Data refreshed!', 'success');
    } catch (err) {
      addToast(`Error: ${err.message}`, 'error');
    }
  };

  if (loading) return <Loader />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {/* render data */}
      <button onClick={handleRefresh}>Refresh</button>
    </div>
  );
};
```

---

## Code Review Checklist

Before submitting PR, ask yourself:

- [ ] Have I used constants instead of hardcoded values?
- [ ] Can this logic be extracted to a hook?
- [ ] Are there any duplicate functions in other files?
- [ ] Have I handled loading and error states?
- [ ] Is this component under 300 lines?
- [ ] Would a child component help readability?
- [ ] Have I used useToast for user feedback?
- [ ] Have I validated data from the API?
- [ ] Are prop types correct and clear?
- [ ] Will this work with the Error Boundary?

---

## Resources

- **Full Architecture Guide:** `FRONTEND_ARCHITECTURE.md`
- **Migration Checklist:** `MIGRATION_CHECKLIST.md`
- **React Docs:** https://react.dev
- **Framer Motion:** https://www.framer.com/motion/
- **Recharts:** https://recharts.org/

---

**Last Updated:** March 16, 2026  
**Version:** 1.0
