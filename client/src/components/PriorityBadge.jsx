import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, AlertOctagon, Info } from 'lucide-react';

void motion;

const PriorityBadge = ({ level, score }) => {
    const styles = {
        CRITICAL: {
            bg: 'bg-red-50',
            text: 'text-red-700',
            border: 'border-red-200',
            shadow: 'shadow-red-100',
            gradient: 'from-red-400 to-red-600',
            icon: AlertOctagon,
            pulseColor: 'bg-red-500'
        },
        HIGH: {
            bg: 'bg-orange-50',
            text: 'text-orange-700',
            border: 'border-orange-200',
            shadow: 'shadow-orange-100',
            gradient: 'from-orange-400 to-orange-600',
            icon: AlertTriangle,
            pulseColor: 'bg-orange-500'
        },
        MEDIUM: {
            bg: 'bg-yellow-50',
            text: 'text-yellow-700',
            border: 'border-yellow-200',
            shadow: 'shadow-yellow-100',
            gradient: 'from-yellow-400 to-yellow-600',
            icon: AlertCircle,
            pulseColor: 'bg-yellow-500'
        },
        LOW: {
            bg: 'bg-gray-50',
            text: 'text-gray-600',
            border: 'border-gray-200',
            shadow: 'shadow-gray-100',
            gradient: 'from-gray-400 to-gray-600',
            icon: Info,
            pulseColor: 'bg-gray-500'
        },
    };

    const displayLevel = level || 'LOW';
    const displayScore = score !== undefined ? score : '0';
    const style = styles[displayLevel] || styles.LOW;
    const Icon = style.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.06, y: -1 }}
            className="inline-block"
        >
            <div className={`group px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold border ${style.bg} ${style.text} ${style.border} shadow-sm ${style.shadow} relative overflow-hidden transition-all`}>
                <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                    animate={{ x: ['-120%', '120%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
                    }}
                />
                <motion.div
                    animate={displayLevel === 'CRITICAL' ? { scale: [1, 1.3, 1] } : { scale: [1, 1.15, 1] }}
                    transition={{ duration: displayLevel === 'CRITICAL' ? 1 : 1.5, repeat: Infinity }}
                    className="relative"
                >
                    <Icon size={14} className="flex-shrink-0" />
                </motion.div>
                <span className="relative font-bold tracking-wide">{displayLevel}</span>
                <span className="relative opacity-70">({displayScore})</span>
                {displayLevel !== 'LOW' && (
                    <motion.div
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: displayLevel === 'CRITICAL' ? 1.2 : 1.8, repeat: Infinity }}
                        className={`absolute w-1.5 h-1.5 ${style.pulseColor} rounded-full -top-0.5 -right-0.5 opacity-70`}
                    />
                )}
            </div>
        </motion.div>
    );
};

export default PriorityBadge;
