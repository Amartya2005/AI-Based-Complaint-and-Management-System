// ─── Framer Motion Animation Variants ─────────────────────────────────────

export const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

export const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 }
    }
};

export const floatingVariants = {
    animate: {
        y: [-5, 5, -5],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    }
};

export const pulseVariants = {
    animate: {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
        transition: {
            duration: 2,
            repeat: Infinity
        }
    }
};

export const shimmerVariants = {
    animate: {
        backgroundPosition: ['0% 0%', '100% 100%'],
        transition: {
            duration: 3,
            repeat: Infinity
        }
    }
};

export const slideInLeft = {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.5 } }
};

export const slideInRight = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.5 } }
};

export const slideInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};

export const rotateIn = {
    initial: { opacity: 0, rotate: -10 },
    animate: { opacity: 1, rotate: 0, transition: { duration: 0.5 } }
};

export const hoverScale = {
    whileHover: { scale: 1.05 },
    transition: { type: 'spring', stiffness: 300 }
};

export const hoverGrow = {
    whileHover: { scale: 1.08, transition: { duration: 0.3 } }
};

export const tapScale = {
    whileTap: { scale: 0.95 }
};

export const cardHoverVariants = {
    initial: { y: 0, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    hover: { 
        y: -8, 
        boxShadow: '0 20px 40px rgba(0,196,204,0.2)',
        transition: { duration: 0.3 }
    }
};

export const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
};
