'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type XgMap = Record<string, { home: number; away: number }>;

const XgContext = createContext<XgMap>({});

export function XgProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<XgMap>({});

  useEffect(() => {
    fetch('/api/pmsr/xg')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setMap)
      .catch(() => {});
  }, []);

  return <XgContext.Provider value={map}>{children}</XgContext.Provider>;
}

export function useXg(eventId: string): { home: number; away: number } | undefined {
  return useContext(XgContext)[eventId];
}
