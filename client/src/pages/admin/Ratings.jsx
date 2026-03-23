import React from 'react';
import RatingsDashboard from '../../components/RatingsDashboard';

/**
 * Admin Ratings Page
 * Shows all staff ratings submitted by students
 */
const Ratings = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-700 to-brand bg-clip-text text-transparent">
                    Staff Ratings & Reviews
                </h1>
                <p className="text-gray-600 mt-2">
                    Monitor student feedback and staff performance ratings
                </p>
            </div>

            <RatingsDashboard />
        </div>
    );
};

export default Ratings;
