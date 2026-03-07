import React, { useState, useEffect } from 'react';
import { fetchComplaints } from '../../services/complaints';
import Card from '../../components/Card';
import { FileText, Clock, CheckCircle, Users, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

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

    if (loading) return <div className="text-primary font-medium">Loading system overview...</div>;

    const pending = complaints.filter(c => c.status === 'PENDING').length;
    const active = complaints.filter(c => ['ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length;
    const resolved = complaints.filter(c => c.status === 'RESOLVED').length;

    const stats = [
        { label: 'Total Complaints', value: complaints.length, icon: FileText, color: 'text-primary', bg: 'bg-blue-50' },
        { label: 'Pending', value: pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        { label: 'Active', value: active, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Resolved', value: resolved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">System Overview</h1>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">{error}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((s, i) => (
                    <Card key={i} className="flex items-center space-x-4">
                        <div className={`p-3.5 rounded-xl ${s.bg}`}>
                            <s.icon size={22} className={s.color} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
                            <h3 className="text-3xl font-bold text-gray-900">{s.value}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { to: '/admin/students', label: 'Manage Students' },
                            { to: '/admin/staff', label: 'Manage Staff' },
                            { to: '/admin/analytics', label: 'View Analytics', className: 'col-span-2' },
                        ].map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`block p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition text-center text-sm font-semibold text-gray-700 ${link.className ?? ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </Card>

                <Card>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Latest Activity</h2>
                    <div className="space-y-3">
                        {[...complaints].reverse().slice(0, 5).map((c) => (
                            <div key={c.id} className="flex items-center justify-between pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                                    <p className="text-xs text-gray-400 capitalize">{c.category?.toLowerCase()} · Student #{c.student_id}</p>
                                </div>
                                <span className="text-xs text-gray-400 ml-3 whitespace-nowrap">
                                    {new Date((c.created_at + 'Z')).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
