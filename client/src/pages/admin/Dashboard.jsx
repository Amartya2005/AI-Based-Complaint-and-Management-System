import React, { useState, useEffect } from "react";
import { fetchComplaints, reassignComplaint } from "../../services/complaints";
import {
  FileText,
  Clock,
  CheckCircle,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Loader from "../../components/Loader";
import { generatePDFReport } from "../../utils/pdfExport";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import { useToast } from "../../context/ToastContext";
import {
  formatDate,
  formatEnumLabel,
  parseApiDate,
} from "../../utils/formatters";

void motion;

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [routingId, setRoutingId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchComplaints({ sortBy: "priority" })
      .then(setComplaints)
      .catch(() => setError("Failed to load system data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader message="Loading system analytics..." />;

  const pending = complaints.filter((c) => c.status === "PENDING").length;
  const active = complaints.filter((c) =>
    ["ASSIGNED", "IN_PROGRESS"].includes(c.status),
  ).length;
  const resolved = complaints.filter((c) => c.status === "RESOLVED").length;
  const total = complaints.length;

  // Handle PDF export
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const stats = { total, pending, active, resolved };
      generatePDFReport(complaints, stats);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    } finally {
      setExporting(false);
    }
  };

  // Derived mock stats for KPIs
  const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;
  const filteredActivity = [...complaints]
    .filter((complaint) => {
      if (!searchTerm.trim()) {
        return true;
      }

      const term = searchTerm.trim().toLowerCase();
      return (
        complaint.title.toLowerCase().includes(term) ||
        complaint.category.toLowerCase().includes(term) ||
        complaint.status.toLowerCase().includes(term) ||
        complaint.id.toString().includes(term)
      );
    })
    .sort((a, b) => parseApiDate(b.created_at) - parseApiDate(a.created_at))
    .slice(0, 6);

  const handleSmartRouting = async (complaintId) => {
    setRoutingId(complaintId);
    try {
      const updatedComplaint = await reassignComplaint(complaintId);
      setComplaints((prev) =>
        prev.map((complaint) =>
          complaint.id === complaintId ? updatedComplaint : complaint,
        ),
      );
      addToast(
        `Complaint #${complaintId} routed to staff #${updatedComplaint.assigned_to}.`,
        "success",
      );
    } catch (err) {
      const detail = err.response?.data?.detail;
      addToast(
        typeof detail === "string" ? detail : "Smart routing failed.",
        "error",
      );
    } finally {
      setRoutingId(null);
    }
  };

  // Transform data for Bar Chart (Mocking monthly data by spreading the existing complaints for demo purposes)
  // Normally we would group by created_at. Here we will do a simple distribution if data is too small.
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  let barData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      name: monthNames[d.getMonth()],
      Pending: 0,
      Active: 0,
      Resolved: 0,
    };
  });

  if (complaints.length > 0) {
    // Group available complaints into the months (very simplistic for demo)
    complaints.forEach((c) => {
      const date = parseApiDate(c.created_at) || new Date();
      const monthName = monthNames[date.getMonth()];
      const targetMonth = barData.find((m) => m.name === monthName);
      if (targetMonth) {
        if (c.status === "PENDING") targetMonth.Pending += 1;
        else if (c.status === "RESOLVED") targetMonth.Resolved += 1;
        else targetMonth.Active += 1;
      } else {
        // Push to recent if month not in window just so we show data
        const last = barData[barData.length - 1];
        if (c.status === "PENDING") last.Pending += 1;
        else if (c.status === "RESOLVED") last.Resolved += 1;
        else last.Active += 1;
      }
    });
  } else {
    // Mock data to just show the design if empty
    barData = [
      { name: "May", Pending: 10, Active: 5, Resolved: 20 },
      { name: "Jun", Pending: 15, Active: 10, Resolved: 15 },
      { name: "Jul", Pending: 8, Active: 12, Resolved: 25 },
      { name: "Aug", Pending: 20, Active: 8, Resolved: 10 },
      { name: "Sep", Pending: 5, Active: 15, Resolved: 30 },
      {
        name: "Oct",
        Pending: Math.max(1, pending),
        Active: Math.max(1, active),
        Resolved: Math.max(1, resolved),
      },
    ];
  }

  // Pie chart data
  const pieData = [
    {
      name: "Hostel",
      value: complaints.filter((c) => c.category === "HOSTEL").length,
    },
    {
      name: "Administrative",
      value: complaints.filter((c) => c.category === "ADMINISTRATIVE").length,
    },
    {
      name: "Academic",
      value: complaints.filter((c) => c.category === "ACADEMIC").length,
    },
  ];
  const COLORS = ["#00c4cc", "#f1f5f9", "#ffc107", "#ff4d4f"]; // Using theme colors + a light gray

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 text-gray-800"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="page-header">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="eyebrow-chip">Admin Control</span>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Analytics Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
              Live complaint volume, routing health, and escalation pressure
              across the whole system.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stat-chip">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                Open Queue
              </div>
              <div className="mt-1 text-2xl font-black">{pending + active}</div>
            </div>
            <div className="stat-chip">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                Resolved
              </div>
              <div className="mt-1 text-2xl font-black">{resolved}</div>
            </div>
            <div className="stat-chip">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                Critical / High
              </div>
              <div className="mt-1 text-2xl font-black">
                {
                  complaints.filter((c) =>
                    ["CRITICAL", "HIGH"].includes(c.priority_level),
                  ).length
                }
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div
          variants={itemVariants}
          className="text-sm font-medium text-slate-500"
        >
          Smart routing is available directly from recent activity cards.
        </motion.div>
        <motion.div variants={itemVariants} className="flex gap-3">
          <motion.button
            onClick={handleExportPDF}
            disabled={exporting || complaints.length === 0}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-white border border-gray-200 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:border-brand/40 transition shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            {exporting ? "Exporting..." : "Export PDF"}
          </motion.button>
          <Link
            to="/admin/analytics"
            className="px-4 py-2 bg-brand hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition shadow-sm shadow-brand/30"
          >
            Detailed View
          </Link>
        </motion.div>
      </div>

      {error && (
        <motion.div
          variants={itemVariants}
          className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-sm text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            title: "Total Volume",
            value: total,
            trend: "+12.5%",
            isUp: true,
            desc: "vs last month",
            bgGradient: "from-cyan-400 to-blue-500",
            icon: Activity,
          },
          {
            title: "Resolution Rate",
            value: `${resolutionRate}%`,
            trend: "+5.2%",
            isUp: true,
            desc: "this week",
            bgGradient: "from-green-400 to-emerald-500",
            icon: CheckCircle,
          },
          {
            title: "Pending Queue",
            value: pending,
            trend: "-2.4%",
            isUp: false,
            desc: "vs last week",
            isGoodIfDown: true,
            bgGradient: "from-yellow-400 to-orange-500",
            icon: Clock,
          },
          {
            title: "Active Cases",
            value: active,
            trend: "+1.5%",
            isUp: true,
            desc: "vs yesterday",
            isWarning: true,
            bgGradient: "from-purple-400 to-pink-500",
            icon: FileText,
          },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            whileHover={{
              y: -8,
              boxShadow: "0 20px 40px -10px rgba(0,196,204,0.2)",
            }}
            className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col justify-between group cursor-pointer overflow-hidden relative transition-all duration-300"
          >
            {/* Animated Background Gradient */}
            <motion.div
              className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${kpi.bgGradient} opacity-10 group-hover:opacity-20`}
              animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-sm font-semibold text-gray-500">
                {kpi.title}
              </h3>
              <motion.button
                whileHover={{ rotate: 90 }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <MoreHorizontal size={18} />
              </motion.button>
            </div>
            <div className="relative z-10">
              <div className="flex items-end justify-between">
                <motion.span
                  className="text-3xl font-black text-gray-900"
                  animate={{ opacity: [1, 0.8, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {kpi.value}
                </motion.span>
                {/* Animated decorative bars */}
                <motion.div className="flex items-end gap-1 h-8 opacity-60 group-hover:opacity-100 transition-opacity">
                  {[3, 5, 8, 6].map((h, idx) => (
                    <motion.div
                      key={idx}
                      animate={{ height: [h * 4, h * 5, h * 4] }}
                      transition={{
                        duration: 2,
                        delay: idx * 0.2,
                        repeat: Infinity,
                      }}
                      className={`w-1.5 rounded-t ${idx === 2 ? `bg-gradient-to-t ${kpi.bgGradient}` : "bg-gray-200"}`}
                    />
                  ))}
                </motion.div>
              </div>
              <motion.div
                className="flex items-center gap-2 mt-3 text-xs font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.span
                  className={`flex items-center ${(kpi.isUp && !kpi.isWarning) || (!kpi.isUp && kpi.isGoodIfDown) ? "text-emerald-500" : "text-rose-500"}`}
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {kpi.isUp ? (
                    <ArrowUpRight size={14} className="mr-0.5" />
                  ) : (
                    <ArrowDownRight size={14} className="mr-0.5" />
                  )}
                  {kpi.trend}
                </motion.span>
                <span className="text-gray-400 font-normal">{kpi.desc}</span>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart Container */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900">
                Complaints Summary Over Time
              </h2>
              <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00c4cc]"></div>{" "}
                  Resolved
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>{" "}
                  Pending
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full bg-gray-100"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 2px, #e5e7eb 2px, #e5e7eb 4px)",
                    }}
                  ></div>{" "}
                  Active
                </div>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600 flex items-center gap-2 cursor-pointer shadow-sm">
              <Clock size={14} /> Last 6 Months
            </div>
          </div>

          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barSize={32}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    padding: "12px 16px",
                    fontWeight: 600,
                  }}
                  itemStyle={{ fontSize: "13px" }}
                  labelStyle={{
                    color: "#64748b",
                    marginBottom: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                />
                <Bar
                  dataKey="Resolved"
                  stackId="a"
                  fill="#00c4cc"
                  radius={[0, 0, 4, 4]}
                />
                <Bar dataKey="Active" stackId="a" fill="#e2e8f0" />
                <Bar
                  dataKey="Pending"
                  stackId="a"
                  fill="#f1f5f9"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Donut Chart Container */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col"
        >
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-bold text-gray-900">
              Category Distribution
            </h2>
            <button className="text-gray-400 hover:text-gray-600 transition">
              <MoreHorizontal size={18} />
            </button>
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
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                  }}
                  itemStyle={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text for donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-2xl font-bold text-gray-900 leading-none">
                {total}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-1">
                Issues
              </span>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((entry, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 cursor-pointer group"
              >
                <div
                  className="w-3 h-3 rounded box-border"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                  {entry.name.slice(0, 6)}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Cards Grid - Recent Operational Activity */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Recent Operational Activity
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {complaints.length} total complaints
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 w-48 sm:w-64 transition-all"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
            <button className="p-2 border border-gray-100 bg-gray-50 text-gray-500 hover:text-gray-800 rounded-lg transition">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {filteredActivity.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
              No complaints match the current search.
            </div>
          ) : (
            filteredActivity.map((c) => {
              const isClosed = ["RESOLVED", "REJECTED"].includes(c.status);

              return (
                <motion.div
                  key={c.id}
                  whileHover={{ y: -4 }}
                  className="border-2 border-gray-100 rounded-xl p-4 transition-all cursor-pointer group hover:shadow-lg bg-white"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <StatusBadge status={c.status} />
                    <PriorityBadge
                      level={c.priority_level}
                      score={c.priority_score}
                    />
                  </div>

                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-brand transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 bg-white bg-opacity-50 px-2 py-1 rounded w-fit">
                      {formatEnumLabel(c.category)}
                    </p>
                  </div>

                  <div className="space-y-2.5 mb-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Assigned Staff:</span>
                      <span
                        className={
                          c.assigned_to
                            ? "font-semibold text-gray-900 bg-gray-50 px-2 py-1 rounded"
                            : "text-gray-400 italic"
                        }
                      >
                        {c.assigned_to ? `#${c.assigned_to}` : "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Reported:</span>
                      <span className="font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Queue:</span>
                      <span className="font-semibold text-gray-900">
                        {c.status === "PENDING"
                          ? "Awaiting first assignment"
                          : "Active handling"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSmartRouting(c.id)}
                    disabled={routingId === c.id || isClosed}
                    className="w-full bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg transition-all text-xs hover:shadow-md flex items-center justify-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {routingId === c.id
                      ? "Routing..."
                      : isClosed
                        ? "Closed Complaint"
                        : c.assigned_to
                          ? "Smart Reassign"
                          : "Smart Assign"}
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
