import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

type AccessibleDialogProps = {
  children: ReactNode;
  className: string;
  labelledBy: string;
  onClose: () => void;
  initialFocusSelector?: string;
};

/** Native modal dialogs provide focus containment and mark the background inert. */
export function AccessibleDialog({
  children,
  className,
  labelledBy,
  onClose,
  initialFocusSelector,
}: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    if (initialFocusSelector && window.matchMedia("(pointer: fine)").matches) {
      dialog.querySelector<HTMLElement>(initialFocusSelector)?.focus();
    }

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [initialFocusSelector]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      onCloseRef.current();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={className}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onCloseRef.current();
      }}
      onClick={handleBackdropClick}
    >
      {children}
    </dialog>
  );
}
