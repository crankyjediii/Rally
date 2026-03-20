'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { popIn, fadeUp, staggerContainer, EASE_SPRING_SNAPPY } from '@/lib/motion';

interface AuthPromptProps {
  title: string;
  description: string;
  icon?: string;
}

export function AuthPrompt({ title, description, icon = '🔐' }: AuthPromptProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="glass-card p-8 sm:p-12 text-center"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.08))',
        borderColor: 'rgba(139,92,246,0.2)',
      }}
    >
      {/* Icon with glow blob */}
      <motion.div variants={popIn} className="relative inline-block mb-4">
        {/* Glow blob */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.55, 0.3],
          }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-rally-500/30 blur-xl pointer-events-none"
          style={{ transform: 'scale(1.6)' }}
        />
        <div className="text-5xl select-none relative z-10">{icon}</div>
      </motion.div>

      <motion.h2 variants={fadeUp} className="text-xl sm:text-2xl font-bold mb-2">
        {title}
      </motion.h2>
      <motion.p
        variants={fadeUp}
        className="text-sm mb-8 max-w-sm mx-auto"
        style={{ color: 'var(--text-secondary, #a1a1aa)' }}
      >
        {description}
      </motion.p>

      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <SignUpButton mode="modal">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={EASE_SPRING_SNAPPY}
            className="btn-primary w-full sm:w-auto px-8 py-3 touch-manipulation"
          >
            <span>Create Free Account</span>
            <span>✨</span>
          </motion.button>
        </SignUpButton>
        <SignInButton mode="modal">
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={EASE_SPRING_SNAPPY}
            className="btn-secondary w-full sm:w-auto px-6 py-3 touch-manipulation"
          >
            Sign In
          </motion.button>
        </SignInButton>
      </motion.div>

      <motion.p
        variants={fadeUp}
        className="text-xs mt-6"
        style={{ color: 'var(--text-muted, #71717a)' }}
      >
        Free forever · No credit card required
      </motion.p>
    </motion.div>
  );
}
