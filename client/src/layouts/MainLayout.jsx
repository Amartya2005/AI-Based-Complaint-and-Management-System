import React, { useContext, useState, useRef, useEffect } from 'react';
import { Navigate, Outlet, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import { logout } from '../services/auth';
import { fetchComplaints } from '../services/complaints';
import { Menu, MessageSquare, Bell, User as UserIcon, ChevronDown, LogOut, FileText } from 'lucide-react';

const MainLayout = ({ allowedRole }) => {
    const { user, setUser, loading } = useContext(AuthContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [recentData, setRecentData] = useState([]);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !loading) {
            fetchComplaints().then(data => {
                const sorted = data.sort((a, b) => new Date(b.created_at + 'Z') - new Date(a.created_at + 'Z'));
                setRecentData(sorted.slice(0, 4));
            }).catch(() => { });
        }
    }, [user, loading]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setUser(null);
        navigate('/');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#ecf0f5] text-[#00c4cc] text-xl font-semibold">Loading...</div>;

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to={`/${user.role}`} replace />;
    }

    return (
        <div className="flex h-screen bg-[#f4f7f6] font-sans text-gray-800 overflow-hidden selection:bg-[#00c4cc] selection:text-white">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Top Navbar */}
                <header className="h-[72px] bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-6 shadow-sm z-30 shrink-0 sticky top-0 transition-all duration-300">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 mr-4 text-gray-400 hover:text-[#00c4cc] hover:bg-[#00c4cc]/10 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#00c4cc]/50"
                        >
                            <Menu size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-4">
                        <Link
                            to={user?.role === 'student' ? '/student/my-complaints' : user?.role === 'staff' ? '/staff/update-status' : '/admin/analytics'}
                            className="relative p-2 text-gray-400 hover:text-[#00c4cc] hover:bg-[#00c4cc]/10 rounded-full transition-all duration-300 hidden sm:block"
                        >
                            <MessageSquare size={18} />
                            {recentData.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>}
                        </Link>

                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="relative p-2 text-gray-400 hover:text-[#00c4cc] hover:bg-[#00c4cc]/10 rounded-full transition-all duration-300 hidden sm:block"
                            >
                                <Bell size={18} />
                                {recentData.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500 ring-2 ring-white"></span>
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            <div className={`absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-50 transition-all duration-200 origin-top-right ${isNotifOpen ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible'}`}>
                                <div className="px-4 py-2 border-b border-gray-100/80 mb-1 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
                                    <span className="text-xs bg-[#00c4cc]/10 text-[#00c4cc] px-2 py-0.5 rounded-full font-bold">{recentData.length} Updates</span>
                                </div>

                                <div className="max-h-80 overflow-y-auto">
                                    {recentData.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-500">No recent activity</div>
                                    ) : (
                                        recentData.map((item, idx) => (
                                            <Link
                                                key={idx}
                                                to={user?.role === 'student' ? '/student/my-complaints' : user?.role === 'staff' ? '/staff/update-status' : '/admin/analytics'}
                                                className="px-4 py-3 hover:bg-gray-50 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0"
                                                onClick={() => setIsNotifOpen(false)}
                                            >
                                                <div className={`p-2 rounded-full mt-0.5 
                                                    ${item.status === 'RESOLVED' ? 'bg-[#28a745]/10 text-[#28a745]' :
                                                        item.status === 'PENDING' ? 'bg-[#ffc107]/10 text-[#ffc107]' :
                                                            item.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                                                                'bg-[#17a2b8]/10 text-[#17a2b8]'}`}>
                                                    <FileText size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Status: <span className="font-bold">{item.status.replace('_', ' ')}</span></p>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>

                                <div className="p-2 border-t border-gray-100/80">
                                    <button
                                        onClick={() => {
                                            setIsNotifOpen(false);
                                            navigate(user?.role === 'student' ? '/student/my-complaints' : user?.role === 'staff' ? '/staff/update-status' : '/admin');
                                        }}
                                        className="w-full text-center text-xs font-bold text-[#00c4cc] hover:text-[#00a1a8] py-2 transition-colors uppercase tracking-wider"
                                    >
                                        View All
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="ml-2 relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 bg-gradient-to-r from-[#00c4cc] to-[#00a1a8] hover:shadow-lg hover:shadow-[#00c4cc]/30 text-white px-5 py-2.5 rounded-full transition-all duration-300 transform active:scale-95"
                            >
                                <UserIcon size={16} />
                                <span className="text-sm font-semibold tracking-wide uppercase hidden sm:block">
                                    {user.name || user.college_id}
                                </span>
                                <ChevronDown size={16} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            <div className={`absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-50 transition-all duration-200 origin-top-right ${isDropdownOpen ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible'}`}>
                                <div className="px-5 py-3 border-b border-gray-100/80 mb-1">
                                    <p className="text-sm font-bold text-gray-900 truncate">{user.name || user.college_id}</p>
                                    <p className="text-xs text-[#00c4cc] font-medium truncate uppercase tracking-widest mt-0.5">{user.role}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-5 py-3 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center transition-colors duration-200"
                                >
                                    <LogOut size={16} className="mr-3" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Scrollable Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default MainLayout;
