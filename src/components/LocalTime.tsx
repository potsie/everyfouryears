'use client';

export function LocalTime({ iso }: { iso: string }) {
  return <>{new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</>;
}
