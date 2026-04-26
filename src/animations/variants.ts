import { Variants } from 'framer-motion';

export const pageVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -20 },
};

export const pageTransition = { type: 'tween', duration: 0.2, ease: 'easeInOut' as const };

export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.055 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

export const chatMsgVariants: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18 } },
};
