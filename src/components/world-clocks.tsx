import "./world-clocks.css";

import { formatTime } from "../lib/time";
import { useNow } from "../lib/use-now";
import { useStore } from "../store";

export function WorldClocks() {
  const { cities, hour12 } = useStore();
  const now = useNow();

  return (
    <div className="cities">
      {cities.map((city, index) => {
        let time = "—";
        try {
          time = formatTime(now, hour12, city.tz);
        } catch {
          // An unknown time zone shows a dash rather than taking the page down.
        }

        return (
          <div className="cities__item" key={`${city.label}-${city.tz}-${index}`}>
            <div className="cities__time">{time}</div>
            <div className="cities__label">{city.label || "—"}</div>
          </div>
        );
      })}
    </div>
  );
}
