import { useEffect, useRef } from 'react';

/**
 * Modal accessibility helper:
 *  - traps Tab / Shift+Tab focus inside the dialog while it is open,
 *  - closes the dialog on Escape,
 *  - restores focus to the previously-focused element when it closes.
 *
 * Returns a ref to attach to the dialog container. `open` must be true only
 * while the dialog is actually visible.
 */
export function useFocusTrap(
  open: boolean,
  onClose: () => void,
): React.RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Keep the latest onClose without re-running the trap effect on every
  // parent re-render (callbacks like `() => setOpen(false)` are new each time).
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      if (previousFocus.current) {
        previousFocus.current.focus();
        previousFocus.current = null;
      }
      return;
    }

    previousFocus.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    const focusables = container
      ? Array.from(
          container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute('disabled'))
      : [];
    focusables[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return containerRef;
}
