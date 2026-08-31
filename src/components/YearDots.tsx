import { memo, useMemo } from "react";

import { buildYear } from "../lib/time";
import { useStore, type Tip } from "../store";

interface YearDotsProps {
  marked: ReadonlySet<string>;
  onOpen: (key: string) => void;
  onTip: (tip: Tip | null) => void;
  today: string;
}

/**
 * One dot per day of the year, Monday-first in columns. Filled days are past,
 * today uses the accent fill, and a thin ring marks a day carrying items.
 */
const Grid = memo(function Grid({ marked, onOpen, onTip, today }: YearDotsProps) {
  const year = useMemo(() => buildYear(new Date()), [today]);

  return (
    <div className="stack">
      <div className="year__head">
        <h2 className="label">{new Date().getFullYear()}</h2>
        <span className="meta">
          {year.todayIndex + 1}/{year.total} ·{" "}
          {Math.round(((year.todayIndex + 1) / year.total) * 100)}%
        </span>
      </div>
      <div className="year__grid">
        {Array.from({ length: year.pad }, (_, index) => (
          <span className="year__cell year__cell--pad" key={`pad-${index}`} />
        ))}
        {year.days.map((day) => {
          const isToday = day.ordinal === year.todayIndex;
          const isMarked = marked.has(day.key);
          return (
            <button
              aria-label={day.label}
              className="year__cell"
              key={day.key}
              onClick={() => onOpen(day.key)}
              onMouseEnter={(event) =>
                onTip({
                  text: day.label + (isMarked ? " · has items" : ""),
                  x: event.clientX,
                  y: event.currentTarget.getBoundingClientRect().top,
                })
              }
              onMouseLeave={() => onTip(null)}
              style={{
                background: isToday
                  ? "var(--accent)"
                  : day.ordinal < year.todayIndex
                    ? "var(--dim)"
                    : "var(--line)",
                boxShadow: isToday
                  ? "none"
                  : isMarked
                    ? "0 0 0 1.5px var(--accent)"
                    : "none",
              }}
              type="button"
            />
          );
        })}
      </div>
    </div>
  );
});

export function YearDots() {
  const { events, openDay, setTip, tasks, today } = useStore();

  const marked = useMemo(() => {
    const keys = new Set<string>();
    events.forEach((event) => keys.add(event.date));
    tasks.forEach((task) => {
      if (task.due) {
        keys.add(task.due);
      }
    });
    return keys;
  }, [events, tasks]);

  return <Grid marked={marked} onOpen={openDay} onTip={setTip} today={today} />;
}
