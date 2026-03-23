import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { pageTransition } from '../utils/animations';

void motion;

const PageTransition = ({ children, className = '' }) => {
    const shouldReduceMotion = useReducedMotion();
    const variants = shouldReduceMotion
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : pageTransition;

    return (
        <motion.div
            className={className}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
