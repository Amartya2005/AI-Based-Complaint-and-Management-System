import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/loader.css';

void motion;

const Loader = ({ message = "Loading...", fullScreen = false }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) return 100;
                const increment = prev === 0 ? Math.random() * 12 : Math.random() * 6;
                const next = prev + increment;
                return next > 92 ? 92 : next;
            });
        }, 250);

        const completeTimeout = setTimeout(() => {
            setProgress(100);
        }, 7500);

        return () => {
            clearInterval(interval);
            clearTimeout(completeTimeout);
        };
    }, []);

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#0a0e14] via-[#1a1f2e] to-[#0f1419] flex items-center justify-center overflow-hidden">
                {/* Background image overlay */}
                <div className="absolute inset-0 bg-[url('/campus_bg.png')] bg-cover bg-center opacity-2 mix-blend-overlay"></div>
                
                {/* Smooth gradient animation */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-b from-[#00c4cc]/3 via-transparent to-[#0099ff]/3"
                    animate={{ opacity: [0.15, 0.35, 0.15] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Left orb - smooth animation */}
                <motion.div 
                    className="absolute top-20 -left-48 w-[550px] h-[550px] bg-[#00c4cc] rounded-full mix-blend-screen filter blur-3xl opacity-15"
                    animate={{ 
                        x: [0, 30, 0],
                        y: [0, -30, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Right orb - smooth animation */}
                <motion.div 
                    className="absolute -bottom-40 -right-48 w-[550px] h-[550px] bg-[#0099ff] rounded-full mix-blend-screen filter blur-3xl opacity-15"
                    animate={{ 
                        x: [0, -30, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />

                {/* Main content container */}
                <motion.div 
                    className="relative z-10 flex flex-col items-center justify-center w-full px-8"
                    initial={{ scale: 0.92, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                >
                    {/* Top accent line */}
                    <motion.div
                        className="w-24 h-1.5 bg-gradient-to-r from-transparent via-[#00c4cc] to-transparent rounded-full mb-20"
                        animate={{ 
                            opacity: [0.3, 0.8, 0.3],
                            width: [80, 96, 80],
                            filter: ['blur(0px)', 'blur(1px)', 'blur(0px)']
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Main card container */}
                    <motion.div
                        className="relative w-full max-w-[500px]"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                    >
                        {/* Outer glow */}
                        <motion.div
                            className="absolute -inset-16 bg-gradient-to-r from-[#00c4cc]/25 via-[#0099ff]/15 to-[#00c4cc]/25 rounded-3xl blur-3xl -z-10"
                            animate={{ 
                                opacity: [0.25, 0.55, 0.25],
                                scale: [1, 1.08, 1]
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        />

                        {/* Progress bar */}
                        <div className="relative w-full h-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-full overflow-hidden border border-gray-600/30 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.4)]">
                            {/* Top shine */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-transparent rounded-full"></div>

                            {/* Smooth sweep */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                animate={{ x: ['-250%', '250%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            />

                            {/* Progress fill - super smooth */}
                            <motion.div
                                className="h-full bg-gradient-to-r from-[#00c4cc] via-[#00e0ff] to-[#0099ff] rounded-full shadow-[inset_0_0_25px_rgba(0,196,204,0.35), 0_0_35px_rgba(0,196,204,0.7)] relative overflow-hidden"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ ease: "easeOut", duration: 0.5 }}
                            >
                                {/* Inner shimmer */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                                />
                            </motion.div>
                        </div>

                        {/* Logo - perfectly aligned */}
                        <motion.div
                            className="absolute top-1/2 transform -translate-y-1/2 w-36 h-36 rounded-full flex items-center justify-center z-20"
                            animate={{ 
                                rotate: 360,
                                x: progress <= 5 ? "-72px" : `calc(${progress}% * 3.1)`
                            }}
                            transition={{ 
                                rotate: { duration: 2.3, repeat: Infinity, ease: "linear" },
                                x: { duration: 0.6, ease: "easeOut" }
                            }}
                        >
                            {/* Outer ring - pulsing */}
                            <motion.div
                                className="absolute inset-0 rounded-full border-2.5 border-[#00c4cc]/85 shadow-[0_0_50px_rgba(0,196,204,0.9), inset_0_0_35px_rgba(0,196,204,0.45)]"
                                animate={{ 
                                    scale: [0.88, 1.08, 0.88],
                                    opacity: [0.5, 1, 0.5]
                                }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                            />
                            
                            {/* Inner ring */}
                            <motion.div
                                className="absolute -inset-4 rounded-full border border-[#0099ff]/70 shadow-[0_0_35px_rgba(0,153,255,0.7)]"
                                animate={{ 
                                    scale: [1.08, 0.88, 1.08],
                                    opacity: [0.7, 0.3, 0.7]
                                }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                            />

                            {/* Logo background */}
                            <motion.div 
                                className="w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-[#00c4cc]/45 to-[#0099ff]/35 backdrop-blur-2xl border border-white/45 shadow-[0_30px_60px_rgba(0,196,204,0.3)]"
                                animate={{ 
                                    boxShadow: [
                                        "0 30px 60px rgba(0,196,204,0.3)",
                                        "0 30px 60px rgba(0,196,204,0.5)",
                                        "0 30px 60px rgba(0,196,204,0.3)"
                                    ]
                                }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/25 via-white/10 to-transparent"></div>
                                <img
                                    src="/university_emblem.png"
                                    alt="GIET Logo"
                                    className="w-28 h-28 object-contain drop-shadow-2xl relative z-10 filter brightness-125"
                                />
                            </motion.div>
                        </motion.div>
                    </motion.div>

                    {/* Status section */}
                    <div className="text-center mt-28 w-full">
                        {/* Message - smooth pulse */}
                        <motion.p
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="text-xs font-bold tracking-[0.2em] uppercase text-gray-300 mb-8"
                            style={{ letterSpacing: '0.2em' }}
                        >
                            {message}
                        </motion.p>

                        {/* Percentage - large and centered */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8"
                        >
                            <motion.span
                                className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c4cc] via-[#00e0ff] to-[#0099ff] font-black text-7xl tracking-tighter"
                                animate={{ 
                                    scale: [1, 1.04, 1],
                                }}
                                transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                            >
                                {Math.round(progress)}%
                            </motion.span>
                        </motion.div>

                        {/* Divider - smooth pulse */}
                        <motion.div
                            className="w-20 h-1 bg-gradient-to-r from-transparent via-[#0099ff] to-transparent rounded-full mx-auto"
                            animate={{ 
                                opacity: [0.2, 0.8, 0.2],
                                width: [60, 80, 60]
                            }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>

                    {/* Bottom accent */}
                    <motion.div
                        className="w-24 h-1.5 bg-gradient-to-r from-transparent via-[#00c4cc] to-transparent rounded-full mt-20"
                        animate={{ 
                            opacity: [0.3, 0.8, 0.3],
                            width: [80, 96, 80],
                            filter: ['blur(0px)', 'blur(1px)', 'blur(0px)']
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                </motion.div>
            </div>
        );
    }

    // Non-fullscreen version
    return (
        <div className="w-full h-[70vh] flex items-center justify-center bg-transparent rounded-2xl relative">
            <motion.div 
                className="relative z-10 flex flex-col items-center justify-center"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
            >
                {/* Progress bar with logo overlay */}
                <motion.div 
                    className="mb-20 relative"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                    {/* Progress bar container */}
                    <div className="relative w-96 h-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-full overflow-hidden border border-gray-600/50 shadow-2xl">
                        {/* Animated gradient sweep */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                            animate={{ x: ['-150%', '150%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Progress fill - smooth */}
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#00c4cc] via-[#0099ff] to-[#00f2fe] rounded-full shadow-[inset_0_0_20px_rgba(0,196,204,0.3)] relative overflow-hidden"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "easeOut", duration: 0.5 }}
                        >
                            {/* Animated shimmer on fill */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                            />
                        </motion.div>
                    </div>

                    {/* Rotating logo over progress bar */}
                    <motion.div
                        className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2 w-28 h-28 rounded-full flex items-center justify-center relative z-20"
                        animate={{ 
                            rotate: 360,
                            x: `calc(${progress}% * 3.333 + 48px)`
                        }}
                        transition={{ 
                            rotate: { duration: 2.2, repeat: Infinity, ease: "linear" },
                            x: { duration: 0.5, ease: "easeOut" }
                        }}
                    >
                        {/* Outer glow ring */}
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-[#00c4cc]/80 shadow-[0_0_40px_rgba(0,196,204,0.7), inset_0_0_25px_rgba(0,196,204,0.3)]"
                            animate={{ scale: [0.95, 1.05, 0.95] }}
                            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                        />
                        
                        {/* Inner glow ring */}
                        <motion.div
                            className="absolute -inset-2 rounded-full border border-[#0099ff]/60 shadow-[0_0_25px_rgba(0,153,255,0.5)]"
                            animate={{ scale: [1.05, 0.95, 1.05] }}
                            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />

                        {/* Logo container with enhanced effects */}
                        <div className="w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-[#00c4cc]/30 to-[#0099ff]/30 backdrop-blur-xl border border-white/30 shadow-[0_20px_40px_rgba(0,196,204,0.2)] relative">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
                            <img
                                src="/university_emblem.png"
                                alt="GIET Logo"
                                className="w-20 h-20 object-contain drop-shadow-2xl relative z-10"
                            />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Status text and percentage */}
                <div className="w-96 text-center mt-24">
                    {/* Message - smooth pulse */}
                    <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                        className="text-sm font-bold tracking-widest uppercase mb-6 text-gray-500"
                    >
                        {message}
                    </motion.p>

                    {/* Percentage display - smooth scale */}
                    <div className="flex justify-center">
                        <motion.div
                            className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c4cc] via-[#0099ff] to-[#00f2fe] font-bold text-5xl tracking-tight"
                            animate={{ scale: [1, 1.06, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                        >
                            {Math.round(progress)}%
                        </motion.div>
                    </div>

                    {/* Bottom decorative line */}
                    <motion.div
                        className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#0099ff] to-transparent rounded-full mx-auto mt-8"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default Loader;
