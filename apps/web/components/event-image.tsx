"use client";

import { useEffect, useState } from "react";
import { initials } from "../event-utils";

export function EventImage({
  src,
  name,
  fallbackClassName,
}: {
  src?: string | null;
  name: string;
  fallbackClassName: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(src) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (hasImage) {
    return <img src={src ?? ""} alt="" onError={() => setImageFailed(true)} />;
  }

  return <span className={fallbackClassName}>{initials(name)}</span>;
}
