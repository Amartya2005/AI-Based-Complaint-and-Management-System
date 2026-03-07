import React, { useState, useEffect } from 'react';
import { fetchComplaints } from '../../services/complaints';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { Inbox } from 'lucide-react';

const CATEGORIES = ['All', 'HOSTEL', 'ADMINISTRATIVE', 'ACADEMIC'];

const StaffDashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchComplaints()
            .then(setComplaints)
            .catch(() => setError('Failed to load assigned complaints.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-primary font-medium">Loading assigned complaints...</div>;

    const filtered = filter === 'All' ? complaints : complaints.filter(c => c.category === filter);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-3xl font-bold text-primary">Assigned Complaints</h1>
                <div className="flex flex-wrap gap-1.5 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${filter === cat ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {cat === 'All' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">{error}</div>
            )}

            <Card>
                {filtered.length === 0 ? (
                    <div className="text-center py-14 text-gray-400">
                        <Inbox size={40} className="mx-auto mb-3 opacity-40" />
                        <p>No complaints found for this category.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Student ID</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c) => (
                                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                                        <td className="py-3.5 px-4 text-sm font-mono text-gray-500">#{c.id}</td>
                                        <td className="py-3.5 px-4 text-sm text-gray-800 font-medium max-w-xs truncate">{c.title}</td>
                                        <td className="py-3.5 px-4 text-sm">
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded capitalize">
                                                {c.category?.toLowerCase()}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-sm text-gray-500 font-mono">{c.student_id}</td>
                                        <td className="py-3.5 px-4 text-sm text-gray-500">
                                            {new Date(c.created_at + 'Z').toLocaleDateString()}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <StatusBadge status={c.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default StaffDashboard;
