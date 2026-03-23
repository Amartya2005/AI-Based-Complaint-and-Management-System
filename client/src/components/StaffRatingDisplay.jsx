import React, { useEffect, useState } from "react";
import { getStaffRatingStats } from "../services/ratings";
import "./StaffRatingDisplay.css";

/**
 * StaffRatingDisplay Component
 * Shows staff member's average rating and breakdown
 *
 * Props:
 * - staffId: number - ID of the staff member
 * - compact: boolean - Show compact version (just average rating)
 */
const StaffRatingDisplay = ({ staffId, compact = false }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getStaffRatingStats(staffId);
        setStats(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch rating stats:", err);
        setError("Failed to load rating data");
      } finally {
        setLoading(false);
      }
    };

    if (staffId) {
      fetchStats();
    }
  }, [staffId]);

  if (loading) {
    return <div className="rating-display loading">Loading ratings...</div>;
  }

  if (error) {
    return <div className="rating-display error">{error}</div>;
  }

  if (!stats) {
    return <div className="rating-display empty">No rating data</div>;
  }

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "premium";
    if (rating >= 3.5) return "standard";
    if (rating >= 2.5) return "developing";
    return "basic";
  };

  const getRatingLabel = (rating) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 3.5) return "Good";
    if (rating >= 2.5) return "Fair";
    return "Needs Improvement";
  };

  const ratingColor = getRatingColor(stats.average_rating);
  const ratingLabel = getRatingLabel(stats.average_rating);

  if (compact) {
    return (
      <div className={`rating-display compact ${ratingColor}`}>
        <div className="rating-stars">
          <span className="star-value">★</span>
          <span className="average-rating">
            {stats.average_rating.toFixed(1)}
          </span>
        </div>
        <div className="rating-info">
          <p className="rating-label">{ratingLabel}</p>
          <p className="rating-count">({stats.total_ratings} ratings)</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rating-display full ${ratingColor}`}>
      <div className="rating-header">
        <h3>{stats.staff_name}</h3>
        <p className="staff-email">{stats.staff_email}</p>
      </div>

      <div className="rating-main">
        <div className="rating-score">
          <div className="big-stars">★★★★★</div>
          <div className="average">{stats.average_rating.toFixed(2)}</div>
          <div className="label">{ratingLabel}</div>
        </div>

        <div className="rating-stats">
          <div className="stat-item">
            <span className="stat-label">Total Ratings</span>
            <span className="stat-value">{stats.total_ratings}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average</span>
            <span className="stat-value">
              {stats.average_rating.toFixed(1)} / 5
            </span>
          </div>
        </div>
      </div>

      <div className="rating-breakdown">
        <h4>Rating Breakdown</h4>
        <div className="breakdown-chart">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="breakdown-row">
              <div className="star-label">
                {star} <span className="star-symbol">★</span>
              </div>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{
                    width: `${
                      stats.total_ratings > 0
                        ? (stats.rating_breakdown[star] / stats.total_ratings) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="count-label">{stats.rating_breakdown[star]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rating-footer">
        <p className="last-updated">
          Updated: {new Date(stats.updated_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default StaffRatingDisplay;
