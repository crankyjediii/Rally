'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';

interface AuthPromptProps {
  title: string;
  description: string;
  icon?: string;
}

export function AuthPrompt({ title, description, icon = '🔐' }: AuthPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-8 sm:p-12 text-center"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.08))',
        borderColor: 'rgba(139,92,246,0.2)',
      }}
    >
      <div className="text-5xl mb-4 select-none">{icon}</div>
      <h2 className="text-xl sm:text-2xl font-bold mb-2">{title}</h2>
      <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: 'var(--text-secondary, #a1a1aa)' }}>
        {description}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <SignUpButton mode="modal">
          <button className="btn-primary w-full sm:w-auto px-8 py-3 touch-manipulation">
            <span>Create Free Account</span>
            <span>✨</span>
          </button>
        </SignUpButton>
        <SignInButton mode="modal">
          <button className="btn-secondary w-full sm:w-auto px-6 py-3 touch-manipulation">
            Sign In
          </button>
        </SignInButton>
      </div>

      <p className="text-xs mt-6" style={{ color: 'var(--text-muted, #71717a)' }}>
        Free forever · No credit card required
      </p>
    </motion.div>
  );
}
