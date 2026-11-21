import React from 'react';
import { Sparkles } from 'lucide-react';

interface MatchScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  score,
  size = 'md',
  onClick
}) => {
  const isHigh = score >= 85;
  const isMedium = score >= 70 && score < 85;

  const colorStyles = isHigh
    ? 'bg-amber-50 text-amber-900 border-amber-300'
    : isMedium
    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
    : 'bg-slate-50 text-slate-800 border-slate-300';

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-1 font-extrabold',
    lg: 'text-sm px-3.5 py-1.5 font-black'
  }[size];

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm transition-transform active:scale-95 ${colorStyles} ${sizeStyles} ${
        onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
      }`}
      title="Click to view full match score breakdown"
    >
      <Sparkles className={size === 'sm' ? 'w-2.5 h-2.5 text-brand-accent' : 'w-3.5 h-3.5 text-brand-accent'} />
      <span>{score}% Match</span>
    </button>
  );
};
