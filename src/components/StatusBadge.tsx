import React from 'react';
import { OrderStatus } from '../types';
import { Clock, CheckCircle2, Truck, Package, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const getStatusConfig = (s: string) => {
    switch (s) {
      case 'requested':
        return {
          label: 'Requested (Unassigned)',
          shortLabel: 'Requested',
          bgColor: 'bg-amber-50 text-amber-800 border-amber-300/80',
          dotColor: 'bg-amber-500',
          icon: Clock,
        };
      case 'assigned':
        return {
          label: 'Rider Assigned',
          shortLabel: 'Assigned',
          bgColor: 'bg-sky-50 text-sky-800 border-sky-300/80',
          dotColor: 'bg-sky-500',
          icon: Package,
        };
      case 'picked_up':
        return {
          label: 'Picked Up (In Transit)',
          shortLabel: 'In Transit',
          bgColor: 'bg-indigo-50 text-indigo-800 border-indigo-300/80',
          dotColor: 'bg-indigo-500 animate-pulse',
          icon: Truck,
        };
      case 'delivered':
        return {
          label: 'Delivered (QR Verified)',
          shortLabel: 'Delivered',
          bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
          dotColor: 'bg-emerald-500',
          icon: CheckCircle2,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          shortLabel: 'Cancelled',
          bgColor: 'bg-rose-50 text-rose-800 border-rose-300/80',
          dotColor: 'bg-rose-500',
          icon: XCircle,
        };
      default:
        return {
          label: s,
          shortLabel: s,
          bgColor: 'bg-stone-100 text-stone-700 border-stone-300',
          dotColor: 'bg-stone-400',
          icon: Clock,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs font-medium gap-2',
    lg: 'px-3.5 py-1.5 text-sm font-semibold gap-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border whitespace-nowrap ${config.bgColor} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{size === 'sm' ? config.shortLabel : config.label}</span>
    </span>
  );
};
