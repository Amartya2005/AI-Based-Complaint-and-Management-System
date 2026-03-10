import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className = '' }) => {
    return (
        <motion.div
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/80 p-6 ${className}`}
        >
            {children}
        </motion.div>
    );
};

export default Card;
