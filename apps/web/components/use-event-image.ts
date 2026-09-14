"use client";

import { useEffect, useRef, useState } from "react";

// Keep the fallback visible until the browser confirms a usable image.
// Checking complete also catches load/error events that happened before hydration.
export function useEventImage(src?: string | null) {
  const ref = useRef<HTMLImageElement>(null);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);
  const ready = Boolean(src && loadedSource === src);
  const check = () => {
    const image = ref.current;
    setLoadedSource(
      image?.complete && image.naturalWidth > 0 ? (src ?? null) : null,
    );
  };
  useEffect(check, [src]);
  return { ref, ready, onLoad: check, onError: () => setLoadedSource(null) };
}
