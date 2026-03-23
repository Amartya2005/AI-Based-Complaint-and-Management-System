import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, List, CheckSquare, Users, BarChart, Star } from 'lucide-react';
import { motion } from 'framer-motion';

void motion;

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user } = useContext(AuthContext);
    const getLinks = () => {
        if (!user) return [];
        if (user.role === 'student') return [
            { to: '/student', label: 'Dashboard', icon: Home },
            { to: '/student/my-complaints', label: 'My Complaints', icon: List },
        ];
        if (user.role === 'staff') return [
            { to: '/staff', label: 'Assigned Complaints', icon: List },
            { to: '/staff/update-status', label: 'Update Status', icon: CheckSquare },
            { to: '/staff/my-ratings', label: 'My Ratings', icon: Star },
        ];
        if (user.role === 'admin') return [
            { to: '/admin', label: 'Overview', icon: Home },
            { to: '/admin/students', label: 'Manage Students', icon: Users },
            { to: '/admin/staff', label: 'Manage Staff', icon: Users },
            { to: '/admin/analytics', label: 'Analytics', icon: BarChart },
            { to: '/admin/ratings', label: 'Staff Ratings', icon: Star },
        ];
        return [];
    };

    const navContainer = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const navItem = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-sidebar-from to-sidebar-to text-gray-300 flex flex-col min-h-screen shadow-2xl lg:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-in-out overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            {/* Animated Background Elements */}
            <motion.div
                className="absolute inset-0 opacity-10 pointer-events-none"
                animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                transition={{ duration: 20, repeat: Infinity }}
                style={{
                    backgroundImage: 'linear-gradient(45deg, transparent 25%, rgba(0, 196, 204, 0.1) 25%, rgba(0, 196, 204, 0.1) 50%, transparent 50%, transparent 75%, rgba(0, 196, 204, 0.1) 75%)',
                    backgroundSize: '30px 30px'
                }}
            />

            {/* Logo Area */}
            <motion.div 
                className="h-24 bg-white/5 backdrop-blur-sm flex items-center px-6 border-b border-white/10 shrink-0 relative z-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <motion.div 
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mr-3 p-1 shadow-inner shrink-0 relative overflow-hidden group"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-50%] bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    />
                    <motion.div
                        animate={{ 
                            boxShadow: ['0 0 10px rgb(var(--brand-rgb) / 0.5)', '0 0 20px rgb(var(--brand-rgb) / 0.8)', '0 0 10px rgb(var(--brand-rgb) / 0.5)']
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="relative z-10"
                    >
                        <img src="/university_emblem.png" alt="GIET Logo" className="h-full w-full object-contain drop-shadow-md" />
                    </motion.div>
                </motion.div>
                <motion.div 
                    className="flex flex-col justify-center"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <span className="text-white font-sans font-extrabold tracking-wide text-lg leading-tight uppercase">GIET University</span>
                    <span className="text-brand font-sans font-medium tracking-wide text-[10px] leading-tight uppercase mt-0.5">Complaint Management System</span>
                </motion.div>
            </motion.div>

            {/* User Info (Mobile only, optional) */}
            <motion.div 
                className="lg:hidden p-4 border-b border-white/10 flex items-center gap-3 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <motion.div 
                    className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold shadow-md"
                    whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgb(var(--brand-rgb) / 0.6)' }}
                >
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <p className="text-white text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                </motion.div>
            </motion.div>

            {/* Navigation Links */}
            <nav className="flex-1 py-6 overflow-y-auto px-4 relative z-10">
                <motion.ul
                    variants={navContainer}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                >
                    {getLinks().map((link, idx) => (
                        <motion.li key={link.to} variants={navItem} custom={idx}>
                            <NavLink
                                to={link.to}
                                end={link.to === `/${user.role}`}
                                onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }}
                                className={({ isActive }) =>
                                    `group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium relative overflow-hidden ${isActive
                                        ? 'text-white shadow-lg shadow-brand/30'
                                        : 'hover:bg-white/10 hover:text-white text-gray-400'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <>
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute inset-0 bg-gradient-to-r from-brand to-brand-600 z-0"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"
                                                    animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    style={{ backgroundSize: '200% 200%' }}
                                                />
                                            </>
                                        )}
                                        <motion.div
                                            className="relative z-10"
                                            whileHover={{ rotate: 360 }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <link.icon size={18} className={`transition-all duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
                                        </motion.div>
                                        <span className="relative z-10 transition-transform group-hover:translate-x-1">{link.label}</span>
                                        {!isActive && (
                                            <motion.div
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand opacity-0 group-hover:opacity-100 z-0"
                                                layoutId="hoverDot"
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        </motion.li>
                    ))}
                </motion.ul>
            </nav>

        </aside>
    );
};

export default Sidebar;
