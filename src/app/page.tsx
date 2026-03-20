'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import { FEATURED_TONIGHT, LOCAL_GEMS } from '@/lib/mock-data';
import { VIBES } from '@/lib/constants';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

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

export default function HomePage() {
  return (
    <main className="relative overflow-x-hidden">
      <Navbar />

      {/* ── Background Orbs ──── */}
      <div className="bg-orb w-[500px] h-[500px] bg-rally-600 -top-40 -left-40 fixed" />
      <div className="bg-orb w-[400px] h-[400px] bg-rally-pink -bottom-32 -right-32 fixed" />

      {/* ── Hero ──── */}
      <section className="relative px-5 pt-8 pb-12 sm:pt-12 sm:pb-20 md:pt-24 md:pb-32 max-w-6xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full bg-rally-500/10 border border-rally-500/20 text-rally-400 text-sm font-medium"
        >
          <span className="w-2 h-2 rounded-full bg-rally-400 animate-pulse" />
          Now in beta — free for everyone
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}
          className="text-[2rem] leading-[1.05] sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4 sm:mb-6"
        >
          Turn your
          <br />
          <span className="gradient-text">location</span> into
          <br />
          an <span className="gradient-text">adventure</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
          className="text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2"
        >
          Rally generates curated mini-outings based on your vibe, budget, and location. Pick a mood. Get a route. Live the story.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 px-6 sm:px-0"
        >
          <Link href="/build" className="btn-primary text-base sm:text-lg px-8 py-4 w-full sm:w-auto">
            <span>Build My Route</span>
            <span>→</span>
          </Link>
          <Link href="/premium" className="btn-secondary px-6 py-3 w-full sm:w-auto">
            <span>See Premium</span>
          </Link>
        </motion.div>

        {/* Trust line */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-6 text-xs sm:text-sm text-text-muted"
        >
          ✨ No account needed · Free to use · Works everywhere
        </motion.p>
      </section>

      {/* ── Featured Tonight ──── */}
      <section className="px-5 pb-12 sm:pb-20 max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5">
            🌙 Featured Tonight
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary mb-6">
            Limited-time routes curated for right now.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {FEATURED_TONIGHT.map((feature, i) => (
              <motion.div key={feature.id} variants={fadeUp} custom={i + 2}>
                <Link href="/build" className={`block glass-card-hover p-5 sm:p-6 bg-gradient-to-br ${feature.gradient} relative overflow-hidden`}>
                  <div className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/80">
                    Tonight
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-1.5 text-white pr-16">{feature.title}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{feature.subtitle}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── How It Works ──── */}
      <section className="px-5 pb-12 sm:pb-20 max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 text-center">
            How Rally Works
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary text-center mb-8 sm:mb-12">
            Four steps. One unforgettable outing.
          </motion.p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={step.step} variants={fadeUp} custom={i + 2} className="glass-card p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{step.icon}</div>
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
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 text-center">
            Routes People Love
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary text-center mb-8 sm:mb-12">
            Real outings. Real vibes. All generated by Rally.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            {EXAMPLE_ROUTES.map((route, i) => (
              <motion.div key={route.title} variants={fadeUp} custom={i + 2}
                className={`glass-card-hover p-5 sm:p-6 bg-gradient-to-br ${route.gradient} ${route.border}`}
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
                    <li key={j} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] sm:text-xs font-bold text-rally-400 shrink-0 mt-0.5">
                        {j + 1}
                      </span>
                      {stop}
                    </li>
                  ))}
                </ol>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Local Gems ──── */}
      <section className="px-5 pb-12 sm:pb-20 max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5">
            💎 Local Gems This Week
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary mb-6">
            Hidden spots hand-picked by locals.
          </motion.p>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5 snap-x snap-mandatory">
            {LOCAL_GEMS.map((gem, i) => (
              <motion.div key={gem.id} variants={fadeUp} custom={i + 2}
                className="glass-card-hover p-4 sm:p-5 min-w-[200px] sm:min-w-[240px] shrink-0 snap-start"
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
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5">
            Pick Your Vibe
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-10">
            Whatever mood you&apos;re in, Rally has a route for it.
          </motion.p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {VIBES.map((vibe, i) => (
              <motion.div key={vibe.value} variants={fadeUp} custom={i + 2}>
                <Link href="/build" className="chip hover:scale-105 active:scale-95 transition-transform">
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
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <motion.div variants={fadeUp} custom={0} className="glass-card p-6 sm:p-8 md:p-12 text-center bg-gradient-to-br from-rally-600/10 to-rally-pink/10 border-rally-600/20">
            <div className="text-3xl sm:text-4xl mb-3">👑</div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Rally Premium</h2>
            <p className="text-sm sm:text-base text-text-secondary max-w-lg mx-auto mb-6 sm:mb-8">
              Unlock hidden gems, unlimited rerolls, date planner mode, group voting, weekly curated drops, and way more.
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              {['Hidden Gems', 'Unlimited Rerolls', 'Group Voting', 'Date Planner', 'Weekly Drops', 'No Chains Mode'].map(f => (
                <span key={f} className="chip active text-xs">{f}</span>
              ))}
            </div>
            <Link href="/premium" className="btn-primary px-8 py-3 w-full sm:w-auto">
              <span>Explore Premium</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Business Partnership ──── */}
      <section className="px-5 pb-12 sm:pb-20 max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}>
          <motion.div variants={fadeUp} custom={0} className="glass-card p-6 sm:p-8 md:p-12 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/10">
            <div className="md:flex items-center gap-8 lg:gap-12">
              <div className="flex-1 mb-6 md:mb-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
                  For Local Businesses
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Rally for Business</h2>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-5 sm:mb-6">
                  Get your restaurant, café, or shop featured in Rally routes. Reach spontaneous customers who are already out and looking for their next stop.
                </p>
                <Link href="/business" className="btn-primary w-full sm:w-auto">
                  <span>Learn More</span>
                  <span>→</span>
                </Link>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  { label: 'Featured Stops', value: '10K+', icon: '📍' },
                  { label: 'Routes Generated', value: '50K+', icon: '🗺️' },
                  { label: 'Active Users', value: '25K+', icon: '👥' },
                  { label: 'Partner Venues', value: '500+', icon: '🏪' },
                ].map(stat => (
                  <div key={stat.label} className="glass-card p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-xl mb-1">{stat.icon}</div>
                    <div className="text-lg sm:text-xl font-bold gradient-text-blue">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs text-text-muted">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── CTA Footer ──── */}
      <section className="px-5 pb-8 sm:pb-16 max-w-4xl mx-auto text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            Ready to rally?
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">
            Your next great outing is one tap away.
          </motion.p>
          <motion.div variants={fadeUp} custom={2} className="px-6 sm:px-0">
            <Link href="/build" className="btn-primary text-base sm:text-lg px-10 py-4 w-full sm:w-auto">
              <span>Build My Route</span>
              <span>🚀</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ──── */}
      <footer className="border-t border-border-default px-5 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-rally-500 to-rally-pink flex items-center justify-center text-white font-bold text-xs">R</div>
            <span className="text-sm font-semibold gradient-text">Rally</span>
          </div>
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
