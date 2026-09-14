"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

export function AccountPopover({
  trigger,
  children,
}: {
  trigger: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      if (!button.current || !panel.current) return;
      const anchor = button.current.getBoundingClientRect();
      const bounds = panel.current.getBoundingClientRect();
      setPosition({
        left: Math.max(
          8,
          Math.min(
            anchor.right - bounds.width,
            window.innerWidth - bounds.width - 8,
          ),
        ),
        top: Math.max(
          8,
          Math.min(anchor.bottom + 8, window.innerHeight - bounds.height - 8),
        ),
      });
    };
    update();
    panel.current
      ?.querySelector<HTMLElement>("a, button")
      ?.focus({ preventScroll: true });
    const observer = new ResizeObserver(update);
    if (button.current) observer.observe(button.current);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !button.current?.contains(target) &&
        !panel.current?.contains(target)
      )
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-haspopup="dialog"
        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-text hover:bg-surface-muted"
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="dialog"
            aria-label="Account"
            style={position}
            className="fixed z-50 max-h-[calc(100dvh-16px)] w-64 max-w-[calc(100vw-16px)] overflow-y-auto rounded-xl border border-border bg-surface-raised p-4 shadow-xl"
            onClick={(event) => {
              if (
                event.target instanceof Element &&
                event.target.closest("a, [data-close-popover]")
              )
                setOpen(false);
            }}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
