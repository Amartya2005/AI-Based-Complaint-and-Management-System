import React, { useState } from 'react';
import Loader from '../components/Loader';
import { motion } from 'framer-motion';

void motion;

const LoaderDemo = () => {
    const [showFullScreen, setShowFullScreen] = useState(false);
    const [showRegular, setShowRegular] = useState(false);

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Interactive Loading Animation
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Rotating logo over animated progress bar with cool effects
                    </p>
                </motion.div>

                {/* Demo Buttons */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex gap-6 justify-center mb-12 flex-wrap"
                >
                    <button
                        onClick={() => setShowFullScreen(!showFullScreen)}
                        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        {showFullScreen ? 'Hide' : 'Show'} Full Screen Loader
                    </button>
                    <button
                        onClick={() => setShowRegular(!showRegular)}
                        className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        {showRegular ? 'Hide' : 'Show'} Regular Loader
                    </button>
                </motion.div>

                {/* Features List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-8 mb-12"
                >
                    <h2 className="text-2xl font-bold text-white mb-6">Features</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex gap-4">
                            <div className="w-1 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                            <div>
                                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Rotating Logo</h3>
                                <p className="text-gray-400">Logo rotates smoothly over the progress bar</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                            <div>
                                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Animated Progress Bar</h3>
                                <p className="text-gray-400">Gradient progress bar with shimmer effects</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                            <div>
                                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Glowing Effects</h3>
                                <p className="text-gray-400">Multiple glow rings around the logo</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                            <div>
                                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Background Effects</h3>
                                <p className="text-gray-400">Animated gradient orbs in background</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                            <div>
                                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Interactive Percentage</h3>
                                <p className="text-gray-400">Animated percentage display that pulses</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                            <div>
                                <h3 className="text-lg font-semibold text-cyan-400 mb-2">Responsive Design</h3>
                                <p className="text-gray-400">Works seamlessly on all screen sizes</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Usage Example */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-4">Usage</h2>
                    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-cyan-400 text-sm font-mono">
{`import Loader from '../components/Loader';

// Full screen loader (recommended for page loads)
<Loader fullScreen={true} message="Loading..." />

// Regular nested loader
<Loader fullScreen={false} message="Processing..." />`}
                        </pre>
                    </div>
                </motion.div>
            </div>

            {/* Full Screen Demo */}
            {showFullScreen && (
                <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <Loader fullScreen={true} message="Loading..." />
                    </motion.div>
                </div>
            )}

            {/* Regular Demo */}
            {showRegular && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed bottom-8 left-8 right-8 max-w-2xl mx-auto bg-slate-900 border border-cyan-500/30 rounded-2xl p-8 shadow-2xl"
                >
                    <Loader fullScreen={false} message="Loading..." />
                </motion.div>
            )}
        </div>
    );
};

export default LoaderDemo;
