import React, { useState, useEffect } from 'react';
import { fetchComplaints, updateComplaint } from '../../services/complaints';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { Edit3, CheckCircle } from 'lucide-react';

// Statuses staff can set (cannot go back to PENDING or ASSIGNED)
const ALLOWED_STATUSES = ['IN_PROGRESS', 'RESOLVED', 'REJECTED'];

const UpdateStatus = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [newStatus, setNewStatus] = useState('IN_PROGRESS');
    const [remarks, setRemarks] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [error, setError] = useState('');

    const loadComplaints = () => {
        setLoading(true);
        fetchComplaints()
            .then((data) => setComplaints(data.filter(c => !['PENDING', 'RESOLVED', 'REJECTED'].includes(c.status))))
            .catch(() => setError('Failed to load complaints.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadComplaints(); }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedId) return;
        setIsUpdating(true);
        setError('');
        setSuccessMsg('');
        try {
            await updateComplaint(selectedId, newStatus, remarks);
            setSuccessMsg(`Complaint #${selectedId} updated to ${newStatus.replace('_', ' ')}.`);
            setSelectedId(null);
            setRemarks('');
            loadComplaints();
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Failed to update. Check your permissions.');
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return <div className="text-primary font-medium">Loading complaints...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Update Complaint Status</h1>

            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle size={16} /> {successMsg}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">{error}</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Complaint List */}
                <div className="lg:col-span-2 space-y-3">
                    <h2 className="text-base font-semibold text-gray-700">Active Complaints — check to select</h2>
                    {complaints.length === 0 ? (
                        <Card><p className="text-gray-500 text-sm">No active complaints require attention.</p></Card>
                    ) : (
                        complaints.map(c => (
                            <Card
                                key={c.id}
                                className={`border-2 transition-all ${selectedId === c.id ? 'border-primary bg-blue-50/40' : 'border-transparent hover:border-blue-100'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <input
                                            type="checkbox"
                                            id={`complaint-${c.id}`}
                                            checked={selectedId === c.id}
                                            onChange={() => setSelectedId(selectedId === c.id ? null : c.id)}
                                            className="w-4 h-4 accent-primary cursor-pointer"
                                        />
                                        <label htmlFor={`complaint-${c.id}`} className="font-mono text-xs text-gray-400 cursor-pointer">#{c.id}</label>
                                        <StatusBadge status={c.status} />
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                                            {c.category?.toLowerCase()}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                        {new Date(c.created_at + 'Z').toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-gray-900 mt-2">{c.title}</h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                            </Card>
                        ))
                    )}
                </div>

                {/* Action Panel */}
                <div>
                    <Card className="sticky top-8 border-t-4 border-accent">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Edit3 size={18} className="text-accent" /> Action Panel
                        </h2>
                        {!selectedId ? (
                            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-sm text-gray-400">Select a complaint to update</p>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm">
                                    Updating: <span className="font-bold text-primary font-mono">#{selectedId}</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                                    <select
                                        value={newStatus}
                                        onChange={e => setNewStatus(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none bg-white"
                                    >
                                        {ALLOWED_STATUSES.map(s => (
                                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Remarks <span className="text-gray-400 text-xs">(optional)</span>
                                    </label>
                                    <textarea
                                        rows="4"
                                        value={remarks}
                                        onChange={e => setRemarks(e.target.value)}
                                        required={false}
                                        placeholder="Add resolution notes..."
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="w-full py-3 bg-primary hover:bg-primary-light text-white rounded-lg font-semibold shadow transition disabled:opacity-70"
                                >
                                    {isUpdating ? 'Saving...' : 'Apply Update'}
                                </button>
                            </form>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UpdateStatus;
