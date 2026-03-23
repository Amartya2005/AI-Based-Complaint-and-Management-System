import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fetchComplaints, submitComplaint } from "../../services/complaints";
import { fetchDepartments } from "../../services/departments";
import PriorityBadge from "../../components/PriorityBadge";
import {
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  BarChart2,
  List as ListIcon,
  X,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../../components/Loader";
import { formatDate } from "../../utils/formatters";

void motion;

const TiltCard = ({ stat }) => {
  const [transform, setTransform] = useState("");

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const centerX = box.width / 2;
    const centerY = box.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
    );
  };

  const handleMouseLeave = () => {
    setTransform("");
  };

  return (
    <div className="perspective-1000 h-full" style={{ perspective: "1000px" }}>
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: transform
            ? transform
            : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transition: transform
            ? "transform 0.1s ease-out"
            : "transform 0.5s ease-out",
        }}
        className={`${stat.bg} rounded-2xl shadow-lg ${stat.shadow} relative overflow-hidden flex flex-col group h-full cursor-pointer will-change-transform`}
      >
        <div
          className={`p-6 flex-1 relative z-10 ${stat.textClass || "text-white"}`}
        >
          <h3 className="text-4xl font-black mb-1 drop-shadow-sm">
            {stat.value}
          </h3>
          <p className="text-sm font-medium opacity-90">{stat.label}</p>
        </div>
        {/* Background watermark icon */}
        <div className="absolute -bottom-4 -right-4 opacity-10 z-0 transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
          <stat.icon size={110} className={stat.textClass || "text-white"} />
        </div>
        {/* Bottom link strip */}
        <Link
          to="/student/my-complaints"
          className="bg-black/10 backdrop-blur-sm hover:bg-black/20 transition-colors py-2.5 px-6 flex justify-between items-center text-sm relative z-10"
        >
          <span className={`${stat.textClass || "text-white"} font-medium`}>
            View details
          </span>
          <div
            className={`w-6 h-6 rounded-full bg-white/20 flex items-center justify-center ${stat.textClass || "text-white"} group-hover:translate-x-1 transition-transform`}
          >
            <ArrowRight size={14} />
          </div>
        </Link>
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState("ALL");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "HOSTEL",
    departmentId: "",
    description: "",
  });

  const loadData = () => {
    setError("");
    fetchComplaints({ sortBy: "date_new" })
      .then(setComplaints)
      .catch(() => setError("Failed to load complaints."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    fetchDepartments()
      .then(setDepartments)
      .catch(() => {});
  }, []);

  if (loading) return <Loader message="Loading dashboard..." />;

  const pending = complaints.filter((c) => c.status === "PENDING").length;
  const assigned = complaints.filter((c) => c.status === "ASSIGNED").length;
  const inProgress = complaints.filter(
    (c) => c.status === "IN_PROGRESS",
  ).length;
  const resolved = complaints.filter((c) => c.status === "RESOLVED").length;
  const total = complaints.length;

  const hostel = complaints.filter((c) => c.category === "HOSTEL").length;
  const admin = complaints.filter(
    (c) => c.category === "ADMINISTRATIVE",
  ).length;
  const academic = complaints.filter((c) => c.category === "ACADEMIC").length;

  const getPercent = (val) => (total > 0 ? Math.round((val / total) * 100) : 0);

  const handleNewComplaintSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitComplaint(formData);
      addToast("Complaint filed successfully!", "success");
      setIsModalOpen(false);
      setFormData({
        title: "",
        category: "HOSTEL",
        departmentId: "",
        description: "",
      });
      loadData(); // Refresh list immediately
    } catch (err) {
      const detail = err.response?.data?.detail;
      addToast(
        typeof detail === "string" ? detail : "Failed to submit complaint.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const recentComplaints = complaints
    .filter(
      (complaint) =>
        tableStatusFilter === "ALL" || complaint.status === tableStatusFilter,
    )
    .slice(0, 5);

  const stats = [
    {
      label: "Total Filed",
      value: total,
      bg: "bg-gradient-to-br from-[#17a2b8] to-[#128293]",
      shadow: "shadow-[#17a2b8]/40",
      icon: Activity,
    },
    {
      label: "Resolved",
      value: resolved,
      bg: "bg-gradient-to-br from-[#28a745] to-[#1e7e34]",
      shadow: "shadow-[#28a745]/40",
      icon: CheckCircle,
    },
    {
      label: "In Progress",
      value: inProgress + assigned,
      bg: "bg-gradient-to-br from-[#8ba1b6] to-[#607182]",
      shadow: "shadow-[#8ba1b6]/40",
      icon: Clock,
    },
    {
      label: "Pending",
      value: pending,
      bg: "bg-gradient-to-br from-[#ffc107] to-[#e0a800]",
      textClass: "text-gray-900",
      shadow: "shadow-[#ffc107]/40",
      icon: AlertCircle,
    },
  ];

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
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow-chip">Student Console</span>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Complaint Pulse
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
              File new issues, track routing decisions, and monitor which
              complaints need attention first.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stat-chip">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                Filed
              </div>
              <div className="mt-1 text-2xl font-black">{total}</div>
            </div>
            <div className="stat-chip">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                Resolved
              </div>
              <div className="mt-1 text-2xl font-black">{resolved}</div>
            </div>
            <div className="stat-chip">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                High Focus
              </div>
              <div className="mt-1 text-2xl font-black">
                {
                  complaints.filter((c) =>
                    ["HIGH", "CRITICAL"].includes(c.priority_level),
                  ).length
                }
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          variants={itemVariants}
          className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-sm mb-4"
        >
          {error}
        </motion.div>
      )}

      {/* Row 1: 4 Colored Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <TiltCard stat={stat} />
          </motion.div>
        ))}
      </div>

      {/* Row 2: Progress Bars (mimicking "Attendance Summary" from GIET ERP) */}
      <motion.div
        variants={itemVariants}
        className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/80 overflow-hidden relative"
      >
        {/* Decorative top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#17a2b8] to-[#00c4cc]"></div>

        <div className="p-5 border-b border-gray-100/80 flex items-center gap-3">
          <div className="p-2 bg-[#17a2b8]/10 rounded-lg">
            <BarChart2 size={18} className="text-[#17a2b8]" />
          </div>
          <h3 className="text-[#2c323f] font-bold text-base tracking-wide">
            Category Summary
          </h3>
        </div>
        <div className="p-6 space-y-7">
          {/* Progress 1 */}
          <div>
            <div className="flex justify-between text-sm font-bold text-[#333] mb-1">
              <span>Hostel Complaints</span>
              <span className="text-[#ffc107]">{getPercent(hostel)}%</span>
            </div>
            <div className="w-full bg-gray-200 h-4 rounded-sm overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getPercent(hostel)}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="bg-[#ffc107] h-full"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)",
                  backgroundSize: "1rem 1rem",
                }}
              />
            </div>
          </div>
          {/* Progress 2 */}
          <div>
            <div className="flex justify-between text-sm font-bold text-[#333] mb-1">
              <span>Administrative Complaints</span>
              <span className="text-[#ffc107]">{getPercent(admin)}%</span>
            </div>
            <div className="w-full bg-gray-200 h-4 rounded-sm overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getPercent(admin)}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                className="bg-[#ffc107] h-full"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)",
                  backgroundSize: "1rem 1rem",
                }}
              />
            </div>
          </div>
          {/* Progress 3 */}
          <div>
            <div className="flex justify-between text-sm font-bold text-[#333] mb-1">
              <span>Academic Complaints</span>
              <span className="text-[#ffc107]">{getPercent(academic)}%</span>
            </div>
            <div className="w-full bg-gray-200 h-4 rounded-sm overflow-hidden flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getPercent(academic)}%` }}
                transition={{ duration: 1.4, ease: "easeOut", delay: 0.4 }}
                className="bg-[#ffc107] h-full"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)",
                  backgroundSize: "1rem 1rem",
                }}
              />
            </div>
          </div>

          <div className="text-center mt-2">
            <span className="text-sm font-medium text-[#ffc107]">
              Overview of registered issues.
            </span>
          </div>
        </div>
      </motion.div>

      {/* Row 3: Table Container */}
      <motion.div
        variants={itemVariants}
        className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/80 overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#17a2b8] to-[#00c4cc]"></div>

        <div className="p-5 flex items-center justify-between gap-4 border-b border-gray-100/80 bg-white/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#17a2b8]/10 rounded-lg">
              <ListIcon size={18} className="text-[#17a2b8]" />
            </div>
            <h3 className="text-[#2c323f] font-bold text-base tracking-wide">
              Recent Complaints
            </h3>
          </div>

          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0px 10px 15px -3px rgba(0,196,204,0.3)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="text-xs flex items-center gap-2 font-semibold uppercase tracking-wider bg-gradient-to-r from-[#00c4cc] to-[#00a1a8] text-white px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <span>New Complaint</span>
          </motion.button>
        </div>

        <div className="p-4 bg-[#f8fafc] flex items-center border-b border-gray-100/80">
          <div className="w-64 max-w-full">
            <select
              value={tableStatusFilter}
              onChange={(e) => setTableStatusFilter(e.target.value)}
              className="block w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c4cc]/50 focus:border-transparent shadow-sm cursor-pointer transition-shadow"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gradient-to-r from-[#17a2b8] to-[#148ea1] text-white">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider border-r border-white/10">
                  ID
                </th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider border-r border-white/10">
                  Title
                </th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider border-r border-white/10">
                  Category
                </th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider border-r border-white/10">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider border-r border-white/10">
                  Priority
                </th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                  Date Filed
                </th>
              </tr>
            </thead>
            <tbody>
              {recentComplaints.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {complaints.length === 0
                      ? "No complaints filed yet."
                      : "No complaints match this status filter."}
                  </td>
                </tr>
              ) : (
                recentComplaints.map((c, idx) => (
                  <motion.tr
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    key={c.id}
                    className={
                      idx % 2 === 0
                        ? "bg-white hover:bg-gray-50 transition-colors"
                        : "bg-gray-50 hover:bg-gray-100 transition-colors"
                    }
                  >
                    <td className="px-4 py-2.5 border-t border-gray-100 font-mono text-gray-600">
                      #{c.id}
                    </td>
                    <td className="px-4 py-2.5 border-t border-gray-100 text-gray-800 font-medium">
                      {c.title}
                    </td>
                    <td className="px-4 py-2.5 border-t border-gray-100 text-[#17a2b8] font-semibold text-xs uppercase">
                      {c.category}
                    </td>
                    <td className="px-4 py-2.5 border-t border-gray-100">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold text-white
                                                    ${
                                                      c.status === "RESOLVED"
                                                        ? "bg-[#28a745]"
                                                        : c.status === "PENDING"
                                                          ? "bg-[#ffc107] text-gray-900"
                                                          : c.status ===
                                                              "REJECTED"
                                                            ? "bg-red-500"
                                                            : "bg-[#6c757d]"
                                                    }`}
                      >
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 border-t border-gray-100">
                      <PriorityBadge
                        level={c.priority_level}
                        score={c.priority_score}
                      />
                    </td>
                    <td className="px-4 py-2.5 border-t border-gray-100 text-gray-500 whitespace-nowrap">
                      {formatDate(c.created_at)}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Interactive File Complaint Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#17a2b8]/5 to-transparent">
                <div>
                  <h2 className="text-xl font-bold text-[#2c323f]">
                    File a Complaint
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitting as:{" "}
                    <strong className="text-[#00c4cc]">
                      {user?.college_id}
                    </strong>
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleNewComplaintSubmit}
                className="p-6 space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Issue Summary
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief title (e.g. WiFi not working)"
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00c4cc]/50 focus:border-[#00c4cc] outline-none transition bg-gray-50/50 hover:bg-white"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00c4cc]/50 focus:border-[#00c4cc] outline-none transition bg-gray-50/50 hover:bg-white appearance-none cursor-pointer"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      <option value="HOSTEL">Hostel</option>
                      <option value="ADMINISTRATIVE">Administrative</option>
                      <option value="ACADEMIC">Academic</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00c4cc]/50 focus:border-[#00c4cc] outline-none transition bg-gray-50/50 hover:bg-white appearance-none cursor-pointer"
                      value={formData.departmentId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departmentId: e.target.value,
                        })
                      }
                    >
                      <option value="">Let admin route this later</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name} ({department.code})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Detailed Description
                  </label>
                  <textarea
                    required
                    rows="4"
                    placeholder="Please provide specific details about your issue..."
                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#00c4cc]/50 focus:border-[#00c4cc] outline-none transition bg-gray-50/50 hover:bg-white resize-none"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-[#00c4cc] to-[#00a1a8] text-white rounded-xl shadow inline-flex items-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <>
                        <Send size={16} /> Submit
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentDashboard;
