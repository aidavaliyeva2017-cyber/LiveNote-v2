import { format, isToday, differenceInMinutes } from 'date-fns';

export const formatDateLabel = (date: Date) => {
  if (isToday(date)) {
    return `Today, ${format(date, 'MMM d')}`;
  }
  return format(date, 'EEEE, MMM d');
};

export const formatTimeRange = (start: Date, end: Date) => {
  return `${format(start, 'p')} – ${format(end, 'p')}`;
};

export const getGreeting = (now: Date) => {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning!';
  if (hour >= 12 && hour < 17) return 'Good afternoon!';
  if (hour >= 17 && hour < 22) return 'Good evening!';
  return 'Still awake?';
};

export const formatCountdown = (target: Date, now: Date) => {
  const minutes = differenceInMinutes(target, now);
  if (minutes <= 0) return 'Now';
  if (minutes < 60) return `in ~${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `in ~${hours}h ${remainingMinutes}m`;
};

