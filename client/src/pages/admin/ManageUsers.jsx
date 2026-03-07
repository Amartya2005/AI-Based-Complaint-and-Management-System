import React, { useState, useEffect } from 'react';
import { fetchUsers, createUser } from '../../services/users';
import { fetchComplaints, assignComplaint } from '../../services/complaints';
import api from '../../services/api';
import Card from '../../components/Card';
import { UserPlus, Search, X, CheckCircle } from 'lucide-react';

const ManageUsers = ({ type }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');

    // New user form
    const [showForm, setShowForm] = useState(false);
    const [newUser, setNewUser] = useState({
        college_id: '', name: '', email: '', password: '', role: type.toUpperCase(), department_id: null
    });
    const [isCreating, setIsCreating] = useState(false);

    // Assign complaint panel (staff only)
    const [complaints, setComplaints] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedComplaint, setSelectedComplaint] = useState('');
    const [selectedStaff, setSelectedStaff] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    const loadUsers = () => {
        setLoading(true);
        fetchUsers(type)
            .then(setUsers)
            .catch(() => setError('Failed to load users.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadUsers();
        // Load departments for dropdown
        api.get('/departments/').then(r => setDepartments(r.data)).catch(() => { });
        if (type === 'staff') {
            fetchComplaints()
                .then(data => setComplaints(data.filter(c => c.status === 'PENDING' || c.status === 'ASSIGNED')))
                .catch(() => { });
        }
    }, [type]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        setError(''); setSuccess('');
        try {
            await createUser({ ...newUser, department_id: newUser.department_id ? parseInt(newUser.department_id) : null });
            setSuccess(`${type} account created successfully.`);
            setShowForm(false);
            setNewUser({ college_id: '', name: '', email: '', password: '', role: type.toUpperCase(), department_id: null });
            loadUsers();
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Failed to create user.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!selectedComplaint || !selectedStaff) return;
        setIsAssigning(true); setError(''); setSuccess('');
        try {
            await assignComplaint(parseInt(selectedComplaint), parseInt(selectedStaff));
            setSuccess(`Complaint #${selectedComplaint} assigned to Staff #${selectedStaff}.`);
            setSelectedComplaint(''); setSelectedStaff('');
            fetchComplaints().then(d => setComplaints(d.filter(c => c.status === 'PENDING'))).catch(() => { });
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Assignment failed.');
        } finally {
            setIsAssigning(false);
        }
    };

    const title = type === 'student' ? 'Manage Students' : 'Manage Staff';
    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.college_id.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-3xl font-bold text-primary">{title}</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white px-5 py-2.5 rounded-lg font-semibold shadow transition"
                >
                    {showForm ? <X size={18} /> : <UserPlus size={18} />}
                    {showForm ? 'Cancel' : `Add ${type === 'student' ? 'Student' : 'Staff'}`}
                </button>
            </div>

            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle size={16} /> {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">{error}</div>
            )}

            {/* Create User Form */}
            {showForm && (
                <Card className="border-t-4 border-accent">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">New {type === 'student' ? 'Student' : 'Staff'} Account</h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { field: 'college_id', label: 'College ID', placeholder: 'e.g. CS2024001', type: 'text' },
                            { field: 'name', label: 'Full Name', placeholder: 'Full name', type: 'text' },
                            { field: 'email', label: 'Email', placeholder: 'user@college.edu', type: 'email' },
                            { field: 'password', label: 'Password', placeholder: 'Min 8 characters', type: 'password' },
                        ].map(({ field, label, placeholder, type: inputType }) => (
                            <div key={field}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                <input
                                    type={inputType}
                                    required
                                    placeholder={placeholder}
                                    value={newUser[field]}
                                    onChange={e => setNewUser({ ...newUser, [field]: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        ))}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department (optional)</label>
                            <select
                                value={newUser.department_id ?? ''}
                                onChange={e => setNewUser({ ...newUser, department_id: e.target.value ? parseInt(e.target.value) : null })}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none bg-white"
                            >
                                <option value="">No department</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="px-6 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg font-semibold shadow transition disabled:opacity-70"
                            >
                                {isCreating ? 'Creating...' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Assign Complaint (Staff page only) */}
            {type === 'staff' && complaints.length > 0 && (
                <Card className="border-t-4 border-primary">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Assign Pending Complaint to Staff</h2>
                    <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Complaint</label>
                            <select
                                required
                                value={selectedComplaint}
                                onChange={e => setSelectedComplaint(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none bg-white"
                            >
                                <option value="">Select complaint</option>
                                {complaints.map(c => (
                                    <option key={c.id} value={c.id}>#{c.id} — {c.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Staff</label>
                            <select
                                required
                                value={selectedStaff}
                                onChange={e => setSelectedStaff(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none bg-white"
                            >
                                <option value="">Select staff member</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.college_id})</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={isAssigning}
                            className="px-5 py-2.5 bg-primary hover:bg-primary-light text-white rounded-lg font-semibold shadow transition disabled:opacity-70"
                        >
                            {isAssigning ? 'Assigning...' : 'Assign'}
                        </button>
                    </form>
                </Card>
            )}

            {/* Users Table */}
            <Card>
                <div className="mb-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder={`Search ${type}s...`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    {['ID', 'College ID', 'Name', 'Email', 'Dept', 'Status'].map(h => (
                                        <th key={h} className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => (
                                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                                        <td className="py-3 px-4 text-sm font-mono text-gray-500">{u.id}</td>
                                        <td className="py-3 px-4 text-sm font-medium text-gray-700">{u.college_id}</td>
                                        <td className="py-3 px-4 text-sm text-gray-800">{u.name}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">{u.email}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">{u.department_id ?? '—'}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {u.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">No users found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ManageUsers;
