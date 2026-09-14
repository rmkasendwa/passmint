"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "nextjs-toploader/app";
import { useAppContext } from "./app-provider";
import { emptyHostEvent } from "../event-utils";
import { CreateEventForm } from "./create-event-form";
export function CreateEventModal() {
  const router = useRouter();
  const { hostEvent } = useAppContext();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.current?.showModal();
    dialog.current
      ?.querySelector<HTMLInputElement>("input")
      ?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [mounted]);
  function close() {
    if (busy) return;
    const dirty = JSON.stringify(hostEvent) !== JSON.stringify(emptyHostEvent);
    if (
      dirty &&
      !window.confirm(
        "Close this form? Your changes will stay here while you browse, but won't be saved as a draft.",
      )
    )
      return;
    router.back();
  }
  if (!mounted) return null;
  return createPortal(
    <dialog
      ref={dialog}
      className="event-create-dialog"
      aria-labelledby="create-event-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          close();
      }}
    >
      <CreateEventForm onClose={close} onBusyChange={setBusy} />
    </dialog>,
    document.body,
  );
}
