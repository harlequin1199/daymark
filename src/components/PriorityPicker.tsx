import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  Check,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  Equal,
} from "lucide-react";

export type Priority = "high" | "medium" | "low";

export const priorities: readonly Priority[] = ["high", "medium", "low"];

export const priorityLabels: Record<Priority, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

export function PriorityIcon({
  priority,
  size = 16,
}: {
  priority: Priority;
  size?: number;
}) {
  const Icon =
    priority === "high"
      ? ChevronsUp
      : priority === "medium"
        ? Equal
        : ChevronsDown;
  return (
    <Icon
      size={size}
      strokeWidth={2.7}
      className={`priority-icon ${priority}`}
      aria-hidden="true"
    />
  );
}

type PriorityPickerProps = {
  id?: string;
  value: Priority;
  onChange: (priority: Priority) => void;
  label: string;
  compact?: boolean;
};

export function PriorityPicker({
  id,
  value,
  onChange,
  label,
  compact = false,
}: PriorityPickerProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(priorities.indexOf(value));
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (open) optionRefs.current[focusedIndex]?.focus();
  }, [open, focusedIndex]);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", handleOutsideClick);
  }, [open]);

  function openMenu(initialIndex = priorities.indexOf(value)) {
    setFocusedIndex(initialIndex);
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function selectPriority(priority: Priority) {
    onChange(priority);
    closeMenu();
  }

  function handleTriggerKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(event.key === "ArrowDown" ? 0 : priorities.length - 1);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      closeMenu();
    }
  }

  function handleOptionKey(
    event: KeyboardEvent<HTMLDivElement>,
    priority: Priority,
  ) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex(
        (current) =>
          (current + (event.key === "ArrowDown" ? 1 : -1) + priorities.length) %
          priorities.length,
      );
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setFocusedIndex(event.key === "Home" ? 0 : priorities.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectPriority(priority);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`priority-picker ${compact ? "compact" : ""}`}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="priority-picker-trigger"
        role="combobox"
        aria-label={`${label}: ${priorityLabels[value]}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKey}
      >
        <PriorityIcon priority={value} size={compact ? 15 : 17} />
        <span>{priorityLabels[value]}</span>
        <ChevronDown
          size={15}
          className="priority-picker-chevron"
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          className="priority-picker-list"
          id={listId}
          role="listbox"
          aria-label={label}
        >
          {priorities.map((priority, index) => (
            <div
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              role="option"
              tabIndex={-1}
              key={priority}
              className={`priority-picker-option ${value === priority ? "selected" : ""}`}
              aria-selected={value === priority}
              onClick={() => selectPriority(priority)}
              onKeyDown={(event) => handleOptionKey(event, priority)}
            >
              <PriorityIcon priority={priority} size={17} />
              <span>{priorityLabels[priority]}</span>
              {value === priority && <Check size={15} aria-hidden="true" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
