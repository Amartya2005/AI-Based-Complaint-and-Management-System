import React, { useEffect, useState } from "react";
import { getAllStaffRatings } from "../services/ratings";
import { useToast } from "../context/ToastContext";
import "./RatingsDashboard.css";

/**
 * RatingsDashboard Component
 * Admin dashboard for viewing all staff ratings
 */
const RatingsDashboard = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const { addToast } = useToast();

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        setLoading(true);
        const skip = page * itemsPerPage;
        const data = await getAllStaffRatings(skip, itemsPerPage + 1);

        // Check if there are more items
        if (data.length > itemsPerPage) {
          setRatings(data.slice(0, itemsPerPage));
          setTotalItems(skip + itemsPerPage);
        } else {
          setRatings(data);
          setTotalItems(skip + data.length);
        }

        setError(null);
      } catch (err) {
        console.error("Failed to fetch ratings:", err);
        setError("Failed to load ratings");
        addToast("Failed to load ratings", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [page, addToast]);

  const getRatingColor = (rating) => {
    if (rating >= 4) return "excellent";
    if (rating >= 3) return "good";
    if (rating >= 2) return "fair";
    return "poor";
  };

  const getRatingLabel = (rating) => {
    if (rating >= 4) return "Excellent";
    if (rating >= 3) return "Good";
    if (rating >= 2) return "Fair";
    return "Poor";
  };

  if (loading && ratings.length === 0) {
    return (
      <div className="ratings-dashboard">
        <div className="loading-state">Loading ratings...</div>
      </div>
    );
  }

  if (error && ratings.length === 0) {
    return (
      <div className="ratings-dashboard">
        <div className="error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="ratings-dashboard">
      <div className="dashboard-header">
        <h2>Staff Ratings Dashboard</h2>
        <p className="subtitle">
          Total Ratings: {totalItems > 0 ? totalItems : 0}
        </p>
      </div>

      {ratings.length === 0 ? (
        <div className="empty-state">
          <p>No ratings available yet</p>
        </div>
      ) : (
        <div className="ratings-table-wrapper">
          <table className="ratings-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Staff Member</th>
                <th>Complaint</th>
                <th>Rating</th>
                <th>Feedback</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((rating) => (
                <tr
                  key={rating.id}
                  className={`rating-row ${getRatingColor(rating.rating)}`}
                >
                  <td>
                    <div className="cell-content">
                      <p className="name">{rating.student_name}</p>
                      <p className="email">{rating.student_email}</p>
                    </div>
                  </td>
                  <td>
                    <p className="name">Staff ID: {rating.staff_id}</p>
                  </td>
                  <td>
                    <p className="complaint-id">#{rating.complaint_id}</p>
                  </td>
                  <td>
                    <div
                      className="rating-badge"
                      title={getRatingLabel(rating.rating)}
                    >
                      <span className="stars">
                        {"★".repeat(rating.rating)}
                        {"☆".repeat(5 - rating.rating)}
                      </span>
                      <span className="rating-value">{rating.rating}/5</span>
                    </div>
                  </td>
                  <td>
                    <p className="feedback">
                      {rating.feedback ? (
                        <span title={rating.feedback}>
                          {rating.feedback.substring(0, 50)}
                          {rating.feedback.length > 50 ? "..." : ""}
                        </span>
                      ) : (
                        <span className="no-feedback">No feedback</span>
                      )}
                    </p>
                  </td>
                  <td>
                    <p className="date">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(ratings.length > 0 || page > 0) && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            ← Previous
          </button>
          <span className="page-info">Page {page + 1}</span>
          <button
            className="btn btn-secondary"
            onClick={() => setPage(page + 1)}
            disabled={ratings.length < itemsPerPage}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default RatingsDashboard;
