'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const BENEFITS = [
  {
    icon: '📍',
    title: 'Featured Stop Placement',
    desc: 'Your venue appears as a recommended stop in Rally routes matching your category, neighborhood, and vibe.',
  },
  {
    icon: '🎯',
    title: 'Targeted Discovery',
    desc: 'Reach users who are actively out and looking for their next stop — not browsing from home.',
  },
  {
    icon: '📊',
    title: 'Real-Time Analytics',
    desc: 'See how many routes include your venue, how many users visit, and track foot traffic attribution.',
  },
  {
    icon: '🏷️',
    title: 'Promoted Tags',
    desc: 'Get a "Rally Pick" or "Local Favorite" badge on your listing to stand out from the crowd.',
  },
  {
    icon: '🎁',
    title: 'In-App Offers',
    desc: 'Create exclusive "Rally Only" deals — show 10% off when a customer arrives from a Rally route.',
  },
  {
    icon: '📸',
    title: 'Rich Venue Profile',
    desc: 'Upload photos, menus, hours, and a custom description. Make your first impression count.',
  },
];

const PRICING = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    desc: 'Perfect for cafés and small shops.',
    features: ['1 venue listing', 'Basic analytics', 'Category placement', 'Monthly report'],
    gradient: 'from-slate-500/20 to-zinc-600/20',
    featured: false,
  },
  {
    name: 'Growth',
    price: '$79',
    period: '/month',
    desc: 'For restaurants and popular venues.',
    features: ['3 venue listings', 'Advanced analytics', 'Priority placement', 'In-app offers', 'Rally Pick badge', 'Weekly reports'],
    gradient: 'from-rally-500/20 to-rally-pink/20',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For chains and venue groups.',
    features: ['Unlimited listings', 'Custom analytics', 'API access', 'Dedicated manager', 'Custom campaigns', 'White-label routes'],
    gradient: 'from-emerald-500/20 to-cyan-500/20',
    featured: false,
  },
];

const TESTIMONIALS = [
  {
    name: 'Maria, Owner',
    venue: 'Grounds & Hounds Café',
    text: 'Rally brought 40+ new customers in our first month. People come in saying "Rally sent me!" — it\'s amazing.',
    avatar: '☕',
  },
  {
    name: 'James, Manager',
    venue: 'Cloud Nine Creamery',
    text: 'Being on Rally routes means we get foot traffic at times we used to be slow. The analytics dashboard is super helpful too.',
    avatar: '🍦',
  },
  {
    name: 'Priya, Owner',
    venue: 'Spice Route Kitchen',
    text: 'The "Rally Only" discount feature is genius. Customers love it and it drives repeat visits.',
    avatar: '🍛',
  },
];

export default function BusinessPage() {
  return (
    <main className="min-h-dvh">
      <Navbar />
      <div className="bg-orb w-[500px] h-[500px] bg-emerald-500 -top-40 -left-40 fixed" />
      <div className="bg-orb w-[300px] h-[300px] bg-cyan-500 bottom-20 right-10 fixed" />

      <div className="max-w-5xl mx-auto px-5 py-4 sm:py-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 sm:mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            For Local Businesses
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-3 sm:mb-4">
            <span className="gradient-text-blue">Rally for Business</span>
          </h1>
          <p className="text-sm sm:text-lg text-text-secondary max-w-2xl mx-auto mb-6 sm:mb-8">
            Get discovered by thousands of spontaneous customers. Rally users are already out, nearby, and looking for their next stop.
          </p>
          <div className="px-4 sm:px-0">
            <button className="btn-primary text-base sm:text-lg px-10 py-4 w-full sm:w-auto">
              <span>Partner with Rally</span>
              <span>→</span>
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-10 sm:mb-16"
        >
          {[
            { label: 'Monthly Active Users', value: '25K+', icon: '👥' },
            { label: 'Routes Generated', value: '50K+', icon: '🗺️' },
            { label: 'Average Visit Rate', value: '73%', icon: '📈' },
            { label: 'Partner Venues', value: '500+', icon: '🏪' },
          ].map((stat, i) => (
            <motion.div key={stat.label} variants={fadeUp} custom={i}
              className="glass-card p-4 sm:p-5 text-center"
            >
              <div className="text-xl sm:text-2xl mb-1.5 sm:mb-2">{stat.icon}</div>
              <div className="text-xl sm:text-2xl font-bold gradient-text-blue">{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Benefits */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10 sm:mb-16">
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 text-center">
            Why Venues Love Rally
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary text-center mb-6 sm:mb-10">
            Reach customers at the perfect moment — when they&apos;re already out exploring.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {BENEFITS.map((benefit, i) => (
              <motion.div key={benefit.title} variants={fadeUp} custom={i + 2}
                className="glass-card-hover p-5 sm:p-6"
              >
                <div className="text-xl sm:text-2xl mb-2 sm:mb-3">{benefit.icon}</div>
                <h3 className="font-bold text-sm sm:text-base mb-1.5 sm:mb-2">{benefit.title}</h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10 sm:mb-16">
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl md:text-3xl font-bold mb-1.5 text-center">
            Simple Pricing
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-base text-text-secondary text-center mb-6 sm:mb-10">
            No setup fees. No long-term contracts. Cancel anytime.
          </motion.p>

          {/* Mobile: horizontal scroll for pricing cards */}
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5 snap-x snap-mandatory sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
            {PRICING.map((plan, i) => (
              <motion.div key={plan.name} variants={fadeUp} custom={i + 2}
                className={`glass-card p-5 sm:p-6 bg-gradient-to-br ${plan.gradient} min-w-[280px] sm:min-w-0 snap-start shrink-0 sm:shrink ${plan.featured ? 'ring-1 ring-rally-500/40 sm:scale-105' : ''}`}
              >
                {plan.featured && (
                  <div className="text-[10px] sm:text-xs font-bold text-rally-400 mb-2 sm:mb-3">MOST POPULAR</div>
                )}
                <h3 className="text-lg sm:text-xl font-bold mb-1">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-2xl sm:text-3xl font-black">{plan.price}</span>
                  <span className="text-text-muted text-sm">{plan.period}</span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary mb-4 sm:mb-5">{plan.desc}</p>
                <ul className="space-y-1.5 sm:space-y-2 mb-5 sm:mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="text-xs sm:text-sm flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button className={plan.featured ? 'btn-primary w-full' : 'btn-secondary w-full'}>
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-10 sm:mb-16">
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center">
            What Partners Say
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} custom={i + 1}
                className="glass-card p-5 sm:p-6"
              >
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{t.avatar}</div>
                <p className="text-xs sm:text-sm text-text-secondary mb-3 sm:mb-4 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-xs sm:text-sm font-semibold">{t.name}</p>
                  <p className="text-[10px] sm:text-xs text-text-muted">{t.venue}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="glass-card p-6 sm:p-10 text-center bg-gradient-to-br from-emerald-500/10 to-cyan-500/10"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">Ready to grow with Rally?</h2>
          <p className="text-sm text-text-secondary mb-5 sm:mb-6">Join 500+ venues already getting discovered through Rally routes.</p>
          <button className="btn-primary text-base sm:text-lg px-10 py-4 w-full sm:w-auto">
            <span>Apply to Partner</span>
            <span>→</span>
          </button>
        </motion.div>
      </div>
      <div className="mobile-nav-spacer" />
    </main>
  );
}
