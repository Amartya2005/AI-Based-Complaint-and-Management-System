import React, { useState, useEffect } from "react";
import { fetchComplaints } from "../../services/complaints";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import { Inbox, ArrowUpDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../../components/Loader";
import { formatDate, formatEnumLabel } from "../../utils/formatters";

void motion;

const CATEGORIES = ["All", "HOSTEL", "ADMINISTRATIVE", "ACADEMIC"];

const StaffDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("priority");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComplaints({ sortBy })
      .then(setComplaints)
      .catch(() => setError("Failed to load assigned complaints."))
      .finally(() => setLoading(false));
  }, [sortBy]);

  if (loading && complaints.length === 0)
    return <Loader message="Loading assigned complaints..." />;

  const filtered =
    filter === "All"
      ? complaints
      : complaints.filter((c) => c.category === filter);

  // Motion Layout Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
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
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="page-header">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="eyebrow-chip">Staff Queue</span>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Assigned Complaints
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
              Prioritized workload, filtered by category and sorted against the
              live backend queue.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stat-chip">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                Assigned
              </div>
              <div className="mt-1 text-2xl font-black">
                {complaints.length}
              </div>
            </div>
            <div className="stat-chip">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                In Progress
              </div>
              <div className="mt-1 text-2xl font-black">
                {complaints.filter((c) => c.status === "IN_PROGRESS").length}
              </div>
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

      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row justify-between md:items-center gap-4"
      >
        <div className="text-sm text-slate-500 font-medium">
          Tune the queue by urgency and category before updating status.
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
          >
            <ArrowUpDown size={16} className="text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => {
                setLoading(true);
                setSortBy(e.target.value);
              }}
              className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
            >
              <option value="priority">Priority (High to Low)</option>
              <option value="date_new">Newest First</option>
              <option value="date_old">Oldest First</option>
            </select>
          </motion.div>

          <div className="flex flex-wrap gap-1.5 bg-white/80 backdrop-blur-sm p-1 rounded-lg border border-gray-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
            {CATEGORIES.map((cat) => (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-300 ${
                  filter === cat
                    ? "bg-gradient-to-r from-brand to-brand-600 text-white shadow-md shadow-brand/20"
                    : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                }`}
              >
                {cat === "All" ? "All" : formatEnumLabel(cat)}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          variants={itemVariants}
          className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl shadow-sm text-sm"
        >
          {error}
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden p-0">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-20 text-gray-400 flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Inbox size={48} className="mb-4 opacity-40 text-brand" />
                </motion.div>
                <p className="text-lg font-medium text-gray-500">
                  No complaints found.
                </p>
                <p className="text-sm mt-1 text-gray-400">
                  Try adjusting your filters.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`transition-opacity duration-300 ${loading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="overflow-x-auto relative">
                  {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                      <Loader2 size={24} className="text-brand animate-spin" />
                    </div>
                  )}
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gradient-to-r from-brand-700 to-brand-600 text-white">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider border-r border-white/10">
                          ID
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider border-r border-white/10">
                          Title
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider border-r border-white/10">
                          Priority
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider border-r border-white/10">
                          Category
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider border-r border-white/10">
                          Date
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c, idx) => (
                        <motion.tr
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * idx, duration: 0.3 }}
                          key={c.id}
                          className={`border-b border-gray-50 hover:bg-gray-50/80 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}
                        >
                          <td className="px-6 py-4 text-sm font-mono text-gray-500">
                            #{c.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800 font-semibold max-w-xs">
                            {c.title}
                          </td>
                          <td className="px-6 py-4">
                            <PriorityBadge
                              level={c.priority_level}
                              score={c.priority_score}
                            />
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="bg-brand/10 text-brand-700 font-bold text-xs uppercase px-2.5 py-1 rounded">
                              {formatEnumLabel(c.category)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 font-medium tracking-tight">
                            {formatDate(c.created_at, "long")}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={c.status} />
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default StaffDashboard;
