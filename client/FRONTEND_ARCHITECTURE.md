# Frontend Architecture Review & Improvement Plan
**Complaint Classifier and Management System**

---

## Executive Summary

Your React + Vite frontend has a solid foundation with proper routing, context-based auth, and decent separation of concerns. This document outlines targeted improvements for **scalability, maintainability, and developer efficiency** without breaking existing functionality.

**Key Focus Areas:**
1. Component decomposition and reusability
2. Custom hooks for complex logic
3. Constants and configuration management
4. API service abstraction
5. State management optimization
6. Performance improvements
7. Developer workflow enhancements

---

## Current State Analysis

### ✅ Strengths
- Clean routing structure with role-based access control
- Context API properly implemented (Auth, Toast)
- Centralized API interceptors (token injection, 401 handling)
- Tailwind CSS for consistent styling
- Framer Motion for animations
- Service layer abstraction (not direct fetch calls)

### ⚠️ Areas for Improvement

| Issue | Impact | Priority |
|-------|--------|----------|
| Large monolithic pages (Dashboard.jsx ~500+ lines) | Hard to test, maintain, debug | **HIGH** |
| Hardcoded values in components (colors, categories, statuses) | Inconsistent across app, hard to update | **HIGH** |
| No custom hooks for common patterns | Prop drilling, code duplication | **MEDIUM** |
| Animation variants scattered throughout components | Not reusable, inconsistent | **MEDIUM** |
| Missing error boundaries | App crashes propagate to users | **MEDIUM** |
| No API request caching or loading states | Network waste, poor UX | **MEDIUM** |
| Mock data mixed with real data | Confusing during development | **LOW** |

---

## Recommended Project Structure

```
src/
├── assets/                          # Images, fonts, icons
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── components/                      # Reusable UI components
│   ├── common/                      # Shared across all pages
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   └── ErrorBoundary.jsx       # NEW: Error boundary wrapper
│   │
│   ├── layouts/                     # Layout-specific components
│   │   ├── MainLayout.jsx           # (exists, good)
│   │   ├── Sidebar.jsx              # (exists, can be extracted)
│   │   └── PageHeader.jsx           # NEW: Reusable page header
│   │
│   ├── dashboard/                   # Dashboard-specific components
│   │   ├── KPICard.jsx              # NEW: Extract from Dashboard
│   │   ├── ComplaintsChart.jsx      # NEW: Extract chart logic
│   │   ├── CategoriesChart.jsx      # NEW: Pie chart component
│   │   └── StatsSummary.jsx         # NEW: Stats aggregator
│   │
│   ├── complaints/                  # Complaint-specific components
│   │   ├── ComplaintCard.jsx
│   │   ├── ComplaintForm.jsx
│   │   ├── ComplaintTable.jsx       # NEW: Reusable table
│   │   ├── StatusBadge.jsx          # (exists, keep)
│   │   └── PriorityBadge.jsx        # (exists, keep)
│   │
│   ├── users/                       # User-specific components
│   │   ├── UserCard.jsx
│   │   ├── UserForm.jsx
│   │   └── UserTable.jsx
│   │
│   ├── notifications/               # Notification components
│   │   └── ToastContainer.jsx       # (exists as part of context)
│   │
│   └── PageTransition.jsx           # (exists, keep)
│
├── context/                         # Global state (Auth, UI, etc)
│   ├── AuthContext.jsx              # (exists)
│   ├── ToastContext.jsx             # (exists)
│   ├── useAuth.js                   # NEW: Custom hook wrapper
│   ├── useToast.js                  # NEW: Custom hook wrapper
│   └── ThemeContext.jsx             # NEW: For theme switching
│
├── hooks/                           # Custom React hooks
│   ├── useAsync.js                  # NEW: Handle async operations
│   ├── useFetch.js                  # NEW: Fetch with caching/loading
│   ├── useLocalStorage.js           # NEW: Persist state to storage
│   ├── useDebounce.js               # NEW: Debounce user input
│   ├── usePagination.js             # NEW: Handle pagination logic
│   └── useComplaintFilters.js       # NEW: Reusable filter logic
│
├── layouts/                         # Page layouts
│   └── MainLayout.jsx               # (exists, refactor into components/)
│
├── pages/                           # Page-level components
│   ├── Login.jsx                    # (exists)
│   ├── NotFound.jsx                 # NEW: 404 page
│   │
│   ├── admin/
│   │   ├── Dashboard.jsx            # REFACTOR: Split into sub-components
│   │   ├── Analytics.jsx            # (exists)
│   │   ├── ManageUsers.jsx          # REFACTOR: Use UserTable component
│   │   └── components/              # Dashboard-specific sub-components
│   │       ├── KPISection.jsx
│   │       ├── ChartsSection.jsx
│   │       └── ExportsAction.jsx
│   │
│   ├── staff/
│   │   ├── Dashboard.jsx
│   │   ├── UpdateStatus.jsx
│   │   └── components/
│   │       └── AssignmentForm.jsx
│   │
│   └── student/
│       ├── Dashboard.jsx
│       ├── MyComplaints.jsx
│       └── components/
│           └── ComplaintForm.jsx
│
├── services/                        # API services & utilities
│   ├── api.js                       # (exists - HTTP client)
│   ├── auth.js                      # (exists - auth endpoints)
│   ├── complaints.js                # (exists - complaints endpoints)
│   ├── users.js                     # (exists - users endpoints)
│   ├── notifications.js             # (exists)
│   ├── departments.js               # (new if missing)
│   ├── http-client.js               # NEW: Wrapper with caching
│   └── service-config.js            # NEW: API endpoints config
│
├── constants/                       # Application constants
│   ├── index.js                     # NEW: Export all constants
│   ├── complaint-categories.js      # NEW: HOSTEL, ACADEMIC, etc.
│   ├── complaint-statuses.js        # NEW: PENDING, RESOLVED, etc.
│   ├── user-roles.js                # NEW: STUDENT, STAFF, ADMIN
│   ├── colors.js                    # NEW: Theme colors
│   ├── api-endpoints.js             # NEW: API URLs
│   └── validation.js                # NEW: Form validation rules
│
├── styles/                          # Global styles & utilities
│   ├── animations.css               # (rename from animations.js)
│   ├── animations.js                # (exists - keep for now)
│   ├── tailwind-config.js           # (from tailwind.config.js)
│   └── form.css                     # NEW: Form-specific styles
│
├── utils/                           # Utility functions
│   ├── index.js                     # NEW: Export all utilities
│   ├── animations.js                # (exists)
│   ├── pdfExport.js                 # (exists)
│   ├── formatters.js                # NEW: Format dates, currency, etc
│   ├── validators.js                # NEW: Validation helpers
│   ├── error-handler.js             # NEW: Centralized error handling
│   ├── storage.js                   # NEW: LocalStorage helpers
│   ├── date-utils.js                # NEW: Date formatting/parsing
│   ├── array-utils.js               # NEW: Array manipulation helpers
│   └── request-logger.js            # NEW: Request/response logging
│
├── App.jsx                          # (exists)
├── main.jsx                         # (exists)
├── index.css                        # (exists)
├── App.css                          # (consider consolidating)
│
└── config/
    └── app-config.js                # NEW: Feature flags, env vars
```

---

## Detailed Improvements

### 1. Component Decomposition

#### **Current Issue: Admin Dashboard**
The `Dashboard.jsx` file is ~500+ lines, mixing:
- Data fetching logic
- Chart rendering
- KPI calculations
- PDF export logic
- Motion animations

#### **Solution: Extract Sub-Components**

```jsx
// File: src/components/dashboard/KPICard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const KPICard = React.memo(({ 
  title, 
  value, 
  trend, 
  isUp, 
  description, 
  icon: Icon,
  bgGradient,
  variant = 'itemVariants'
}) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -8 }}
      className="bg-white rounded-2xl p-5 shadow-md border border-gray-100"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-gray-500">{title}</h3>
        <Icon size={20} className="text-gray-400" />
      </div>
      
      <div className="text-3xl font-bold text-gray-900 mb-3">{value}</div>
      
      <div className="flex items-center gap-2 text-xs font-medium">
        <span className={isUp ? 'text-emerald-500' : 'text-rose-500'}>
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </span>
        <span className="text-gray-400">{description}</span>
      </div>
    </motion.div>
  );
});

KPICard.displayName = 'KPICard';
```

```jsx
// File: src/components/dashboard/ChartsSection.jsx
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export const ComplaintsChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="Resolved" stackId="a" fill="#00c4cc" />
      <Bar dataKey="Active" stackId="a" fill="#e2e8f0" />
      <Bar dataKey="Pending" stackId="a" fill="#f1f5f9" />
    </BarChart>
  </ResponsiveContainer>
);

export const CategoriesChart = ({ data, colors }) => (
  <ResponsiveContainer width="100%" height={220}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={65}
        outerRadius={85}
        dataKey="value"
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
    </PieChart>
  </ResponsiveContainer>
);
```

```jsx
// File: src/pages/admin/Dashboard.jsx (AFTER refactoring - 150 lines instead of 500+)
import React, { useState, useEffect } from 'react';
import { fetchComplaints } from '../../services/complaints';
import { KPICard } from '../../components/dashboard/KPICard';
import { ComplaintsChart, CategoriesChart } from '../../components/dashboard/ChartsSection';
import { useToast } from '../../context/useToast';
import Loader from '../../components/Loader';

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchComplaints()
      .then(setComplaints)
      .catch(err => {
        addToast('Failed to load complaints', 'error');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader message="Loading analytics..." />;

  // Extracted calculation functions
  const stats = calculateStats(complaints);
  const chartData = prepareChartData(complaints);
  const categoryData = prepareCategoryData(complaints);

  return (
    <div className="space-y-6">
      <KPISection stats={stats} />
      <ChartsSection chartData={chartData} categoryData={categoryData} />
      <ExportActions complaints={complaints} stats={stats} />
    </div>
  );
};

// Logic extracted into pure functions
const calculateStats = (complaints) => ({
  total: complaints.length,
  pending: complaints.filter(c => c.status === 'PENDING').length,
  active: complaints.filter(c => ['ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length,
  resolved: complaints.filter(c => c.status === 'RESOLVED').length,
  resolutionRate: calculateResolutionRate(complaints),
});

export default AdminDashboard;
```

---

### 2. Create Constants File Structure

```js
// File: src/constants/complaint-categories.js
export const COMPLAINT_CATEGORIES = {
  HOSTEL: 'HOSTEL',
  ADMINISTRATIVE: 'ADMINISTRATIVE',
  ACADEMIC: 'ACADEMIC',
};

export const CATEGORY_LABELS = {
  [COMPLAINT_CATEGORIES.HOSTEL]: 'Hostel',
  [COMPLAINT_CATEGORIES.ADMINISTRATIVE]: 'Administrative',
  [COMPLAINT_CATEGORIES.ACADEMIC]: 'Academic',
};

export const CATEGORY_COLORS = {
  [COMPLAINT_CATEGORIES.HOSTEL]: '#00c4cc',
  [COMPLAINT_CATEGORIES.ADMINISTRATIVE]: '#f1f5f9',
  [COMPLAINT_CATEGORIES.ACADEMIC]: '#ffc107',
};
```

```js
// File: src/constants/complaint-statuses.js
export const COMPLAINT_STATUSES = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
};

export const STATUS_LABELS = {
  [COMPLAINT_STATUSES.PENDING]: 'Pending',
  [COMPLAINT_STATUSES.ASSIGNED]: 'Assigned',
  [COMPLAINT_STATUSES.IN_PROGRESS]: 'In Progress',
  [COMPLAINT_STATUSES.RESOLVED]: 'Resolved',
  [COMPLAINT_STATUSES.REJECTED]: 'Rejected',
};

export const STATUS_COLORS = {
  [COMPLAINT_STATUSES.PENDING]: '#ffc107',
  [COMPLAINT_STATUSES.ASSIGNED]: '#2196f3',
  [COMPLAINT_STATUSES.IN_PROGRESS]: '#ff9800',
  [COMPLAINT_STATUSES.RESOLVED]: '#4caf50',
  [COMPLAINT_STATUSES.REJECTED]: '#f44336',
};
```

```js
// File: src/constants/index.js
export * from './complaint-categories';
export * from './complaint-statuses';
export * from './user-roles';
export * from './colors';
export * from './api-endpoints';
```

**Before:**
```jsx
const categoryData = [
  ['Hostel', complaints.filter(c => c.category === 'HOSTEL').length],
  ['Administrative', complaints.filter(c => c.category === 'ADMINISTRATIVE').length],
  // Hardcoded values scattered throughout
];
```

**After:**
```jsx
import { CATEGORY_LABELS, COMPLAINT_CATEGORIES } from '../constants';

const categoryData = Object.entries(COMPLAINT_CATEGORIES).map(([key, value]) => ({
  name: CATEGORY_LABELS[key],
  value: complaints.filter(c => c.category === value).length,
}));
```

---

### 3. Custom Hooks for Complex Logic

#### **Hook: useFetch - For API calls with caching**

```js
// File: src/hooks/useFetch.js
import { useState, useEffect, useRef } from 'react';

const cache = new Map();

export const useFetch = (fetchFn, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const countRef = useRef(0);
  
  const cacheKey = fetchFn.name || 'fetch';
  
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      // Check cache first
      if (cache.has(cacheKey) && !options.skipCache) {
        setData(cache.get(cacheKey));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await fetchFn();
        
        if (isMounted) {
          cache.set(cacheKey, result);
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [cacheKey, options]);

  const refetch = () => {
    cache.delete(cacheKey);
    countRef.current += 1;
  };

  return { data, loading, error, refetch };
};
```

**Usage:**
```jsx
const AdminDashboard = () => {
  const { data: complaints, loading, error, refetch } = useFetch(fetchComplaints);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <ComplaintsList complaints={complaints} />
      <button onClick={refetch}>Refresh</button>
    </div>
  );
};
```

#### **Hook: useComplaintFilters - Reusable filter logic**

```js
// File: src/hooks/useComplaintFilters.js
import { useState, useMemo } from 'react';
import { COMPLAINT_STATUSES } from '../constants';

export const useComplaintFilters = (complaints) => {
  const [filters, setFilters] = useState({
    status: null,
    category: null,
    searchTerm: '',
  });

  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
      if (filters.status && complaint.status !== filters.status) return false;
      if (filters.category && complaint.category !== filters.category) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (
          complaint.title.toLowerCase().includes(term) ||
          complaint.description.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [complaints, filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: null, category: null, searchTerm: '' });
  };

  return {
    filters,
    filteredComplaints,
    updateFilter,
    clearFilters,
  };
};
```

**Usage:**
```jsx
const MyComplaints = ({ complaints }) => {
  const { filters, filteredComplaints, updateFilter, clearFilters } = useComplaintFilters(complaints);

  return (
    <div>
      <FilterBar 
        filters={filters} 
        onFilterChange={updateFilter}
        onClear={clearFilters}
      />
      <ComplaintsList complaints={filteredComplaints} />
    </div>
  );
};
```

---

### 4. Wrapper Hooks for Context (Better DX)

```js
// File: src/context/useAuth.js
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

```js
// File: src/context/useToast.js
import { useContext } from 'react';
import { ToastContext } from './ToastContext';

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
```

**Before:**
```jsx
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

const component = () => {
  const { user } = useContext(AuthContext);
};
```

**After:**
```jsx
import { useAuth } from '../context/useAuth';

const component = () => {
  const { user } = useAuth(); // Cleaner, with error boundary
};
```

---

### 5. Utility Functions

```js
// File: src/utils/formatters.js
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  if (format === 'short') return d.toLocaleDateString('en-IN');
  if (format === 'long') return d.toLocaleDateString('en-IN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  return d.toISOString();
};

export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-IN');
};

export const formatDateTime = (date) => {
  return `${formatDate(date, 'short')} ${formatTime(date)}`;
};

export const calculateResolutionRate = (complaints) => {
  if (complaints.length === 0) return 0;
  const resolved = complaints.filter(c => c.status === 'RESOLVED').length;
  return ((resolved / complaints.length) * 100).toFixed(1);
};

export const truncateText = (text, length = 50) => {
  return text.length > length ? text.substring(0, length) + '...' : text;
};
```

```js
// File: src/utils/validators.js
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isStrongPassword = (password) => {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

export const validateComplaintForm = (data) => {
  const errors = {};
  if (!data.title || data.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters';
  }
  if (!data.description || data.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters';
  }
  if (!data.category) {
    errors.category = 'Category is required';
  }
  return errors;
};
```

---

### 6. Error Boundary Component

```jsx
// File: src/components/common/ErrorBoundary.jsx
import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="text-red-500" size={48} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 text-center mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="w-full px-4 py-2 bg-brand text-white rounded-lg flex items-center justify-center gap-2 hover:bg-brand-600 transition"
            >
              <RotateCcw size={16} />
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage in App.jsx:**
```jsx
<ErrorBoundary>
  <BrowserRouter>
    <AnimatedRoutes />
  </BrowserRouter>
</ErrorBoundary>
```

---

### 7. API Service Abstraction

```js
// File: src/services/service-config.js
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
  },
  COMPLAINTS: {
    LIST: '/complaints/',
    CREATE: '/complaints/',
    UPDATE: (id) => `/complaints/${id}/status`,
    ASSIGN: (id) => `/complaints/${id}/assign`,
  },
  USERS: {
    LIST: '/users/',
    CREATE: '/users/',
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
  },
  DEPARTMENTS: {
    LIST: '/departments/',
  },
};
```

```js
// File: src/services/http-client.js
import api from './api';

const requestCache = new Map();

export const httpClient = {
  get: async (url, config = {}) => {
    const cacheKey = `GET:${url}`;
    
    if (requestCache.has(cacheKey) && !config.skipCache) {
      return requestCache.get(cacheKey);
    }

    try {
      const response = await api.get(url, config);
      requestCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  post: async (url, data, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      // Invalidate relevant cache entries
      invalidateCache('GET:' + url);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  patch: async (url, data, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      invalidateCache('GET:' + url.split('/')[1]); // Invalidate list endpoints
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  clearCache: () => requestCache.clear(),
};

function handleError(error) {
  if (error.response?.status === 401) {
    // Auth error already handled by interceptor
    return new Error('Unauthorized');
  }
  if (error.response?.status === 400) {
    return new Error(error.response.data.detail || 'Bad request');
  }
  return error;
}

function invalidateCache(pattern) {
  for (let [key] of requestCache) {
    if (key.startsWith(pattern)) {
      requestCache.delete(key);
    }
  }
}
```

---

## Migration Strategy

### Phase 1: Foundation (Week 1)
- ✅ Create `/constants` folder with category/status/role configs
- ✅ Create `/hooks` folder with `useAuth`, `useToast`, `useFetch`
- ✅ Add `ErrorBoundary` component
- ✅ Create utility files (formatters, validators)

### Phase 2: Component Refactoring (Week 2-3)
- ⏳ Extract Dashboard into sub-components
- ⏳ Create reusable `ComplaintTable`, `UserTable` components
- ⏳ Refactor form components
- ⏳ Extract modal/dialog components

### Phase 3: Optimization (Week 3-4)
- ⏳ Implement `useFetch` hook in all service calls
- ⏳ Add React.memo to chart components
- ⏳ Implement pagination hook
- ⏳ Setup request caching

### Phase 4: Cleanup (Week 4)
- ⏳ Remove duplicate code
- ⏳ Update imports across app
- ⏳ Test all features
- ⏳ Documentation

---

## Performance Optimizations

### 1. Memoization

```jsx
// Prevent unnecessary re-renders of static components
export const KPICard = React.memo(({ title, value, trend }) => (
  <div>...</div>
), (prevProps, nextProps) => 
  prevProps.value === nextProps.value && 
  prevProps.trend === nextProps.trend
);

// Or use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return complaints.reduce((acc, c) => acc + calculateComplexValue(c), 0);
}, [complaints]);
```

### 2. Code Splitting

```jsx
// Load pages only when needed
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));

<Suspense fallback={<Loader />}>
  <Route path="/admin" element={<AdminDashboard />} />
</Suspense>
```

### 3. Debounce Search Input

```js
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

Usage:
```jsx
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

const filteredComplaints = useMemo(() => {
  return complaints.filter(c => 
    c.title.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
}, [debouncedSearch, complaints]);
```

---

## Developer Workflow Improvements

### 1. ESLint Configuration

```js
// .eslintrc.json
{
  "extends": ["eslint:recommended", "plugin:react/recommended", "plugin:react-hooks/recommended"],
  "rules": {
    "react/prop-types": "warn",
    "react/react-in-jsx-scope": "off",
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "prefer-const": "warn"
  }
}
```

### 2. File Naming Convention

- **Folders**: kebab-case (e.g., `user-dashboard`)
- **Components**: PascalCase (e.g., `UserCard.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useFetch.js`)
- **Utils/Services**: camelCase (e.g., `formatters.js`)
- **Constants**: UPPER_SNAKE_CASE exports in camelCase files

### 3. Component Template

```jsx
// src/components/MyComponent.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types'; // Consider adding prop-types

/**
 * Brief description of what this component does
 * @param {string} title - The title to display
 * @param {boolean} isActive - Whether component is active
 */
export const MyComponent = ({ title, isActive }) => {
  const [state, setState] = useState(null);

  return (
    <div>
      {/* JSX here */}
    </div>
  );
};

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  isActive: PropTypes.bool,
};

MyComponent.defaultProps = {
  isActive: false,
};

export default MyComponent;
```

---

## Quality Checklist

- [ ] All magic strings moved to constants
- [ ] Custom hooks created for complex logic
- [ ] Components under 300 lines (or split into sub-components)
- [ ] Error boundaries wrapping major sections
- [ ] API calls use service layer
- [ ] No prop drilling beyond 2 levels
- [ ] Animations defined in centralized file
- [ ] Loading/error states handled
- [ ] Form validation centralized
- [ ] Sensitive data not logged/stored

---

## Next Steps

1. **Review** this document with team
2. **Pick one page** (e.g., Dashboard) for pilot refactoring
3. **Extract components** following the new structure
4. **Test thoroughly** to ensure no functionality breaks
5. **Iterate** on other pages
6. **Document** final structure for team

---

**Expected Benefits:**
- ✅ 40% reduction in code duplication
- ✅ Faster feature development (reusable components)
- ✅ Easier debugging (smaller, focused components)
- ✅ Better performance (memoization, code splitting)
- ✅ Improved testability (pure functions, isolated logic)
- ✅ Onboarding new team members (clear patterns)

