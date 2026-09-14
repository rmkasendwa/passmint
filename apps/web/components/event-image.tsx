"use client";

import { useEventImage } from "./use-event-image";
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
  const { ready, ...imageProps } = useEventImage(src);
  return (
    <>
      {!ready && (
        <span className={fallbackClassName} aria-hidden="true">
          {initials(name)}
        </span>
      )}
      {src && (
        <img
          {...imageProps}
          src={src}
          alt=""
          style={{ display: ready ? undefined : "none" }}
        />
      )}
    </>
  );
}
