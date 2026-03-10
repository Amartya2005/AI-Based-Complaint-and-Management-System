import React from 'react';

const PriorityBadge = ({ level, score }) => {
    const styles = {
        CRITICAL: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
        HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
        MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        LOW: 'bg-gray-100 text-gray-600 border-gray-300',
    };

    // Fallback if level is undefined
    const displayLevel = level || 'LOW';
    const displayScore = score !== undefined ? score : '0';

    return (
        <span className={`px-2 py-1 rounded inline-block text-xs font-semibold border ${styles[displayLevel] || styles.LOW}`}>
            {displayLevel} ({displayScore})
        </span>
    );
};

export default PriorityBadge;
