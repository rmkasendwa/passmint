"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function MobileNavigationDrawer({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const desktop = window.matchMedia("(min-width: 900px)");
    const resize = () => {
      if (desktop.matches) close.current();
    };
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
    desktop.addEventListener("change", resize);
    resize();
    return () => {
      desktop.removeEventListener("change", resize);
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <dialog
      ref={dialog}
      id="mobile-navigation"
      aria-labelledby="mobile-navigation-title"
      className="mobile-navigation-drawer"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
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
          onClose();
      }}
    >
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <h2 id="mobile-navigation-title" className="m-0 text-lg font-semibold">
          Explore Passmint
        </h2>
        <button
          type="button"
          aria-label="Close navigation"
          className="grid size-11 place-items-center rounded-lg text-text hover:bg-surface-muted"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      <nav aria-label="Mobile navigation" className="grid gap-2">
        {children}
      </nav>
    </dialog>,
    document.body,
  );
}
