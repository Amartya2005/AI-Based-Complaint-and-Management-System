// mockData.js
export const MOCK_USERS = {
    student: { token: "mock-student-token", role: "student", name: "Alice Student", id: "S1001" },
    staff: { token: "mock-staff-token", role: "staff", name: "Bob Staff", id: "ST1001" },
    admin: { token: "mock-admin-token", role: "admin", name: "Charlie Admin", id: "A1001" },
};

let MOCK_COMPLAINTS = [
    { id: "C001", title: "Wi-Fi not working in Hostel A", category: "Hostel", status: "Pending", submitterId: "S1001", date: "2026-03-01", description: "The wifi has been dead for 2 days on the 3rd floor." },
    { id: "C002", title: "Course Registration Error", category: "Academic", status: "In Progress", submitterId: "S1001", date: "2026-03-02", description: "Getting a 500 error when trying to register for CS101." },
    { id: "C003", title: "Library AC broken", category: "Administrative", status: "Resolved", submitterId: "S1002", date: "2026-02-28", description: "The AC in the reading hall is leaking water." },
    { id: "C004", title: "Hostel mess food quality", category: "Hostel", status: "Pending", submitterId: "S1003", date: "2026-03-02", description: "The food today was cold and stale." },
];

export const getMockComplaints = () => [...MOCK_COMPLAINTS];
export const updateMockComplaintStatus = (id, newStatus, comment) => {
    const index = MOCK_COMPLAINTS.findIndex(c => c.id === id);
    if (index !== -1) {
        MOCK_COMPLAINTS[index] = { ...MOCK_COMPLAINTS[index], status: newStatus, resolutionComment: comment };
        return MOCK_COMPLAINTS[index];
    }
    return null;
};
export const addMockComplaint = (complaint) => {
    const newComplaint = {
        ...complaint,
        id: `C00${MOCK_COMPLAINTS.length + 1}`,
        status: "Pending",
        date: new Date().toISOString().split('T')[0],
    };
    MOCK_COMPLAINTS.push(newComplaint);
    return newComplaint;
};
