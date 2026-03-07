import React from 'react';

const Card = ({ children, className = '' }) => {
    return (
        <div className={`bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/80 p-6 transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] ${className}`}>
            {children}
        </div>
    );
};

export default Card;
