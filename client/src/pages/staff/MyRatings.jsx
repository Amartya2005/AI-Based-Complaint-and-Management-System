import React, { useContext } from 'react';
import StaffRatingDisplay from '../../components/StaffRatingDisplay';
import { AuthContext } from '../../context/AuthContext';

/**
 * Staff My Ratings Page
 * Shows the staff member's average rating and breakdown
 */
const MyRatings = () => {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-700 to-brand bg-clip-text text-transparent">
                    Your Performance Ratings
                </h1>
                <p className="text-gray-600 mt-2">
                    View feedback and ratings from students about your complaint handling
                </p>
            </div>

            <div className="max-w-2xl">
                <StaffRatingDisplay staffId={user.id} compact={false} />
            </div>
        </div>
    );
};

export default MyRatings;
