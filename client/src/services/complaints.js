import api from "./api";

export const fetchComplaints = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.sortBy) query.append("sort_by", params.sortBy);

  const url = `/complaints/${query.toString() ? "?" + query.toString() : ""}`;
  const response = await api.get(url);
  return response.data;
};

export const submitComplaint = async ({
  title,
  description,
  category,
  departmentId = null,
}) => {
  const payload = {
    title,
    description,
    category: category.toUpperCase(),
  };

  if (departmentId) {
    payload.department_id = Number(departmentId);
  }

  const response = await api.post("/complaints/", payload);
  return response.data;
};

export const updateComplaint = async (id, newStatus, remarks = "") => {
  // Backend uses new_status + remarks fields
  const response = await api.patch(`/complaints/${id}/status`, {
    new_status: newStatus, // e.g. "IN_PROGRESS", "RESOLVED"
    remarks,
  });
  return response.data;
};

export const assignComplaint = async (complaintId, staffId) => {
  const response = await api.patch(`/complaints/${complaintId}/assign`, {
    staff_id: staffId,
  });
  return response.data;
};

export const reassignComplaint = async (complaintId) => {
  const response = await api.patch(`/complaints/${complaintId}/reassign`);
  return response.data;
};
