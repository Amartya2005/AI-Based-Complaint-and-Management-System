import React, { useState, useEffect } from "react";
import { fetchComplaints } from "../../services/complaints";
import { motion } from "framer-motion";
import {
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  Users,
  Zap,
  BarChart3,
  Filter,
} from "lucide-react";
import { parseApiDate } from "../../utils/formatters";

void motion;

const KPICard = ({ icon: Icon, label, value, subtext, color, bgColor }) => {
  void Icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${bgColor} backdrop-blur-sm rounded-xl p-6 border border-opacity-20 shadow-lg hover:shadow-xl transition-all`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
            {label}
          </p>
          <h3 className={`text-3xl font-bold ${color} mb-1`}>{value}</h3>
          {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
        </div>
        <div className={`${color} p-3 rounded-lg bg-opacity-10`}>
          <Icon size={24} className={color} />
        </div>
      </div>
    </motion.div>
  );
};

const ProgressBar = ({ label, value, max, color, percentage }) => (
  <div className="mb-6">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <span className="text-xs font-bold text-gray-600">
        {value} / {max} ({percentage}%)
      </span>
    </div>
    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full ${color} rounded-full`}
      />
    </div>
  </div>
);

const Analytics = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchComplaints()
      .then(setComplaints)
      .catch(() => setError("Failed to load analytics data."))
      .finally(() => setLoading(false));
  }, []);

  // Filter complaints based on selected filters
  const getFilteredComplaints = () => {
    let filtered = [...complaints];

    // Time filter
    if (timeFilter !== "all") {
      const now = new Date();
      let days = 30;
      if (timeFilter === "7d") days = 7;
      else if (timeFilter === "30d") days = 30;
      else if (timeFilter === "90d") days = 90;

      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((c) => {
        const createdAt = parseApiDate(c.created_at);
        return createdAt ? createdAt >= cutoffDate : false;
      });
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    return filtered;
  };

  const filtered = getFilteredComplaints();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full"
        />
        <p className="mt-4 text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  const total = filtered.length;
  const resolved = filtered.filter((c) => c.status === "RESOLVED").length;
  const pending = filtered.filter((c) => c.status === "PENDING").length;
  const inProgress = filtered.filter(
    (c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED",
  ).length;
  const rejected = filtered.filter((c) => c.status === "REJECTED").length;

  // Priority distribution
  const criticalCount = filtered.filter(
    (c) => c.priority_level === "CRITICAL",
  ).length;
  const highCount = filtered.filter((c) => c.priority_level === "HIGH").length;
  const mediumCount = filtered.filter(
    (c) => c.priority_level === "MEDIUM",
  ).length;
  const lowCount = filtered.filter((c) => c.priority_level === "LOW").length;

  // Category distribution
  const categoryData = {
    Hostel: filtered.filter((c) => c.category === "HOSTEL").length,
    Administrative: filtered.filter((c) => c.category === "ADMINISTRATIVE")
      .length,
    Academic: filtered.filter((c) => c.category === "ACADEMIC").length,
  };

  const pct = (n) => (total === 0 ? 0 : Math.round((n / total) * 100));
  const resolutionRate = total === 0 ? 0 : Math.round((resolved / total) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#2c323f] to-[#1a1f2e] bg-clip-text text-transparent mb-2">
          System Analytics
        </h1>
        <p className="text-gray-600">
          Real-time performance metrics and insights
        </p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-wrap gap-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200"
      >
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Filter:</span>
        </div>

        {/* Time Filter */}
        <div className="flex gap-2">
          {["all", "7d", "30d", "90d"].map((period) => (
            <button
              key={period}
              onClick={() => setTimeFilter(period)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                timeFilter === period
                  ? "bg-brand text-white shadow-md shadow-brand/20"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {period === "all" ? "All Time" : period}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2">
          {["all", "HOSTEL", "ADMINISTRATIVE", "ACADEMIC"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                categoryFilter === cat
                  ? "bg-brand text-white shadow-md shadow-brand/20"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat === "all" ? "All" : cat.replace("_", " ")}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={BarChart3}
          label="Total Complaints"
          value={total}
          subtext={`${filtered.length} in selected period`}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <KPICard
          icon={CheckCircle}
          label="Resolved"
          value={resolved}
          subtext={`${pct(resolved)}% resolution rate`}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <KPICard
          icon={Zap}
          label="In Progress"
          value={inProgress}
          subtext={`${pct(inProgress)}% active`}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <KPICard
          icon={AlertCircle}
          label="Pending"
          value={pending}
          subtext={`${pct(pending)}% awaiting action`}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-brand" />
            <h2 className="text-lg font-bold text-gray-800">
              Status Distribution
            </h2>
          </div>
          <div className="space-y-1">
            <ProgressBar
              label="Resolved"
              value={resolved}
              max={total}
              color="bg-green-500"
              percentage={pct(resolved)}
            />
            <ProgressBar
              label="In Progress"
              value={inProgress}
              max={total}
              color="bg-blue-500"
              percentage={pct(inProgress)}
            />
            <ProgressBar
              label="Pending"
              value={pending}
              max={total}
              color="bg-yellow-500"
              percentage={pct(pending)}
            />
            <ProgressBar
              label="Rejected"
              value={rejected}
              max={total}
              color="bg-red-500"
              percentage={pct(rejected)}
            />
          </div>
        </motion.div>

        {/* Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle size={20} className="text-red-500" />
            <h2 className="text-lg font-bold text-gray-800">
              Priority Breakdown
            </h2>
          </div>
          <div className="space-y-1">
            <ProgressBar
              label="Critical"
              value={criticalCount}
              max={total}
              color="bg-red-600"
              percentage={pct(criticalCount)}
            />
            <ProgressBar
              label="High"
              value={highCount}
              max={total}
              color="bg-orange-500"
              percentage={pct(highCount)}
            />
            <ProgressBar
              label="Medium"
              value={mediumCount}
              max={total}
              color="bg-yellow-500"
              percentage={pct(mediumCount)}
            />
            <ProgressBar
              label="Low"
              value={lowCount}
              max={total}
              color="bg-green-500"
              percentage={pct(lowCount)}
            />
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-2 mb-6">
            <Users size={20} className="text-blue-500" />
            <h2 className="text-lg font-bold text-gray-800">
              Category Workload
            </h2>
          </div>
          <div className="space-y-1">
            {Object.entries(categoryData).map(([name, count]) => (
              <ProgressBar
                key={name}
                label={name}
                value={count}
                max={total}
                color="bg-brand"
                percentage={pct(count)}
              />
            ))}
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-2 mb-6">
            <Clock size={20} className="text-purple-500" />
            <h2 className="text-lg font-bold text-gray-800">
              Performance Metrics
            </h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-700 font-semibold uppercase mb-1">
                Resolution Rate
              </p>
              <p className="text-3xl font-bold text-green-600">
                {resolutionRate}%
              </p>
              <p className="text-xs text-green-600 mt-1">
                {resolved} of {total} completed
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-semibold uppercase mb-1">
                Active Workload
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {pct(inProgress)}%
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {inProgress} complaints being handled
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-700 font-semibold uppercase mb-1">
                Pending Review
              </p>
              <p className="text-3xl font-bold text-amber-600">{pending}</p>
              <p className="text-xs text-amber-600 mt-1">
                Awaiting assignment or action
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Summary Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-r from-slate-50 via-blue-50 to-slate-50 rounded-xl border border-gray-200 p-6 text-center"
      >
        <p className="text-sm text-gray-600">
          <span className="font-semibold">
            Showing {filtered.length} complaints
          </span>{" "}
          |
          <span className="ml-2">
            Period:{" "}
            <span className="font-semibold">
              {timeFilter === "all" ? "All Time" : timeFilter}
            </span>
          </span>
          {categoryFilter !== "all" && (
            <span className="ml-2">
              | Category:{" "}
              <span className="font-semibold">{categoryFilter}</span>
            </span>
          )}
        </p>
      </motion.div>
    </div>
  );
};

export default Analytics;
