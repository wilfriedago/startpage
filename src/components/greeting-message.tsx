import "./greeting-message.css";

import { useNow } from "../lib/use-now";
import { greetingFor } from "../lib/time";
import { useStore } from "../store";

export function Greeting() {
  const { cityName } = useStore();
  const now = useNow(60_000);

  return (
    <div className="greeting">
      <span className="greeting__dot" />
      <p className="greeting__text">
        {greetingFor(now.getHours())}
        {cityName ? ` — ${cityName}` : ""}
      </p>
    </div>
  );
}
