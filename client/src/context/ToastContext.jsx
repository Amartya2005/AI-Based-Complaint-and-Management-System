import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-start gap-3 w-80 p-4 bg-white/95 backdrop-blur shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] rounded-2xl border border-gray-100 transform transition-all duration-300 animate-[slideIn_0.3s_ease-out] relative overflow-hidden`}
                    >
                        {/* Type Indicator Line */}
                        <div className={`absolute top-0 left-0 bottom-0 w-1 ${toast.type === 'success' ? 'bg-[#00c4cc]' :
                                toast.type === 'error' ? 'bg-red-500' : 'bg-[#2c323f]'
                            }`} />

                        <div className={`mt-0.5 shrink-0 ${toast.type === 'success' ? 'text-[#00c4cc]' :
                                toast.type === 'error' ? 'text-red-500' : 'text-[#2c323f]'
                            }`}>
                            {toast.type === 'success' ? <CheckCircle size={20} /> :
                                toast.type === 'error' ? <AlertCircle size={20} /> : 'info' ? <Info size={20} /> : null}
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
                    </div>
                ))}
            </div>
            {/* Inject simple animation keyframes inline for ease */}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
