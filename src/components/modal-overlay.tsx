import "./modal-overlay.css";

import type { ComponentChildren } from "preact";
import { useEffect, useRef } from "preact/hooks";

interface OverlayProps {
  children: ComponentChildren;
  className?: string;
  label: string;
  onClose: () => void;
}

/** A modal scrim: click the backdrop to dismiss, and focus moves inside on open. */
export function Overlay({ children, className, label, onClose }: OverlayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const focusable = ref.current?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea",
    );
    focusable?.focus();
  }, []);

  return (
    <div
      aria-label={label}
      aria-modal="true"
      className={className ? `overlay ${className}` : "overlay"}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      ref={ref}
      role="dialog"
    >
      {children}
    </div>
  );
}
