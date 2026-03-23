import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext(null);

void motion;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence initial={false}>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            layout
                            initial={{ opacity: 0, x: 120, scale: 0.98, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, x: 120, scale: 0.98, filter: 'blur(4px)' }}
                            transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                            className="pointer-events-auto flex items-start gap-3 w-80 p-4 bg-white/95 backdrop-blur shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] rounded-2xl border border-gray-100 relative overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 bottom-0 w-1 ${toast.type === 'success' ? 'bg-brand' :
                                toast.type === 'error' ? 'bg-red-500' : 'bg-gray-800'
                                }`} />

                            <div className={`mt-0.5 shrink-0 ${toast.type === 'success' ? 'text-brand' :
                                toast.type === 'error' ? 'text-red-500' : 'text-gray-800'
                                }`}>
                                {toast.type === 'success' ? <CheckCircle size={20} /> :
                                    toast.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
                            </div>

                            <div className="flex-1 text-sm font-medium text-gray-700 leading-snug">
                                {toast.message}
                            </div>

                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mt-1 -mr-1 rounded-full hover:bg-gray-100"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
