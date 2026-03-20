'use client';

import { motion } from 'framer-motion';
import { GeneratedRoute } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { fadeUp, staggerContainer } from '@/lib/motion';

interface RouteStatsProps {
  route: GeneratedRoute;
}

export default function RouteStats({ route }: RouteStatsProps) {
  const { stops, totalCost, totalTime, travelMode } = route;

  const indoorCount = stops.filter(s => s.place.indoor).length;
  const indoorPct = stops.length > 0 ? Math.round((indoorCount / stops.length) * 100) : 0;

  // Category frequency
  const catCounts: Record<string, number> = {};
  stops.forEach(s => { catCounts[s.place.category] = (catCounts[s.place.category] ?? 0) + 1; });
  const topCats = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const catEmojis: Record<string, string> = {
    restaurant: '🍽️', cafe: '☕', dessert: '🍰', bar: '🍸', nightlife: '🌙',
    museum: '🎭', park: '🌿', bookstore: '📚', arcade: '🎮', scenic: '📸',
    attraction: '⭐', shopping: '🛍️', activity: '⚡',
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
    >
      <Chip emoji="💰" label={`~${formatCurrency(totalCost)}`} />
      <Chip emoji="⏱️" label={totalTime} />
      <Chip emoji="📍" label={`${stops.length} stop${stops.length !== 1 ? 's' : ''}`} />
      <Chip emoji={travelMode === 'Walking' ? '🚶' : '🚇'} label={travelMode} />
      {stops.length > 0 && (
        <Chip emoji="🏠" label={`${indoorPct}% indoor`} />
      )}
      {topCats.map(([cat, count]) => (
        <Chip key={cat} emoji={catEmojis[cat] ?? '📌'} label={`${count} ${cat}`} />
      ))}
    </motion.div>
  );
}

function Chip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ scale: 1.05, y: -1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/8 whitespace-nowrap shrink-0 cursor-default"
    >
      <span className="text-sm leading-none">{emoji}</span>
      <span className="text-xs text-text-secondary">{label}</span>
    </motion.div>
  );
}
