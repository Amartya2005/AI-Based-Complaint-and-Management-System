import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, FileText, List, CheckSquare, Users, BarChart } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, setUser } = useContext(AuthContext);
    const getLinks = () => {
        if (!user) return [];
        if (user.role === 'student') return [
            { to: '/student', label: 'Dashboard', icon: Home },
            { to: '/student/my-complaints', label: 'My Complaints', icon: List },
        ];
        if (user.role === 'staff') return [
            { to: '/staff', label: 'Assigned Complaints', icon: List },
            { to: '/staff/update-status', label: 'Update Status', icon: CheckSquare },
        ];
        if (user.role === 'admin') return [
            { to: '/admin', label: 'Overview', icon: Home },
            { to: '/admin/students', label: 'Manage Students', icon: Users },
            { to: '/admin/staff', label: 'Manage Staff', icon: Users },
            { to: '/admin/analytics', label: 'Analytics', icon: BarChart },
        ];
        return [];
    };

    return (
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#1e2330] to-[#2c323f] text-gray-300 flex flex-col min-h-screen shadow-2xl lg:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            {/* Logo Area */}
            <div className="h-24 bg-white/5 backdrop-blur-sm flex items-center px-6 border-b border-white/10 shrink-0">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mr-3 p-1 shadow-inner shrink-0">
                    <img src="/university_emblem.png" alt="GIET Logo" className="h-full w-full object-contain drop-shadow-md" />
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-white font-sans font-extrabold tracking-wide text-lg leading-tight uppercase">GIET University</span>
                    <span className="text-[#00c4cc] font-sans font-medium tracking-wide text-[10px] leading-tight uppercase mt-0.5">Complaint Management System</span>
                </div>
            </div>

            {/* User Info (Mobile only, optional) */}
            <div className="lg:hidden p-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00c4cc] flex items-center justify-center text-white font-bold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                    <p className="text-white text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 py-6 overflow-y-auto px-4">
                <ul className="space-y-2">
                    {getLinks().map((link) => (
                        <li key={link.to}>
                            <NavLink
                                to={link.to}
                                end={link.to === `/${user.role}`}
                                onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }}
                                className={({ isActive }) =>
                                    `group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${isActive
                                        ? 'bg-gradient-to-r from-[#00c4cc] to-[#00a1a8] text-white shadow-md shadow-[#00c4cc]/20'
                                        : 'hover:bg-white/10 hover:text-white text-gray-400 hover:translate-x-1'
                                    }`
                                }
                            >
                                <link.icon size={18} className={`transition-transform duration-300 ${!window.location.pathname.startsWith(link.to) && 'group-hover:scale-110'}`} />
                                <span>{link.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

        </aside>
    );
};

export default Sidebar;
