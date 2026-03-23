import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, XCircle, Zap } from 'lucide-react';

void motion;

// Maps backend uppercase status enums to display labels and colors
const STATUS_CONFIG = {
    PENDING: { 
        label: 'Pending', 
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm shadow-yellow-100',
        gradient: 'from-yellow-400 to-yellow-500',
        icon: AlertCircle,
        pulseColor: 'bg-yellow-400'
    },
    ASSIGNED: { 
        label: 'Assigned', 
        className: 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm shadow-purple-100',
        gradient: 'from-purple-400 to-purple-500',
        icon: Zap,
        pulseColor: 'bg-purple-400'
    },
    IN_PROGRESS: { 
        label: 'In Progress', 
        className: 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm shadow-blue-100',
        gradient: 'from-blue-400 to-blue-500',
        icon: Clock,
        pulseColor: 'bg-blue-400'
    },
    RESOLVED: { 
        label: 'Resolved', 
        className: 'bg-green-50 text-green-700 border-green-200 shadow-sm shadow-green-100',
        gradient: 'from-green-400 to-green-500',
        icon: CheckCircle2,
        pulseColor: 'bg-green-400'
    },
    REJECTED: { 
        label: 'Rejected', 
        className: 'bg-red-50 text-red-700 border-red-200 shadow-sm shadow-red-100',
        gradient: 'from-red-400 to-red-500',
        icon: XCircle,
        pulseColor: 'bg-red-400'
    },
};

const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] ?? { 
        label: status, 
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        gradient: 'from-gray-400 to-gray-500',
        icon: AlertCircle,
        pulseColor: 'bg-gray-400'
    };
    const Icon = config.icon;

    const pulseAnimation = status === 'PENDING' || status === 'IN_PROGRESS' ? {
        scale: [1, 1.2, 1],
        opacity: [1, 0.6, 1]
    } : undefined;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.06, y: -1 }}
            className="inline-block"
        >
            <div className={`group px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 whitespace-nowrap transition-all relative overflow-hidden ${config.className}`}>
                <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                    animate={{ x: ['-120%', '120%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
                    }}
                />
                <motion.div
                    animate={pulseAnimation}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="relative"
                >
                    <Icon size={14} className="flex-shrink-0" />
                </motion.div>
                <span className="relative">{config.label}</span>
                {(status === 'PENDING' || status === 'IN_PROGRESS') && (
                    <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        className={`absolute w-2 h-2 ${config.pulseColor} rounded-full opacity-60 -right-1 -top-1`}
                    />
                )}
            </div>
        </motion.div>
    );
};

export default StatusBadge;
