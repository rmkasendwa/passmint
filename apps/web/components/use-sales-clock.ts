'use client';

import { useEffect, useState } from 'react';

export function useSalesClock() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => { if (!document.hidden) setNow(Date.now()); };
    update();
    const timer = window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, []);
  return now;
}
