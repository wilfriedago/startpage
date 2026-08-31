import { formatClock } from "../lib/time";
import { useNow } from "../lib/useNow";
import { describe } from "../lib/weather";
import { useStore } from "../store";

function weatherLine(store: ReturnType<typeof useStore>): [string, string] {
  const { unit, weather } = store;
  if (weather === "error") {
    return ["·", "weather unavailable"];
  }
  if (weather === null) {
    return ["·", "loading weather…"];
  }

  const [text, glyph] = describe(weather.code);
  const degree = unit === "f" ? "°F" : "°";
  return [glyph, `${text} · ${weather.temp}${degree} · H${weather.hi} L${weather.lo}`];
}

export function ClockBlock() {
  const store = useStore();
  const { hour12, panels, showSeconds } = store;
  const now = useNow();
  const [glyph, text] = weatherLine(store);

  return (
    <div className="clock">
      <div className="clock__row">
        <div className="clock__time">{formatClock(now, hour12)}</div>
        <div className="clock__side">
          <div>{hour12 ? (now.getHours() < 12 ? "AM" : "PM") : ""}</div>
          <div>{showSeconds ? String(now.getSeconds()).padStart(2, "0") : ""}</div>
        </div>
      </div>
      <div className="clock__date-row">
        <div className="clock__date">
          {now.toLocaleDateString([], { day: "numeric", month: "long", weekday: "long" })}
        </div>
        {panels.weather && (
          <div className="clock__weather">
            <span className="clock__divider" />
            <div className="weather">
              <span className="weather__glyph">{glyph}</span>
              <span>{text}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
