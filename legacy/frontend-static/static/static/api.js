// ─── API Base ───────────────────────────────────────────────────────────────
const BASE = 'http://127.0.0.1:8000';

function getToken() { return localStorage.getItem('token'); }
function getUser()  { return JSON.parse(localStorage.getItem('user') || 'null'); }

async function request(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || JSON.stringify(err));
  }
  return res.status === 204 ? null : res.json();
}

// ─── Auth ───────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const form = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

// ─── Users ──────────────────────────────────────────────────────────────────
export const createUser  = (data)        => request('POST', '/users/', data);
export const getUsers    = (role = '')   => request('GET', `/users/${role ? '?role=' + role : ''}`);

// ─── Complaints ─────────────────────────────────────────────────────────────
export const createComplaint = (data)              => request('POST', '/complaints/', data);
export const getComplaints   = ()                  => request('GET',  '/complaints/');
export const assignComplaint = (id, staff_id)      => request('PATCH', `/complaints/${id}/assign`, { staff_id });
export const updateStatus    = (id, new_status, remarks = '') =>
  request('PATCH', `/complaints/${id}/status`, { new_status, remarks });

// ─── Notifications ───────────────────────────────────────────────────────────
export const getNotifications   = ()   => request('GET',   '/notifications/');
export const markNotifRead      = (id) => request('PATCH', `/notifications/${id}/read`);
