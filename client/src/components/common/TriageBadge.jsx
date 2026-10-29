import React from 'react';
import { AlertOctagon, AlertTriangle, Clock, CheckCircle2, Info } from 'lucide-react';

export const TriageBadge = ({ level, size = 'md', showIcon = true, pulse = false }) => {
  const rawLevel = String(level || 'LEVEL 4').trim().toUpperCase();

  // Map levels and aliases
  let key = 'LEVEL 4';
  if (rawLevel === 'LEVEL 1' || rawLevel === 'RED' || rawLevel === 'CRITICAL' || rawLevel === '1' || rawLevel === 'RESUSCITATION' || rawLevel === 'IMMEDIATE') {
    key = 'LEVEL 1';
  } else if (rawLevel === 'LEVEL 2' || rawLevel === 'ORANGE' || rawLevel === 'HIGH' || rawLevel === '2' || rawLevel === 'EMERGENT') {
    key = 'LEVEL 2';
  } else if (rawLevel === 'LEVEL 3' || rawLevel === 'YELLOW' || rawLevel === 'AMBER' || rawLevel === 'MODERATE' || rawLevel === '3' || rawLevel === 'URGENT') {
    key = 'LEVEL 3';
  } else if (rawLevel === 'LEVEL 4' || rawLevel === 'GREEN' || rawLevel === 'LESS URGENT' || rawLevel === '4') {
    key = 'LEVEL 4';
  } else if (rawLevel === 'LEVEL 5' || rawLevel === 'BLUE' || rawLevel === 'LOW' || rawLevel === 'NON-URGENT' || rawLevel === '5') {
    key = 'LEVEL 5';
  }

  const configs = {
    'LEVEL 1': {
      label: 'Immediate',
      shortLabel: 'Immediate',
      badgeNum: '1',
      bgClass: 'bg-rose-50 text-rose-800 border-rose-300 ring-rose-500/20 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
      solidClass: 'bg-rose-600 text-white',
      dotClass: 'bg-rose-500',
      colorName: 'Red',
      icon: AlertOctagon
    },
    'LEVEL 2': {
      label: 'Emergent',
      shortLabel: 'Emergent',
      badgeNum: '2',
      bgClass: 'bg-orange-50 text-orange-900 border-orange-300 ring-orange-500/20 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
      solidClass: 'bg-orange-600 text-white',
      dotClass: 'bg-orange-500',
      colorName: 'Orange',
      icon: AlertTriangle
    },
    'LEVEL 3': {
      label: 'Urgent',
      shortLabel: 'Urgent',
      badgeNum: '3',
      bgClass: 'bg-amber-50 text-amber-900 border-amber-300 ring-amber-500/20 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      solidClass: 'bg-amber-500 text-white',
      dotClass: 'bg-amber-500',
      colorName: 'Yellow',
      icon: Clock
    },
    'LEVEL 4': {
      label: 'Less Urgent',
      shortLabel: 'Less Urgent',
      badgeNum: '4',
      bgClass: 'bg-blue-50 text-blue-900 border-blue-300 ring-blue-500/20 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      solidClass: 'bg-blue-600 text-white',
      dotClass: 'bg-blue-500',
      colorName: 'Blue',
      icon: CheckCircle2
    },
    'LEVEL 5': {
      label: 'Non-Urgent',
      shortLabel: 'Non-Urgent',
      badgeNum: '5',
      bgClass: 'bg-blue-50 text-blue-900 border-blue-300 ring-blue-500/20 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      solidClass: 'bg-blue-600 text-white',
      dotClass: 'bg-blue-500',
      colorName: 'Blue',
      icon: Info
    }
  };

  const config = configs[key];
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-semibold rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-lg gap-1.5 shadow-xs',
    lg: 'text-sm px-3.5 py-1.5 font-bold rounded-xl gap-2 shadow-sm'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  const isUrgentPulse = pulse && (key === 'LEVEL 1' || key === 'LEVEL 2');

  return (
    <span className={`inline-flex items-center tracking-wide font-sans ${sizeClasses[size] || sizeClasses.md} ${config.solidClass} ${isUrgentPulse ? 'animate-pulse ring-2 ring-rose-500/40' : ''}`}>
      {showIcon && <IconComponent size={iconSizes[size] || 14} className="shrink-0" />}
      <span>{size === 'sm' ? config.shortLabel : config.label}</span>
    </span>
  );
};
