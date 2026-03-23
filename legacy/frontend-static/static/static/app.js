import * as api from './api.js';

// ─── State ───────────────────────────────────────────────────────────────────
let currentPage = '';

// ─── Toast ───────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function parseJwt(token) {
    try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function saveSession(tokenData) {
    localStorage.setItem('token', tokenData.access_token);
    const payload = parseJwt(tokenData.access_token);
    localStorage.setItem('user', JSON.stringify(payload));
}

function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function isLoggedIn() { return !!localStorage.getItem('token'); }

// ─── Show / hide sections ─────────────────────────────────────────────────────
function showAuth() {
    document.getElementById('auth-section').style.display = 'flex';
    document.getElementById('app-section').style.display = 'none';
}

function showApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'flex';
    buildNav();
    loadNotifications();
    navigateTo(getDefaultPage());
}

function getDefaultPage() {
    const u = api.getUser();
    if (!u) return 'dashboard';
    if (u.role === 'STUDENT') return 'my-complaints';
    if (u.role === 'STAFF') return 'assigned-complaints';
    return 'dashboard'; // ADMIN
}

// ─── Header ───────────────────────────────────────────────────────────────────
function buildHeader() {
    const u = api.getUser();
    if (!u) return;
    document.getElementById('header-role').textContent = u.role;
    document.getElementById('header-role').className = `role-badge role-${u.role}`;
    document.getElementById('header-user').textContent = u.college_id || '';
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_CONFIG = {
    STUDENT: [
        { id: 'my-complaints', icon: '📋', label: 'My Complaints' },
        { id: 'submit-complaint', icon: '✏️', label: 'Submit Complaint' },
    ],
    STAFF: [
        { id: 'assigned-complaints', icon: '📌', label: 'Assigned to Me' },
    ],
    ADMIN: [
        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'all-complaints', icon: '📋', label: 'All Complaints' },
        { id: 'create-user', icon: '👤', label: 'Create User' },
    ],
};

function buildNav() {
    const u = api.getUser();
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = '';
    buildHeader();
    const items = NAV_CONFIG[u?.role] || [];
    items.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'nav-item';
        btn.dataset.page = item.id;
        btn.innerHTML = `<span class="nav-icon">${item.icon}</span>${item.label}`;
        btn.onclick = () => navigateTo(item.id);
        nav.appendChild(btn);
    });
}

function navigateTo(pageId) {
    currentPage = pageId;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    const page = document.getElementById(`page-${pageId}`);
    if (page) page.classList.add('active');
    const btn = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (btn) btn.classList.add('active');
    // Load page data
    const loaders = {
        'my-complaints': loadMyComplaints,
        'assigned-complaints': loadAssignedComplaints,
        'all-complaints': loadAllComplaints,
        'dashboard': loadAdminDashboard,
        'submit-complaint': () => { },
        'create-user': () => { },
    };
    (loaders[pageId] || (() => { }))();
}

// ─── Notifications ─────────────────────────────────────────────────────────────
async function loadNotifications() {
    try {
        const notifs = await api.getNotifications();
        const list = document.getElementById('notif-list');
        const badge = document.getElementById('notif-badge');
        const unread = notifs.filter(n => !n.is_read);
        badge.textContent = unread.length;
        badge.style.display = unread.length ? 'flex' : 'none';
        if (!notifs.length) {
            list.innerHTML = '<div class="notif-empty">No notifications yet</div>';
            return;
        }
        list.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.is_read ? 'read' : 'unread'}" data-id="${n.id}">
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${new Date(n.created_at).toLocaleString()}</div>
      </div>`).join('');
        list.querySelectorAll('.notif-item.unread').forEach(el => {
            el.onclick = async () => {
                await api.markNotifRead(el.dataset.id).catch(() => { });
                el.classList.replace('unread', 'read');
                loadNotifications();
            };
        });
    } catch (e) { /* silently ignore */ }
}

// ─── Student: My Complaints ───────────────────────────────────────────────────
async function loadMyComplaints() {
    const tbody = document.getElementById('my-complaints-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem"><span class="spinner"></span></td></tr>';
    try {
        const complaints = await api.getComplaints();
        if (!complaints.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No complaints submitted yet.</td></tr>';
            return;
        }
        tbody.innerHTML = complaints.map(c => `
      <tr>
        <td>#${c.id}</td>
        <td>${c.title}</td>
        <td><span class="pill pill-${c.category}">${c.category}</span></td>
        <td><span class="pill pill-${c.status}">${c.status.replace('_', ' ')}</span></td>
        <td>${new Date(c.created_at).toLocaleDateString()}</td>
      </tr>`).join('');
    } catch (e) { toast(e.message, 'error'); }
}

// ─── Student: Submit Complaint ────────────────────────────────────────────────
document.getElementById('submit-complaint-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Submitting…';
    try {
        await api.createComplaint({
            title: document.getElementById('c-title').value,
            description: document.getElementById('c-desc').value,
            category: document.getElementById('c-category').value,
        });
        toast('Complaint submitted!', 'success');
        e.target.reset();
        navigateTo('my-complaints');
    } catch (err) { toast(err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Submit Complaint'; }
});

// ─── Staff: Assigned Complaints ───────────────────────────────────────────────
async function loadAssignedComplaints() {
    const tbody = document.getElementById('assigned-complaints-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem"><span class="spinner"></span></td></tr>';
    try {
        const complaints = await api.getComplaints();
        if (!complaints.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No complaints assigned to you yet.</td></tr>';
            return;
        }
        tbody.innerHTML = complaints.map(c => `
      <tr>
        <td>#${c.id}</td>
        <td>${c.title}</td>
        <td><span class="pill pill-${c.category}">${c.category}</span></td>
        <td><span class="pill pill-${c.status}">${c.status.replace('_', ' ')}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="openStatusModal(${c.id}, '${c.status}')">Update Status</button>
        </td>
      </tr>`).join('');
    } catch (e) { toast(e.message, 'error'); }
}

// Status update modal
window.openStatusModal = function (id, currentStatus) {
    document.getElementById('status-complaint-id').value = id;
    document.getElementById('status-select').value = currentStatus;
    document.getElementById('status-remarks').value = '';
    openModal('status-modal');
};

document.getElementById('status-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    try {
        const id = document.getElementById('status-complaint-id').value;
        const status = document.getElementById('status-select').value;
        const remarks = document.getElementById('status-remarks').value;
        await api.updateStatus(id, status, remarks);
        toast('Status updated!', 'success');
        closeModal('status-modal');
        loadAssignedComplaints();
    } catch (err) { toast(err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Update Status'; }
});

// ─── Admin: Dashboard ──────────────────────────────────────────────────────────
async function loadAdminDashboard() {
    try {
        const complaints = await api.getComplaints();
        document.getElementById('stat-total').textContent = complaints.length;
        document.getElementById('stat-pending').textContent = complaints.filter(c => c.status === 'PENDING').length;
        document.getElementById('stat-resolved').textContent = complaints.filter(c => c.status === 'RESOLVED').length;
        document.getElementById('stat-progress').textContent = complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
    } catch (e) { /* ignore */ }
}

// ─── Admin: All Complaints ────────────────────────────────────────────────────
async function loadAllComplaints() {
    const tbody = document.getElementById('all-complaints-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem"><span class="spinner"></span></td></tr>';
    try {
        const [complaints, staff] = await Promise.all([api.getComplaints(), api.getUsers('STAFF')]);
        window._staff = staff;
        if (!complaints.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No complaints yet.</td></tr>';
            return;
        }
        tbody.innerHTML = complaints.map(c => `
      <tr>
        <td>#${c.id}</td>
        <td>${c.title}</td>
        <td><span class="pill pill-${c.category}">${c.category}</span></td>
        <td><span class="pill pill-${c.status}">${c.status.replace('_', ' ')}</span></td>
        <td>${c.assigned_to || '—'}</td>
        <td>
          ${c.status === 'PENDING'
                ? `<button class="btn btn-sm btn-primary" onclick="openAssignModal(${c.id})">Assign</button>`
                : `<span style="color:var(--muted);font-size:.8rem">Assigned</span>`}
        </td>
      </tr>`).join('');
    } catch (e) { toast(e.message, 'error'); }
}

window.openAssignModal = function (id) {
    document.getElementById('assign-complaint-id').value = id;
    const sel = document.getElementById('assign-staff-select');
    sel.innerHTML = (window._staff || []).map(s => `<option value="${s.id}">${s.name} (${s.college_id})</option>`).join('');
    openModal('assign-modal');
};

document.getElementById('assign-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    try {
        const id = document.getElementById('assign-complaint-id').value;
        const staff_id = parseInt(document.getElementById('assign-staff-select').value);
        await api.assignComplaint(id, staff_id);
        toast('Complaint assigned!', 'success');
        closeModal('assign-modal');
        loadAllComplaints();
    } catch (err) { toast(err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Assign'; }
});

// ─── Admin: Create User ────────────────────────────────────────────────────────
document.getElementById('create-user-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating…';
    try {
        await api.createUser({
            college_id: document.getElementById('u-college-id').value,
            name: document.getElementById('u-name').value,
            email: document.getElementById('u-email').value,
            password: document.getElementById('u-password').value,
            role: document.getElementById('u-role').value,
        });
        toast('User created successfully!', 'success');
        e.target.reset();
    } catch (err) { toast(err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Create User'; }
});

// ─── Modal helpers ────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});
window.closeModal = closeModal;

// ─── Notification panel ───────────────────────────────────────────────────────
document.getElementById('notif-toggle')?.addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('notif-panel').classList.toggle('open');
});
document.addEventListener('click', () => document.getElementById('notif-panel')?.classList.remove('open'));
document.getElementById('notif-panel')?.addEventListener('click', e => e.stopPropagation());

// ─── Login form ───────────────────────────────────────────────────────────────
document.getElementById('login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type=submit]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Logging in…';
    try {
        const data = await api.login(
            document.getElementById('email').value,
            document.getElementById('password').value,
        );
        saveSession(data);
        showApp();
    } catch (err) {
        toast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Login';
    }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
document.getElementById('logout-btn')?.addEventListener('click', () => {
    clearSession();
    showAuth();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
if (isLoggedIn()) showApp(); else showAuth();
