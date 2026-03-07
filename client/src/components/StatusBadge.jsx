import React from 'react';

// Maps backend uppercase status enums to display labels and colors
const STATUS_CONFIG = {
    PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    ASSIGNED: { label: 'Assigned', className: 'bg-purple-100 text-purple-800 border-purple-200' },
    IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-100   text-blue-800   border-blue-200' },
    RESOLVED: { label: 'Resolved', className: 'bg-green-100  text-green-800  border-green-200' },
    REJECTED: { label: 'Rejected', className: 'bg-red-100    text-red-800    border-red-200' },
};

const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${config.className}`}>
            {config.label}
        </span>
    );
};

export default StatusBadge;
