'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { useTheme } from '@/hooks/useTheme';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/build', label: 'Build', icon: '🚀' },
  { href: '/history', label: 'History', icon: '📋' },
  { href: '/saved', label: 'Saved', icon: '❤️' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-xl bg-surface-elevated border border-border-default flex items-center justify-center text-base transition-all hover:border-border-hover active:scale-95"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.span
        key={isDark ? 'moon' : 'sun'}
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {isDark ? '🌙' : '☀️'}
      </motion.span>
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();

  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-6 py-3 bg-surface-primary/90 backdrop-blur-xl border-b border-border-default">
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ scale: 1.12, rotate: 6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="w-8 h-8 rounded-lg bg-linear-to-br from-rally-500 to-rally-pink flex items-center justify-center text-white font-bold text-sm"
          >
            R
          </motion.div>
          <span className="text-lg font-bold gradient-text">Rally</span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-rally-adaptive'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-rally-500/10 rounded-lg border border-rally-500/20"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/premium" className="btn-secondary text-xs">
            <span>✨</span>
            <span>Premium</span>
          </Link>
          {isLoaded && (
            isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 rounded-lg',
                    userButtonTrigger: 'focus:ring-2 focus:ring-rally-500/50 rounded-lg',
                  },
                }}
              />
            ) : (
              <SignInButton mode="modal">
                <button className="btn-secondary text-xs py-2 px-3 touch-manipulation">
                  Sign In
                </button>
              </SignInButton>
            )
          )}
        </div>
      </nav>

      {/* Mobile Bottom Nav — 60px tall + safe-area */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-primary/95 backdrop-blur-xl border-t border-border-default pb-safe">
        <div className="flex items-stretch justify-around h-[60px]">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center flex-1 min-w-0 gap-0.5 transition-colors ${
                  isActive ? 'text-rally-adaptive' : 'text-text-muted'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-gradient-to-r from-rally-500 to-rally-pink rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <motion.span
                  animate={isActive ? { y: [-3, 0] } : { y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="text-xl leading-none"
                >
                  {item.icon}
                </motion.span>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop top spacer */}
      <div className="hidden md:block h-16" />
    </>
  );
}
