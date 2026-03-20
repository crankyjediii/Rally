'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import { FEATURED_TONIGHT, LOCAL_GEMS } from '@/lib/mock-data';
import { VIBES } from '@/lib/constants';
import {
  fadeUp,
  cardReveal,
  staggerContainer,
  EASE_SPRING_SNAPPY,
  EASE_SPRING_SOFT,
} from '@/lib/motion';

const EXAMPLE_ROUTES = [
  {
    title: 'Soft Launch Saturday',
    vibe: 'cozy',
    emoji: '🧣',
    stops: ['Local coffee shop', 'Used bookstore', 'Cheap dinner spot'],
    gradient: 'from-amber-500/20 to-orange-600/20',
    border: 'border-amber-500/20',
  },
  {
    title: 'Main Character Mode',
    vibe: 'main-character',
    emoji: '✨',
    stops: ['Scenic overlook', 'Artsy café', 'Dessert stop', 'Nighttime walk'],
    gradient: 'from-purple-500/20 to-pink-600/20',
    border: 'border-purple-500/20',
  },
  {
    title: 'Friend Chaos Route',
    vibe: 'chaotic',
    emoji: '🎲',
    stops: ['Fries or snacks', 'Arcade / activity', 'Dessert challenge', 'Photo spot'],
    gradient: 'from-red-500/20 to-yellow-500/20',
    border: 'border-red-500/20',
  },
  {
    title: 'Cheap Date, High Aura',
    vibe: 'date',
    emoji: '🌹',
    stops: ['Coffee', 'Museum or park', 'Casual dinner', 'Dessert closer'],
    gradient: 'from-rose-500/20 to-violet-600/20',
    border: 'border-rose-500/20',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Pick Your Vibe', desc: 'Choose a mood — cozy, chaotic, romantic, or whatever you\'re feeling.', icon: '🎯' },
  { step: '02', title: 'Set Your Filters', desc: 'Budget, time, group, radius. Tell Rally what you\'re working with.', icon: '⚙️' },
  { step: '03', title: 'Get Your Route', desc: 'Rally generates a curated 2–4 stop outing with real nearby spots.', icon: '🗺️' },
  { step: '04', title: 'Go Live It', desc: 'Follow the route, reroll stops you don\'t like, share it with friends.', icon: '🎉' },
];

const HERO_LINES = [
  { text: 'Turn your', gradient: false },
  { text: 'location', gradient: true },
  { text: 'into an', gradient: false },
  { text: 'adventure', gradient: true },
];

export default function HomePage() {
  return (
    <main className="relative overflow-x-hidden">
      <Navbar />

      {/* ── Background Orbs ──── */}
      <div className="bg-orb w-[500px] h-[500px] bg-rally-600 -top-40 -left-40 fixed" />
      <div className="bg-orb w-[400px] h-[400px] bg-rally-pink -bottom-32 -right-32 fixed" />

      {/* ── Hero ──── */}
      <section className="gradient-mesh relative px-5 pt-8 pb-12 sm:pt-12 sm:pb-20 md:pt-24 md:pb-32 max-w-6xl mx-auto text-center">
        {/* Beta badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full bg-rally-500/10 border border-rally-500/20 text-rally-400 text-sm font-medium cursor-default"
        >
          <span className="w-2 h-2 rounded-full bg-rally-400 animate-pulse" />
          Now in beta — free for everyone
        </motion.div>

        {/* Hero headline — staggered lines */}
        <div className="text-[2rem] leading-[1.1] sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4 sm:mb-6">
          {HERO_LINES.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="block"
            >
              {line.gradient ? (
                <span className="gradient-text">{line.text}</span>
              ) : (
                line.text
              )}
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2"
        >
          Rally generates curated mini-outings based on your vibe, budget, and location. Pick a mood. Get a route. Live the story.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 px-6 sm:px-0"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={EASE_SPRING_SNAPPY}>
            <Link href="/build" className="btn-primary text-base sm:text-lg px-8 py-4 w-full sm:w-auto animate-glow-pulse">
              <span>Build My Route</span>
              <span>→</span>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={EASE_SPRING_SNAPPY}>
            <Link href="/premium" className="btn-secondary px-6 py-3 w-full sm:w-auto">
              <span>See Premium</span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="mt-6 text-xs sm:text-sm text-text-muted"
        >
          ✨ No account needed · Free to use · Works everywhere
        </motion.p>

        {/* Floating preview route card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 mx-auto max-w-xs glass-card animate-float p-4 border-rally-500/15 bg-rally-500/5 text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-xs text-emerald-400 font-medium">Live Route — Main Character Mode</span>
          </div>
          {[
            { emoji: '☕', name: 'Artsy Coffee Corner', cat: 'café' },
            { emoji: '🎭', name: 'Local Art Museum', cat: 'museum' },
            { emoji: '🌹', name: 'Candlelit Dinner Spot', cat: 'restaurant' },
          ].map((stop, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-text-secondary py-1.5 border-b border-white/5 last:border-0">
              <span className="w-5 h-5 rounded-full bg-linear-to-br from-rally-500/30 to-rally-pink/30 text-xs font-bold flex items-center justify-center shrink-0 text-rally-300">
                {i + 1}
              </span>
              <span className="text-base shrink-0">{stop.emoji}</span>
              <div className="min-w-0">
                <div className="font-medium text-text-primary text-xs truncate">{stop.name}</div>
                <div className="text-[10px] text-text-muted">{stop.cat}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Featured Tonight ──── */}
      <section className="px-5 pb-12 sm:pb-20 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5">
            🌙 Featured Tonight
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary mb-6">
            Limited-time routes curated for right now.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {FEATURED_TONIGHT.map((feature) => (
              <motion.div key={feature.id} variants={cardReveal}>
                <motion.div whileHover={{ y: -3 }} transition={EASE_SPRING_SOFT}>
                  <Link href="/build" className={`block glass-card-hover p-5 sm:p-6 bg-linear-to-br ${feature.gradient} relative overflow-hidden glow-border`}>
                    <div className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/80">
                      Tonight
                    </div>
                    <h3 className="text-base sm:text-lg font-bold mb-1.5 text-white pr-16">{feature.title}</h3>
                    <p className="text-sm text-white/70 leading-relaxed">{feature.subtitle}</p>
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── How It Works ──── */}
      <section className="px-5 pb-12 sm:pb-20 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 text-center">
            How Rally Works
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary text-center mb-8 sm:mb-12">
            Four steps. One unforgettable outing.
          </motion.p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {HOW_IT_WORKS.map((step) => (
              <motion.div
                key={step.step}
                variants={cardReveal}
                whileHover={{ scale: 1.03, y: -2 }}
                transition={EASE_SPRING_SNAPPY}
                className="glass-card glow-border p-4 sm:p-6 text-center cursor-default"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-rally-500/20 to-rally-pink/20 flex items-center justify-center text-2xl sm:text-3xl mb-2 sm:mb-3 mx-auto">
                  {step.icon}
                </div>
                <div className="text-[10px] sm:text-xs font-bold text-rally-400 mb-1.5">STEP {step.step}</div>
                <h3 className="text-sm sm:text-lg font-bold mb-1 sm:mb-2">{step.title}</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Example Routes ──── */}
      <section className="px-5 pb-12 sm:pb-20 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 text-center">
            Routes People Love
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary text-center mb-8 sm:mb-12">
            Real outings. Real vibes. All generated by Rally.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            {EXAMPLE_ROUTES.map((route) => (
              <motion.div
                key={route.title}
                variants={cardReveal}
                whileHover={{ y: -4 }}
                transition={EASE_SPRING_SOFT}
                className={`glass-card-hover glow-border p-5 sm:p-6 bg-linear-to-br ${route.gradient} ${route.border}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl sm:text-2xl">{route.emoji}</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">{route.title}</h3>
                    <span className="chip text-xs mt-1">{route.vibe}</span>
                  </div>
                </div>
                <ol className="space-y-1.5 sm:space-y-2">
                  {route.stops.map((stop, j) => (
                    <motion.li
                      key={j}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: j * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-start gap-2.5 text-sm text-text-secondary"
                    >
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] sm:text-xs font-bold text-rally-400 shrink-0 mt-0.5">
                        {j + 1}
                      </span>
                      {stop}
                    </motion.li>
                  ))}
                </ol>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Local Gems ──── */}
      <section className="px-5 pb-12 sm:pb-20 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5">
            💎 Local Gems This Week
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary mb-6">
            Hidden spots hand-picked by locals.
          </motion.p>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5 snap-x snap-mandatory">
            {LOCAL_GEMS.map((gem, i) => (
              <motion.div
                key={gem.id}
                variants={cardReveal}
                custom={i}
                whileHover={{ scale: 1.03, y: -2 }}
                transition={EASE_SPRING_SNAPPY}
                className="glass-card-hover glow-border p-4 sm:p-5 min-w-[200px] sm:min-w-[240px] shrink-0 snap-start"
              >
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{gem.image}</div>
                <h3 className="font-bold text-sm sm:text-base mb-0.5">{gem.name}</h3>
                <p className="text-xs text-rally-400 mb-1.5">{gem.neighborhood}</p>
                <p className="text-xs sm:text-sm text-text-secondary">{gem.tagline}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Vibes Showcase ──── */}
      <section className="px-5 pb-12 sm:pb-20 max-w-6xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5">
            Pick Your Vibe
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-10">
            Whatever mood you&apos;re in, Rally has a route for it.
          </motion.p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {VIBES.map((vibe, i) => (
              <motion.div
                key={vibe.value}
                variants={fadeUp}
                custom={i + 2}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.93 }}
                transition={EASE_SPRING_SNAPPY}
              >
                <Link href="/build" className="chip">
                  <span>{vibe.icon}</span>
                  <span>{vibe.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Premium Features ──── */}
      <section className="px-5 pb-12 sm:pb-20 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.div
            variants={cardReveal}
            whileHover={{ y: -2 }}
            transition={EASE_SPRING_SOFT}
            className="glass-card glow-border p-6 sm:p-8 md:p-12 text-center bg-linear-to-br from-rally-600/10 to-rally-pink/10 border-rally-600/20"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-3xl sm:text-4xl mb-3"
            >
              👑
            </motion.div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Rally Premium</h2>
            <p className="text-sm sm:text-base text-text-secondary max-w-lg mx-auto mb-6 sm:mb-8">
              Unlock hidden gems, unlimited rerolls, date planner mode, group voting, weekly curated drops, and way more.
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              {['Hidden Gems', 'Unlimited Rerolls', 'Group Voting', 'Date Planner', 'Weekly Drops', 'No Chains Mode'].map(f => (
                <span key={f} className="chip active text-xs">{f}</span>
              ))}
            </div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={EASE_SPRING_SNAPPY}>
              <Link href="/premium" className="btn-primary px-8 py-3 w-full sm:w-auto">
                <span>Explore Premium</span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Business Partnership ──── */}
      <section className="px-5 pb-12 sm:pb-20 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
        >
          <motion.div
            variants={cardReveal}
            className="glass-card glow-border p-6 sm:p-8 md:p-12 bg-linear-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/10"
          >
            <div className="md:flex items-center gap-8 lg:gap-12">
              <div className="flex-1 mb-6 md:mb-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
                  For Local Businesses
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Rally for Business</h2>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-5 sm:mb-6">
                  Get your restaurant, café, or shop featured in Rally routes. Reach spontaneous customers who are already out and looking for their next stop.
                </p>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={EASE_SPRING_SNAPPY}>
                  <Link href="/business" className="btn-primary w-full sm:w-auto">
                    <span>Learn More</span>
                    <span>→</span>
                  </Link>
                </motion.div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  { label: 'Featured Stops', value: '10K+', icon: '📍' },
                  { label: 'Routes Generated', value: '50K+', icon: '🗺️' },
                  { label: 'Active Users', value: '25K+', icon: '👥' },
                  { label: 'Partner Venues', value: '500+', icon: '🏪' },
                ].map(stat => (
                  <motion.div
                    key={stat.label}
                    whileHover={{ scale: 1.05 }}
                    transition={EASE_SPRING_SNAPPY}
                    className="glass-card p-3 sm:p-4 text-center cursor-default"
                  >
                    <div className="text-lg sm:text-xl mb-1">{stat.icon}</div>
                    <div className="text-lg sm:text-xl font-bold gradient-text-blue">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs text-text-muted">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── CTA Footer ──── */}
      <section className="px-5 pb-8 sm:pb-16 max-w-4xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            Ready to rally?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">
            Your next great outing is one tap away.
          </motion.p>
          <motion.div variants={fadeUp} custom={2} className="px-6 sm:px-0">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={EASE_SPRING_SNAPPY}
              className="inline-block w-full sm:w-auto"
            >
              <Link href="/build" className="btn-primary text-base sm:text-lg px-10 py-4 w-full sm:w-auto animate-glow-pulse">
                <span>Build My Route</span>
                <span>🚀</span>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ──── */}
      <footer className="border-t border-border-default px-5 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={EASE_SPRING_SNAPPY}
            className="flex items-center gap-2 cursor-default"
          >
            <div className="w-6 h-6 rounded-md bg-linear-to-br from-rally-500 to-rally-pink flex items-center justify-center text-white font-bold text-xs">R</div>
            <span className="text-sm font-semibold gradient-text">Rally</span>
          </motion.div>
          <div className="flex gap-5 sm:gap-6 text-sm text-text-muted">
            <Link href="/premium" className="hover:text-text-primary transition">Premium</Link>
            <Link href="/business" className="hover:text-text-primary transition">Business</Link>
            <span className="cursor-default">Privacy</span>
            <span className="cursor-default">Terms</span>
          </div>
          <p className="text-xs text-text-muted">© 2026 Rally. All rights reserved.</p>
        </div>
      </footer>

      {/* Bottom nav spacer on mobile */}
      <div className="mobile-nav-spacer" />
    </main>
  );
}
