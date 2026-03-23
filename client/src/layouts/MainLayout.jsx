import React, { useContext, useState, useRef, useEffect } from "react";
import {
  Navigate,
  Outlet,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { AuthContext } from "../context/AuthContext";
import { logout } from "../services/auth";
import {
  Menu,
  MessageSquare,
  Bell,
  User as UserIcon,
  ChevronDown,
  LogOut,
  FileText,
  ShieldCheck,
} from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
} from "../services/notifications";
import { formatDateTime, getTimeAgo, parseApiDate } from "../utils/formatters";
import Loader from "../components/Loader";
import { AnimatePresence, motion } from "framer-motion";
import PageTransition from "../components/PageTransition";

const MainLayout = ({ allowedRole }) => {
  void motion;
  const { user, setUser, loading } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const activityRoute =
    user?.role === "student"
      ? "/student/my-complaints"
      : user?.role === "staff"
        ? "/staff/update-status"
        : "/admin/analytics";
  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "";

  useEffect(() => {
    if (!user || loading) {
      return undefined;
    }

    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const data = await fetchNotifications();
        if (!isMounted) {
          return;
        }

        const sorted = [...data].sort(
          (a, b) => parseApiDate(b.created_at) - parseApiDate(a.created_at),
        );
        setNotifications(sorted.slice(0, 8));
      } catch {
        if (isMounted) {
          setNotifications([]);
        }
      }
    };

    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, [user, loading, location.pathname]);

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate("/");
  };

  const handleNotificationClick = async (notificationId) => {
    const targetNotification = notifications.find(
      (item) => item.id === notificationId,
    );
    if (!targetNotification) {
      return;
    }

    if (!targetNotification.is_read) {
      try {
        await markNotificationRead(notificationId);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId ? { ...item, is_read: true } : item,
          ),
        );
      } catch {
        // Keep the dropdown responsive even if marking read fails.
      }
    }

    setIsNotifOpen(false);
    navigate(activityRoute);
  };

  if (loading)
    return <Loader message="Verifying session..." fullScreen={true} />;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return (
    <div className="flex h-screen bg-surface font-sans text-gray-800 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-12rem] top-[-10rem] h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
          <div className="absolute right-[-10rem] top-20 h-64 w-64 rounded-full bg-orange-300/10 blur-3xl" />
          <div className="absolute bottom-[-10rem] left-1/3 h-72 w-72 rounded-full bg-sky-300/10 blur-3xl" />
        </div>

        {/* Top Navbar */}
        <header className="h-[78px] bg-white/72 backdrop-blur-xl border-b border-white/60 flex items-center justify-between px-4 sm:px-6 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.55)] z-30 shrink-0 sticky top-0 transition-all duration-300">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 mr-4 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand/50"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-cyan-200 shadow-inner">
                <ShieldCheck size={18} />
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Operations Desk
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {roleLabel} workspace for {user.college_id}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            <Link
              to={activityRoute}
              className="relative p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-full transition-all duration-300 hidden sm:block"
            >
              <MessageSquare size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              )}
            </Link>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-full transition-all duration-300 hidden sm:block"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500 ring-2 ring-white"></span>
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <div
                className={`absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-50 transition-all duration-200 origin-top-right ${isNotifOpen ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible"}`}
              >
                <div className="px-4 py-2 border-b border-gray-100/80 mb-1 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-gray-900">
                    Notifications
                  </h3>
                  <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} Unread
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`w-full px-4 py-3 hover:bg-gray-50 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0 text-left ${item.is_read ? "bg-white" : "bg-brand/5"}`}
                        onClick={() => handleNotificationClick(item.id)}
                      >
                        <div
                          className={`p-2 rounded-full mt-0.5 ${item.is_read ? "bg-gray-100 text-gray-500" : "bg-brand/10 text-brand"}`}
                        >
                          <FileText size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 leading-snug">
                            {item.message}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <span title={formatDateTime(item.created_at)}>
                              {getTimeAgo(item.created_at)}
                            </span>
                            {item.complaint_id ? (
                              <span className="font-semibold text-brand">
                                Complaint #{item.complaint_id}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {!item.is_read ? (
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" />
                        ) : null}
                      </button>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-gray-100/80">
                  <button
                    onClick={() => {
                      setIsNotifOpen(false);
                      navigate(activityRoute);
                    }}
                    className="w-full text-center text-xs font-bold text-brand hover:text-brand-600 py-2 transition-colors uppercase tracking-wider"
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>

            <div className="ml-2 relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 hover:shadow-lg hover:shadow-slate-900/20 text-white px-3 py-2.5 sm:px-5 rounded-2xl transition-all duration-300 transform active:scale-95 border border-white/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                  <UserIcon size={15} />
                </span>
                <span className="hidden sm:block text-left leading-tight">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                    {roleLabel}
                  </span>
                  <span className="block text-sm font-semibold">
                    {user.name || user.college_id}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              <div
                className={`absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-50 transition-all duration-200 origin-top-right ${isDropdownOpen ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible"}`}
              >
                <div className="px-5 py-3 border-b border-gray-100/80 mb-1">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user.name || user.college_id}
                  </p>
                  <p className="text-xs text-brand font-medium truncate uppercase tracking-widest mt-0.5">
                    {user.role}
                  </p>
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
        <main className="relative flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="page-shell mx-auto max-w-[1600px] p-4 sm:p-5 lg:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainLayout;
