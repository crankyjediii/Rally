'use client';

import { GeneratedRoute } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

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
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {/* Cost */}
      <Chip emoji="💰" label={`~${formatCurrency(totalCost)}`} />

      {/* Time */}
      <Chip emoji="⏱️" label={totalTime} />

      {/* Stop count */}
      <Chip emoji="📍" label={`${stops.length} stop${stops.length !== 1 ? 's' : ''}`} />

      {/* Travel mode */}
      <Chip emoji={travelMode === 'Walking' ? '🚶' : '🚇'} label={travelMode} />

      {/* Indoor/outdoor */}
      {stops.length > 0 && (
        <Chip emoji="🏠" label={`${indoorPct}% indoor`} />
      )}

      {/* Top categories */}
      {topCats.map(([cat, count]) => (
        <Chip key={cat} emoji={catEmojis[cat] ?? '📌'} label={`${count} ${cat}`} />
      ))}
    </div>
  );
}

function Chip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/8 whitespace-nowrap shrink-0">
      <span className="text-sm leading-none">{emoji}</span>
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}
