# Migration Checklist & Implementation Guide

## Quick Start

### Phase 1: Foundation Setup (Do First)

- [ ] Copy constants files:
  - [x] Created `src/constants/complaint-categories.js`
  - [x] Created `src/constants/complaint-statuses.js`
  - [x] Created `src/constants/user-roles.js`
  - [x] Created `src/constants/index.js`

- [ ] Copy utility files:
  - [x] Created `src/utils/formatters.js`
  - [x] Created `src/utils/validators.js`

- [ ] Copy custom hooks:
  - [x] Created `src/hooks/useFetch.js`
  - [x] Created `src/hooks/useComplaintFilters.js`
  - [x] Created `src/hooks/useDebounce.js`
  - [x] Created `src/hooks/index.js`

- [ ] Copy components:
  - [x] Created `src/components/common/ErrorBoundary.jsx`

- [ ] Wrap App with ErrorBoundary in `App.jsx`:
  ```jsx
  import ErrorBoundary from './components/common/ErrorBoundary';

  <ErrorBoundary>
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  </ErrorBoundary>
  ```

---

## Step-by-Step Migration Examples

### Example 1: Replace Hardcoded Categories

**Before:**
```jsx
// In Dashboard.jsx - scattered throughout
const pieData = [
  { name: 'Hostel', value: complaints.filter(c => c.category === 'HOSTEL').length },
  { name: 'Administrative', value: complaints.filter(c => c.category === 'ADMINISTRATIVE').length },
  { name: 'Academic', value: complaints.filter(c => c.category === 'ACADEMIC').length },
];
const COLORS = ['#00c4cc', '#f1f5f9', '#ffc107'];
```

**After:**
```jsx
import { COMPLAINT_CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS, getCategoryOptions } from '../constants';

// Cleaner, reusable
const pieData = getCategoryOptions().map(opt => ({
  name: opt.label,
  value: complaints.filter(c => c.category === opt.value).length,
}));

const COLORS = getCategoryOptions().map(opt => CATEGORY_COLORS[opt.value]);
```

---

### Example 2: Use useFetch Hook

**Before:**
```jsx
const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComplaints()
      .then(setComplaints)
      .catch(() => setError('Failed to load system data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader message="Loading system analytics..." />;
  if (error) return <ErrorMessage message={error} />;

  // ... rest of component
};
```

**After:**
```jsx
import { useFetch } from '../hooks';

const AdminDashboard = () => {
  const { data: complaints, loading, error, refetch } = useFetch(
    fetchComplaints,
    { cacheKey: 'admin-complaints' }
  );

  if (loading) return <Loader message="Loading system analytics..." />;
  if (error) return <ErrorMessage message={error.message} />;

  return (
    <div>
      {/* ... your JSX ... */}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
};
```

---

### Example 3: Use useComplaintFilters Hook

**Before:**
```jsx
const MyComplaints = ({ complaints }) => {
  const [filteredComplaints, setFilteredComplaints] = useState(complaints);
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let result = complaints;
    if (statusFilter) result = result.filter(c => c.status === statusFilter);
    if (categoryFilter) result = result.filter(c => c.category === categoryFilter);
    if (searchTerm) {
      result = result.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredComplaints(result);
  }, [complaints, statusFilter, categoryFilter, searchTerm]);

  return (
    <div>
      <select onChange={e => setStatusFilter(e.target.value)}>
        {/* ... */}
      </select>
      <input onChange={e => setSearchTerm(e.target.value)} />
      {/* render filtered list */}
    </div>
  );
};
```

**After:**
```jsx
import { useComplaintFilters } from '../hooks';

const MyComplaints = ({ complaints }) => {
  const { filters, filteredComplaints, updateFilter, clearFilters } = useComplaintFilters(complaints);

  return (
    <div>
      <select value={filters.status || ''} onChange={e => updateFilter('status', e.target.value || null)}>
        <option value="">All Statuses</option>
        {/* ... */}
      </select>
      <input
        value={filters.searchTerm}
        onChange={e => updateFilter('searchTerm', e.target.value)}
        placeholder="Search complaints..."
      />
      <button onClick={clearFilters}>Clear Filters</button>
      {/* render filteredComplaints */}
    </div>
  );
};
```

---

### Example 4: Use Formatters

**Before:**
```jsx
const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN');
};

const calculateResolutionRate = (complaints) => {
  if (complaints.length === 0) return 0;
  const resolved = complaints.filter(c => c.status === 'RESOLVED').length;
  return ((resolved / complaints.length) * 100).toFixed(1);
};

// Used in multiple places, duplicated logic

<span>{formatDate(complaint.created_at)}</span>
<span>{calculateResolutionRate(complaints)}%</span>
```

**After:**
```jsx
import { formatDate, calculateResolutionRate } from '../utils/formatters';

// Single source of truth for formatting logic

<span>{formatDate(complaint.created_at)}</span>
<span>{calculateResolutionRate(complaints)}%</span>
```

---

### Example 5: Use Validators

**Before:**
```jsx
const ComplaintForm = () => {
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.title || formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit form
  };

  // ... rest of component
};
```

**After:**
```jsx
import { validateComplaintForm, hasErrors } from '../utils/validators';

const ComplaintForm = () => {
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formErrors = validateComplaintForm(formData);
    
    if (hasErrors(formErrors)) {
      setErrors(formErrors);
      return;
    }

    // Submit form
  };

  // ... rest of component
};
```

---

## Testing New Architecture

### Test 1: Constants are being used

```bash
# Search for hardcoded values in components
grep -r "'HOSTEL'" src/

# Both should return only import statements, not comparisons
grep -r "COMPLAINT_CATEGORIES" src/
```

### Test 2: Hooks are working

```jsx
// Quick test in any component
import { useFetch, useComplaintFilters } from '../hooks';

// These should work with autocomplete
const { data, loading } = useFetch(() => Promise.resolve([1, 2, 3]));
const { filteredComplaints } = useComplaintFilters([]);
```

### Test 3: Formatters are consistent

```jsx
import { formatDate, calculateResolutionRate } from '../utils/formatters';

// Should consistently format dates the same way everywhere
console.log(formatDate('2024-03-16')); // Should always show as "16/03/2024"
```

---

## Common Pitfalls to Avoid

### ❌ Don't Mix Old and New Code

```jsx
// BAD: Mixing old constants with new hook
import { useFetch } from '../hooks';

const [complaints, setComplaints] = useState([]);

useEffect(() => {
  // Still using old pattern
  fetchComplaints().then(setComplaints);
}, []);

// Later using hook
const { data: newComplaints } = useFetch(fetchComplaints);
```

### ✅ Do Commit to New Pattern

```jsx
// GOOD: Fully using new hook approach
import { useFetch } from '../hooks';

const { data: complaints, loading } = useFetch(fetchComplaints);
```

---

### ❌ Don't Create New Constants Outside /constants

```jsx
// BAD: Duplicate constant definition
const STATUSES = {
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
};
```

### ✅ Do Use Centralized Constants

```jsx
// GOOD: Import from constants
import { COMPLAINT_STATUSES } from '../constants';
```

---

## File Structure After Migration

```
src/
├── constants/
│   ├── complaint-categories.js  ✅ Ready
│   ├── complaint-statuses.js    ✅ Ready
│   ├── user-roles.js            ✅ Ready
│   └── index.js                 ✅ Ready
│
├── hooks/
│   ├── useFetch.js              ✅ Ready
│   ├── useComplaintFilters.js   ✅ Ready
│   ├── useDebounce.js           ✅ Ready
│   └── index.js                 ✅ Ready
│
├── utils/
│   ├── formatters.js            ✅ Ready
│   ├── validators.js            ✅ Ready
│   ├── animations.js            (existing)
│   └── pdfExport.js             (existing)
│
├── components/
│   ├── common/
│   │   └── ErrorBoundary.jsx    ✅ Ready
│   ├── dashboard/               (to be created)
│   ├── complaints/              (to be created)
│   └── ... rest of components
│
└── pages/
    ├── admin/
    │   ├── Dashboard.jsx        (to refactor)
    │   └── components/          (new - sub-components)
    └── ... rest of pages
```

---

## Next Steps

1. **Copy all ready files** into your project
2. **Update imports** in existing components
3. **Test thoroughly** - make sure nothing breaks
4. **Refactor one page at a time** - start with Dashboard
5. **Document changes** in your team wiki/docs

---

## Questions to Ask Yourself During Migration

- [ ] Can this hardcoded value be moved to a constant?
- [ ] Is this logic duplicated across components?
- [ ] Could this be a custom hook?
- [ ] Is this component doing too many things?
- [ ] Would extracting this sub-component help readability?
- [ ] Should this be memoized to prevent re-renders?
- [ ] Is there error handling for this async operation?

---

## Success Metrics

After full migration:
- [ ] No hardcoded category/status values in components
- [ ] All API calls use `useFetch` hook
- [ ] All forms use validators from `utils/validators.js`
- [ ] No date formatting inconsistencies
- [ ] Error boundary catches component crashes gracefully
- [ ] Code duplication reduced by 30%+
- [ ] Easier to add new features

---

**Remember:** Refactoring is iterative. Don't try to do everything at once. 
Focus on consistency, reusability, and maintainability. 🚀
