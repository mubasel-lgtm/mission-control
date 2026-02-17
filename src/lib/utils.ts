import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 0) {
    if (diffMins > -60) return `${Math.abs(diffMins)}m ago`;
    if (diffHours > -24) return `${Math.abs(diffHours)}h ago`;
    return `${Math.abs(diffDays)}d ago`;
  }
  
  if (diffMins < 60) return `in ${diffMins}m`;
  if (diffHours < 24) return `in ${diffHours}h`;
  return `in ${diffDays}d`;
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
    case '1':
      return 'text-red-500 bg-red-500/10';
    case 'medium':
    case '2':
      return 'text-yellow-500 bg-yellow-500/10';
    case 'low':
    case '3':
    case '4':
      return 'text-green-500 bg-green-500/10';
    default:
      return 'text-gray-500 bg-gray-500/10';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'in_progress':
    case 'completed':
      return 'text-green-500 bg-green-500/10';
    case 'paused':
    case 'warning':
      return 'text-yellow-500 bg-yellow-500/10';
    case 'error':
    case 'blocking':
      return 'text-red-500 bg-red-500/10';
    case 'queued':
    case 'todo':
      return 'text-blue-500 bg-blue-500/10';
    default:
      return 'text-gray-500 bg-gray-500/10';
  }
}
