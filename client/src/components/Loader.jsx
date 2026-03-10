import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const Loader = ({ message = "Loading...", fullScreen = false }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Mock progress matching the animation duration roughly
        const interval = setInterval(() => {
            setProgress((prev) => {
                const next = prev + Math.random() * 15;
                if (next >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return next > 95 ? 95 : next;
            });
        }, 150);
        return () => clearInterval(interval);
    }, []);

    const containerStyle = fullScreen
        ? "fixed inset-0 z-50 bg-[#1e2330]"
        : "w-full h-[60vh] min-h-[400px] bg-transparent rounded-2xl";

    return (
        <div className={`flex flex-col items-center justify-center overflow-hidden relative ${containerStyle}`}>
            {fullScreen && <div className="absolute inset-0 bg-[url('/campus_bg.png')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>}

            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                className={`w-28 h-28 rounded-full flex items-center justify-center p-3 mb-8 relative z-10 ${fullScreen ? 'bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(0,196,204,0.15)]' : 'bg-[#00c4cc]/5 border border-[#00c4cc]/20 shadow-[0_0_30px_rgba(0,196,204,0.1)]'}`}
            >
                <img
                    src="/university_emblem.png"
                    alt="GIET Logo"
                    className="w-full h-full object-contain drop-shadow-lg"
                />
            </motion.div>

            <div className="w-72 relative z-10">
                <div className={`flex justify-between text-xs font-bold mb-2 tracking-widest uppercase ${fullScreen ? 'text-gray-300' : 'text-gray-500'}`}>
                    <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        {message}
                    </motion.span>
                    <span className="text-[#00c4cc]">{Math.round(progress)}%</span>
                </div>
                <div className={`h-1.5 w-full rounded-full overflow-hidden backdrop-blur-sm ${fullScreen ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#00c4cc] to-[#00f2fe] rounded-full shadow-[0_0_10px_rgba(0,196,204,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "easeOut", duration: 0.2 }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Loader;
