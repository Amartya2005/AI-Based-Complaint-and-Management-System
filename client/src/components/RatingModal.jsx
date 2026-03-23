import React, { useState } from 'react';
import { submitRating } from '../services/ratings';
import { useToast } from '../context/ToastContext';
import './RatingModal.css';

/**
 * RatingModal Component
 * Allows students to rate staff members after complaint resolution
 * 
 * Props:
 * - isOpen: boolean - Modal visibility
 * - complaint: object - Complaint data with id, assigned_to
 * - onClose: function - Callback when modal closes
 * - onSuccess: function - Callback after successful rating
 */
const RatingModal = ({ isOpen, complaint, onClose, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    if (!isOpen || !complaint) return null;

    const handleStarClick = (value) => {
        setRating(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            addToast('Please select a rating', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await submitRating(
                complaint.id,
                complaint.assigned_to,
                rating,
                feedback
            );

            addToast('Rating submitted successfully!', 'success');
            
            // Reset form
            setRating(0);
            setFeedback('');
            
            if (onSuccess) {
                onSuccess(result);
            }
            
            onClose();
        } catch (error) {
            const message = error.response?.data?.detail || 'Failed to submit rating';
            addToast(message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="rating-modal-overlay" onClick={onClose}>
            <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
                <div className="rating-modal-header">
                    <h2>Rate Staff Member</h2>
                    <button 
                        className="modal-close-btn"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        ✕
                    </button>
                </div>

                <div className="rating-modal-body">
                    <p className="complaint-title">
                        Complaint: <strong>{complaint.title}</strong>
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="rating-section">
                            <label>Your Rating</label>
                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`star ${star <= rating ? 'active' : ''}`}
                                        onClick={() => handleStarClick(star)}
                                        disabled={isSubmitting}
                                        title={`${star} out of 5 stars`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <p className="rating-text">
                                {rating > 0 ? `You rated: ${rating} out of 5 stars` : 'Select a rating'}
                            </p>
                        </div>

                        <div className="feedback-section">
                            <label htmlFor="feedback">Additional Feedback (Optional)</label>
                            <textarea
                                id="feedback"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Share your experience with this staff member..."
                                maxLength={500}
                                disabled={isSubmitting}
                            />
                            <p className="char-count">
                                {feedback.length} / 500 characters
                            </p>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting || rating === 0}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
