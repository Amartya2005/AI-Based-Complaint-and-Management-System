import React from 'react';
import { motion } from 'framer-motion';

void motion;

const Card = ({ children, className = '', interactive = false }) => {
    return (
        <motion.div
            layout
            whileHover={{ y: interactive !== false ? -6 : 0, boxShadow: interactive !== false ? "0 20px 40px -10px rgb(var(--brand-rgb) / 0.18)" : "0 4px 20px -4px rgba(0,0,0,0.05)" }}
            whileTap={interactive !== false ? { scale: 0.99 } : undefined}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100/80 p-6 ${className} relative overflow-hidden group`}
        >
            {/* Animated border gradient on hover */}
            <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100"
                animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{
                    background: 'linear-gradient(45deg, transparent, rgb(var(--brand-rgb) / 0.12), transparent)',
                    backgroundSize: '200% 200%'
                }}
            />
            
            {/* Glowing corner effect on hover */}
            <motion.div
                className="absolute -top-1 -right-1 w-20 h-20 bg-gradient-to-br from-brand/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 pointer-events-none"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                whileHover={{ scale: 1.3 }}
            />

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};

export default Card;
