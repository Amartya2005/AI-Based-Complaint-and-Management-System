import React, { useState, useEffect, useCallback } from "react";
import {
  fetchUsers,
  createUser,
  deleteUser,
  deactivateUser,
} from "../../services/users";
import { fetchComplaints, assignComplaint } from "../../services/complaints";
import { fetchDepartments } from "../../services/departments";
import Card from "../../components/Card";
import { UserPlus, Search, X, CheckCircle, Trash2 } from "lucide-react";

const ManageUsers = ({ type }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  // New user form
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({
    college_id: "",
    name: "",
    email: "",
    password: "",
    role: type.toUpperCase(),
    department_id: null,
  });
  const [isCreating, setIsCreating] = useState(false);

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    userId: null,
    userName: null,
    collegeid: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteAction, setDeleteAction] = useState("deactivate"); // 'delete' or 'deactivate'

  // Assign complaint panel (staff only)
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const departmentLookup = departments.reduce((lookup, department) => {
    lookup[department.id] = `${department.name} (${department.code})`;
    return lookup;
  }, {});

  const loadUsers = useCallback(() => {
    setLoading(true);
    fetchUsers(type)
      .then(setUsers)
      .catch(() => setError("Failed to load users."))
      .finally(() => setLoading(false));
  }, [type]);

  useEffect(() => {
    loadUsers();
    fetchDepartments()
      .then(setDepartments)
      .catch(() => {});
    if (type === "staff") {
      fetchComplaints({ sortBy: "priority" })
        .then((data) =>
          setComplaints(data.filter((c) => c.status === "PENDING")),
        )
        .catch(() => {});
    }
  }, [type, loadUsers]);

  useEffect(() => {
    setNewUser({
      college_id: "",
      name: "",
      email: "",
      password: "",
      role: type.toUpperCase(),
      department_id: null,
    });
    setShowForm(false);
    setSelectedComplaint("");
    setSelectedStaff("");
  }, [type]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    setSuccess("");
    try {
      await createUser({
        ...newUser,
        department_id: newUser.department_id
          ? parseInt(newUser.department_id)
          : null,
      });
      setSuccess(`${type} account created successfully.`);
      setShowForm(false);
      setNewUser({
        college_id: "",
        name: "",
        email: "",
        password: "",
        role: type.toUpperCase(),
        department_id: null,
      });
      loadUsers();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to create user.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (userId, userName, collegeId) => {
    setDeleteModal({ show: true, userId, userName, collegeid: collegeId });
    setDeleteAction("deactivate"); // Default to deactivate
  };

  const handleDelete = async () => {
    if (!deleteModal.userId) return;
    setIsDeleting(true);
    setError("");
    setSuccess("");

    try {
      if (deleteAction === "deactivate") {
        await deactivateUser(deleteModal.userId);
        setSuccess(
          `${deleteModal.userName} has been deactivated successfully.`,
        );
      } else {
        await deleteUser(deleteModal.userId);
        setSuccess(`${deleteModal.userName} has been permanently deleted.`);
      }
      setDeleteModal({
        show: false,
        userId: null,
        userName: null,
        collegeid: null,
      });
      loadUsers();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg =
        typeof detail === "string" ? detail : "Failed to perform action.";

      // If hard delete fails, automatically switch to deactivate
      if (
        deleteAction === "delete" &&
        (errorMsg.includes("associated") || errorMsg.includes("constraint"))
      ) {
        setError(`${errorMsg}\n\nAutomatically switched to deactivate mode.`);
        setDeleteAction("deactivate");
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !selectedStaff) return;
    setIsAssigning(true);
    setError("");
    setSuccess("");
    try {
      await assignComplaint(
        parseInt(selectedComplaint),
        parseInt(selectedStaff),
      );
      setSuccess(
        `Complaint #${selectedComplaint} assigned to Staff #${selectedStaff}.`,
      );
      setSelectedComplaint("");
      setSelectedStaff("");
      fetchComplaints({ sortBy: "priority" })
        .then((d) => setComplaints(d.filter((c) => c.status === "PENDING")))
        .catch(() => {});
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Assignment failed.");
    } finally {
      setIsAssigning(false);
    }
  };

  const title = type === "student" ? "Manage Students" : "Manage Staff";
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.college_id.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const fieldClassName =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand-400 transition";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">{title}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-accent to-accent-dark hover:shadow-lg hover:shadow-accent/20 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {showForm ? <X size={18} /> : <UserPlus size={18} />}
          {showForm
            ? "Cancel"
            : `Add ${type === "student" ? "Student" : "Staff"}`}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Create User Form */}
      {showForm && (
        <Card className="border-t-4 border-accent">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            New {type === "student" ? "Student" : "Staff"} Account
          </h2>
          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {[
              {
                field: "college_id",
                label: "College ID",
                placeholder: "e.g. CS2024001",
                type: "text",
              },
              {
                field: "name",
                label: "Full Name",
                placeholder: "Full name",
                type: "text",
              },
              {
                field: "email",
                label: "Email",
                placeholder: "user@college.edu",
                type: "email",
              },
              {
                field: "password",
                label: "Password",
                placeholder: "Min 8 characters",
                type: "password",
              },
            ].map(({ field, label, placeholder, type: inputType }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  type={inputType}
                  required
                  placeholder={placeholder}
                  value={newUser[field]}
                  onChange={(e) =>
                    setNewUser({ ...newUser, [field]: e.target.value })
                  }
                  className={fieldClassName}
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department (optional)
              </label>
              <select
                value={newUser.department_id ?? ""}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    department_id: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                className={fieldClassName}
              >
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-brand-700 text-white rounded-xl font-semibold shadow-sm hover:shadow-lg hover:shadow-brand/20 transition disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                {isCreating ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Assign Complaint (Staff page only) */}
      {type === "staff" && complaints.length > 0 && (
        <Card className="border-t-4 border-primary">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Assign Pending Complaint to Staff
          </h2>
          <form
            onSubmit={handleAssign}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complaint
              </label>
              <select
                required
                value={selectedComplaint}
                onChange={(e) => setSelectedComplaint(e.target.value)}
                className={fieldClassName}
              >
                <option value="">Select complaint</option>
                {complaints.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} - {c.title} [{c.priority_level}]
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Staff
              </label>
              <select
                required
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className={fieldClassName}
              >
                <option value="">Select staff member</option>
                {users
                  .filter((u) => u.is_active)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.college_id})
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isAssigning}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-brand-700 text-white rounded-xl font-semibold shadow-sm hover:shadow-lg hover:shadow-brand/20 transition disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {isAssigning ? "Assigning..." : "Assign"}
            </button>
          </form>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder={`Search ${type}s...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand-400 transition text-sm"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[
                    "ID",
                    "College ID",
                    "Name",
                    "Email",
                    "Dept",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition"
                  >
                    <td className="py-3 px-4 text-sm font-mono text-gray-500">
                      {u.id}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-700">
                      {u.college_id}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {u.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {u.email}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {u.department_id
                        ? departmentLookup[u.department_id] ||
                          `#${u.department_id}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${u.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() =>
                          handleDeleteClick(u.id, u.name, u.college_id)
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-red-300"
                        title={
                          u.is_active
                            ? "Delete or deactivate user"
                            : "Delete or reactivate user"
                        }
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-gray-400 text-sm"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete/Deactivate Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Delete {type}
                </h3>
                <p className="text-xs text-gray-500">
                  {deleteModal.userName} ({deleteModal.collegeid})
                </p>
              </div>
            </div>

            {/* Error Message in Modal */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Choose an action:
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-blue-100 transition">
                  <input
                    type="radio"
                    name="deleteAction"
                    value="deactivate"
                    checked={deleteAction === "deactivate"}
                    onChange={() => setDeleteAction("deactivate")}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Deactivate (Safe)
                    </p>
                    <p className="text-xs text-gray-600">
                      User remains in database but cannot log in. Data is
                      preserved.
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-red-100 transition">
                  <input
                    type="radio"
                    name="deleteAction"
                    value="delete"
                    checked={deleteAction === "delete"}
                    onChange={() => setDeleteAction("delete")}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Delete Permanently
                    </p>
                    <p className="text-xs text-gray-600">
                      Removes user completely. Cannot be undone.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() =>
                  setDeleteModal({
                    show: false,
                    userId: null,
                    userName: null,
                    collegeid: null,
                  })
                }
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-70"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {deleteAction === "deactivate"
                      ? "Deactivating..."
                      : "Deleting..."}
                  </span>
                ) : deleteAction === "deactivate" ? (
                  "Deactivate"
                ) : (
                  "Delete Permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
