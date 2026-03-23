import React, { useState, useEffect } from "react";
import { fetchComplaints } from "../../services/complaints";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import PriorityBadge from "../../components/PriorityBadge";
import RatingModal from "../../components/RatingModal";
import { motion } from "framer-motion";
import { ChevronDown, Calendar, Tag, AlertCircle, Star } from "lucide-react";
import { formatDate, formatEnumLabel } from "../../utils/formatters";

void motion;

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    fetchComplaints({ sortBy: "date_new" })
      .then(setComplaints)
      .catch(() => setError("Could not load your complaints."))
      .finally(() => setLoading(false));
  }, []);

  const filteredComplaints =
    filterStatus === "all"
      ? complaints
      : complaints.filter((c) => c.status === filterStatus);

  const handleRatingClick = (complaint) => {
    setSelectedComplaint(complaint);
    setRatingModalOpen(true);
  };

  const handleRatingSuccess = () => {
    // Refresh complaints after successful rating
    fetchComplaints({ sortBy: "date_new" })
      .then(setComplaints)
      .catch(() => setError("Could not load your complaints."));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
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

  if (loading)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="flex items-center justify-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full"
          />
          <span className="text-primary font-medium">
            Loading your complaints...
          </span>
        </div>
      </motion.div>
    );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-700 to-brand bg-clip-text text-transparent">
            My Complaints
          </h1>
          <div className="text-sm font-semibold text-gray-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
            <span className="text-brand">{complaints.length}</span> total filed
          </div>
        </div>
      </motion.div>

      {/* Filter Buttons */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {[
          "all",
          "PENDING",
          "ASSIGNED",
          "IN_PROGRESS",
          "RESOLVED",
          "REJECTED",
        ].map((status) => (
          <motion.button
            key={status}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filterStatus === status
                ? "bg-gradient-to-r from-brand to-brand-600 text-white shadow-lg shadow-brand/30"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {status === "all" ? "All Statuses" : status.replace("_", " ")}
          </motion.button>
        ))}
      </motion.div>

      {error && (
        <motion.div
          variants={itemVariants}
          className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm flex items-center gap-2"
        >
          <AlertCircle size={18} />
          {error}
        </motion.div>
      )}

      {filteredComplaints.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="text-center py-16">
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium text-lg">
                {filterStatus === "all"
                  ? "You have no complaints on record."
                  : `No complaints with status: ${filterStatus.replace("_", " ")}`}
              </p>
            </motion.div>
          </Card>
        </motion.div>
      ) : (
        <motion.div className="space-y-4 list-none">
          {filteredComplaints.map((c, idx) => (
            <motion.div
              key={c.id}
              variants={itemVariants}
              custom={idx}
              whileHover={{ y: -4 }}
              layout
            >
              <motion.div
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                className="cursor-pointer group"
                whileHover={{ scale: 1.01 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-brand hover:border-brand-600 bg-gradient-to-r from-white to-brand-50/40">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                          #{c.id}
                        </span>
                        <StatusBadge status={c.status} />
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="text-xs bg-gradient-to-r from-brand/10 to-brand-600/10 text-brand px-3 py-1 rounded-full font-semibold flex items-center gap-1"
                        >
                          <Tag size={12} />
                          {formatEnumLabel(c.category)}
                        </motion.span>
                        <PriorityBadge
                          level={c.priority_level}
                          score={c.priority_score}
                        />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mt-1 group-hover:text-brand transition-colors">
                        {c.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 flex items-center justify-end gap-1 whitespace-nowrap">
                        <Calendar size={14} />
                        {formatDate(c.created_at, "long")}
                      </span>
                      <motion.div
                        animate={{ rotate: expandedId === c.id ? 180 : 0 }}
                        className="mt-2"
                      >
                        <ChevronDown size={20} className="text-brand" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: expandedId === c.id ? 1 : 0,
                      height: expandedId === c.id ? "auto" : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <p className="text-sm text-gray-700 leading-relaxed mb-4">
                        {c.description}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 mb-4">
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-xs text-gray-500 bg-slate-50 rounded-lg p-3 border border-slate-100"
                        >
                          Department:{" "}
                          <strong className="text-slate-700">
                            {c.department_id
                              ? `#${c.department_id}`
                              : "Pending routing"}
                          </strong>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-xs text-gray-500 bg-blue-50 rounded-lg p-3 border border-blue-100"
                        >
                          Assigned Staff:{" "}
                          <strong className="text-blue-600">
                            {c.assigned_to
                              ? `#${c.assigned_to}`
                              : "Awaiting assignment"}
                          </strong>
                        </motion.div>
                      </div>

                      {/* Rating Button - Show only when complaint is RESOLVED and has assigned staff */}
                      {c.status === "RESOLVED" && c.assigned_to && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRatingClick(c)}
                          className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <Star size={18} />
                          Rate Staff Member
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        complaint={selectedComplaint}
        onClose={() => {
          setRatingModalOpen(false);
          setSelectedComplaint(null);
        }}
        onSuccess={handleRatingSuccess}
      />
    </motion.div>
  );
};

export default MyComplaints;
