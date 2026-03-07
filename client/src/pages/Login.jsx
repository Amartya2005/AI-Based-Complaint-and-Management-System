import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import { AuthContext } from '../context/AuthContext';

// ─── Captcha helpers ──────────────────────────────────────────────────────────
const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
function generateCaptcha(len = 5) {
    return Array.from({ length: len }, () =>
        CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)]
    ).join('');
}

const CaptchaCanvas = ({ text }) => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = '#f0f4f8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Noise lines
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `hsl(${Math.random() * 360},50%,70%)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        // Characters — each with a different color and slight rotation
        const colors = ['#0d9488', '#1e40af', '#7c3aed', '#b45309', '#be123c'];
        [...text].forEach((ch, i) => {
            ctx.save();
            ctx.font = `bold ${20 + Math.random() * 6}px monospace`;
            ctx.fillStyle = colors[i % colors.length];
            ctx.translate(14 + i * 22, 28 + (Math.random() * 6 - 3));
            ctx.rotate((Math.random() - 0.5) * 0.4);
            ctx.fillText(ch, 0, 0);
            ctx.restore();
        });

        // Noise dots
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }, [text]);

    return <canvas ref={canvasRef} width={130} height={42} className="rounded" />;
};

// ─── Main Login Component ─────────────────────────────────────────────────────
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [captchaText, setCaptchaText] = useState(() => generateCaptcha());
    const [captchaInput, setCaptchaInput] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, setUser, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    const refreshCaptcha = useCallback(() => {
        setCaptchaText(generateCaptcha());
        setCaptchaInput('');
    }, []);

    // Single source of truth for redirect
    useEffect(() => {
        if (!loading && user) navigate(`/${user.role}`, { replace: true });
    }, [user, loading, navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-white text-lg font-semibold animate-pulse">Loading...</div>
        </div>
    );

    const handleLogin = async (e) => {
        e.preventDefault();
        if (captchaInput.trim() !== captchaText) {
            setError('Incorrect captcha. Please try again.');
            refreshCaptcha();
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const userData = await login(email, password);
            setUser(userData);
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(typeof detail === 'string' ? detail : 'Invalid credentials. Please check your email and password.');
            refreshCaptcha();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
            style={{
                backgroundImage: 'url(/campus_bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            {/* Dark desaturated overlay */}
            <div
                className="absolute inset-0"
                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'grayscale(85%) brightness(0.55)' }}
            />

            {/* Login Card */}
            <div className="relative z-10 flex w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">

                {/* ── Left Panel ── */}
                <div
                    className="hidden md:flex flex-col items-center justify-center w-5/12 p-10 text-white text-center relative"
                    style={{
                        backgroundImage: 'url(/campus_bg.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* dark overlay just for left panel */}
                    <div className="absolute inset-0 bg-black/65" />

                    <div className="relative z-10 flex flex-col items-center gap-5">
                        {/* Logo circle */}
                        <div className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden shadow-lg bg-white/10 flex items-center justify-center">
                            <img
                                src="/university_emblem.png"
                                alt="GIET University"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div>
                            <h2 className="text-2xl font-extrabold tracking-[0.18em] uppercase leading-tight">
                                GIET<br />UNIVERSITY
                            </h2>
                            <div className="mt-2 w-10 h-0.5 bg-teal-400 mx-auto rounded-full" />
                            <p className="text-xs text-gray-300 mt-3 italic font-light">
                                Best University in Eastern India
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Right Panel ── */}
                <div className="flex-1 bg-white px-8 py-10 flex flex-col justify-center">
                    <h1 className="text-3xl font-bold tracking-[0.2em] text-teal-500 mb-7">
                        LOGIN
                    </h1>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-5">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">

                        {/* Email / Username */}
                        <div className="relative">
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="Username"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-lg text-sm outline-none
                                           focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition bg-gray-50 placeholder-gray-400"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </span>
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="current-password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-lg text-sm outline-none
                                           focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition bg-gray-50 placeholder-gray-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-500 transition"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Captcha row */}
                        <div className="flex items-center gap-3">
                            <div
                                onClick={refreshCaptcha}
                                className="cursor-pointer select-none flex-shrink-0"
                                title="Click to refresh captcha"
                            >
                                <CaptchaCanvas text={captchaText} />
                            </div>
                            <input
                                type="text"
                                required
                                placeholder="Captcha Code"
                                value={captchaInput}
                                onChange={e => setCaptchaInput(e.target.value)}
                                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none
                                           focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition bg-gray-50 placeholder-gray-400"
                            />
                        </div>
                        <p className="text-xs text-gray-400 -mt-1 pl-1">Click the captcha image to refresh</p>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white
                                       font-bold tracking-[0.2em] rounded-lg shadow-md transition disabled:opacity-60 mt-1"
                        >
                            {isSubmitting ? 'Signing in...' : 'LOGIN'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        Contact your administrator if you need access.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Login;
