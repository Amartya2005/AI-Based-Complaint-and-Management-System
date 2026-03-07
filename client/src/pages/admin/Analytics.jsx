import React, { useState, useEffect } from 'react';
import { fetchComplaints } from '../../services/complaints';
import Card from '../../components/Card';
import { FolderOpen, ShieldCheck, Cog, Inbox, Activity, Users } from 'lucide-react';

const Analytics = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchComplaints()
            .then(setComplaints)
            .catch(() => setError('Failed to load analytics data.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center justify-center p-12 text-[#00c4cc] font-medium">Loading advanced analytics...</div>;

    const total = complaints.length;

    // --- Core Metrics ---
    const resolved = complaints.filter(c => c.status === 'RESOLVED').length;
    const pending = complaints.filter(c => c.status === 'PENDING').length;
    const inProgress = complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length;
    const rejected = complaints.filter(c => c.status === 'REJECTED').length;

    // --- Distribution Data ---
    const categoryData = {
        Hostel: complaints.filter(c => c.category === 'HOSTEL').length,
        Administrative: complaints.filter(c => c.category === 'ADMINISTRATIVE').length,
        Academic: complaints.filter(c => c.category === 'ACADEMIC').length,
    };

    const statusData = {
        Pending: pending,
        'Active Work': inProgress,
        Resolved: resolved,
        Rejected: rejected,
    };

    const pct = (n) => (total === 0 ? 0 : Math.round((n / total) * 100));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-[#2c323f]">System Analytics</h1>
                    <p className="text-gray-500 text-sm mt-1">Real-time performance and resolution metrics from the database</p>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>}

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-none shadow-sm flex items-center p-5">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg mr-4"><FolderOpen size={24} /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Total Filed</p>
                        <h3 className="text-2xl font-bold text-gray-800">{total}</h3>
                    </div>
                </Card>
                <Card className="bg-white border-none shadow-sm flex items-center p-5">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg mr-4"><ShieldCheck size={24} /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Resolved</p>
                        <h3 className="text-2xl font-bold text-gray-800">{resolved}</h3>
                    </div>
                </Card>
                <Card className="bg-white border-none shadow-sm flex items-center p-5">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-lg mr-4"><Cog size={24} /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Active / In Progress</p>
                        <h3 className="text-2xl font-bold text-gray-800">{inProgress}</h3>
                    </div>
                </Card>
                <Card className="bg-white border-none shadow-sm flex items-center p-5">
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg mr-4"><Inbox size={24} /></div>
                    <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Pending Setup</p>
                        <h3 className="text-2xl font-bold text-gray-800">{pending}</h3>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Distribution (GIET Theme Bars) */}
                <Card className="border-t-[3px] border-[#00c4cc]">
                    <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <Users size={18} className="text-[#00c4cc]" /> Department Workload
                    </h2>
                    <div className="space-y-5">
                        {Object.entries(categoryData).map(([name, count]) => (
                            <div key={name}>
                                <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                                    <span>{name}</span>
                                    <span>{count} tickets</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-sm h-3 overflow-hidden">
                                    <div
                                        className="bg-[#00c4cc] h-full"
                                        style={{ width: `${pct(count)}%`, backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Status Pipeline */}
                <Card className="border-t-[3px] border-[#2c323f]">
                    <h2 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
                        <Activity size={18} className="text-[#2c323f]" /> Resolution Pipeline
                    </h2>
                    <div className="flex flex-col gap-4">
                        {Object.entries(statusData).map(([name, count]) => (
                            <div key={name} className="flex items-center gap-4">
                                <div className="w-24 text-right text-sm font-semibold text-gray-600">{name}</div>
                                <div className="flex-1 bg-gray-100 rounded-sm h-6 relative overflow-hidden flex items-center">
                                    <div
                                        className={`h-full ${name === 'Resolved' ? 'bg-[#28a745]' : name === 'Pending' ? 'bg-[#ffc107]' : name === 'Rejected' ? 'bg-red-500' : 'bg-[#17a2b8]'}`}
                                        style={{ width: `${pct(count)}%` }}
                                    />
                                    <span className="absolute left-2 text-xs font-bold mix-blend-difference text-white">
                                        {pct(count)}%
                                    </span>
                                </div>
                                <div className="w-8 text-sm font-bold text-gray-800">{count}</div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;
