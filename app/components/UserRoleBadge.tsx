import { Zap } from 'lucide-react';
import React from 'react';
import { cn } from '../utils/styles';

interface UserRoleBadgeProps {
  role: 'manager' | 'investor' | 'wallet';
}

function UserRoleBadge({ role }: UserRoleBadgeProps) {
  let label: string;

  switch (role) {
    case 'manager':
      label = 'Fund Manager';
      break;
    case 'investor':
      label = 'Investor';
      break;
    case 'wallet':
      label = 'Wallet';
      break;
    default:
      label = 'Unknown';
  }

  return (
    <div
      className={cn('flex items-center gap-2 rounded-lg px-3 py-1.5', {
        'bg-purple-500/10 text-purple-400': role === 'manager',
        'bg-blue-500/10 text-blue-400': role === 'investor',
        'bg-amber-500/10 text-amber-400': role === 'wallet',
      })}
    >
      <Zap className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
}

export default UserRoleBadge;
