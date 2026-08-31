import type { KeyboardEvent } from "react";
import type { Ref } from "react";

import type { AgendaEvent, Task } from "../lib/types";

export function EventRow({
  event,
  onRemove,
}: {
  event: AgendaEvent & { id: string };
  onRemove: (id: string) => void;
}) {
  return (
    <div className="row">
      <span className="row__at">{event.at}</span>
      <span className="row__title">{event.title}</span>
      <button
        aria-label={`Remove ${event.title}`}
        className="row__remove"
        onClick={() => onRemove(event.id)}
        type="button"
      >
        ×
      </button>
    </div>
  );
}

export function TaskRow({
  onRemove,
  onToggle,
  task,
}: {
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  task: Task & { id: string };
}) {
  return (
    <div className="row row--task">
      <button
        aria-checked={task.done}
        aria-label={task.title}
        className={task.done ? "row__check row__check--on" : "row__check"}
        onClick={() => onToggle(task.id)}
        role="checkbox"
        type="button"
      />
      <span className={task.done ? "row__title row__title--done" : "row__title"}>{task.title}</span>
      <button
        aria-label={`Remove ${task.title}`}
        className="row__remove"
        onClick={() => onRemove(task.id)}
        type="button"
      >
        ×
      </button>
    </div>
  );
}

/** Uncontrolled by design: type, press Enter, and the field empties itself. */
export function EntryInput({
  className = "inline-input",
  onSubmit,
  placeholder,
  ref,
}: {
  className?: string;
  onSubmit: (value: string) => void;
  placeholder: string;
  ref?: Ref<HTMLInputElement>;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key !== "Enter" || !event.currentTarget.value.trim()) {
      return;
    }

    onSubmit(event.currentTarget.value);
    event.currentTarget.value = "";
  }

  return (
    <input
      aria-label={placeholder}
      className={className}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      ref={ref}
      type="text"
    />
  );
}
