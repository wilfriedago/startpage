import type { ChangeEvent, ReactNode } from "react";

export function Pill({
  grow,
  label,
  mono,
  on,
  onClick,
}: {
  grow?: boolean;
  label: string;
  mono?: boolean;
  on: boolean;
  onClick: () => void;
}) {
  const classes = ["pill"];
  if (on) {
    classes.push("pill--on");
  }
  if (grow) {
    classes.push("pill--grow");
  }
  if (mono) {
    classes.push("pill--mono");
  }

  return (
    <button
      aria-pressed={on}
      className={classes.join(" ")}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function Check({
  checked,
  label,
  boxed,
  onChange,
}: {
  boxed?: boolean;
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={boxed ? "check check--boxed" : "check"}>
      <input
        checked={checked}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}

export function SliderRow({
  display,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  display: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <div className="slider-row">
      <span className="slider-row__label">{label}</span>
      <input
        aria-label={label}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
      <span className="slider-row__value">{display}</span>
    </div>
  );
}

export function Group({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="stack">
      <h3 className="label">{label}</h3>
      {children}
    </div>
  );
}

export function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button aria-label={label} className="editor-row__remove" onClick={onClick} type="button">
      ×
    </button>
  );
}
