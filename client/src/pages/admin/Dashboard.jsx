import React, { useState, useEffect } from 'react';
import { fetchComplaints } from '../../services/complaints';
import { FileText, Clock, CheckCircle, Users, MoreHorizontal, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Loader from '../../components/Loader';

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

    const pending = complaints.filter(c => c.status === 'PENDING').length;
    const active = complaints.filter(c => ['ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length;
    const resolved = complaints.filter(c => c.status === 'RESOLVED').length;
    const total = complaints.length;

    // Derived mock stats for KPIs
    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;
    const pendingRate = total > 0 ? ((pending / total) * 100).toFixed(1) : 0;

    // Transform data for Bar Chart (Mocking monthly data by spreading the existing complaints for demo purposes)
    // Normally we would group by created_at. Here we will do a simple distribution if data is too small.
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let barData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return {
            name: monthNames[d.getMonth()],
            Pending: 0,
            Active: 0,
            Resolved: 0
        };
    });

    if (complaints.length > 0) {
        // Group available complaints into the months (very simplistic for demo)
        complaints.forEach(c => {
            const date = new Date(c.created_at + 'Z');
            const monthName = monthNames[date.getMonth()];
            const targetMonth = barData.find(m => m.name === monthName);
            if (targetMonth) {
                if (c.status === 'PENDING') targetMonth.Pending += 1;
                else if (c.status === 'RESOLVED') targetMonth.Resolved += 1;
                else targetMonth.Active += 1;
            } else {
                // Push to recent if month not in window just so we show data
                const last = barData[barData.length - 1];
                if (c.status === 'PENDING') last.Pending += 1;
                else if (c.status === 'RESOLVED') last.Resolved += 1;
                else last.Active += 1;
            }
        });
    } else {
        // Mock data to just show the design if empty
        barData = [
            { name: 'May', Pending: 10, Active: 5, Resolved: 20 },
            { name: 'Jun', Pending: 15, Active: 10, Resolved: 15 },
            { name: 'Jul', Pending: 8, Active: 12, Resolved: 25 },
            { name: 'Aug', Pending: 20, Active: 8, Resolved: 10 },
            { name: 'Sep', Pending: 5, Active: 15, Resolved: 30 },
            { name: 'Oct', Pending: Math.max(1, pending), Active: Math.max(1, active), Resolved: Math.max(1, resolved) },
        ];
    }

    // Pie chart data
    const pieData = [
        { name: 'Hostel', value: complaints.filter(c => c.category === 'HOSTEL').length },
        { name: 'Administrative', value: complaints.filter(c => c.category === 'ADMINISTRATIVE').length },
        { name: 'Academic', value: complaints.filter(c => c.category === 'ACADEMIC').length },
    ];
    const COLORS = ['#00c4cc', '#f1f5f9', '#ffc107', '#ff4d4f']; // Using theme colors + a light gray

    // Motion variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6 text-gray-800"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <motion.h1 variants={itemVariants} className="text-3xl font-extrabold text-gray-900 tracking-tight">Analytics Overview</motion.h1>
                <motion.div variants={itemVariants} className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-sm">
                        Export Report
                    </button>
                    <Link to="/admin/analytics" className="px-4 py-2 bg-[#00c4cc] hover:bg-[#00a1a8] text-white text-sm font-medium rounded-lg transition shadow-sm shadow-[#00c4cc]/30">
                        Detailed View
                    </Link>
                </motion.div>
            </div>

            {error && (
                <motion.div variants={itemVariants} className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-sm text-sm">{error}</motion.div>
            )}

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { title: "Total Volume", value: total, trend: "+12.5%", isUp: true, desc: "vs last month" },
                    { title: "Resolution Rate", value: `${resolutionRate}%`, trend: "+5.2%", isUp: true, desc: "this week" },
                    { title: "Pending Queue", value: pending, trend: "-2.4%", isUp: false, desc: "vs last week", isGoodIfDown: true },
                    { title: "Active Cases", value: active, trend: "+1.5%", isUp: true, desc: "vs yesterday", isWarning: true }
                ].map((kpi, i) => (
                    <motion.div key={i} variants={itemVariants} className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-sm font-semibold text-gray-500">{kpi.title}</h3>
                            <button className="text-gray-400 hover:text-gray-600 transition"><MoreHorizontal size={18} /></button>
                        </div>
                        <div>
                            <div className="flex items-end justify-between">
                                <span className="text-3xl font-black text-gray-900">{kpi.value}</span>
                                {/* Little decorative dummy bars for styling */}
                                <div className="flex items-end gap-1 h-8 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <div className="w-1.5 bg-gray-200 rounded-t h-3" />
                                    <div className="w-1.5 bg-gray-200 rounded-t h-5" />
                                    <div className="w-1.5 bg-[#00c4cc]/40 rounded-t h-8" />
                                    <div className="w-1.5 bg-[#00c4cc] rounded-t h-6" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3 text-xs font-medium">
                                <span className={`flex items-center ${(kpi.isUp && !kpi.isWarning) || (!kpi.isUp && kpi.isGoodIfDown) ? 'text-emerald-500' : 'text-rose-500'
                                    }`}>
                                    {kpi.isUp ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
                                    {kpi.trend}
                                </span>
                                <span className="text-gray-400 font-normal">{kpi.desc}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Middle Row: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Bar Chart Container */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-gray-900">Complaints Summary Over Time</h2>
                            <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-gray-500">
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#00c4cc]"></div> Resolved</div>
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div> Pending</div>
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-100" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #e5e7eb 2px, #e5e7eb 4px)' }}></div> Active</div>
                            </div>
                        </div>
                        <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600 flex items-center gap-2 cursor-pointer shadow-sm">
                            <Clock size={14} /> Last 6 Months
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px 16px', fontWeight: 600 }}
                                    itemStyle={{ fontSize: '13px' }}
                                    labelStyle={{ color: '#64748b', marginBottom: '8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                />
                                <Bar dataKey="Resolved" stackId="a" fill="#00c4cc" radius={[0, 0, 4, 4]} />
                                <Bar dataKey="Active" stackId="a" fill="#e2e8f0" />
                                <Bar dataKey="Pending" stackId="a" fill="#f1f5f9" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Donut Chart Container */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-lg font-bold text-gray-900">Category Distribution</h2>
                        <button className="text-gray-400 hover:text-gray-600 transition"><MoreHorizontal size={18} /></button>
                    </div>

                    <div className="flex items-end gap-3 mb-2">
                        <span className="text-4xl font-black text-gray-900">{total}</span>
                        <span className="text-sm font-medium text-emerald-500 mb-1 flex items-center">
                            <ArrowUpRight size={14} className="mr-0.5" /> Active Logs
                        </span>
                    </div>

                    <div className="flex-1 w-full min-h-[200px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center text for donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                            <span className="text-2xl font-bold text-gray-900 leading-none">{total}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-1">Issues</span>
                        </div>
                    </div>

                    {/* Custom Legend */}
                    <div className="flex justify-center gap-4 mt-2">
                        {pieData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1.5 cursor-pointer group">
                                <div className="w-3 h-3 rounded box-border" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                                    {entry.name.slice(0, 6)}: {entry.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

            </div>

            {/* Bottom Table */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Recent Operational Activity</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search records..."
                                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c4cc]/30 w-48 sm:w-64 transition-all"
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <button className="p-2 border border-gray-100 bg-gray-50 text-gray-500 hover:text-gray-800 rounded-lg transition"><MoreHorizontal size={18} /></button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Complaint Context</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Assigned Staff</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Priority</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Reported Date</th>
                                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...complaints].reverse().slice(0, 6).map((c, idx) => (
                                <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {/* Beautiful status toggle mimicking image */}
                                            <div className={`w-8 h-4 rounded-full flex items-center p-0.5 ${c.status === 'RESOLVED' ? 'bg-emerald-500 justify-end' : c.status === 'PENDING' ? 'bg-gray-200 justify-start' : 'bg-[#00c4cc] justify-center'}`}>
                                                <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-900 truncate max-w-[200px]">{c.title}</p>
                                        <p className="text-xs text-gray-400 capitalize mt-0.5">{c.category?.toLowerCase()}</p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                        {c.assigned_to_id ? `Staff #${c.assigned_to_id}` : <span className="text-gray-400">Unassigned</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600 uppercase tracking-wider">
                                            {c.priority_level || 'Normal'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-medium font-mono text-xs">
                                        {new Date(c.created_at + 'Z').toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-xs font-semibold text-gray-400 group-hover:text-gray-800 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg hover:border-gray-200 transition-all flex items-center gap-1.5 ml-auto">
                                            Report <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AdminDashboard;
