import React, { useState, useEffect } from 'react';
import { fetchComplaints } from '../../services/complaints';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';

const MyComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchComplaints()
            .then((data) => setComplaints([...data].reverse()))
            .catch(() => setError('Could not load your complaints.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-primary font-medium">Loading your complaints...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">My Complaints</h1>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">{error}</div>
            )}

            {complaints.length === 0 ? (
                <Card className="text-center py-12 text-gray-400">
                    <p>You have no complaints on record.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {complaints.map((c) => (
                        <Card key={c.id} className="hover:shadow-md transition">
                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-2 pb-4 mb-4 border-b border-gray-100">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-gray-400">#{c.id}</span>
                                        <StatusBadge status={c.status} />
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                                            {c.category?.toLowerCase()}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mt-1">{c.title}</h3>
                                </div>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {new Date(c.created_at + 'Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>

                            <p className="text-sm text-gray-700 leading-relaxed">{c.description}</p>

                            {c.assigned_to && (
                                <div className="mt-3 text-xs text-gray-500">
                                    Assigned to Staff ID: <strong>{c.assigned_to}</strong>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyComplaints;
